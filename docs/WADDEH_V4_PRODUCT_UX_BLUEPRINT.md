# Waddeh V4 — Product, UX, and Redesign Blueprint

> **Purpose of this file**
>
> This document is the source of truth for the Waddeh V4 redesign. It is written so that Codex, Antigravity, Claude Code, Gemini CLI, Cursor, or another agentic coding platform can understand the product before changing the repository.
>
> **Do not treat the current Waddeh UI or the Base44 prototype as the final design.**
> The goal is to preserve the working application's real functionality, use the strongest ideas from both versions, and redesign Waddeh around a coherent user journey.

---

## 0. Non-negotiable implementation principles

1. **Do not break working functionality in `main`.**
2. Create a dedicated redesign branch before implementation.
3. Redesign incrementally. Do not replace the application wholesale.
4. The current Waddeh color scheme is the starting palette. Do **not** replace it with the Base44 palette.
5. Base44 is a UX/reference source only. Do not merge the Base44 codebase wholesale.
6. Organize the UI around what the user is trying to do, not around backend functions or React components.
7. Core quick-use functionality must work without an account.
8. Authentication unlocks persistence, personalization, and cross-reading learning—not basic understanding.
9. Arabic is the primary content and must remain visually central.
10. Mobile is a first-class PWA experience, not a squeezed desktop layout.
11. Avoid generic AI/SaaS dashboard design, excessive cards, unnecessary settings, glassmorphism, decorative AI sparkles, and clutter.
12. Use progressive disclosure: show the user what matters now; reveal deeper tools when requested.
13. Any new UI must preserve accessibility, proper RTL/LTR behavior, keyboard navigation, loading/error states, and responsive behavior.

---

# Step 1 — Define the Waddeh experience

## Product definition

Waddeh is an Arabic understanding and learning product delivered as a web app/PWA.

It supports two complementary use cases:

### Quick Waddeh
For a person who encounters Arabic and wants immediate help.

Flow:

**Open Waddeh → paste/type/upload → understand → optionally explore → leave**

No forced account creation.

### Personal Waddeh
For a signed-in user who wants Waddeh to learn from their activity over time.

Flow:

**Read → understand → explore → save vocabulary/expressions → review → revisit readings → receive personalized learning guidance**

The product hierarchy is:

1. **Understand something now** → Home + Reading
2. **Learn from this specific content** → Reading's Learn and Explore tools
3. **Learn across everything over time** → My Learning

## Product positioning

A useful guiding statement:

> **A translator tells you what Arabic says. Waddeh helps you understand it.**

Waddeh is not:
- merely a translator,
- a generic AI chatbot,
- a settings-heavy dashboard,
- a full LMS,
- or a Duolingo clone.

Waddeh should make real Arabic content understandable while turning useful moments into learning opportunities.

## Guest vs signed-in users

### Guests can use
- Home
- text input
- PDF upload
- Standard/Poetry input mode
- Reading
- Understand
- Simplify
- Learn
- audio
- word exploration
- Test Your Understanding
- Meaning Thread
- Language Insights
- temporary vocabulary
- temporary recent readings

### Signed-in users additionally receive
- persistent My Learning
- persistent Vocabulary
- persistent History
- Continue Learning
- Progressive Path
- review/mastery tracking
- cross-reading learning insights
- synchronization across devices
- persistent PDF/reading position
- personalized recommendations

Temporary guest state should use appropriate browser storage such as sessionStorage/localStorage/IndexedDB rather than using cookies as the primary content store.

---

# Step 2 — Pages and navigation

## Primary product destinations

### 1. Home
The primary entry point for new content.

### 2. My Learning
The personal learning hub for signed-in users.

Internal destinations:
- Overview
- Vocabulary
- History
- Path

### 3. Reading
A contextual/dynamic route opened after submitting content or reopening a previous reading.

**Reading is not a permanent navbar destination.**

### 4. Profile / Settings
Secondary account controls, not a major content destination.

## Features that are NOT permanent top-level pages

These live within Reading or focused overlays/activities:
- Understand
- Simplify
- Learn
- Test Your Understanding
- Meaning Thread
- Language Insights
- word exploration
- audio
- Poetry analysis

## Desktop navigation

### Signed in
**Waddeh | Home | My Learning | Avatar**

### Guest
**Waddeh | Home | My Learning | Sign in**

Keep My Learning visible to guests so they understand that Waddeh is more than a one-time translator.

