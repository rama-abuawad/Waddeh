# Waddeh V4 Design System

This file is the visual and motion source of truth for Waddeh V4. It is subordinate to the product decisions in `WADDEH_V4_PRODUCT_UX_BLUEPRINT.md` and intended to be used together with `WADDEH_V4_IMPLEMENTATION_PLAN.md`.

## 1. Waddeh Visual Personality

Waddeh should feel like a contemporary Arabic reading desk: calm, literate, focused, premium, and practical. It should not feel like a SaaS dashboard, a chatbot clone, a gradient-heavy AI product, or a gallery of floating cards.

The interface should be recognizably Waddeh through a few repeated visual moves:

- Source Arabic uses an elevated white paper surface with a restrained 3px teal top edge.
- Interpretation and explanation use open paper with a 3px mint annotation rule.
- Learning state uses sage and mint fills, especially for saved vocabulary, active learning paths, and progress.
- Tools feel like reading instruments, not dashboard widgets.
- Empty space should feel intentional and editorial, not unfinished.

The product should keep the existing teal, green, mint, paper, and ink identity. The goal is richer use of the current palette, not a new color palette.

## 2. Design Tokens

Keep the current V4 palette as the foundation:

| Token | Value | Role |
| --- | --- | --- |
| `--v4-paper` | `#faf8f2` | Main page background |
| `--v4-paper-deep` | `#f2eee4` | Secondary shelves, rails, grouped learning areas |
| `--v4-white` | `#fffef9` | Focal reading and composer surfaces |
| `--v4-ink` | `#18302a` | Primary text |
| `--v4-ink-soft` | `#47605a` | Secondary text and metadata |
| `--v4-teal` | `#0e6b5c` | Primary action, active edge, selected controls |
| `--v4-teal-dark` | `#084e44` | Hover/pressed action state |
| `--v4-mint` | `#41b78c` | Annotation, learning highlight, positive interaction |
| `--v4-sage` | `#dce9df` | Saved state, active learning state, subtle fills |
| `--v4-line` | `rgba(24,48,42,.16)` | Default border and divider |
| `--v4-line-strong` | `rgba(14,107,92,.32)` | Active border, focus-adjacent border |

Add or standardize these derived roles:

| Role | Value |
| --- | --- |
| Teal wash | `rgba(14,107,92,.08)` |
| Mint wash | `rgba(65,183,140,.12)` |
| Sage wash | `rgba(220,233,223,.65)` |
| Focus ring | `0 0 0 3px rgba(65,183,140,.24)` |
| Hairline shadow | `0 1px 0 rgba(24,48,42,.05)` |
| Reading elevation | `0 18px 45px rgba(24,48,42,.08), 0 1px 0 rgba(24,48,42,.05)` |
| Popover elevation | `0 22px 60px rgba(24,48,42,.14), 0 1px 0 rgba(24,48,42,.06)` |

The current interface underuses its own color identity. Teal and mint should appear as structure, edges, fills, and active states, not only as button backgrounds.

## 3. Typography System

Use a bilingual UI font stack that supports Arabic-first product surfaces:

- UI and headings: IBM Plex Sans Arabic, IBM Plex Sans, Segoe UI, Tahoma, sans-serif.
- Arabic reading: Noto Naskh Arabic, Amiri, Scheherazade New, serif.
- English natural meaning: Newsreader, Georgia, serif.
- Do not install fonts during documentation-only work. Treat these as implementation guidance.

Do not scale font size with viewport width. Letter spacing should remain `0`.

| Use | Desktop | Mobile | Line height | Max measure |
| --- | ---: | ---: | ---: | --- |
| Home display heading | 52px | 36px | 1.04 | 760px |
| Page title | 40px | 30px | 1.12 | 720px |
| Reading mode heading | 34px | 28px | 1.18 | 720px |
| Section title | 24px | 21px | 1.25 | 680px |
| Body text | 17px | 16px | 1.65 | 680px |
| Metadata | 13px | 12px | 1.35 | 520px |
| Arabic reading | 34px | 27px | 1.95 | 760px |
| Arabic vocabulary | 28px | 24px | 1.65 | 340px |
| English natural meaning | 26px | 23px | 1.5 | 680px |
| Explanation | 17px | 16px | 1.7 | 660px |

Use serif type only where it gives editorial warmth and reading quality:

- Arabic long-form reading should use the Arabic reading face.
- English Natural Meaning may use Newsreader or Georgia.
- UI labels, controls, metadata, tabs, buttons, navigation, and learning rows should use the sans stack.

## 4. Spacing And Layout System

Use a consistent spacing rhythm that makes the product feel assembled rather than loose.

