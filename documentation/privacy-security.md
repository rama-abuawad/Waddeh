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
- File size must be 4 MB or smaller so the request remains below Vercel's function payload limit.

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

Local development allows the explicit `FRONTEND_ORIGIN`, defaulting to `http://localhost:3000`.
An intentionally split deployment may add a comma-separated `FRONTEND_ORIGINS` list.
The Vercel Services deployment is same-origin, and the platform-provided frontend
service URL is accepted without hard-coding preview or production domains. Wildcard
origins and credentialed wildcard CORS are not enabled.

## Error Handling

Backend routes return controlled HTTP errors for missing Gemini configuration, model failures, invalid Arabic text, invalid PDFs, and oversized files.

Do not expose stack traces or secrets in user-facing errors.

## Production Controls

- AI routes have bounded Pydantic inputs, route-specific per-instance throttles,
  and a shared AI-request throttle. A Vercel WAF rate-limit rule is still required
  for a globally coordinated limit across scaled functions.
- PDFs are streamed into a bounded in-memory buffer and rejected above 4 MB.
- Cloud speech is limited to 600 characters per request; longer passages use the
  browser's device voice to avoid oversized function responses.
- Vercel environment variables hold deployment secrets, and `vercel.json` keeps
  browser API traffic same-origin.
- Public launch still requires abuse monitoring, provider quota/budget alerts,
  adversarial PDF testing, and a user-facing privacy policy for model processing.