## Mobile navigation

Persistent bottom navigation:

**Home | My Learning | Profile**

Do not use a hamburger menu for the primary navigation.

## Architecture rule

> Anything related to the **currently open Arabic** belongs to Reading.  
> Anything accumulated **across multiple readings** belongs to My Learning.

---

# Step 3 — Home / Landing

## Goal

The Home page has one primary job:

> **Give Waddeh some Arabic.**

It should feel closer to the simplicity of ChatGPT/Gemini than a traditional marketing landing page.

## Desktop structure

### Header
- Waddeh identity/logo
- Home
- My Learning
- Avatar or Sign in

### Main area
Concise positioning:

> **A translator tells you what Arabic says.  
> Waddeh helps you understand it.**

Optional short supporting line:

> Paste Arabic, upload a document, and understand it in context.

### Main composer
A large, calm input supporting:
- typed Arabic
- pasted Arabic
- long text
- PDF/document upload
- desktop drag-and-drop
- attached-document chip
- submit action

Example placeholder:

> **Paste or type Arabic…**

## Input mode

Use a subtle mode selector near/in the composer.

Initial modes:
- **Standard**
- **Poetry**

Do not make this a dominant navbar toggle.

Waddeh may later auto-detect likely poetry and suggest:

> This looks like poetry. Analyse as poetry?

## Returning signed-in users

Below the composer, and only if it does not compete with the primary action:

### Continue Learning
Show at most 2–3 recent/incomplete items.

Examples:
- previous reading
- PDF section progress

Then:
**View My Learning →**

## Do NOT put on Home
- feature-card grids
- analytics
- vocabulary statistics
- grammar dashboards
- large marketing sections inside the app surface
- excessive explanations of every feature
- AI buzzwords
- large settings blocks

## Submission / loading

After submit:
1. Navigate immediately into the Reading environment.
2. Show a polished loading state while processing.
3. Use honest rotating messages such as:
   - Reading the Arabic…
   - Understanding the context…
   - Preparing your reading…
4. Do not use fake percentages.
5. Reveal the completed Reading experience smoothly.

## PDF handling

Do **not** send an entire long PDF through one giant translation request.

Instead:
1. extract/read the document,
2. identify useful sections/pages,
3. open Reading in Document mode,
4. analyze the current section,
5. let the user navigate section-by-section.

This improves UX, token usage, cost, loading time, and mobile behavior.

---

# Step 4 — Reading / Understanding

The Reading page is the heart of Waddeh.

## Core principle

> **The Arabic stays central. Everything else helps the user understand it without pulling them away from it.**

## Desktop layout

Approximately:
- **70% main Reading area**
- **30% Explore rail**

Do not treat this as a rigid percentage at every breakpoint; preserve the hierarchy.

## Reading header
Possible elements:
- Back
- reading title/source
- document/section context
- overflow menu
- optional pin/save behavior if needed

Signed-in successful readings should already persist to History; users should not need a Save button just to preserve them.

## Arabic reading surface

Use generous, high-quality Arabic typography.

Include a compact integrated audio player:
- play/pause
- elapsed/duration
- speed: 0.75× / 1× / 1.25×
- optional replay sentence
- optional synchronized highlighting when reliable

Avoid giant audio cards.

## Direct word exploration

Arabic words should be interactive.

### Desktop
Click/hover → contextual popover or side drawer.

### Mobile
Tap → bottom sheet.

Word details may include:
- Arabic form
- normalized/base form where reliable
- transliteration/pronunciation
- meaning in this context
- reliable root where available
- source sentence
- Hear
- Save
- optional other common meanings

Do not dump every word definition onto the page by default.

## Three primary Reading modes

Use:

**Understand | Simplify | Learn**

Only one mode needs to dominate at a time.

### REMOVE the old controls
Do not retain:
- Clear text
- English translation
- Text as written

These are redundant with the new mode model.

## Understand

Default mode.

### Natural Meaning
The primary, readable English meaning.

### Explanation
Concise contextual explanation first.

Optional:
**Show deeper explanation**

For some content, an additional:
**Natural / Literal**
distinction may be useful.

Do not force a large essay when the input is simple.

## Simplify

The goal is **clearer Arabic**, not merely another English translation.

Show:
- original Arabic
- simplified Arabic
- optionally “What changed?” for difficult expressions/structures

This is an important Waddeh differentiator.

## Learn

