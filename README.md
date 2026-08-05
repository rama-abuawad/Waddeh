# وضّح | Waddeh

> لأن الفهم يبدأ بالوضوح — Because understanding starts with clarity.

Waddeh is an Arabic-first reading companion designed to make complex Arabic content easier to understand without removing its meaning. It combines meaning-preserving clarification, translation, contextual vocabulary support, and adaptive learning in a bilingual, mobile-friendly experience.

## Product vision

Arabic readers often face a choice between difficult original text and translations or summaries that lose important details. Waddeh creates a clearer path through the original content while preserving names, dates, numbers, conditions, warnings, and technical facts.

The experience serves three focused reader profiles:

- Children who benefit from short sentences and familiar vocabulary.
- Non-Arabic speakers who need clear Arabic supported by English.
- General readers who want direct Modern Standard Arabic.

## Core capabilities

### Meaning-preserving clarification

Transforms complex Arabic into clearer Modern Standard Arabic while retaining critical information and the intent of the source.

### Arabic Word Lens

Provides the contextual meaning, helpful تشكيل, Arabic root, synonym, and English meaning of a selected word.

### PDF understanding

Processes Arabic PDF documents up to 10 MB as connected documents rather than isolated excerpts.

### Optional تشكيل

Adds selective diacritics to difficult or ambiguous words without filling the entire result with unnecessary marks.

### Saved vocabulary

Stores useful words in a device-local vocabulary collection that remains available across reading sessions.

### Adaptive learning

Adjusts the clarification level using completed readings and grounded comprehension checks.

### Change Map

Connects selected original phrases to their clearer versions and explains why each change improves readability.

### Bilingual experience

Supports a complete Arabic RTL and English LTR interface, accurate English results, bilingual learning tools, and browser-based read-aloud.

### Progressive Web App

Provides responsive phone, tablet, and desktop layouts with installable PWA metadata and an offline application shell.

## Architecture

```text
Browser
  Next.js · React · TypeScript · Tailwind CSS · PWA
                         │
                         │ HTTP
                         ▼
Application backend
  FastAPI · Pydantic · HTTPX
                         │
                         ▼
AI understanding layer
  Structured text, PDF, translation, and learning output
```

The frontend owns presentation, accessibility, RTL/LTR behavior, speech, and device-local learning state. The backend owns validation, document handling, structured AI requests, and private configuration.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, Pydantic, HTTPX |
| AI integration | Gemini Interactions API, structured JSON responses |
| Browser features | Speech synthesis, local storage, service worker |
| Quality | ESLint, TypeScript, Pytest |

## Repository structure

```text
waddeh/
├── frontend/           Web interface, PWA, and browser interactions
├── backend/            Validation and server-side AI integration
├── documentation/      Architecture and development notes
├── sample-documents/   Safe demonstration documents
├── context.md          Product scope, priorities, and roadmap
├── .env.example        Local configuration template
└── package.json        Monorepo commands
```

## Requirements

- Node.js 20.9 or newer
- Python 3.11 or newer
- A configured local `.env` file based on `.env.example`

## Installation

### Windows

```bat
npm.cmd install
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### macOS and Linux

```bash
npm install
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

## Development

Run the backend and frontend in separate terminal sessions from the repository root.

### Backend — Windows

```bat
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

### Backend — macOS and Linux

```bash
backend/.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

### Frontend

```bash
npm run dev:frontend
```

The application is available at `http://localhost:3000`.

## Validation

### Frontend

```bash
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
```

### Backend

Windows:

```bat
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

macOS and Linux:

```bash
backend/.venv/bin/python -m pytest backend/tests
```

## Privacy and data handling

- Simplification interactions are configured as stateless.
- Uploaded PDFs are processed for the active request and are not written to local server storage.
- Vocabulary and adaptive progress remain in browser storage on the current device.
- Sensitive or personal documents should not be used as public samples.

## Documentation

- [Product context and roadmap](./context.md)
- [Architecture](./documentation/architecture.md)
- [Development principles](./documentation/development.md)

## Project status

The current competition MVP includes the complete reading, translation, vocabulary, adaptive learning, PDF, PWA, and bilingual interface flow. Future work may extend OCR, grounded document chat, accounts, synchronized progress, and evaluation tooling.

## License

No open-source license has been selected. All rights are reserved.
