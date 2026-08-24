# Firebase account and persistence boundary

Waddeh remains guest-first. The existing browser storage is the authoritative cache for a guest and an account-specific local cache keeps the signed-in experience usable when Firestore is offline. Firebase Authentication adds Google and email/password accounts; Firestore adds cross-device learning-state synchronization.

## Data layout

- `users/{uid}`: interface language, learning profile, schema version, sync timestamps, and bounded deletion tombstones.
- `users/{uid}/readings/{readingId}`: reading source text, mode, level, status, generated result, comprehension state, and reading UI state. Uploaded PDF bytes are never persisted.
- `users/{uid}/vocabulary/{wordId}`: saved word or expression, source context, review evidence, transfer evidence, and derived mastery.

The repository in `frontend/lib/waddeh-repository.ts` is the only Firestore persistence boundary. It normalizes loaded data, merges records by stable identifiers and timestamps, unions learning evidence conservatively, writes in batches, and retains local state if cloud access fails. First account sign-in copies guest data into the account cache and cloud; the guest copy is not deleted. Existing account language and level preferences take precedence over guest preferences, and migration waits when Firestore is unavailable so an unknown remote account is not overwritten later. A device-level completion marker prevents the same guest profile from being silently copied into a later, different account.

## Backend decision

Firebase Admin is intentionally not added to FastAPI. The backend continues to process Arabic text, poetry, PDFs, and TTS without requiring an account, while Firestore is accessed directly by the authenticated web client under user-owned security rules. No backend API schema, Gemini credential path, or guest reading contract changes. If server-owned account data or privileged jobs are introduced later, token verification and Firebase Admin should be added as a separate backend boundary.

## Firebase Console setup

1. Create a Firebase Web App and place its public web configuration values in the six `NEXT_PUBLIC_FIREBASE_*` environment variables documented in `.env.example`.
2. Enable Authentication providers: Email/Password and Google. Add local and deployed app domains to Authentication authorized domains.
3. Create a Firestore database and deploy `firestore.rules` and `firestore.indexes.json` with the Firebase CLI.
4. Use a test account to verify sign-up, email verification delivery, sign-in, reset email, sign-out, migration, and a second-browser cross-device sync.

Firebase web configuration values identify the project but are not authorization secrets. Service-account keys are not used and must never be added to frontend environment variables or committed.
