# Development notes

## Principles

- Arabic and right-to-left behavior are first-class requirements.
- Preserve names, dates, numbers, deadlines, conditions, requirements, warnings, exceptions, and technical facts.
- Prefer fewer complete features over many unfinished features.
- Do not record invented user-testing results.
- Keep private document content and service credentials out of logs and source control.
- Do not persist uploaded PDF bytes; forward validated bytes only for the active AI request.
- Preserve guest-first local continuity and UID-scoped account synchronization.

## Branches

Use `main` for stable reviewed work. Create focused feature or fix branches from the latest `main`, validate them, and merge through review. Do not force-push shared branches. Preserve the central backend/frontend API contract.

## Validation

Run from the repository root before handoff:

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
backend\.venv\Scripts\python.exe evaluation\check_deterministic.py
backend\.venv\Scripts\python.exe evaluation\live_gemini_smoke.py
git ls-files .env
```

`evaluation\live_gemini_smoke.py` requires a locally configured Gemini key. It never prints the key.
