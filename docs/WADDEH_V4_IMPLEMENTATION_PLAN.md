# Waddeh V4 — Implementation Plan

> **Status:** Phase 0 repository mapping only  
> **Blueprint:** `docs/WADDEH_V4_PRODUCT_UX_BLUEPRINT.md`  
> **Audit date:** 2026-08-22  
> **Implementation branch at audit:** `redesign/waddeh-v4`

This document maps the current working repository to the V4 product and UX blueprint. It is intended to prevent repeated repository discovery during later phases. It does not authorize a wholesale rewrite: V4 should be delivered by extracting and relocating working behavior, then adding the missing route, persistence, and document capabilities in controlled phases.

## 1. Executive implementation decision

The current application already contains most of the AI-backed reading and learning capabilities required by V4, but they are presented as one long page and implemented in one large client component. The backend contracts are structured, validated, and well tested. The lowest-risk path is therefore:

1. Keep the current Next.js, React, Tailwind, FastAPI, Pydantic, and Gemini stack.
2. Preserve the existing backend endpoints and response fields while the frontend is reorganized.
3. Extract state and behaviors from `frontend/app/page.tsx` before changing their UX.
4. Introduce Home, Reading, and My Learning as separate route environments around the extracted behavior.
5. Add local reading persistence before Firebase so route migration and guest use can be completed independently of authentication.
6. Extend backend contracts only for capabilities the current API cannot represent: general contextual explanation, explicit language insights, and sectioned PDF/document processing.

The current teal, mint, paper, and ink identity remains the visual foundation. The V4 work should reduce marketing-page and card-heavy patterns, not introduce a second design system.

---

## 2. Current architecture relevant to V4

### 2.1 Runtime and framework boundary

```text
Browser / installed PWA
  Next.js 16 App Router
  React 19 client state
  TypeScript
  Tailwind CSS 4 + large global CSS layer
  motion/react for landing/auth transitions
  localStorage for language, vocabulary, and learning profile
  Web Audio + SpeechSynthesis for playback/fallback
          |
          | HTTP through frontend/lib/api.ts
          v
FastAPI
  Pydantic request/response validation
  deterministic readability and integrity services
  Gemini structured generation, semantic verification, PDF analysis, and TTS
```

The frontend owns navigation presentation, current reading state, level selection, local learning state, audio playback, and browser persistence. The backend owns input validation, AI prompts, structured model output, readability analysis, meaning-integrity checks, PDF validation, and generated speech.

### 2.2 Existing routes and layout

The production build currently exposes only these product routes:

| Route | Current implementation | V4 mapping |
|---|---|---|
| `/` | `frontend/app/page.tsx` | Currently combines marketing Home, input workspace, Reading/results, vocabulary/review, poetry, and product explanation. Must become focused Home. |
| `/auth` | `frontend/app/auth/page.tsx` rendering `Auth11` | Presentation-only sign-in/create-account mock. Keep the route, replace form behavior when Firebase is introduced. |
| `/_not-found` | Framework default | V4 needs a branded and useful not-found state later. |

There is no Reading route, My Learning route, profile/settings route, history route, or document route. Current results remain in component memory on `/`; refresh or navigation loses them.

`frontend/app/layout.tsx` is the only shared layout. It supplies metadata, a fixed initial Arabic `lang="ar"`/`dir="rtl"`, global CSS, and `PwaRegister`. The Home client later mutates the root language and direction when the UI language changes.

### 2.3 Current Home and submission flow

`frontend/app/page.tsx` is a client component of roughly 2,800 lines. Its current pre-result flow contains:

- `WaddehHero` and `LandingNavbar`, with a full-viewport marketing hero, language switch, sign-in link, and anchor navigation.
- `HowItWorks`, a four-card explanation band.
- A multi-step workspace that asks for audience, learner level, placement mode, and input source before submission.
- Text input with a 15,000-character limit.
- PDF input with client-side 10 MB validation and a file-ready state.
- A separate poetry section and form far below the standard workspace.
- An example text and example poem.
- Readability assessment before text simplification.
- Inline loading, validation, and request error states.

Submission is handled by the inline `handleSubmit` function. It builds a `ReadingMemorySnapshot`, optionally calls `assessReadability`, then calls either `simplifyText` or `simplifyPdf`. The completed response is stored only in React state and rendered farther down the same page.

This provides working input ergonomics, validation, and API orchestration, but it does not match V4's focused composer, Standard/Poetry selector, immediate Reading navigation, or guest reading history.

### 2.4 Current Reading/results implementation

The current `result-shell` in `frontend/app/page.tsx` is the source implementation for V4 Reading. It currently provides:

- Result title or PDF filename.
- Three views: `clear`, `english`, and `original`.
- Optional difficult-word diacritics in the clear Arabic view.
- Interactive Arabic word tokens through `InteractiveArabic`.
- Inline Word Lens details and save action.
- Readability metrics.
- Primary tools: comprehension check, Meaning Threads, and Bridge Mode.
- Progressively disclosed secondary tools: TTS, learning cards, change map, cultural meanings, visual steps, and meaning integrity.
- Copy result and reset/new-content actions.

