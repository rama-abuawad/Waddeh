# Development notes

## Principles

- Arabic and right-to-left behavior are first-class requirements.
- Preserve names, dates, numbers, deadlines, conditions, requirements, warnings, exceptions, and technical facts.
- Prefer fewer complete features over many unfinished features.
- Do not record invented user-testing results.
- Keep private document content and service credentials out of logs and source control.
- Do not persist uploaded PDFs in the competition MVP; forward validated bytes only for the active AI request.
- Keep vocabulary and learning progress on the user's device until accounts and consent-based synchronization are designed.

## Branches

Use `main` for stable reviewed work.

Use `competition/waddeh-v2` for the current competition transformation. Do not commit competition development directly to `main`, and do not force-push shared branches.

Feature branches may branch from `competition/waddeh-v2` when parallel work needs isolation. Integrate only reviewed changes that preserve the central backend/frontend API contract.

## Validation

Run from the repository root before handoff:

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
backend\.venv\Scripts\python.exe evaluation\check_deterministic.py
git ls-files .env
```
