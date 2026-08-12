# Waddeh V2 Architecture

Waddeh V2 is an adaptive Arabic learning companion. Its core journey is:

```text
Authentic Arabic
  -> readability assessment
  -> learner level selection
  -> controlled Arabic adaptation
  -> independent meaning-integrity checks
  -> contextual vocabulary
  -> Bridge Mode
  -> original Arabic
```

## System Boundary

```text
Browser
  Next.js, React, TypeScript, Tailwind CSS, PWA shell
        |
        | HTTP
        v
FastAPI backend
  Pydantic schemas
  deterministic readability service
  deterministic integrity service
  Gemini generation and semantic verification
        |
        v
Gemini Interactions API
```

The frontend owns the learning journey, RTL/LTR presentation, local learner profile, saved vocabulary, speech synthesis, and PDF/text input ergonomics.

The backend owns validation, structured AI prompts, Gemini credentials, deterministic analysis, PDF validation, independent meaning-integrity checks, and response schemas.

## Backend Pipeline

For text requests, `POST /api/simplify` performs:

1. Arabic input validation.
2. Deterministic readability assessment.
3. Structured Gemini adaptation at the requested learner level.
4. Deterministic integrity comparison between source and adapted text.
5. Separate semantic integrity verification with Gemini when configured.
6. A single structured response containing adaptation, translation support, Word Lens inputs, Change Map, Bridge Mode, comprehension check, readability, and meaning integrity.

For PDF requests, `POST /api/upload/pdf` validates file type and size, forwards the active bytes to Gemini, and does not write uploaded content to local storage. Because the original extracted PDF text is not persisted in this MVP, deterministic source-vs-adapted integrity is limited for PDF responses.

## Readability

The first implementation separates deterministic signals from AI-estimated signals. Current deterministic signals include sentence count, word count, average sentence length, long sentence examples, vocabulary indicators, numbers, dates, and difficulty reasons.

The displayed difficulty estimate is a heuristic, not a validated academic readability score.

## Meaning Integrity

Meaning integrity has two layers:

- Deterministic checks for numbers, dates, times, currencies, percentages, and visible list counts.
- Semantic verification for conditions, warnings, obligations, omissions, and possible meaning changes when Gemini is configured.

The UI avoids absolute claims such as perfect verification.

## Bridge Mode

Bridge Mode is the main learning differentiator. It presents progressively richer Arabic versions so learners can move from their adapted level toward the original wording while seeing meaningful vocabulary or structure reintroductions.

## Local Persistence

The competition MVP uses browser `localStorage` for:

- UI language.
- Saved vocabulary.
- Reading count.
- Preferred learner level.
- Highest bridge level reached.

There are no accounts or cross-device sync in this version.