The current result view maps to V4 as follows:

| Existing response/UI | V4 destination | Migration note |
|---|---|---|
| `english_translation` | Reading → Understand → Natural Meaning | Re-label and present as the primary readable English meaning. |
| `simplified_text` | Reading → Simplify | Preserve as the primary clearer-Arabic output. |
| `diacritized_text` | Reading → Simplify or reading preference | Preserve the difficult-word diacritics toggle. |
| `original_text` | Arabic source surface / optional comparison | Keep Arabic central; do not retain “Text as written” as an equal top-level result tab. |
| `change_map` | Simplify → What changed? | Reuse behind progressive disclosure. |
| `learning_cards` | Learn → Vocabulary in This Text | Preserve save behavior; initially show the existing maximum of three items. |
| `cultural_meanings` | Learn → Expressions Worth Knowing and/or Explore | Separate expressions from general word vocabulary in presentation and persistence. |
| `comprehension_check` | Explore → Test Your Understanding | Reuse existing choices, answer, feedback, and level evidence. |
| `meaning_threads` | Explore → Meaning Thread | Reuse in the desktop rail drawer and mobile sheet/activity. |
| `bridge` | Reading handoff and My Learning → Path | Keep current per-reading data, but move the full path presentation to My Learning. |
| `visual_steps` | Optional Explore utility | Preserve only when returned; do not give it a permanent destination. |
| `meaning_integrity` and `preserved_details` | Secondary trust/details surface | Preserve without competing with the primary reading flow. |
| `readability` and `adaptation_strategy` | Internal/adaptive support; restrained user detail | Preserve the data and current level logic; remove dashboard-like prominence. |

The current backend does not provide a dedicated concise general explanation distinct from the English translation, and it does not return explicit structured grammar/language insights. These are true contract gaps, not merely missing UI.

### 2.5 Translation and simplification pipeline

Frontend API calls live in `frontend/lib/api.ts`:

- `assessReadability`
- `simplifyText`
- `simplifyPdf`
- `explainWord`
- `createTransferChallenge`
- `explainPoetry`
- `generateSpeechBlob`

The file also defines the TypeScript request and response types used throughout the client. `requestJson` provides request cancellation timeouts and controlled Arabic connection/error messages.

Backend routes live in `backend/app/main.py`:

| Endpoint | Current role | V4 use |
|---|---|---|
| `GET /api/health` | Health check | Preserve. |
| `POST /api/readability` | Deterministic/heuristic text assessment | Preserve for adaptation and optional restrained feedback. |
| `POST /api/simplify` | Full structured text adaptation | Preserve as the core Standard Reading request. |
| `POST /api/upload/pdf` | Validates and sends one entire PDF for one simplification result | Preserve during early migration; supersede with section extraction/analysis in Document phase. |
| `POST /api/explain-word` | Contextual Word Lens | Preserve for direct word exploration. |
| `POST /api/learning/transfer-challenge` | New-context vocabulary challenge | Preserve for My Learning review. |
| `POST /api/speech` | WAV speech generation | Preserve behind the extracted speech player. |
| `POST /api/poetry/explain` | Structured poetry overview, lines, vocabulary, and cultural meanings | Preserve and move into the common Reading shell. |

`backend/app/schemas.py` validates every request and AI/client response. `SimplificationOutput` already includes adaptation strategy, clear Arabic, selective diacritics, English translation, preserved details, learning cards, visual steps, change map, Meaning Threads, cultural meanings, Bridge Mode, and a comprehension check. `SimplifyResponse` adds the original input, reader, level, readability, integrity report, and optional source filename.

`backend/app/services/gemini.py` is the central AI service. The V4 migration must preserve these methods and their error behavior:

- `GeminiService.simplify`
- `GeminiService.simplify_pdf`
- `GeminiService.verify_integrity`
- `GeminiService.explain_word`
- `GeminiService.create_transfer_challenge`
- `GeminiService.explain_poetry`
- `GeminiService.generate_speech`
- `get_gemini_service`

Supporting deterministic services are already separated and should remain intact:

- `backend/app/services/adaptation.py` → `build_adaptation_strategy`
- `backend/app/services/readability.py` → `assess_readability`
- `backend/app/services/integrity.py` → `build_deterministic_integrity_report` and `combine_integrity_reports`

### 2.6 TTS architecture

TTS is fully implemented but embedded in `frontend/app/page.tsx`. The current flow:

1. Chooses Arabic or English from the active result view.
2. Caches up to ten generated audio blobs in memory.
3. Calls `generateSpeechBlob` and decodes WAV data through `AudioContext`.
4. Handles request abort, stale sessions, cleanup, and audio completion.
5. Falls back to a matching device `SpeechSynthesisVoice` when cloud speech fails.
6. Gives specific feedback for rate limits, timeouts, unavailable providers, invalid audio, and missing device voices.

This behavior is valuable and regression-prone. It should be extracted largely unchanged into a dedicated hook/service. Current limitations relative to V4 are the lack of elapsed time, duration, seek/replay, selectable 0.75×/1×/1.25× speed, sentence-level playback, and synchronized highlighting.

