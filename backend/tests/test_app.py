import io
import json
import os
import unittest
from unittest.mock import Mock, patch

import app as finora


class FinoraApiTests(unittest.TestCase):
    def setUp(self):
        self.client = finora.app.test_client()

    def test_health_reports_ai_when_groq_key_exists(self):
        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}, clear=False):
            response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["mode"], "ai")

    def test_health_reports_demo_without_groq_key(self):
        with patch.dict(os.environ, {"GROQ_API_KEY": ""}, clear=False):
            response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["mode"], "demo")

    def test_growth_zero_rate(self):
        response = self.client.post(
            "/api/finance/growth",
            json={"monthly_contribution": 1000, "months": 12, "annual_rate": 0},
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["projected_value"], 12000)
        self.assertEqual(data["illustrative_growth"], 0)

    def test_growth_rejects_invalid_months(self):
        response = self.client.post(
            "/api/finance/growth",
            json={"monthly_contribution": 1000, "months": 0, "annual_rate": 8},
        )
        self.assertEqual(response.status_code, 400)

    def test_emi_zero_rate(self):
        response = self.client.post(
            "/api/finance/emi",
            json={"principal": 12000, "annual_rate": 0, "months": 12},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["monthly_emi"], 1000)

    def test_emi_rejects_negative_principal(self):
        response = self.client.post(
            "/api/finance/emi",
            json={"principal": -1, "annual_rate": 10, "months": 12},
        )
        self.assertEqual(response.status_code, 400)

    def test_chat_ai_success(self):
        completion = Mock()
        completion.choices = [Mock(message=Mock(content="A clear explanation."))]

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = completion

        with patch.dict(
            os.environ,
            {"GROQ_API_KEY": "test-key", "GROQ_MODEL": "test-model"},
            clear=False,
        ):
            with patch.object(finora, "Groq", return_value=mock_client):
                with patch.object(finora, "retrieve", return_value=[]):
                    with patch.object(
                        finora, "create_finora_visual",
                        return_value="/api/generated/test.png",
                    ):
                        response = self.client.post(
                            "/api/chat",
                            json={"message": "Explain budgeting"},
                        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["mode"], "ai")
        self.assertEqual(data["reply"], "A clear explanation.")
        self.assertEqual(data["visual"], "/api/generated/test.png")
        self.assertNotIn("test-key", json.dumps(data))
        mock_client.chat.completions.create.assert_called_once()

    def test_chat_rejects_empty_message(self):
        response = self.client.post("/api/chat", json={"message": "  "})
        self.assertEqual(response.status_code, 400)

    def test_vision_falls_back_when_primary_model_is_busy(self):
        calls = []

        class Response:
            text = "The image is a solid green field."

        class Models:
            def generate_content(self, **kwargs):
                calls.append(kwargs.get("model"))
                if kwargs.get("model") == "gemini-3.8-flash":
                    raise RuntimeError("503 UNAVAILABLE: high demand")
                return Response()

        class Client:
            models = Models()

        types = Mock()
        types.Part.from_bytes.return_value = object()

        with patch.object(finora, "GEMINI_VISION_MODEL", "gemini-3.8-flash"):
            with patch.object(finora, "genai_types", types):
                with patch.object(finora, "gemini_client", return_value=Client()):
                    result = finora.analyze_uploaded_image(
                        b"png-bytes",
                        "image/png",
                        "What color is this?",
                    )

        self.assertEqual(calls, ["gemini-3.8-flash", "gemini-3.5-flash"])
        self.assertIn("green", result.lower())

    def test_chat_multipart_lvm_flow(self):
        completion = Mock()
        completion.choices = [Mock(message=Mock(content="The chart shows a rising trend."))]
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = completion

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}, clear=False):
            with patch.object(finora, "analyze_uploaded_image", return_value="Observed: the chart rises."):
                with patch.object(finora, "Groq", return_value=mock_client):
                    with patch.object(finora, "retrieve", return_value=[]):
                        with patch.object(finora, "create_finora_visual", return_value="/api/generated/visual.png"):
                            response = self.client.post(
                                "/api/chat",
                                data={
                                    "message": "What does this chart show?",
                                    "history": "[]",
                                    "image": (io.BytesIO(b"fake image bytes"), "chart.png"),
                                },
                                content_type="multipart/form-data",
                            )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["vision"], "Observed: the chart rises.")
        self.assertIn("chart", data["reply"].lower())
        self.assertEqual(data["visual"], "/api/generated/visual.png")

    def test_generate_image_falls_back_to_contextual_visual(self):
        with patch.object(
            finora, "create_finora_visual",
            return_value="/api/generated/fallback.png",
        ):
            response = self.client.post(
                "/api/generate-image",
                json={"prompt": "Explain compound interest visually"},
            )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["image"], "/api/generated/fallback.png")

    def test_video_falls_back_when_veo_is_unavailable(self):
        mock_client = Mock()
        mock_client.models.generate_videos.side_effect = RuntimeError("429 RESOURCE_EXHAUSTED")

        with patch.object(finora, "gemini_client", return_value=mock_client):
            with patch.object(finora, "genai_types", Mock()):
                response = self.client.post(
                    "/api/generate-video",
                    json={"prompt": "Concept: Rent 18000 and Food 6500"},
                )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["model"], "local-explainer")
        self.assertTrue(str(data["video"]).endswith(".mp4"))

    def test_market_rejects_unknown_symbol(self):
        response = self.client.get("/api/market/quote?symbol=UNKNOWN")
        self.assertEqual(response.status_code, 400)


