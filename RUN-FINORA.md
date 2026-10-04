# Finora — Final Run Guide

## 1. Keep your existing secrets
This final package intentionally does **not** include `backend/.env`.

Keep your existing:
`backend/.env`

Make sure it contains your working Groq, Pinecone and Gemini keys.

The expected Gemini models are:
- `gemini-3.1-flash-image`
- `gemini-3.8-flash`
- `veo-3.1-generate-preview`

## 2. Install/update backend packages

Open PowerShell in `Finora/backend`:

```powershell
py -m pip install -r requirements.txt
```

## 3. Run the backend

```powershell
py app.py
```

Health check:

```text
http://127.0.0.1:5000/api/health
```

## 4. Run the frontend

Open a second PowerShell in `Finora/frontend`:

```powershell
npm run dev
```

Open the URL Vite prints.

## 5. Multimodal checks

Text:
- Ask a normal finance question.
- The answer should appear and a contextual visual should appear beneath it.

LVM:
- Click the paperclip.
- Upload a chart/screenshot.
- Ask what the image shows.
- The chat should show `LVM · SEE` and the analyzed answer.
- A contextual visual should also be returned when the image request succeeds.

Voice:
- Click the microphone.
- Speak a question.
- The transcript should enter the input.

Video:
- Use `Generate video` under an assistant response.

## Important
The frontend sends image uploads as `multipart/form-data` without manually setting the Content-Type header. The Flask backend reads the uploaded file from `request.files["image"]`.

Gemini image generation uses the current Gemini Interactions API. The project requires `google-genai>=2.28,<3`.
