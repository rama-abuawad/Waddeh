# API Contract

Base URL in local development: `http://localhost:8000`.

The local frontend uses `NEXT_PUBLIC_API_BASE_URL`. Production leaves that variable
unset and uses same-origin `/api/*` routes through Vercel Services.

AI-backed routes return HTTP 429 with a safe message and `Retry-After` header when
the per-instance guard is exceeded. A Vercel WAF rule provides the deployment-wide
limit across scaled backend instances.

## `GET /api/health`

Returns:

```json
{ "status": "ok", "service": "waddeh-api" }
```

## `POST /api/readability`

Request:

```json
{ "text": "Arabic text of at least 20 characters" }
```

Returns a `ReadabilityAssessment` with:

- `deterministic`: sentence/word counts, average sentence length, long sentences, vocabulary indicators, numeric/date counts, and reasons.
- `heuristic_estimate`: estimated level, recommended adaptation level, confidence, and reasons.
- `ai_estimate`: currently `unavailable` unless a later dedicated AI readability stage is added.

The estimate is heuristic and must not be described as a validated academic score.

## `POST /api/simplify`

Request:

```json
{
  "text": "Arabic text of at least 20 characters",
  "reader": "child | general_reader | non_arabic_speaker",
  "level": 1,
  "reading_memory": {
    "mastered_terms": ["المتقدم"],
    "learning_terms": ["استيفاء"],
    "difficulty_focus": ["pronoun", "condition"]
  }
}
```

`level` values:

- `1`: Beginner / very easy.
- `2`: Easy.
- `3`: Intermediate.
- `4`: Advanced.
- `5`: Original.

Returns `SimplifyResponse`:

- Original text, selected reader, and selected level.
- `readability`.
- `adaptation_strategy`.
- `simplified_text`.
- `diacritized_text`.
- `english_translation`.
- `learning_cards`.
- `change_map`.
- `meaning_threads`: confident sentence relations with Arabic and English explanations.
- `cultural_meanings`: zero to four source-grounded idioms, proverbs, metaphors, or cultural references with literal meaning, intended meaning, concise context, English support, an optional close English expression, and confidence.
- `bridge`.
- `meaning_integrity`.
- `comprehension_check`, including three aligned Arabic/English answer choices and the validated correct-choice index.

## `POST /api/upload/pdf`

Accepts a raw `application/pdf` body up to 4 MB with optional query params:

```text
reader=general_reader&level=2
```

Headers:

```text
Content-Type: application/pdf
X-File-Name: encoded filename
X-Reading-Memory: URI-encoded ReadingMemorySnapshot JSON
```

Returns the same `SimplifyResponse` shape. PDF source text is not persisted, so deterministic source-vs-adapted integrity is limited in this MVP.

## `POST /api/explain-word`

Request:

```json
{
  "word": "Arabic word or expression",
  "context": "Current adapted Arabic context",
  "reader": "general_reader"
}
```

Returns contextual Word Lens data:

- Helpful diacritics.
- Simple Arabic meaning.
- Arabic root when confident, or uncertainty.
- Contextual synonym.
- English support.
- Optional Arabic example.
- Confidence.

## `POST /api/learning/transfer-challenge`

Request:

```json
{
  "word": "استيفاء",
  "meaning": "إكمال المتطلبات",
  "english_meaning": "meeting the requirements",
  "source_context": "يجب استيفاء الشروط قبل الموعد.",
  "reader": "general_reader",
  "level": 2
}
```

Returns one new, level-appropriate Arabic fill-in-the-blank context with:

- One aligned Arabic/English prompt containing exactly one `____` blank.
- Three distinct, aligned Arabic/English choices.
- A validated zero-based `correct_choice_index`.
- Concise Arabic and English feedback explaining why the target word fits.

The endpoint is called only when the learner explicitly starts a challenge. The client
stores attempts locally and does not mark a word as mastered until recall and contextual
transfer have both been demonstrated.

## `POST /api/poetry/explain`

Request:

```json
{
  "text": "Arabic verse or a short poem",
  "reader": "child | general_reader | non_arabic_speaker",
  "level": 2
}
```

Returns the poem's concise Arabic and English overview, complete English translation,
line-by-line meaning, contextual vocabulary, and `cultural_meanings`. The cultural list
contains only source-grounded poetic images, idioms, proverbs, or cultural references;
it is empty when the poem does not need beyond-literal context.