class LearningActionTests(unittest.TestCase):
    def setUp(self):
        self._env = patch.dict(os.environ, {"GROQ_API_KEY": ""}, clear=False)
        self._env.start()

    def tearDown(self):
        self._env.stop()

    def test_mind_map_quiz_infographic_and_slides_from_material(self):
        import workspace_actions as actions

        payload = {
            "topic": "Monthly budget",
            "answer": "Rent is 18000. Food is 6500. Transport is 2200.",
            "document": "The uploaded budget lists Rent 18000, Food 6500 and Transport 2200.",
        }
        mind = actions.build_mind_map(payload)
        self.assertEqual(mind["center"]["id"], "center")
        self.assertGreaterEqual(len(mind["nodes"]), 3)
        quiz = actions.build_quiz({**payload, "difficulty": "easy"})
        self.assertEqual(len(quiz["questions"]), 3)
        self.assertEqual(len(quiz["questions"][0]["choices"]), 4)
        graphic = actions.build_infographic(payload)
        self.assertGreaterEqual(len(graphic["items"]), 3)
        self.assertEqual(graphic["items"][0]["value"], 18000)
        self.assertTrue(graphic["image"].endswith(".png"))
        slides = actions.build_slides(payload)
        self.assertGreaterEqual(len(slides["slides"]), 3)
        self.assertTrue(slides["file"].endswith(".pptx"))
        pptx_path = actions.GENERATED_DIR / slides["file"].split("/")[-1]
        self.assertTrue(pptx_path.exists())
        self.assertGreater(pptx_path.stat().st_size, 1000)

    def test_actions_follow_the_question_instead_of_workspace_figures(self):
        import workspace_actions as actions

        payload = {
            "topic": "What is the debt-to-equity ratio?",
            "answer": (
                "The debt-to-equity ratio compares how much debt financing a firm uses with its equity. "
                "Higher leverage means more risk and less ability to survive a reversal."
            ),
            "workspace": "monthly savings 5000, horizon 24 months, income 40000, expenses 28000, EMI 1550.",
        }
        mind = actions.build_mind_map(payload)
        mind_text = " ".join(
            [mind["center"]["title"], mind["center"]["explanation"]]
            + [f"{node['title']} {node['explanation']}" for node in mind["nodes"]]
        ).lower()
        graphic = actions.build_infographic(payload)
        slides = actions.build_slides(payload)
        slide_text = " ".join(
            slide["title"] + " " + " ".join(slide["bullets"]) for slide in slides["slides"]
        ).lower()
        self.assertIn("debt", mind_text)
        self.assertNotIn("5000", mind_text)
        self.assertNotIn("5000", str(graphic["items"]))
        self.assertIn("debt", (graphic["title"] + " " + " ".join(graphic["notes"])).lower())
        self.assertIn("debt", slide_text)
        self.assertNotIn("5000", slide_text)


if __name__ == "__main__":
    unittest.main()