| Context | Rule |
| --- | --- |
| Desktop page gutters | 32px |
| Tablet gutters | 24px |
| Mobile gutters | 16px |
| Desktop section gaps | 48px to 64px |
| Reading internal section gaps | 28px to 40px |
| My Learning section gaps | 32px to 48px |
| Compact control gaps | 8px to 12px |
| Component padding, compact | 12px to 16px |
| Component padding, standard | 20px to 24px |
| Reading surface padding | 32px desktop, 20px mobile |
| Composer padding | 16px to 20px |

Reading layout:

- Overall desktop composition: 1216px maximum.
- Main reading column: 800px.
- Explore rail: 304px.
- Desktop gap between reading and Explore: 36px.
- Mode content measure: 720px, aligned with the RTL reading edge.
- Mobile reading uses one column with the Explore surface converted to a drawer or sheet.

Home layout:

- Composer width: 736px maximum.
- Empty composer height: 112px target.
- Textarea should grow up to roughly 6 lines before scrolling.
- Keep the main action obvious within the first viewport.

My Learning layout:

- Overall maximum width: 1152px.
- Use a main content area plus a 288px side area where needed.
- Desktop gap: 40px.
- Mobile should collapse into flat editorial sections, not stacked dashboard cards.

## 5. Surface, Border, Radius, And Shadow Rules

Use fewer surface types, more consistently.

| Surface | Use |
| --- | --- |
| Plain paper background | Page canvas and open editorial content |
| Elevated white paper | Focal Arabic reading surface, composer, active popovers |
| Deep-paper surface | Explore rail, Continue Learning shelf, grouped archive/path regions |
| Mint-tinted surface | Annotation, learning callouts, subtle selected interpretation |
| Sage surface | Saved states, active learning state, progress markers |
| Bordered surface | Repeated vocabulary/history rows and compact controls |
| No container | Headings, body explanations, and editorial interpretation content |

Avoid carding everything. Do not put UI cards inside other cards. Page sections should not become floating card stacks.

Radius system:

| Token | Value | Use |
| --- | ---: | --- |
| `radius-xs` | 8px | Rows, small buttons, compact chips |
| `radius-sm` | 12px | Controls, inputs, small repeated items |
| `radius-md` | 16px | Composer, panels, vocabulary cards |
| `radius-lg` | 20px | Arabic reading surface, major sheets |
| `radius-xl` | 24px | Large mobile sheets only |
| `radius-pill` | 999px | Audio pill, segmented controls, icon buttons |

Elevation system:

- Level 0: no shadow, use border or tint only.
- Level 1: hairline shadow for rows and controls.
- Level 2: reading elevation for the Arabic surface and composer.
- Level 3: popover elevation for Word Lens, mobile sheets, and temporary overlays.

Shadows should be visible enough to separate paper from paper, but never glossy.

## 6. Color-Role Rules

Use color as hierarchy and state.

- Primary teal: primary actions, selected tabs, Explore active edge, source Arabic top edge.
- Dark teal: hover and pressed state for primary actions.
- Mint: annotation rules, learning highlights, skeleton shimmer tint, subtle focus expression.
- Sage: saved state, active path state, vocabulary mastery, non-destructive positive feedback.
- Paper: main canvas.
- Deep paper: secondary workspaces, shelves, rails, grouped archive/path surfaces.
- White: focal content, especially source Arabic and composer.
- Ink: main text.
- Ink soft: supporting text, metadata, timestamps, secondary labels.
- Line: structural borders and separators.
- Strong line: active borders and selected state boundaries.

Hover states should usually combine a small tint shift with a border-color change. Focus states should use the focus ring, not only a color change.

Do not use black for Waddeh UI controls. The mobile Explore trigger should be a teal or deep-paper control connected to the reading system.

## 7. Icon System

Use one icon family consistently. Phosphor is recommended for Waddeh because its regular and bold weights feel warmer and more editorial than generic utility icons.

Implementation guidance:

- Default icon weight: regular.
- Active or selected icon weight: bold.
- Dense row icons: 16px.
- Button label icons: 18px.
- Primary action icons: 20px.
- Mobile nav icons: 24px.
- Icons should support labels in navigation, mode controls, vocabulary actions, and audio actions.
- Do not use icons as decoration.
- Do not use decorative sparkles or generic AI glyphs.
- Do not install Phosphor during documentation-only work.

If the app keeps Lucide temporarily, use it consistently until an intentional icon migration is made.

## 8. Home Final Direction

Home should feel effortless like ChatGPT or Gemini in terms of action clarity, but distinctly Waddeh in material, type, and color.

Header:

- Keep the current architecture.
- Use quieter header height and a stronger brand wordmark presence.
- Avoid marketing navigation density.