### 2.7 Vocabulary, review, and personalization

Vocabulary and learning state are also embedded in `frontend/app/page.tsx`.

Current saved-word data includes:

- generated ID and save/review dates,
- Arabic and diacritized forms,
- Arabic meaning and English meaning,
- root and synonym,
- example/context,
- confidence,
- support/encounter count,
- mastery state,
- meaning quiz attempts and correct answers,
- transfer challenge attempts and correct answers.

Current mastery values are `new`, `learning`, and `mastered`. V4 user-facing labels should become `New`, `Learning`, and `Familiar` while preserving or migrating the stored value safely.

The current learning profile stores:

- reading count,
- preferred learner level,
- highest Bridge level reached,
- Meaning Thread difficulty signals,
- understood/review comprehension counts,
- level evidence and last adjustment index,
- placement completion,
- automatic/manual level mode.

Current functionality includes:

- saving words from Word Lens, learning cards, and poetry,
- deduplicating by word and meaning,
- encounter-count updates,
- optional vocabulary meaning review,
- generated transfer challenges,
- a local mastery map,
- automatic level adjustment from comprehension evidence,
- a three-question placement check,
- a bounded `ReadingMemorySnapshot` sent with later adaptation requests.

The vocabulary drawer already supplies useful behavior for My Learning, but it is not scalable as a permanent collection and does not store a stable source reading ID, reading title, encounter history, audio reference, item type (`word` versus `expression`), or a reliable source sentence for every save path.

### 2.8 Current persistence and history

The browser currently uses these `localStorage` keys:

| Key | Contents | V4 treatment |
|---|---|---|
| `waddeh-language` | `ar` or `en` | Preserve and read through a settings/preferences adapter. |
| `waddeh-vocabulary` | Array of saved vocabulary with mastery evidence | Preserve; add a versioned migration rather than renaming or discarding it. |
| `waddeh-learning-profile` | Placement, level, readings, checks, Bridge, and difficulty state | Preserve; add a versioned migration and expose it through a learning-profile hook. |

There is no saved reading record, recent-reading list, processing-result cache, PDF progress, selected Reading mode persistence, quiz completion per reading, pin state, or guest-to-account migration. Full `SimplificationResult` payloads are not persisted anywhere.

Because stored analyses and documents can exceed practical `localStorage` limits, V4 should keep small preferences/profile indexes in `localStorage` and use native IndexedDB behind a repository adapter for reading records and larger analysis payloads. Do not add a storage library unless native IndexedDB proves unmaintainable.

### 2.9 Authentication

`frontend/components/ui/auth-11.tsx` is a responsive visual prototype only:

- It toggles sign-in/create-account copy and Arabic/English presentation.
- The Google button has no handler.
- The email/password form prevents submission and performs no authentication.
- Continue as guest links to `/`.
- There is no auth provider, session context, Firebase dependency/configuration, user model, protected persistence, redirect continuity, or account-data migration.

No backend user or persistence layer exists. V4 should not block core Reading on this gap; Firebase arrives only after the local guest flows are stable.

### 2.10 Styling, accessibility, and responsive behavior

The frontend uses Tailwind CSS 4 utility classes together with approximately 3,900 lines in `frontend/app/globals.css`. The global file contains both design tokens and page/component-specific selectors.

Current palette tokens to preserve include:

- ink: `#18302a` / `#17372f`
- paper: `#faf8f2`
- sage: `#dce9df`
- teal: `#0e6b5c`
- mint: `#41b78c`

Current typography defaults to `Tahoma, Arial, sans-serif`. It is functional for Arabic but does not yet satisfy the blueprint's high-quality editorial Arabic typography requirement.

Existing responsive behavior includes:

- Tailwind responsive utilities plus custom breakpoints at 640 px and 900 px.
- Mobile stacking for workspace, result tools, poetry, change maps, and cards.
- A full-width vocabulary drawer below 640 px.
- Reduced-motion overrides through `prefers-reduced-motion`.
- Several explicit focus-visible, hover, pressed, inline error, loading, and empty states.
- Correct explicit `dir` handling for many mixed Arabic/English surfaces.
- PWA manifest, icons, service-worker registration, and navigation-shell caching.

Important V4 gaps:

- No persistent mobile bottom navigation.
- No mobile bottom sheets or full-screen activity flows.
- No desktop 70/30 Reading/Explore shell.
- No shared active-route navigation.
- The Home hero uses `100svh` and a large marketing presentation instead of a compact composer-first surface.
- The vocabulary dialog is a side drawer on all desktop contexts and simply becomes full width on mobile.
- Root direction starts as Arabic and is corrected client-side for English.
- Styling is tightly coupled to the monolithic page, increasing regression risk during extraction.
- Metadata lacks the full social-sharing treatment, and the app relies on the framework's default not-found page.

---

## 3. Functionality that must be preserved

The following behaviors are working and are migration invariants. They must remain available until intentionally superseded and regression-tested.

### Input and processing

- Guest access without authentication.
- Arabic input validation and current length limits.
- PDF type, signature, filename, and 10 MB size validation.
- Reader type and five-level adaptation support.
- Manual level selection and automatic placement.
- Readability assessment and level recommendation data.
- Loading, timeout, unavailable-backend, and model error feedback.
- Reading Memory included in later simplification requests.

