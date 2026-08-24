# Security Policy

## Supported version

Security fixes are applied to the latest code on `main` and the latest published release.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository when available. If it is unavailable, open a minimal public issue asking the maintainers to establish a private reporting channel; do not include exploit details, credentials, private documents, personal data, or screenshots containing sensitive information.

Do not post any of the following in an issue, discussion, pull request, log, or screenshot:

- Gemini API keys or other access tokens.
- Firebase service-account credentials or private keys.
- `.env` or `.env.local` contents.
- Firebase UIDs, test-account details, or personal email addresses.
- Private Arabic text, uploaded PDFs, or other learner documents.

## Current security boundaries

- Gemini credentials remain behind the FastAPI backend and are never required by the browser.
- Firestore rules scope user documents and subcollections to the authenticated UID.
- Guest learning data is local to the browser; signed-in data uses an account-specific local cache and Firestore synchronization.
- Raw PDF bytes are transient and are not persisted to Firestore.
- Text and PDFs are sent to the configured model provider only for active processing requests.
- Environment files are ignored by Git and must never be committed.

Security reports should include a concise impact description, affected path or component, reproduction steps using non-sensitive fixtures, and a suggested mitigation when possible.