Headline:

- Desktop: 52px maximum.
- Mobile: 36px maximum.
- Width: 680px to 760px.
- Tone: direct and product-like, not manifesto-like.
- Avoid oversized visual hierarchy.

Composer:

- Width: 736px.
- Empty height: 112px target.
- Arabic input size: 24px desktop, 22px mobile.
- Arabic line height: 1.8.
- Use an elevated white paper surface with a subtle teal focus state.
- Integrate Standard and Poetry into the composer toolbar, not as a detached mode strip.
- Toolbar height: 56px.
- Submit button: 48px, pill or rounded control, clearly primary.
- Attachment, examples, mode, and submit should read as one coherent toolbar.
- Textarea should grow up to about 6 lines, then scroll.

Surrounding space:

- Remove or greatly reduce the global radial wash.
- Do not fill the page with generic “how it works” panels.
- Use one Continue Learning shelf 48px to 56px below the composer when there is saved history.
- The shelf should use deep paper, compact rows, and one clear resume action.
- If there is no history, the surrounding space should stay quiet, not promotional.

## 9. Reading Final Direction

Reading is the most important Waddeh surface. It should feel like a premium Arabic reader, not a dashboard.

Arabic surface:

- Use white elevated paper.
- Radius: 20px.
- Padding: 32px desktop, 20px mobile.
- Add a restrained 3px teal top edge.
- Arabic long-form type: 34px desktop, 27px mobile.
- Line height: 1.95.
- Keep reading width around 760px within the 800px column.
- Preserve RTL behavior and word interaction.

Audio:

- The audio pill should live inside the Arabic surface header or immediately adjacent to it.
- Desktop pill width: 380px to 420px.
- Height: 48px.
- Mobile: full-width within the Arabic surface.
- Play button: 40px.
- Keep real Waddeh TTS, browser fallback, and speed controls.
- Speed controls should be visually light: compact segmented options or a small menu, not a heavy toolbar.

Understand, Simplify, Learn:

- Use a compact intrinsic segmented control around 404px wide and 44px high.
- Use a deep-paper track with active teal or sage fill.
- Align the control to the reading edge rather than stretching it full width.
- Mode transitions should be subtle and content-preserving.

Natural Meaning:

- Use Newsreader or Georgia.
- Size: 26px desktop, 23px mobile.
- Line height: 1.5.
- Keep max measure around 680px.
- Avoid placing it inside a heavy card.

Explanation:

- Size: 17px desktop, 16px mobile.
- Line height: 1.7.
- Use a 3px mint annotation rule to establish Waddeh’s interpretation grammar.
- Keep readable measure around 660px.

Expressions:

- Use compact editorial rows.
- Avoid oversized cards.
- Arabic expression should be visually primary, with meaning and context secondary.
- Use mint or sage only for state and emphasis.

Vocabulary:

- Use curated cards based on Base44 proportions, adapted to Waddeh colors.
- Desktop: two-column grid where space allows.
- Each item should have Arabic vocabulary around 28px, compact meaning, status/action, and a clear save/mastery state.
- Avoid dashboard stat styling.

Explore:

- Treat Explore as a deep-paper book margin, not a settings sidebar.
- Width: 304px desktop.
- Row height: about 44px.
- Reduce repeated explanatory microcopy.
- Use a restrained active state: sage fill plus teal edge or strong teal text.
- Word Lens selection should swap into the Explore workspace on desktop rather than opening a large interruptive overlay where practical.
- On mobile, Explore should become a bottom sheet or drawer with the same visual identity.
- Replace the isolated black floating trigger with a smaller teal or deep-paper control tied to the mode/reading area.

## 10. My Learning Final Direction

My Learning should feel like a coherent learning product, not an analytics dashboard.

Overview:

- Make Continue Learning dominant.
- Use one deep-paper “Now” panel or shelf, not multiple summary cards.
- Reduce oversized manifesto headings.
- Keep progress human-readable and contextual.

Vocabulary:

- Use editorial summary text and compact filters.
- Filter bar height: about 44px.
- Vocabulary rows: about 72px.
- Keep rows flat and scannable.
- Saved/mastered states should use sage and mint, not loud badges.

History:

- Treat as a reading archive.
- Group entries inside one deep-paper region with flat white rows.
- Emphasize title/source and last-opened state.
- Avoid analytics-card summaries.

Path:

- Show progression as a learning path, not a dashboard metric board.
- Use a 2px mint vertical line with 12px nodes.
- Current level marker: about 48px, sage fill, teal detail.
- Keep descriptions compact and practical.

Shared My Learning rules:

- Overview, Vocabulary, History, and Path should share typography, row rhythm, and controls.
- Each area can have distinct structure, but the same material system should connect them.
- Use fewer bordered boxes and more purposeful shelves, rows, and path markers.

