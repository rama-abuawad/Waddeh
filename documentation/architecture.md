# Initial architecture

Waddeh starts as a responsive Arabic-first web application with a deliberately small foundation.

```text
Browser (Next.js, RTL)
        |
        | HTTP /api/*
        v
FastAPI backend
        |
        +-- Gemini Interactions API (server-side only)
        |     +-- structured text understanding
        |     +-- direct PDF understanding
        |     +-- contextual Word Lens
        +-- PostgreSQL / pgvector (future)
        +-- document storage (future)
```

## Boundaries

- The frontend owns presentation, accessibility, responsive RTL layouts, and user interactions.
- The interface language is a device-local preference. Arabic renders RTL and English renders LTR without changing the source language of the reading task.
- The backend owns validation, AI requests, document processing, secrets, and later persistence.
- AI credentials must never be shipped to the browser.
- `GET /api/health` reports service availability.
- `POST /api/simplify` validates Arabic input and returns structured Gemini output.
- `POST /api/upload/pdf` validates a PDF up to 10 MB, sends it to Gemini for the request, and does not write it to server storage.
- `POST /api/explain-word` returns a short explanation grounded in the current clear-text context.
- Simplification requests use stateless Gemini interactions (`store=false`).
- One structured response also supplies selective تشكيل, an English translation, bilingual learning support, a bilingual Change Map, a grounded bilingual comprehension check, optional process steps, and preserved critical details.
- Saved vocabulary and the learning profile use browser `localStorage` in this competition version. They are device-local and require no account.

## Near-term priorities

1. Reliable meaning-preserving results for Arabic text and PDF input.
2. Arabic Word Lens and optional selective تشكيل inside the reading view.
3. Device-local vocabulary and grounded comprehension support.
4. Original, clear-Arabic, English, and Change Map views in a responsive PWA.

Detailed summaries, grounded chat, full quizzes, accounts, OCR, and retrieval across large document libraries remain later features. The current learning and visual tools are progressive: they appear after the clear text and never compete with the primary reading experience.
