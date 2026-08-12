# Privacy and Security Notes

This document describes the current competition MVP posture. It is not a claim that Waddeh is fully secure for public production traffic.

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

Uploaded PDFs are not written to local server storage in the MVP.

## Local Browser Data

The frontend stores the following in `localStorage`:

- UI language.
- Saved vocabulary.
- Reading count.
- Preferred learner level.
- Highest bridge level reached.

This data stays on the current browser/device. There are no accounts or sync features in this version.

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