### Reading and understanding

- Clear Arabic simplification.
- Selective diacritics.
- Complete English translation/natural meaning.
- Source text availability for comparison.
- Preserved-details and independent meaning-integrity checks.
- Change Map.
- Visual steps when relevant.
- Copy result.
- Bilingual Arabic/English UI and content direction.

### Learning and exploration

- Interactive Arabic word selection.
- Contextual Word Lens with root, synonym, meanings, example, and confidence.
- Learning cards and save behavior.
- Meaning Threads and difficulty-signal recording.
- Cultural meanings/idioms/metaphors.
- Comprehension check and answer feedback.
- Bridge Mode's progressively richer Arabic levels.
- Vocabulary recall quizzes and transfer challenges.
- Placement and adaptive learner-level evidence.
- Poetry overview, full translation, line-by-line meaning, vocabulary, cultural meanings, and saves.

### Audio and resilience

- Gemini-generated WAV speech.
- In-memory speech cache.
- Abort and stale-session protection.
- Browser/device voice fallback.
- Language-appropriate voice selection.
- Honest rate-limit, timeout, provider, invalid-audio, and missing-voice feedback.
- Cleanup on stop and unmount.

### Persistence and platform

- Existing vocabulary and profile data stored under the current keys.
- Existing mastery evidence and encounter counts.
- UI-language persistence.
- PWA metadata, brand icons, installability, and service-worker registration.
- Reduced-motion support and existing keyboard-accessible controls.
- Existing API schemas, validation, safe backend errors, and Gemini credential boundary.

---

## 4. Exact reuse and modification map

### 4.1 Frontend files

| Existing file/component | Disposition | Required V4 use |
|---|---|---|
| `frontend/app/page.tsx` | **Extract and replace incrementally** | Source of truth for all current state, handlers, Reading panels, placement, vocabulary, review, poetry, and TTS. First split behavior without changing output; then leave this route as focused Home. |
| `frontend/app/layout.tsx` | **Modify** | Retain metadata/PWA registration; add shared providers and app shell support. Resolve language/direction without a visible post-mount correction. |
| `frontend/app/globals.css` | **Retain tokens; split/refactor gradually** | Keep palette and base variables. Move route/component styles beside extracted components or into clearly named CSS layers. Avoid a second theme. |
| `frontend/app/pwa-register.tsx` | **Reuse as-is initially** | Continue registering the service worker. Revisit caching only after dynamic routes and offline expectations are defined. |
| `frontend/app/manifest.ts` | **Reuse and later update copy/navigation metadata** | Preserve standalone PWA behavior, icons, colors, Arabic direction, and installability. |
| `frontend/app/auth/page.tsx` | **Reuse route; replace contents later** | Keep `/auth`; connect it to real auth only in the Firebase phase. |
| `frontend/components/interactive-arabic.tsx` (`InteractiveArabic`) | **Direct reuse, then extend** | Use in the Reading Arabic surface. Preserve tokenization and keyboard buttons; add popover/sheet integration and source-sentence context without rewriting the tokenizer unnecessarily. |
| `frontend/components/landing/hero.tsx` (`WaddehHero`) | **Supersede for V4 Home** | Reuse selected brand copy/motion ideas only. The full-screen marketing hero should not wrap the new composer-first Home. |
| `frontend/components/landing/navbar.tsx` (`LandingNavbar`) | **Replace with shared product navigation** | Preserve logo assets, language control patterns, focus states, and sign-in link behavior; replace anchor-based marketing navigation. |
| `frontend/components/landing/how-it-works.tsx` (`HowItWorks`) | **Remove from the primary in-app Home** | Its explanatory content may inform a secondary/about surface, but it should not compete with the composer. |
| `frontend/components/landing/scroll-indicator.tsx` | **Retire from core app** | Not needed in the focused Home/Reading flow. |
| `frontend/components/ui/auth-11.tsx` (`Auth11`) | **Modify in Firebase phase** | Reuse the responsive visual structure and bilingual copy; add validation, loading/errors, Firebase actions, guest-data migration, and return-to-reading continuity. |
| `frontend/components/ui/button.tsx` and `frontend/lib/utils.ts` | **Reuse where helpful** | Use existing primitives rather than introducing another component system; do not force a wholesale conversion of working controls. |
| `frontend/components/ui/hero-17.tsx` | **Do not reuse** | It is an unused generic demo component with unrelated placeholder content and dead `#` links. |
| `frontend/lib/api.ts` | **Preserve and extend** | Keep current request behavior, timeouts, errors, and types. Add new endpoints/types only for explicit V4 contract gaps. |
| `frontend/lib/ui-copy.ts` | **Refactor, preserving existing copy coverage** | Split copy by Home, Reading, My Learning, auth, and shared navigation while retaining Arabic/English parity and existing error wording. |
| `frontend/public/sw.js` | **Preserve initially; update later** | Retain current network-first navigation fallback. Add dynamic-route/offline policy only after Reading persistence exists. |
| `frontend/public/brand/Waddeh_Brand/*` | **Reuse** | Continue using the current logo, mark, favicon, and PWA assets. |

