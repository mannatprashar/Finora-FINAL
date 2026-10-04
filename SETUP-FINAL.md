# Finora FINAL — setup

## 1. Backend

Open PowerShell in this folder:

```powershell
cd backend
py -m pip install -r requirements.txt
py app.py
```

Keep this terminal running. The API runs on `http://127.0.0.1:5000`.

Make sure `backend/.env` contains your existing API keys. **Do not put API keys in the frontend.**

Recommended/current models in `.env.example`:
- Groq LLM: `openai/gpt-oss-120b`
- Gemini LIM: `gemini-3.1-flash-image`
- Gemini LVM: `gemini-3.8-flash`
- Gemini video: `veo-3.1-generate-preview`

## 2. Frontend

Open a second PowerShell terminal:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Open the exact `Local` URL printed by Vite (for example `http://localhost:5183/`).

## 3. Test order

1. Open `/api/health` on the backend and confirm the `providers` object shows the configured providers.
2. Send a normal chat message.
3. Upload a screenshot/chart and ask Finora to analyze it — this uses Gemini LVM.
4. Ask a financial question and check for the generated LIM visual.
5. Press **Generate video** on an answer — this uses Veo.
6. Upload a PDF/CSV/XLSX/DOCX/TXT and ask Finora to analyze it.

Uploads are capped at 50 MB.
