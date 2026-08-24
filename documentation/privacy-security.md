# Privacy and Security Notes

This document describes the current application posture. It is not a claim that Waddeh is fully secure for public production traffic.

## Secrets

- `GEMINI_API_KEY` belongs only in local `.env` or deployment secrets.
- `.env` is ignored by Git and must never be committed.
- The browser never receives the Gemini key.
- Do not print, log, screenshot, fixture, or document real API keys.

## AI Processing

Text and PDF content sent for adaptation is forwarded to the configured model provider for the active request.

The backend sets Gemini interaction storage to `false` in requests. This is an application configuration choice, not a complete privacy guarantee beyond the provider's actual policies.

## PDF Handling

The backend validates:

- `Content-Type` must be `application/pdf`.
- File bytes must include a PDF signature near the start.
- File size must be 10 MB or smaller.

Uploaded PDF bytes are not written to local server storage or Firestore.

## Browser and Account Data

Guest mode stores the following in browser storage:

- UI language.
- Saved vocabulary.
- Reading count.
- Preferred learner level.
- Learner level mode and placement status.
- Highest bridge level reached.
- Vocabulary mastery states, quiz evidence, and review timestamps.
- Comprehension feedback counts.
- Meaning Thread categories the learner explicitly opened.

Guest data stays on the current browser/device. A bounded snapshot of relevant vocabulary and difficulty categories is sent to the backend only with an active adaptation request so the next reading can be personalized.

Signed-in learners use an account-specific local cache and Firestore synchronization. Account data is stored under `users/{uid}` and UID-scoped reading and vocabulary subcollections. Firestore rules require the authenticated UID to match the requested user path. Guest-to-account migration copies and conservatively merges learning state; it does not delete the guest copy. Raw PDF bytes are never included in Firestore records.

## CORS

Local development allows the configured `FRONTEND_ORIGIN`, defaulting to `http://localhost:3000`.

For public deployment, set `FRONTEND_ORIGIN` explicitly to the production frontend URL and avoid broad origins.

## Error Handling

Backend routes return controlled HTTP errors for missing Gemini configuration, model failures, invalid Arabic text, invalid PDFs, and oversized files.

Do not expose stack traces or secrets in user-facing errors.

## Production Gaps

Before public launch, add:

- Rate limiting.
- Abuse monitoring.
- Deployment-specific secret management.
- Production CORS review.
- Larger adversarial PDF testing.
- Dependency vulnerability review.
- A clear privacy policy for model-provider processing.