Contains learning material specifically derived from the current text.

### Expressions Worth Knowing
Curated expressions/proverbs/phrases with:
- Arabic
- useful meaning
- contextual explanation
- Hear
- Save expression

### Vocabulary in This Text
Show a curated set first, not every word.

Example:
- 3–5 useful items
- Hear
- Save
- Show more vocabulary

## Explore rail

The desktop right rail is for **activities and contextual tools**, not more reading content.

Possible tools:
- **Test Your Understanding**
- **Meaning Thread**
- **Language Insights**
- **Progressive Path** handoff into My Learning

Keep these as compact rows/surfaces rather than giant cards.

### Test Your Understanding
Use a focused modal or activity screen.

Possible flow:
- comprehension question
- answer
- feedback
- next
- result
- review what was missed
- return to Reading

### Meaning Thread
Best as a side drawer/panel while Reading remains visible.

Purpose:
show how meaning is composed through the Arabic step by step.

### Language Insights
Drawer/panel for useful:
- grammar
- pronouns
- structures
- notable linguistic patterns

If nothing relevant is found, do not clutter the main UI with “No X found.”
Only show a quiet empty state after the user opens the tool.

### Progressive Path
Do not duplicate the full learning journey here.

Reading may say:
> This reading strengthens vocabulary / expressions.

Then:
**View in My Learning →**

The full Progressive Path primarily belongs in My Learning.

## Adaptive Reading layouts

Do not show the exact same UI for every input.

### Single word
Keep output compact:
- word
- pronunciation
- meaning
- usage/context
- word exploration

### Phrase/sentence
Add:
- Natural Meaning
- short explanation if useful
- small vocabulary set

### Paragraph/article
Use the full Reading system:
- Arabic
- audio
- Understand/Simplify/Learn
- Explore tools

### Long text
Split into meaningful sections.
Allow section-by-section Reading.
Offer full text view only if useful.

### PDF / Document mode
Use:
- document title
- current page/section
- Previous / Next
- section selector
- collapsible document outline

Analyze the current section using the same:
**Understand | Simplify | Learn**

### Poetry mode
Keep the same Reading shell but change the analysis emphasis.

Prioritize:
- line-by-line meaning
- imagery
- metaphor
- poetic expressions
- unusual vocabulary
- cultural/literary context

Only add specialized features such as meter if they are reliable enough.

## Resume state

For signed-in users, preserve when appropriate:
- reading/document section
- reading position
- saved vocabulary
- completed quizzes
- activity progress
- relevant selected mode

---

# Step 5 — Vocabulary

There are two vocabulary experiences.

## A. Vocabulary in this Text
Lives in:
**Reading → Learn**

Purpose:
> What useful words/expressions are worth learning from this text?

Show curated content first:
- Arabic
- transliteration/pronunciation
- meaning in context
- Hear
- Save
- Show more

Beautiful cards are acceptable here because the list is intentionally small.

## B. My Learning → Vocabulary
Persistent personal collection.

Purpose:
> What have I saved, and what should I review?

## Saving

Use lightweight feedback:
**Saved ✓**

Do not interrupt with a modal.

Guests can save temporarily.
After meaningful accumulation, use a natural account prompt such as:

> You've saved 6 words. Sign in to keep them across readings and devices.

## Persist useful context

Where possible store:
- Arabic form
- normalized/base form
- transliteration/pronunciation
- contextual meaning
- reliable root
- original sentence
- source reading
- date encountered
- encounter count
- audio reference
- mastery/review state

## Collection design

Use a compact scalable list/grid rather than large cards for every saved word.

Useful information:
- Arabic
- meaning
- source
- encounter count
- mastery
- Hear
- Review

Possible restrained filters:
- All
- Learning
- Familiar
- Recent
- Needs Review
- By Reading

Do not expose all filters unless they are genuinely useful.

## Search

Search should eventually work by:
- Arabic
- English meaning
- possibly root

## Word detail

### Desktop
Drawer.

### Mobile
Full-height bottom sheet.

Possible content:
- word
- pronunciation
- meaning
- root
- source sentence
- readings where encountered
- Waddeh explanation
- Hear
- View original reading

## Expressions

Allow users to save expressions as well as individual words.

Possible distinction:
- Words
- Expressions

Avoid creating a totally separate product area unless needed.

## Review mode

Focused temporary flow, not a navbar destination.

Simple example:

> What does this mean?

Arabic word

**Reveal answer**

