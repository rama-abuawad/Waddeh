# Waddeh Evaluation

This directory contains a small, safe evaluation starter set for the Waddeh V2 competition branch.

The sample passages are self-created and short. They cover:

- Beginner-friendly Arabic.
- Educational Arabic.
- Academic Arabic.
- Formal or administrative Arabic.
- Cultural or heritage Arabic.

## Deterministic Checks

Run from the repository root after backend dependencies are installed:

```powershell
backend\.venv\Scripts\python.exe evaluation\check_deterministic.py
```

This check does not call Gemini. It verifies that the representative samples pass through the deterministic readability and meaning-integrity services without schema failures or obvious fact-loss regressions.

## AI Evaluation

Live adaptation, semantic integrity verification, Word Lens, PDF understanding, and Bridge Mode quality require a configured `GEMINI_API_KEY` in `.env`.

Run the live integration smoke test from the repository root:

```powershell
backend\.venv\Scripts\python.exe evaluation\live_gemini_smoke.py
```

The script checks the real backend pipeline for text and PDF inputs, including structured response validity, readability, fact preservation, Meaning Integrity status, at least three Bridge levels, contextual Word Lens fields, and visible encoding artifacts. It prints only a safe pass/fail summary.

Do not record or publish AI quality claims from this directory unless they come from actual runs and reviewed outputs.

## Future Human Testing

Use the template in `documentation/user-testing-template.md` to collect future learner feedback. Do not invent comprehension scores, learner confidence, vocabulary gains, or usability results.