## 11. Motion System

Motion should feel premium, calm, and purposeful. It should improve comprehension and perceived quality, not decorate weak layouts.

Durations:

| Motion | Duration |
| --- | ---: |
| Fast state change | 140ms |
| Standard interaction | 220ms |
| Content entrance | 300ms to 340ms |
| Sheet/drawer movement | 380ms to 420ms |
| Skeleton shimmer cycle | 1600ms |

Easing:

| Use | Easing |
| --- | --- |
| Standard | `cubic-bezier(.2,.8,.2,1)` |
| Entrance | `cubic-bezier(.22,1,.36,1)` |
| Exit | `cubic-bezier(.4,0,1,1)` |

Specific motion:

- Page transitions: opacity plus 6px vertical movement over 240ms.
- Composer focus: border and shadow change over 160ms.
- Composer submission: submit button compresses for 90ms, then input content fades into the loading skeleton.
- Loading skeleton: use actual Reading shapes: Arabic surface, audio pill, mode selector, meaning rows, and Explore area. Stagger reveal by about 60ms. Use mint-tinted shimmer, not generic gray bars.
- Loading copy: persistently show “This might take up to a minute.”
- Reading reveal: Arabic surface enters first, then audio/mode controls, then meaning and Explore.
- Mode switching: 180ms opacity plus 4px movement; no large slide.
- Audio interaction: play state should use a calm fill shift and icon change, not pulsing decoration.
- Vocabulary save: 220ms sage fill, icon weight change, and a small check state. No confetti.
- Word exploration: selected word gets a 120ms mint underline/fill; Explore content resolves over 220ms.
- Explore rail: desktop content crossfades and shifts 4px; mobile sheet uses 380ms movement with no overshoot.
- Bottom sheets: backdrop fade 180ms, sheet movement 380ms.
- My Learning transitions: tab content uses 180ms fade and 4px movement.

Reduced motion:

- Respect `prefers-reduced-motion`.
- Remove transforms, shimmer, and wave-like motion.
- Preserve instant state changes, opacity transitions under 100ms, and focus visibility.

## 12. What Must Be Removed From The Current Implementation

- Global radial wash that makes the product feel pale and generic.
- Detached Home mode strip when Standard/Poetry can live inside the composer toolbar.
- Large empty cream fields with no material structure.
- Full-width hairline dividers used as the main hierarchy device.
- Indistinct white panels that blend into paper background.
- Settings-sidebar feeling in Explore.
- Isolated black mobile Explore floating circle.
- Repeated eyebrow/heading/microcopy patterns that make the UI feel generated.
- System default typography as the final visual identity.
- Mixed icon styles or decorative AI-style icons.
- Oversized dashboard summaries in My Learning.

## 13. What Must Be Preserved

- Existing Waddeh teal, mint, paper, sage, and ink color identity.
- Current product architecture, routes, and information architecture.
- Reading composition proportions: roughly 800px main column, 304px Explore rail, 36px desktop gap.
- Arabic-first RTL behavior and bilingual LTR/RTL support.
- Real Waddeh TTS, browser fallback, and speed controls.
- Understand, Simplify, and Learn modes.
- Explore rail and Word Lens behavior.
- Desktop Word Lens workspace direction and mobile drawer/sheet direction.
- Current vocabulary, history, and learning persistence behavior.
- Flat editorial vocabulary and history direction.
- Mobile bottom navigation.
- PWA support and current brand assets.
- Accessibility expectations, including focus visibility and reduced motion.

## 14. Top 10 Highest-Impact Implementation Changes

1. Establish the typography system: bilingual UI stack, Arabic reading stack, and English natural-meaning serif.
2. Remove the global wash and strengthen material separation between paper, white paper, deep paper, and sage.
3. Apply Waddeh’s repeated visual grammar: teal source edge, mint annotation rule, sage saved/active states.
4. Integrate Standard/Poetry into the Home composer toolbar and tighten composer proportions.
5. Move or restyle the audio controls as a compact reading pill within the Arabic reading surface.
6. Align Reading interpretation content to a 720px editorial measure with Natural Meaning and Explanation hierarchy.
7. Convert Explore into a dense book-margin workspace with stronger active states and less explanatory copy.
8. Rework My Learning surfaces into Continue shelf, vocabulary rows, archive groups, and path markers instead of dashboard summaries.
9. Standardize the icon system, preferably Phosphor regular/bold, without mixing decorative icon styles.
10. Centralize motion tokens and apply the calm motion language to composer submission, loading reveal, mode switching, saving vocabulary, Word Lens, Explore, and mobile sheets.
