# وضّح | Waddeh

Waddeh helps learners understand authentic Arabic at their current level and progressively guides them toward reading the original language independently.

It is an Arabic-first adaptive reading companion built around one journey:

```text
Authentic Arabic
  -> Difficulty Assessment
  -> Learner Level
  -> Controlled Arabic Adaptation
  -> Meaning Integrity Check
  -> Contextual Vocabulary Learning
  -> Bridge Mode
  -> Original Arabic
```

## Problem

Arabic learners often encounter real Arabic that is above their current level. Translating, summarizing, or replacing it with beginner material may help them understand information, but it can also let them bypass the Arabic itself.

Waddeh is designed to bridge the gap between the Arabic a learner understands today and the authentic Arabic they want to understand tomorrow.

## What Waddeh Is

Implemented in the current competition branch:

- Arabic readability assessment with deterministic signals and honest heuristic labels.
- Explicit learner-level selection: Beginner, Easy, Standard, Advanced, Original.
- Controlled Arabic adaptation through the FastAPI/Gemini backend.
- Independent meaning-integrity layer with deterministic fact checks and separate semantic verification when Gemini is configured.
- Bridge Mode for progressively richer Arabic versions that lead back toward the original.
- Contextual Word Lens with diacritics, meaning, root when confident, synonym, English support, and save-to-vocabulary.
- English translation as support, not the destination.
- PDF upload path for the same adaptive reading journey.
- Device-local learner progress and saved vocabulary.
- PWA shell, RTL/LTR interface, frontend validation, backend tests, CI, and deterministic evaluation starter set.

Waddeh is not a generic chatbot, generic translator, generic PDF chatbot, unrelated AI feature bundle, or Duolingo clone.

## Current Limitations

- Readability levels are heuristic, not academically validated scores.
- Live adaptation quality, Bridge Mode ordering, and semantic integrity require a configured Gemini key and human review.
- PDF source text is not persisted in this MVP, so deterministic source-vs-adapted integrity is limited for PDFs.
- Learner profile is local to the browser/device.
- No accounts, OCR, large document library, or open-ended chat are included.

## Architecture

```text
Browser
  Next.js · React · TypeScript · Tailwind CSS · PWA
        |
        | HTTP
        v
FastAPI backend
  Pydantic schemas
  readability service
  integrity service
  Gemini service
        |
        v
Gemini Interactions API
```

The frontend owns the learning journey, RTL/LTR behavior, local vocabulary, learner progress, and presentation.

The backend owns validation, PDF handling, deterministic analysis, Gemini credentials, structured AI requests, and independent integrity checks.

## Repository Structure

```text
waddeh/
├── frontend/           Next.js adaptive reading interface
├── backend/            FastAPI API, schemas, services, tests
├── documentation/      V2 architecture, API, evaluation, privacy notes
├── evaluation/         Self-created Arabic samples and deterministic runner
├── sample-documents/   Demo document notes
├── context.md          V2 product brief
├── AGENTS.md           Shared engineering guidance
├── .env.example        Local environment template
└── package.json        Monorepo frontend commands
```

## Requirements

- Node.js 20.9 or newer. Local development was verified with Node.js 24.14.0 and npm 11.12.1.
- Python 3.11 or newer. On this machine, use the bundled Codex Python if system Python is not on PATH.
- A local `.env` file based on `.env.example`.

## Environment

Create `.env` from `.env.example`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:3000
AI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=
```

Only populate `GEMINI_API_KEY` locally. Never commit `.env`.

## Installation

Windows from the repository root:

```powershell
npm.cmd install
& 'C:\Users\mukes\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

macOS/Linux:

```bash
npm install
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

## Development

Run backend and frontend in separate terminals from the repository root.

Backend:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
npm run dev:frontend
```

Open `http://localhost:3000`.

## Validation

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
backend\.venv\Scripts\python.exe evaluation\check_deterministic.py
git ls-files .env
```

`git ls-files .env` should print nothing.

## API Summary

- `GET /api/health`
- `POST /api/readability`
- `POST /api/simplify`
- `POST /api/upload/pdf`
- `POST /api/explain-word`

See `documentation/api-contract.md` for response details.

## Privacy Notes

- Gemini key remains server-side.
- `.env` is ignored and must not be committed.
- Uploaded PDFs are validated and not written to local server storage.
- Text/PDF content is sent to the configured model provider for active processing.
- Saved vocabulary and learner progress are stored in browser `localStorage`.

See `documentation/privacy-security.md`.

## Roadmap

Planned after the competition MVP:

- Live QA after a Gemini key is configured.
- Better sentence-level Bridge Mode alignment.
- More learner progress signals without overclaiming personalization depth.
- Expanded evaluation with reviewed AI outputs and real learner testing.
- Deployment hardening: rate limiting, production CORS, abuse monitoring, and privacy policy.
