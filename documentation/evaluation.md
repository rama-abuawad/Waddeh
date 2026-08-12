# Evaluation Strategy

Waddeh V2 needs evidence for the learning journey, not generic model impressiveness.

## Current Automated Coverage

Backend tests cover:

- Health endpoint.
- Arabic input validation.
- Mocked adaptation response shape.
- PDF validation.
- Word Lens route.
- Gemini proxy isolation.
- Deterministic readability signals.
- Deterministic number/date preservation.
- Deterministic missing-number detection.

The deterministic evaluation runner in `evaluation/` uses representative self-created Arabic passages and does not require Gemini.

## What Deterministic Checks Can Prove

They can catch regressions in:

- Schema validity.
- Sentence and word counting.
- Formal or technical vocabulary indicators.
- Number/date extraction.
- Missing numeric facts.
- PDF input validation.

## What Requires Live AI Review

These require `GEMINI_API_KEY` and human review:

- Whether the adapted Arabic is genuinely appropriate for the target learner level.
- Whether Bridge Mode levels are ordered from easier to more authentic.
- Whether semantic integrity warnings catch subtle omissions.
- Whether Word Lens meanings are contextual and not dictionary dumps.
- Whether English support helps without becoming the destination.

## Manual Demo Checks

Use at least one short formal Arabic passage with a date and a number. Confirm:

- Difficulty result appears.
- Selected learner level affects the request.
- Adapted Arabic preserves critical facts.
- Meaning Integrity does not overclaim.
- Bridge Mode shows progressive versions.
- Word Lens opens for Arabic words.
- English translation is available but not the central path.
- PDF upload follows the same journey after a configured API key is present.

## No Fabricated Results

Do not publish comprehension gains, accuracy percentages, learner confidence scores, or usability results unless they come from actual logged evaluation sessions.
