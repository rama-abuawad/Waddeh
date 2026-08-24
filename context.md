# Waddeh Product Context

Waddeh helps learners understand authentic Arabic at their current level and progressively guides them toward reading the original language independently.

## Mission

Waddeh is an adaptive Arabic learning companion that creates a bridge between the Arabic a learner can understand today and the authentic Arabic they want to understand tomorrow.

Product philosophy:

```text
Understand -> Learn -> Adapt -> Progress
```

## Problem

Arabic learners often meet authentic Arabic that is above their current reading level. Translation, summarization, and beginner-only material can help in the moment, but they may let the learner bypass the Arabic itself.

Waddeh closes the gap between:

- The Arabic the learner understands today.
- The authentic Arabic they want to understand eventually.

## Product Journey

```text
Authentic Arabic
  -> Difficulty Assessment
  -> Learner Level
  -> Controlled Arabic Adaptation
  -> Meaning Integrity Check
  -> Contextual Vocabulary Learning
  -> Bridge Mode
  -> Increasingly Authentic Arabic
  -> Original Arabic
```

## Differentiation

Waddeh focuses on:

- Controlled Arabic readability.
- Personalized adaptation.
- Preservation of source meaning.
- Contextual Arabic vocabulary learning.
- Progressive movement toward authentic Arabic.

Waddeh is not:

- A generic chatbot.
- A generic translator.
- A generic PDF chatbot.
- A collection of unrelated AI features.
- A Duolingo clone.

## Current Implementation

Implemented in the current product:

- Next.js Arabic-first PWA frontend.
- FastAPI backend.
- Gemini integration behind the backend.
- Text and PDF adaptation requests.
- Standard reading, poetry explanation, and PDF reading workflows.
- Deterministic readability assessment.
- Learner-controlled level setup: manual selection or a short placement check with optional automatic adjustment from later comprehension checks.
- Controlled adaptation strategy.
- Deterministic meaning-integrity checks.
- Separate semantic integrity verification when Gemini is configured.
- Contextual Word Lens.
- Meaning Threads for pronouns, actors, connectors, negation, conditions, and references.
- English translation support.
- Guest-first Reading Memory with saved-word review, transfer challenges, evidence-based vocabulary mastery, comprehension feedback, and recurring difficulty signals.
- Bridge Mode response and UI.
- Text-to-speech, Reading History, Learning Path, and Learning Map.
- Firebase Authentication with Google and email/password accounts.
- UID-scoped Firestore synchronization with guest-to-account migration and account-specific local caching.
- Arabic and English RTL/LTR interfaces.
- Backend tests and deterministic evaluation starter set.
- GitHub Actions validation workflow.

## Limitations

- Readability level is a heuristic, not a validated academic score.
- Semantic integrity and Bridge Mode quality require Gemini and human review.
- Raw PDF bytes are not persisted, so learners must reattach a PDF when retrying after the page closes.
- Reading Memory reflects placement, quiz, comprehension, and transfer evidence; it is not a validated proficiency model.
- Cloud synchronization requires configured Firebase services; guest mode remains local to the browser.
- Large document management, OCR, and generic chat are intentionally outside the product scope.

## Roadmap

High-value next steps:

1. Live Gemini QA with representative Arabic passages after a key is configured.
2. Improve Bridge Mode ordering with more sentence-level alignment.
3. Add richer learner progress signals while keeping claims honest.
4. Add public deployment hardening: rate limiting, production CORS, abuse monitoring, and privacy policy.
5. Expand evaluation with reviewed AI outputs and real learner testing.