### 4.2 Inline functions and components to extract from `frontend/app/page.tsx`

There are no reusable custom hooks today. The following current logic should become reusable modules before route redesign:

| Current symbol/behavior | Target responsibility |
|---|---|
| `handleSubmit`, `visibleResult`, result reset state | `useReadingSession` plus Reading session/domain types. |
| `inspectWord`, `saveWord`, `saveLearningCard`, `savePoetryWord` | Word exploration and vocabulary actions. |
| `persistProfile`, `persistWords`, mount-time restore effects | Versioned local learning repository and `useLocalLearning`. |
| `buildReadingMemorySnapshot` | Keep as a pure domain selector shared by submission flows. |
| `recordComprehensionChoice`, placement functions | Learning-profile/adaptation hook. |
| vocabulary quiz and transfer challenge functions | My Learning review controller. |
| `toggleSpeech`, `playGeminiBlob`, `playBrowserSpeech`, voice/session helpers | `useSpeechPlayer`; preserve current cancellation and fallback semantics. |
| `PanelHeading`, `ReadabilityPanel`, `BridgeModePanel`, `MeaningThreadsPanel`, `CulturalMeaningPanel`, `IntegrityPanel` | Focused Reading/Explore components. |
| `WordMasteryCheck`, `MasteryMap`, `TransferChallengeCard` | My Learning vocabulary/review components. |
| `JourneyRail` | Retire after its useful status information is mapped to V4 loading/progress states. |

Recommended new module boundaries, created only during implementation:

```text
frontend/
  app/
    page.tsx                         # focused Home
    reading/[readingId]/page.tsx    # Reading shell
    learning/page.tsx               # Overview
    learning/vocabulary/page.tsx
    learning/history/page.tsx
    learning/path/page.tsx
    profile/page.tsx
    settings/page.tsx
  components/
    app-shell/
    home/
    reading/
    learning/
  hooks/
    use-reading-session.ts
    use-local-learning.ts
    use-speech-player.ts
  lib/
    reading/
    storage/learning-store.ts
    storage/reading-store.ts
```

Use one shared responsive navigation shell: desktop top navigation and mobile persistent bottom navigation. Reading remains a dynamic contextual route and must not appear as a permanent navigation item.

### 4.3 Backend files and services

| Existing file/service | Disposition | Required V4 use |
|---|---|---|
| `backend/app/main.py` | **Preserve routes; extend deliberately** | Keep current endpoint behavior. Add contract endpoints only when contextual explanation/language insights or document sectioning is implemented. |
| `backend/app/schemas.py` | **Preserve and extend with validated optional fields/new models** | Remain the source of truth for AI-facing and client-facing structures. Any frontend type change must be synchronized here. |
| `backend/app/services/gemini.py` | **Preserve methods and prompt guarantees** | Continue structured generation, validation, fallback-model handling, storage-disabled requests, and safe error translation. |
| `backend/app/services/adaptation.py` | **Reuse as-is** | Continue controlling level-specific vocabulary, sentences, explanation, and terminology. |
| `backend/app/services/readability.py` | **Reuse as-is** | Continue deterministic/heuristic assessment; do not market it as validated proficiency. |
| `backend/app/services/integrity.py` | **Reuse as-is** | Continue deterministic and combined integrity checks. |
| `backend/app/config.py` | **Preserve** | Keep Gemini and deployment secrets server-side. Add Firebase server configuration only if a backend-authenticated persistence path is later required. |

### 4.4 Existing tests to retain and expand

- `backend/tests/test_health.py`: route validation and controlled backend errors.
- `backend/tests/test_gemini.py`: schemas, prompts, retry/fallback behavior, structured outputs, and TTS extraction.
- `backend/tests/test_readability_integrity.py`: deterministic readability/integrity behavior.
- `backend/tests/test_speech.py`: speech route success, validation, and safe failure reasons.

The repository currently has no frontend unit, component, or end-to-end tests. Add tests around extracted pure logic first, then route flows and browser persistence before the monolithic page is retired.

---

## 5. Missing functionality

### Required for the core V4 route redesign

- Focused composer-first Home.
- Integrated Standard/Poetry input mode.
- Dedicated `/reading/[readingId]` route with immediate navigation and honest processing state.
- Shared desktop/mobile application navigation.
- My Learning Overview, Vocabulary, History, and Path routes.
- V4 `Understand | Simplify | Learn` mode model.
- Desktop Reading/Explore split and mobile Explore sheet/activity.
- Mobile word-detail bottom sheet and desktop contextual popover/drawer.
- Reading identifiers and normalized reading-session records.
- Guest recent readings and stored successful analyses.
- Continue Learning selection and resume state.
- Source-reading links from vocabulary.
- Expression item type and persistence.

### Backend/data gaps

- A dedicated concise contextual explanation in Arabic/English.
- Explicit structured Language Insights for grammar, pronouns, and notable structures beyond current Meaning Threads.
- PDF extraction into titled pages/sections.
- Per-section analysis and navigation metadata.
- Stored document outline and progress.
- Re-analysis/version metadata for historical results.
- User-scoped persistence schema and synchronization.

