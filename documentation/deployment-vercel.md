# Vercel deployment runbook

This repository is prepared for one Vercel project using Vercel Services. Do not
create separate frontend and backend projects unless Services is unavailable to
the account.

## Import settings

1. Import `rama-abuawad/Waddeh` from GitHub.
2. Set the project name to `waddeh` (or another stable name you control).
3. Set **Framework Preset / Application Preset** to **Services**.
4. Keep the repository root as the project root. Do not select `frontend/` or
   `backend/` in the dashboard: `vercel.json` defines both service roots.
5. Keep install, build, and output commands on their detected defaults.
6. Confirm that Vercel detects:
   - `frontend`: root `frontend/`, framework `nextjs`
   - `backend`: root `backend/`, framework `fastapi`, entrypoint `app.main:app`

Vercel Services is currently an access-controlled feature. If **Services** is not
shown as a preset, request Services access from Vercel before importing. Do not
replace the configuration with deprecated `builds` syntax.

## Environment variables

Add the following to Production. Add them to Preview only if preview deployments
will be used for real Firebase/Gemini testing.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY` (encrypted secret; never prefix with `NEXT_PUBLIC_`)
- `AI_MODEL`
- `AI_FALLBACK_MODEL`
- `AI_TTS_MODEL`
- `AI_TTS_ARABIC_VOICE`
- `AI_TTS_ENGLISH_VOICE`
- `RATE_LIMIT_ENABLED=true`

Do not add `NEXT_PUBLIC_API_BASE_URL` in Vercel. Production browser calls are
same-origin and `/api/*` is routed to FastAPI. `FRONTEND_ORIGIN` is only required
for a deliberately separate cross-origin frontend; Services deployments are
same-origin and Vercel supplies the service URL automatically.

## Cost protection before public access

The API has per-instance, per-IP throttles as defense in depth. Because serverless
instances do not share memory, configure a Vercel Firewall rule before sharing the
site publicly:

1. Open the project, then **Firewall**.
2. Create a rate-limit rule for request method `POST` and paths beginning `/api/`.
3. Group by client IP and start with 20 requests per 10 minutes.
4. Apply the rule to Production. Monitor legitimate use and Gemini quota, then
   tune the threshold rather than disabling protection.
5. Keep Google AI/Gemini usage quotas or budget alerts enabled as a second guard.

If the plan does not expose the Rate Limit action, do not treat the in-process
limit as a globally reliable replacement. Enable the appropriate Vercel WAF tier
or keep the deployment protected while choosing another shared rate-limit store.

## Firebase after the first deployment

1. Copy the stable production domain from Vercel.
2. In Firebase Console, open **Authentication → Settings → Authorized domains**
   and add only that stable production domain.
3. Deploy the reviewed rules with `firebase deploy --only firestore:rules,firestore:indexes`.
4. Redeploy after confirming all environment variables.
5. Test email/password sign-in, Google sign-in, sign-out/sign-in, Firestore sync,
   and guest-to-account migration.

Avoid authorizing wildcard preview domains. If preview authentication is needed,
authorize only a stable preview alias and give Preview its own intentional
environment-variable scope. Otherwise keep Firebase and Gemini variables limited
to Production.

## Analytics

After deployment, enable **Web Analytics** and **Speed Insights** in the Vercel
project dashboard. The frontend already includes the official packages and root
layout components. They collect aggregate, privacy-oriented traffic and web-vital
data; Waddeh does not attach these events to Firebase user identities.
