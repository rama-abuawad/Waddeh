# Contributing to Waddeh

Thank you for helping Waddeh make authentic Arabic more understandable without replacing the language learners are trying to read.

## Before you start

- Read the product mission and current capabilities in `README.md`.
- Keep changes focused on controlled Arabic readability, contextual learning, meaning preservation, and progress toward original wording.
- Do not turn Waddeh into a generic chatbot, translator, PDF chat tool, or unrelated feature bundle.
- For substantial changes, open an issue first so the scope and frontend/backend contract can be discussed.

## Development workflow

1. Branch from the latest `main`.
2. Use a short, descriptive branch name such as `fix/rtl-dialog-focus` or `feature/reading-support`.
3. Keep commits focused and do not rewrite shared history.
4. Update tests and documentation with the implementation.
5. Open a pull request using the repository template.

Follow the setup instructions in `README.md`. Never commit `.env`, `.env.local`, Firebase service credentials, API keys, private documents, or real user data.

## Required validation

Run the relevant checks before opening a pull request:

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
git diff --check
```

For frontend changes, also verify:

- Arabic RTL and English LTR layouts.
- Desktop, tablet, and mobile behavior.
- Keyboard navigation, visible focus, and dialog focus restoration.
- No unintended horizontal overflow or clipped controls.

For backend or AI-facing changes, keep schemas structured, validate model output, preserve frontend/backend compatibility, and cover important behavior with deterministic fixtures or mocked model calls.

## Pull requests

Describe the learner problem, the change, validation performed, and any external-service checks that remain manual. Do not claim performance, accuracy, learning gains, or user-test outcomes without evidence.

By participating, you agree to follow `CODE_OF_CONDUCT.md` and `SECURITY.md`.