Then:
- **I knew it**
- **Review again**

Keep mastery simple:
- New
- Learning
- Familiar

Spaced repetition may later exist under the hood without exposing technical scheduling complexity.

## Key differentiator

Waddeh teaches vocabulary in the **context where the user originally encountered it**, rather than only as isolated flashcards.

Cross-reading patterns may later power personalized learning insights.

---

# Step 6 — History / Library

History lives inside **My Learning**.

The user-facing heading can be:

### Your Readings

## Purpose

> Find something previously processed and return to exactly where you left off.

## History vs Continue Learning

### History
Everything successfully processed before.

### Continue Learning
Only the few active/incomplete things worth returning to now.

Continue Learning should be surfaced:
- on My Learning Overview
- optionally on Home for signed-in returning users

## Automatic persistence

Signed-in successful readings should automatically enter History.

Guests may have a limited temporary local recent history.

## History item context

Items should communicate what they are.

Examples:

### Normal reading
- Arabic/title preview
- type
- date
- vocabulary saved
- quiz state

### PDF
- filename
- Document
- Section X of Y
- Continue

### Poetry
- first line/title
- Poetry
- date

## Reopening

History does **not** create another reader.

It reopens the existing Reading experience and restores previous state where possible.

## Search

Search may eventually match:
- title
- Arabic text
- translation/meaning
- filename
- saved vocabulary

## Filters

Keep restrained:
- All
- Text
- Documents
- Poetry

Optional sort:
- Recent first

## Grouping

Prefer human recency grouping:
- Today
- This week
- Earlier

## Pinning

Instead of a second overlapping “Saved Readings” system, allow optional **Pin** for important readings.

## Row actions

Possible overflow actions:
- Rename
- Pin
- Delete

Deleting a reading must **not** automatically delete vocabulary the user explicitly saved from it.

## Stored analysis

When reopening an old reading:
- load stored analysis,
- do not call Gemini again unnecessarily.

Provide explicit **Re-analyze** if a fresh result is desired.

This reduces API cost and keeps previous results consistent.

## Guest → account migration

When appropriate, allow:
> Bring your recent readings and saved words with you?

Then migrate temporary local data into the signed-in account.

## Learning data

History can contribute to My Learning insights:
- content types read
- repeated vocabulary
- difficult structures
- quiz performance
- frequently saved topics
- reading frequency
- unfinished material

---

# Step 7 — Authentication, Profile, Settings

## Principle

> **You should be able to understand Arabic before Waddeh ever asks who you are.**

Authentication supports persistence and personalization.

## Natural sign-in moments

Prompt only when it makes sense, for example:
- opening My Learning
- wanting Progressive Path
- saving many temporary words
- keeping history
- syncing across devices

## My Learning guest state

A guest who opens My Learning should see a useful explanation rather than a dead login wall.

Example concept:

### Your Arabic can become a learning journey.
Keep words you discover, continue past readings, and let Waddeh learn what you need help with.

**Sign in to start My Learning**

## Guest save prompt

Do not block the first save.

After several saved items:

> Keep these words for later.  
> Sign in to keep them across your readings and devices.

Allow **Not now**.

## Authentication technology direction

Firebase is the preferred future persistence/auth direction.

Initial providers:
- Google
- Email/password

Do not add many social providers without a real need.

## Auth continuity

If someone signs in from Reading, return them to the **same Reading context** afterward.

Do not throw them back to Home.

## Guest-data migration

On account creation/sign-in, optionally offer:
- move temporary saved vocabulary
- move recent readings
- preserve current PDF section/progress

## Onboarding

Avoid long onboarding questionnaires.

Prefer:
- no forced onboarding, or
- a very light optional Arabic-comfort/preference prompt

Waddeh should infer learning needs primarily from real user behavior over time.

## Avatar menu

Keep compact:
- user name/email
- My Learning
- Settings
- Sign out

## Profile

Do not create a large social/profile destination unless needed.

A small account view is enough:
- name
- email
- avatar
- edit account

## Settings

Keep purposeful.

### Reading
- Arabic text size
- transliteration preference
- related reading preferences

### Audio
- default speed
- preferred voice if the backend supports meaningful choices

### Learning
- grammar-insight preference
- review reminders only if notifications/reminders are actually implemented

### Account & Data
- account details
- change password where appropriate
- clear history
- clear vocabulary
- delete account
- export learning data later if implemented