### Authentication and account gaps

- Firebase SDK/configuration.
- Google and email/password actions.
- Auth/session provider.
- Validation, password/account flows, and error states.
- Return URL/current Reading continuity.
- Guest vocabulary/history migration.
- Profile, settings, sign-out, and account/data controls.

### Audio gaps

- 0.75×/1×/1.25× playback control.
- Elapsed time and duration.
- Seek/replay sentence controls.
- Persisted default speed.
- Reliable sentence-level highlighting.
- A stable audio reference on saved vocabulary when appropriate.

### Product quality gaps

- High-quality Arabic reading font and complementary English/UI font.
- Branded not-found state and back navigation on all new routes.
- Skip-to-content link.
- Frontend regression tests.
- Explicit offline behavior for stored readings.
- Search and restrained filters for vocabulary/history.
- History rename, pin, and delete behavior that preserves explicitly saved vocabulary.
- Loading skeletons shaped like the target Reading layout.
- Scalable empty/error states for My Learning and document mode.

---

## 6. Implementation risks and mitigations

| Risk | Why it matters | Mitigation and required gate |
|---|---|---|
| Monolithic client state | `page.tsx` couples submission, persistence, learning, TTS, poetry, and presentation. A visual rewrite could silently drop behavior. | Extract pure types/functions and hooks first. Maintain a preservation checklist and compare old/new flows before deleting any original branch. |
| Route navigation loses results/files | Current state exists only in the Home component. A new Reading route can mount without its request payload or result. | Add a layout-level in-memory reading-session provider. Create a pending reading ID before navigation. Persist successful text analyses through a reading repository; require PDF reselection after an interrupted pre-document-mode request rather than silently failing. |
| Storage compatibility | Existing users may already have vocabulary and profile evidence under unversioned keys. | Read existing keys, normalize missing fields as current code does, and write a versioned schema through an adapter. Never clear or rename data without migration. |
| Browser storage limits/privacy | Full analyses and long texts can exceed `localStorage`; PDFs may contain sensitive content. | Use IndexedDB for reading payloads and keep small preferences in `localStorage`. Do not persist raw PDF bytes in early phases. Document retention and clear-data behavior before cloud sync. |
| TTS regressions after extraction | Browser autoplay, AudioContext state, stale requests, and device voice loading are subtle. | Move code with minimal semantic changes; add mocked hook tests for cancellation/fallback and browser smoke tests for play/stop/speed. |
| Backend/client drift | `api.ts` duplicates Pydantic response shapes manually. New fields can diverge. | Change Pydantic models and TypeScript types in the same commit; add fixture contract tests and keep new fields optional during rollout. |
| PDF architecture mismatch | The existing endpoint returns one analysis for the entire PDF, with empty `original_text` and no section metadata. | Keep it working until Document phase. Build a separate extraction/section contract, then analyze one section at a time rather than overloading the existing response silently. |
| Global CSS coupling | Hundreds of selectors rely on current DOM structure and broad breakpoints. | Preserve tokens, migrate styles component-by-component, and remove old selectors only after visual QA at phone, tablet, laptop, and wide desktop widths. |
| No frontend test safety net | Build and lint cannot detect interaction/state loss. | Add unit tests for migrated storage/profile logic and Playwright-style critical-flow coverage before deleting the monolithic implementation. |
| Auth expands scope too early | Firebase work could block the guest-first core redesign. | Complete guest Home/Reading/My Learning local flows first. Keep auth optional until Phase 7. |
| Poetry becomes a second app | It currently has a separate input and result section. | Route both Standard and Poetry through the same pending-reading/session abstraction and Reading shell; specialize only the mode content. |
| Bridge/Path duplication | Current Bridge Mode is a complete per-reading tool, while V4 assigns cross-reading Path to My Learning. | Keep per-reading bridge data but show a concise Reading preview/handoff; aggregate the full guidance only in My Learning Path. |
| Mixed language/direction regressions | Root direction and many nested content directions are currently set separately. | Define UI direction at the shared shell and explicit content direction at Arabic/English boundaries; test both languages at every target breakpoint. |

---

## 7. Phased migration plan

Each phase must remain reviewable and leave the application buildable. Do not start a later phase by deleting fallback behavior from an earlier phase.

### Phase 1 — Extract working domain behavior

**Goal:** Make current behavior reusable without changing routes or visible UX.

- Move API-independent types and pure selectors from `page.tsx` into reading/learning domain modules.
- Introduce a versioned learning-storage adapter that reads all three current storage keys and preserves current normalization defaults.
- Extract `useLocalLearning` for vocabulary, mastery, profile, placement, comprehension evidence, and Reading Memory.
- Extract `useSpeechPlayer` with the existing cloud-first/device-fallback implementation and in-memory cache.
- Extract Reading panels and My Learning candidates listed in the reuse map.
- Keep `page.tsx` composing the extracted modules so behavior can be compared before route work.
- Add deterministic frontend tests for storage migration, mastery calculation, Reading Memory selection, placement scoring, and speech state transitions.

