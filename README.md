# Finora

An immersive, interactive finance playground by Mannat Prashar. React + Vite + Three.js frontend with a Flask API backend.

## Features
- Animated Three.js hero and responsive editorial layout.
- Chat panel integrated with `POST /api/chat`, including recent conversation and current workspace context.
- Demo chat mode works without a paid AI key; configure an OpenAI-compatible API key for generated answers.
- Growth Lab and Loan Explorer include frontend live visualisations and matching backend calculation endpoints.
- Spending Map with editable categories, income, donut chart, CSV validation, category aggregation and preview; imported data is included in chat context when the user asks for analysis.
- Local RAG pipeline retrieves relevant bundled financial-education chunks with transparent lexical TF-IDF ranking. Answers cite retrieved chunks using [S1], [S2], etc.; clickable citations and evidence cards expose the supporting passage and source portal. The bundled passages are concise educational summaries, not live page quotations.
- No social or personal links included.

## Requirements
- Node.js 18+ and npm
- Python 3.10+

## Run on Windows
Open the project root (`Finora`) in VS Code. Use two integrated terminals.

### Terminal 1 — backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```
If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. Keep this terminal running. The API is at `http://127.0.0.1:5000`.

To enable AI answers, open `backend/.env` and set `OPENAI_API_KEY` to your own key. Keep the key private and restart the backend. Do not commit `.env`.

### Terminal 2 — frontend
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Vite proxies `/api/*` to Flask, so the browser does not need a hardcoded backend URL.

## API
- `GET /api/health` — service status and `ai`/`demo` mode.
- `POST /api/chat` — JSON `{ "message": "...", "history": [], "context": "..." }`.
- `POST /api/finance/growth` — JSON `{ "monthly_contribution": 5000, "months": 24, "annual_rate": 8 }`.
- `POST /api/finance/emi` — JSON `{ "principal": 300000, "annual_rate": 10, "months": 36 }`.

The finance endpoints return transparent estimates and disclaimers. `GET /api/sources` returns curated RBI/SEBI learning links. The app fetches public market data on demand from Yahoo Finance; availability and delay can vary. It does not connect to banks, store user accounts, or provide personalized regulated financial advice. AI mode requires an OpenAI-compatible API key configured locally in `backend/.env`; never commit or share that key.

## GitHub
From the project root:
```powershell
git init
git add .
git commit -m "Build Finora interactive finance app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/finora.git
git push -u origin main
```
Create an empty GitHub repository first, then replace `YOUR-USERNAME` with your GitHub username. If `origin` already exists, use `git remote set-url origin https://github.com/YOUR-USERNAME/finora.git` instead of `git remote add origin ...`.

`.gitignore` excludes `.env`, virtual environments, dependencies and build output. Never add API keys to Git.


## Public market snapshot

The Market Pulse tab fetches a quote on demand from Yahoo Finance's public chart endpoint for NIFTY 50, BSE SENSEX, Reliance Industries, or TCS. Provider availability, delay, and timestamp can vary. The app does not use this quote to make predictions or trading recommendations. If the provider is unavailable, the UI shows an error rather than substituting made-up prices.

## CSV behavior

CSV import expects a header row with a category/name and amount/value column. It validates non-negative numeric amounts, aggregates repeated categories, previews the first eight categories, and makes the imported summary available to the chat context when the user asks a question. Data is processed in the browser; it is not uploaded automatically.


## Backend tests
From `backend/` with the virtual environment activated:
```powershell
python -m unittest discover -s tests -v
```
The tests cover calculator edge cases, demo/AI chat response handling (AI calls are mocked), source links, and market-provider failure handling. They do not verify the external market provider or a live AI account.


## Evidence-backed retrieval (RAG)

Finora includes a lightweight local retrieval pipeline in `backend/rag.py` and a bundled knowledge library in `backend/knowledge_base.json`. It tokenizes the user's question, ranks passages with TF-IDF-style cosine similarity, and returns only retrieved chunks as source records. In AI mode, retrieved passages are included as reference context and the model is instructed to cite factual claims using the supplied `[S#]` markers. In demo mode, the response is assembled from retrieved passages, so citations still work without an AI key.

The frontend turns `[S#]` markers into clickable links and displays evidence cards containing the retrieved passage, publisher, section and source URL. `GET /api/knowledge/sources` lists the bundled source records.

**Scope and limitations:** this is lexical retrieval, not semantic embedding search. The bundled corpus contains concise summaries associated with official RBI/SEBI education portals; the summaries are not presented as verbatim excerpts or live-scraped source text. For a production-grade evidence system, add reviewed source documents with exact page/section anchors, document version dates, ingestion controls and evaluation against a benchmark question set. AI-generated answers can still make mistakes; citations are a navigation aid and should be checked against the linked source.


## In-product capabilities overview
The interface includes a capabilities section covering conversational financial education, bundled-library retrieval with source links, savings projections, editable spending analysis, CSV import/preview, loan EMI estimates, on-demand market snapshots, and explanations using current workspace inputs. The descriptions intentionally distinguish illustrative calculations and educational information from financial advice.