Do not expose:
- AI model selection
- temperature
- prompt settings
- technical API controls
- unnecessary theme/configuration knobs

---

# Step 8 — Mobile UX

Mobile is a first-class PWA, not a squeezed desktop site.

## Bottom navigation

Use:
**Home | My Learning | Profile**

## Home

- compact header
- central composer
- Standard/Poetry selector near composer
- upload
- submit
- optional Continue Learning below

Optimize for one-handed use.

## Reading

Single column:

1. Arabic
2. compact audio
3. Understand / Simplify / Learn
4. selected mode content

## Explore on mobile

The desktop Explore rail becomes a sticky/contextual:

**Explore**

action.

Tap → bottom sheet containing:
- Test Your Understanding
- Meaning Thread
- Language Insights
- Path handoff

## Word exploration

Tap an Arabic word → bottom sheet.

Preserve reading position when the sheet closes.

## Test Your Understanding / review

Use focused full-screen activities on mobile rather than tiny modal cards.

## PDF / long text

Use compact section navigation:

**Section 3 of 9**

with:
- Previous
- Next
- document outline in bottom sheet

## My Learning

Use internal top tabs/segmented navigation:
- Overview
- Vocabulary
- History
- Path

These may horizontally scroll on narrow screens.

## Avoid on mobile

- desktop sidebars
- tiny two-column cards
- floating-button overload
- primary hamburger navigation
- card-heavy dashboard grids

---

# Step 9 — Visual identity and motion

## Color

**Keep the current Waddeh color scheme as the starting palette.**

Do not replace it with Base44's warm/orange palette.

Improve:
- hierarchy
- contrast
- spacing
- typography
- surfaces
- component consistency

around the existing color identity.

## Visual direction

Warm, editorial, Arabic-first, modern, calm.

Take inspiration from Base44's clarity but do not produce a generic beige SaaS clone.

## Typography

Arabic typography is the hero.

Requirements:
- high-quality readable Arabic face
- generous Arabic line height
- proper diacritics
- strong RTL behavior
- complementary English typography
- careful mixed Arabic/English hierarchy

## Surfaces and cards

Use:
- typography
- whitespace
- dividers
- subtle surfaces

before reaching for rounded cards.

Cards are appropriate for:
- vocabulary recommendations
- quizzes
- attachments
- contained interactive objects
- word detail
- small contextual modules

Do not wrap every section in a card.

## Motion

Purposeful and subtle.

Good motion:
- Home → Reading transition
- processing → result reveal
- Understand/Simplify/Learn transition
- save-word microinteraction
- drawer/bottom-sheet motion
- optional synchronized audio highlighting
- subtle content reveal

Avoid:
- bouncing icons
- decorative motion everywhere
- excessive gradients
- glassmorphism
- “AI sparkles” as a default visual language
- animation that competes with reading

## Dark mode

May be added later if reading quality remains excellent.

The primary competition/demo experience can remain the existing light/current color direction.

---

# Step 10 — Final UX map

## Guest quick-use flow

**Home**
→ paste/type/upload
→ processing
→ **Reading**
→ Understand / Simplify / Learn
→ Explore tools / word interactions
→ temporary saved vocabulary/history
→ optional natural sign-in prompt when persistence is desired

## Signed-in quick-use flow

**Home**
→ submit
→ Reading
→ get meaning
→ leave

Successful reading is automatically persisted.

## Signed-in learning flow

**Home / Continue Learning**
→ Reading
→ Learn / Explore
→ save vocabulary/expressions
→ Test Your Understanding / review
→ My Learning
→ Vocabulary / History / Path
→ return to source readings when useful

## PDF flow

**Home**
→ upload PDF
→ processing
→ **Reading: Document Mode**
→ section-by-section navigation
→ Understand / Simplify / Learn for current section
→ Explore
→ progress persisted
→ resume later

## Poetry flow

**Home**
→ Poetry mode or auto-suggestion
→ Reading using the same shell
→ line-by-line meaning
→ imagery / context / expressions / vocabulary
→ optional saves/review

## My Learning structure

### Overview
Purpose: connect the whole learning system without becoming an analytics dashboard.

Potential content:
- Continue Learning
- concise learning snapshot
- Needs Attention
- vocabulary ready to review
- recent readings
- Progressive Path
- useful repeated patterns

### Vocabulary
Persistent saved words/expressions + review.

### History
Your Readings.

### Path
Progressive learning guidance across readings.