**Gate:** Existing `/` behavior remains functionally equivalent; current storage data loads without reset; lint, TypeScript, build, and backend tests pass.

### Phase 2 — Shared shell and route foundations

**Goal:** Establish the V4 information architecture without moving all content at once.

- Add shared application navigation with desktop `Waddeh | Home | My Learning | Avatar/Sign in` and mobile `Home | My Learning | Profile`.
- Add route placeholders for `/reading/[readingId]`, `/learning`, `/learning/vocabulary`, `/learning/history`, `/learning/path`, `/profile`, and `/settings`.
- Add active-route state, back navigation, skip-to-content, route-level loading/error/not-found states, and shared bilingual direction handling.
- Add a layout-level client provider for the in-flight Reading session only; do not turn all application state into one global context.
- Retain PWA registration and current metadata/brand assets.

**Gate:** Desktop and mobile navigation work by keyboard and touch; guest users can reach useful My Learning and Profile guest states without being forced to sign in.

### Phase 3 — Focused Home and Reading transition

**Goal:** Make Home do one job: accept Arabic and open Reading.

- Replace the full-screen hero and multi-step workspace with concise positioning and one large composer.
- Integrate Standard/Poetry mode near the composer.
- Preserve text limits, PDF validation, attachment state, errors, sample content, reader/level defaults, and Reading Memory submission.
- Move detailed learner/placement controls out of the main path; retain them through progressive disclosure or My Learning/settings.
- On submit, create a pending UUID, place the request payload in the in-flight provider, and navigate immediately to `/reading/[readingId]`.
- Let Reading own the request and render rotating honest processing messages without percentages.
- On success, write a normalized local reading record and render the stored result. On text-request refresh, reload the stored/pending record where available. For an interrupted PDF request, request file reselection until Document mode exists.

**Gate:** Standard text and Poetry both enter the same Reading shell; PDF still works through the existing endpoint; failed requests can retry without losing entered text.

### Phase 4 — V4 Reading shell and mode mapping

**Goal:** Recompose existing results into the V4 Reading experience.

- Build the desktop main-reading/Explore layout and mobile single-column layout.
- Keep source Arabic visually primary and render it with `InteractiveArabic`.
- Replace `clear | english | original` with `Understand | Simplify | Learn`:
  - Understand: `english_translation`, followed by concise contextual explanation when available.
  - Simplify: `simplified_text`, diacritics option, and `change_map` disclosure.
  - Learn: curated `learning_cards`, cultural expressions, save actions, and review handoff.
- Move comprehension check, Meaning Threads, cultural/language insights, optional visual steps, integrity, and Bridge preview into Explore.
- Render Explore as a rail/drawer on desktop and an action sheet or focused activity on mobile.
- Present Word Lens as a contextual desktop surface and mobile full-height bottom sheet while preserving reading position.
- Place the extracted compact TTS control beside the Arabic surface; add speed using AudioBuffer playback-rate and SpeechSynthesis rate mappings while retaining current fallback/error handling.
- If UX evaluation confirms the explanation gap, extend `SimplificationOutput` with optional validated Arabic/English contextual-explanation fields. Do not synthesize an explanation in the browser.
- Add an optional validated `language_insights` list only when the current Meaning Thread/cultural/change data cannot represent the desired insight. Hide the tool when the list is empty.

**Gate:** All current result fields remain reachable; old result tabs and “Clear text / English translation / Text as written” controls are gone; Arabic remains central at all breakpoints.

### Phase 5 — Local My Learning, vocabulary, and history

**Goal:** Deliver the long-term learning model for guests before cloud accounts.

- Move vocabulary collection, review, mastery map, and transfer challenge into `/learning/vocabulary`.
- Keep existing vocabulary/profile keys and migrate items to a versioned shape with `kind`, stable `sourceReadingId`, source sentence/title, encounters, and mastery metadata.
- Store expressions and words in one collection with a restrained Words/Expressions distinction.
- Add native IndexedDB `reading-store` records containing ID, input type, title/preview, timestamps, processing status, stored structured result, selected mode, reading position, quiz state, pin state, and document progress placeholder.
- Build `/learning/history` with recency grouping, search foundation, type filters, reopen, rename, pin, and delete. Deleting a reading must retain explicitly saved vocabulary.
- Build `/learning` Overview with at most a few Continue Learning items, vocabulary ready to review, recent readings, and concise Path handoff.
- Build `/learning/path` from existing profile evidence and per-reading Bridge data without inventing proficiency claims.
- Add optional Continue Learning below Home only when records exist and it does not compete with the composer.

**Gate:** A guest can save, leave, reopen, resume, review, and return from vocabulary to the source Reading on the same device; old local vocabulary/profile data remains intact.

### Phase 6 — Stored Reading restoration and guest migration contract

**Goal:** Make local Reading state durable and ready for eventual account sync.

