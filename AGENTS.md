# Waddeh Agent Guide

## Product Mission

Waddeh is an adaptive Arabic learning companion that creates a bridge between the Arabic a learner can understand today and the authentic Arabic they want to understand tomorrow.

Product philosophy: Understand → Learn → Adapt → Progress.

## Core Differentiation

Waddeh must focus on:

- Controlled Arabic readability.
- Personalized adaptation.
- Preservation of source meaning.
- Contextual Arabic vocabulary learning.
- Progressive movement toward authentic Arabic.

Waddeh must not become:

- A generic chatbot.
- A generic translator.
- A generic PDF chatbot.
- A collection of unrelated AI features.
- A Duolingo clone.

## Engineering Rules

- Design Arabic-first, with correct RTL behavior and bilingual support where it helps learning.
- Preserve existing working features unless they are intentionally superseded.
- Keep frontend and backend API contracts synchronized.
- Use structured backend schemas for AI-facing and client-facing data.
- Validate external model output before returning it to the client.
- Test important AI behavior with deterministic fixtures or mocked model calls.
- Never expose secrets in source, logs, screenshots, prompts, tests, docs, or commits.
- `.env` must never be committed; keep real credentials local and server-side.
- Gemini credentials must stay behind the FastAPI backend.
- Do not invent metrics, user-test results, partnerships, awards, or unsupported claims.
- Do not force-push.
- Use branch-based development and merge only reviewed, validated work into `main`.

## Local Commands

Install dependencies from the repository root:

```powershell
npm.cmd install
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Run development servers in separate terminals:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
npm run dev:frontend
```

Validate before handing off work:

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
git status --short --branch
git ls-files .env
```