## Cross-linking

The product should feel connected:
- Vocabulary → View original reading
- History → reopen Reading
- My Learning → resume Reading
- Path → relevant vocabulary/review/reading
- Reading → My Learning Path handoff
- Continue Learning → exact previous state

---

# Step 11 — Implementation guardrails

Do not begin by rewriting everything.

## Branch strategy

Start from the known-good `main`.

Create a dedicated branch such as:

```bash
git checkout main
git pull
git checkout -b redesign/waddeh-v4
```

Use the project's actual naming conventions if different.

## Before UI changes

The coding agent should:
1. inspect the current repository,
2. map the current routes/components/hooks/services/backend integrations,
3. identify which functionality is working,
4. identify reusable UI primitives,
5. identify current auth/data assumptions,
6. identify tests/build/lint commands,
7. produce a short implementation plan,
8. **not delete working functionality merely because the new UI does not use it yet.**

## Implementation order

### Phase A — Foundations
- route/page structure
- navigation shell
- responsive shell
- preserve current color tokens
- typography/spacing system
- shared loading/error/empty states

### Phase B — Home
- new minimal landing/composer
- Standard/Poetry mode
- text/PDF attachment UI
- processing transition

### Phase C — Reading shell
- dynamic Reading route
- desktop 70/30 shell
- mobile single-column shell
- compact audio
- Understand/Simplify/Learn navigation

### Phase D — Existing functionality migration
Move current working functionality into the new Reading structure:
- translation/natural meaning
- simplification
- TTS
- vocabulary extraction
- existing learning features

Do not redesign the backend contract unless necessary.

### Phase E — Explore tools
- Test Your Understanding
- Meaning Thread
- Language Insights
- Progressive Path handoff

### Phase F — My Learning shell
- Overview
- Vocabulary
- History
- Path

Use current local state first if backend persistence is not ready.

### Phase G — Firebase persistence/auth
Integrate only after the UI flows work cleanly:
- Google + email/password
- user-scoped history
- vocabulary
- progress
- guest migration

### Phase H — Document mode
- PDF extraction flow
- sectioning
- section-by-section analysis
- stored document progress

### Phase I — Polish
- animations
- accessibility
- mobile interaction polish
- error/rate-limit states
- build/lint/tests
- performance
- PWA validation

## Agent behavior rules

When an agent works on this redesign:

- Read this entire file before coding.
- Inspect the repository before proposing a rewrite.
- Prefer small, reviewable changes.
- Do not introduce a second competing design system.
- Do not replace the current color scheme.
- Do not make every feature a card or page.
- Do not invent functionality that the backend cannot support without calling it out.
- Preserve existing API/TTS/history/vocabulary behavior until deliberately migrated.
- Verify desktop and mobile behavior after every major phase.
- Run the project's tests/build/lint after meaningful changes.
- Explain any deleted component or behavior.
- Stop and report blockers instead of hiding broken functionality.

---

# Acceptance criteria for the redesign

The redesign is successful when:

1. A first-time user immediately understands where to paste/upload Arabic.
2. The Home page feels calm and focused.
3. Submitting content transitions into a dedicated Reading experience.
4. Arabic is visually dominant.
5. Understand/Simplify/Learn cleanly replace the previous overlapping result modes.
6. The old “Clear text / English translation / Text as written” controls are gone.
7. Secondary tools no longer clutter the main reading flow.
8. Desktop Reading makes good use of the Explore rail.
9. Mobile Reading works naturally without a desktop sidebar.
10. Vocabulary is contextual inside Reading and scalable inside My Learning.
11. History restores previous Reading state rather than acting as a dead list.
12. PDF content is handled section-by-section.
13. Poetry uses specialized analysis without creating a separate app.
14. Guest use remains immediate.
15. Accounts meaningfully unlock memory/personalization.
16. My Learning clearly demonstrates Waddeh's long-term Arabic-learning value.
17. The current working backend functionality remains intact during the redesign.
18. The current Waddeh color identity remains recognizable.
19. The UI feels intentionally designed rather than AI-generated or dashboard-like.
20. The production build, lint, tests, and key user flows pass before merge.

---

# Final product shorthand

When in doubt, use this mental model:

> **Home = give Waddeh Arabic.**  
> **Reading = understand and learn from this Arabic.**  
> **My Learning = what Waddeh remembers and helps you improve over time.**

Everything else should support one of those three ideas.
