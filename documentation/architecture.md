# Waddeh Architecture

Waddeh is an adaptive Arabic learning companion. Its core journey is:

```text
Authentic Arabic
  -> readability assessment
  -> manual level selection or short placement check
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
  guest/account-specific local cache
  Firebase Authentication and Firestore synchronization
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

The frontend owns the learning journey, RTL/LTR presentation, guest and account-specific local state, Firebase Authentication, Firestore synchronization, saved vocabulary, speech playback, and PDF/text input ergonomics.

The backend owns validation, structured AI prompts, Gemini credentials, deterministic analysis, PDF validation, independent meaning-integrity checks, and response schemas. A separately configured fallback model is attempted only when the primary Gemini model returns HTTP 429; authentication and request-validation failures are not retried against it.

## Backend Pipeline

For text requests, `POST /api/simplify` performs:

1. Arabic input validation.
2. Deterministic readability assessment.
3. Structured Gemini adaptation at the requested learner level.
4. Deterministic integrity comparison between source and adapted text.
5. Separate semantic integrity verification with Gemini when configured.
6. A single structured response containing adaptation, translation support, Word Lens inputs, Meaning Threads, Change Map, Bridge Mode, comprehension check, readability, and meaning integrity.

For PDF requests, `POST /api/upload/pdf` validates file type and size, forwards the active bytes to Gemini, and does not write uploaded content to local server storage or Firestore. Raw file bytes remain transient and must be reattached when a later retry needs them.

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

## Meaning Threads and Reading Memory

Meaning Threads return only confident, structured relationships inside the adapted Arabic: pronoun references, actors, connectors, negation scope, conditions, and other references. Opening a thread is an explicit support action and updates Reading Memory.

Reading Memory tracks saved vocabulary mastery from optional multiple-choice review, comprehension feedback, and recurring relationship difficulties. Users may keep a manually selected level fixed or use automatic mode, where placement and later comprehension evidence adjust the level gradually. A bounded snapshot is included in later adaptation requests so mastered language can remain when appropriate and unresolved vocabulary can receive support. It is not presented as a validated proficiency model.

## Persistence

Guest mode uses browser storage for:

- UI language.
- Saved vocabulary.
- Reading count.
- Preferred learner level.
- Learner level mode and placement status.
- Highest bridge level reached.
- Vocabulary mastery states, quiz evidence, and review timestamps.
- Comprehension feedback and explicitly opened Meaning Thread categories.

Signed-in learners use Firebase Authentication and UID-scoped Firestore documents with an account-specific local cache. Guest-to-account migration conservatively merges readings, vocabulary, profile state, and learning evidence while retaining the original guest copy. Firestore access is isolated in `frontend/lib/waddeh-repository.ts`, and `firestore.rules` permits users to access only their own document tree.
