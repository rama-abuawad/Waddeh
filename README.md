# وضّح | Waddeh

**لأن الفهم يبدأ بالوضوح — Because understanding starts with clarity.**

Waddeh is an Arabic-first, AI-powered reading companion that makes difficult Arabic content clearer without changing its meaning. The competition MVP now accepts Arabic text and PDF documents, adapts explanations to the reader, and turns each result into a small learning experience.

## Repository structure

```text
waddeh/
├── frontend/           Next.js, TypeScript, Tailwind CSS, Arabic RTL
├── backend/            FastAPI service
├── documentation/      Architecture and project documentation
├── sample-documents/   Safe, non-sensitive test documents
├── context.md          Full project scope and roadmap
└── .env.example        Shared environment-variable template
```

## Requirements

- Node.js 20 or newer
- Python 3.11 or newer

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment, then install and run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; health is at `GET /api/health`, and interactive documentation is at `/docs`.

## Environment

Copy `.env.example` to `.env` and adjust local values. Never commit real credentials. Browser code must never receive AI or database service-role keys; all AI calls will go through the backend.

For the working simplification feature, add a Gemini API key to the root `.env` file:

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=your_private_key
```

## Current scope

- Responsive Arabic RTL simplification workspace
- Complete Arabic/English interface switch with automatic RTL/LTR layout
- Three focused reader profiles: child, non-Arabic speaker, and general reader
- Arabic text and PDF understanding (PDF files up to 10 MB)
- Arabic Word Lens: tap a word for its contextual meaning, useful تشكيل, root, synonym, and English meaning
- Optional selective تشكيل for difficult or ambiguous words in the clear text
- A personal vocabulary list stored locally on the reader's device
- Adaptive learning based on completed readings and self-rated comprehension checks
- English versions of generated learning steps, Change Map explanations, preserved details, and comprehension checks
- Change Map showing selected before-and-after phrases and why each was clarified
- FastAPI application with CORS, health, structured simplification, PDF, and word-explanation endpoints
- Gemini clear-Arabic and English translation output with server-side secret handling
- Installable PWA metadata, generated application icons, and an offline app shell
- Browser-based Arabic and English read-aloud
- Grounded vocabulary cards and a comprehension check
- Automatic step visualization for procedural text
- Meaning-preservation review for critical names, dates, numbers, and conditions
- Monorepo scripts and configuration
- Documentation and sample-document placeholders

See [context.md](./context.md) for the complete product vision, priorities, and delivery roadmap. See [documentation/architecture.md](./documentation/architecture.md) for the initial architecture.

PDF files are sent directly to the configured AI service for the current request and are not written to local server storage. Saved vocabulary and adaptive progress stay in the browser on that device. Clearing browser storage removes them.

## Checks

```bash
cd frontend && npm run lint && npm run build
cd backend && python -m pytest
```

## License

No open-source license has been selected yet. All rights are reserved until the project team chooses one.
