# PALASH AI

Hackathon prototype for **AI-Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother Tongue-Based Primary Education**.

Scope: Hindi ↔ Santali support for primary-school teachers.

## What is included

- React + Vite frontend with dashboard, translator, lessons, flashcards, and worksheets
- FastAPI backend with content APIs and translation API
- Lazy loading hook for `ai4bharat/indictrans2-indic-indic-dist-320M`
- Honest placeholders for AI4Bharat IndicConformer ASR and Indic Parler-TTS until checkpoints are configured
- Local demo content for classroom lessons and teacher phrases

## Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Python 3.12 or 3.13 is recommended for the optional AI stack; the base API dependencies are kept compatible with the repository's Python 3.14 venv where possible.

For real IndicTrans2 translation support, install the optional AI dependencies if your Python version and hardware support them:

```bash
pip install -r requirements-ai.txt
```

Then start the backend and call `/translate`. If the Hugging Face model cannot be downloaded because of network, license, compatibility, or cache restrictions, the API returns a clear 503 error instead of fake translation.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The frontend expects the backend at `http://localhost:8000`. Override with `VITE_API_BASE` if needed.

## Test checks

```bash
cd frontend && npm run build
cd backend && python -m py_compile main.py translation/indictrans.py
```

## AI limitations

- Translation is wired to load `ai4bharat/indictrans2-indic-indic-dist-320M`, but actual runtime depends on model availability, Python/package compatibility, and machine resources.
- Speech recognition and text-to-speech endpoints intentionally return `501` until AI4Bharat IndicConformer and Indic Parler-TTS checkpoints are installed/configured.