- Restore selected mode, scroll/section position, completed quiz state, saved-item state, and activity progress where appropriate.
- Always load stored analysis when reopening; add explicit Re-analyze rather than calling Gemini automatically.
- Version reading records and isolate persistence behind repository interfaces so Firebase can implement the same operations later.
- Define deterministic merge rules for guest-to-user migration: preserve user records, deduplicate vocabulary by normalized form plus contextual meaning, retain encounter/source links, and keep the newest compatible progress state.
- Add clear local-history, clear-vocabulary, and clear-all actions with explicit confirmation and separation of reading deletion from saved vocabulary deletion.

**Gate:** Reload and reopen do not trigger unnecessary model calls; migrations are repeatable and do not duplicate or erase data.

### Phase 7 — Firebase authentication and synchronization

**Goal:** Add persistence and cross-device value without gating core understanding.

- Add Firebase Google and email/password authentication behind an auth provider.
- Connect `/auth` controls to real actions with validation, loading, errors, and guest continuation.
- Preserve a `returnTo` reading URL and current reading ID through sign-in.
- Offer, rather than force, migration of local vocabulary, readings, and progress after authentication.
- Implement user-scoped repositories using the same domain interfaces as local storage; keep an offline/local cache and explicit sync status.
- Add compact avatar menu, profile, settings, sign-out, account/data controls, and useful My Learning guest messaging.
- Keep Gemini credentials and all model calls behind FastAPI.

**Gate:** Signing in from Reading returns to the same Reading; declined migration leaves guest data intact; one user cannot access another user's records.

### Phase 8 — Sectioned Document mode

**Goal:** Replace one-shot PDF simplification with section-by-section Reading.

- Add a validated extraction contract returning document title, ordered section/page identifiers, labels, and extracted Arabic text without persisting raw PDF bytes on the server.
- Store extracted guest sections locally in IndexedDB and analyze only the current section through the existing simplification pipeline where possible.
- Add document outline, `Section X of Y`, Previous/Next, current-section processing, stored results per section, and resume position.
- Preserve the existing `/api/upload/pdf` path until the new flow is proven; then keep it as a compatibility fallback or deprecate it explicitly.
- Avoid sending the entire long document on every section request.

**Gate:** Long PDFs do not trigger one giant translation request; reopening restores the section and stored analysis; mobile document navigation is usable one-handed.

### Phase 9 — Accessibility, responsive, PWA, and production polish

**Goal:** Complete the redesign without compromising reading quality or reliability.

- Introduce a high-quality Arabic reading face and complementary English/UI typography while preserving diacritics and layout stability.
- Complete keyboard focus order, focus trapping/restoration for drawers and sheets, labels, announcements, touch targets, and reduced-motion behavior.
- Verify mobile bottom navigation, safe-area spacing, sheet behavior, virtual keyboard behavior, and reading-position preservation.
- Replace generic spinners with layout-matched processing skeletons where appropriate.
- Audit empty, error, offline, rate-limit, permission, and storage-quota states.
- Update service-worker caching for the final dynamic-route and stored-reading strategy; validate installability and offline fallback.
- Remove unused legacy landing/result CSS and components only after parity and visual QA.
- Run performance and bundle checks; avoid adding heavy state, storage, or animation dependencies unless justified.

**Gate:** Acceptance criteria in the V4 blueprint pass on small phone, tablet, laptop, and wide desktop layouts; lint, typecheck, production build, backend tests, frontend tests, and critical end-to-end flows all pass.

---

## 8. Validation baseline

The following commands passed during the Phase 0 audit on 2026-08-22:

```powershell
npm run lint:frontend
npm exec --workspace frontend -- tsc --noEmit
npm run build:frontend
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

Baseline result:

- ESLint passed.
- TypeScript passed with no emitted files.
- Next.js production build passed.
- Static routes generated: `/`, `/auth`, manifest/icon routes, and the framework not-found route.
- All 36 backend tests passed.

Run the complete validation set after every meaningful migration phase, followed by:

```powershell
git status --short --branch
git ls-files .env
```

No phase may expose secrets, commit `.env`, move Gemini credentials to the browser, invent unsupported product metrics, or commit competition work directly to `main`.

---

## 9. Assumptions and defaults

- The V4 blueprint is the product source of truth; this document is the repository/implementation source of truth until code changes materially alter the architecture.
- Guest use remains fully functional throughout migration.
- Current backend endpoints remain compatible until an explicitly versioned extension is required.
- Local persistence is implemented before Firebase and remains the offline/guest foundation afterward.
- Existing storage keys are migrated, not discarded.
- Stored successful analysis is reused by default; re-analysis is always explicit.
- Raw PDF bytes are not persisted server-side, and early route migration does not persist them locally.
- The current color identity and brand assets remain recognizable.
- No new framework, global state library, CSS system, icon system, or storage dependency is required for the core migration.
- New functionality must use structured schemas and deterministic/mocked AI tests.
- The migration favors small extraction and relocation commits over a parallel replacement application.

## 10. Definition of implementation readiness

Phase 0 is complete when this document is reviewed and accepted. Phase 1 may then begin without another broad repository scan. Before implementing any later phase, the engineer should inspect only:

1. the files named in that phase,
2. changes made by earlier completed phases,
3. the relevant API schemas/tests,
4. the V4 acceptance criteria affected by the phase.

If the repository diverges materially from this map, update this document in the same change that introduces the divergence.
