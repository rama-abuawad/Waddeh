# وضّح | Waddeh — Project Context

> **Tagline:** لأن الفهم يبدأ بالوضوح  
> **English:** Because understanding starts with clarity.

---

## 1. Project Overview

**Waddeh (وضّح)** is an AI-powered Arabic reading companion designed to make difficult Arabic content clear, personalized, and interactive without changing its original meaning.

Users can paste Arabic text or upload documents, then use Waddeh to:

- Simplify the content according to their reading level.
- Compare the original and simplified versions.
- Explain difficult words and sentences.
- Translate the content into English.
- Summarize the content in different formats.
- Ask questions about the uploaded document.
- Generate quizzes and flashcards.
- Convert suitable content into flowcharts, timelines, and mind maps.
- Listen to the text using Arabic text-to-speech.
- Learn advanced Arabic gradually through an interactive learning mode.

Waddeh is not intended to be a general chatbot or a basic translator. Its main purpose is to improve understanding of Arabic content through AI.

---

## 2. Competition Category

Waddeh is designed for the **Smart Arabic** category.

It supports the competition theme by combining:

- Artificial intelligence.
- Arabic natural language processing.
- Accessible Arabic content.
- Personalized learning.
- Interactive educational tools.
- Digital innovation.
- Arabic reading and comprehension support.

---

## 3. Problem Statement

Many Arabic readers struggle with content that contains:

- Long and complicated sentences.
- Academic vocabulary.
- Legal and government terminology.
- Scientific or technical expressions.
- Classical or highly formal Arabic.
- Unfamiliar words and sentence structures.
- Poorly explained ideas.

This problem can affect:

- School students.
- University students.
- Children.
- General readers.
- Non-native Arabic learners.
- Older readers.
- People with reading difficulties.
- Users trying to understand government, legal, academic, or medical information.

Most existing tools provide translation, summarization, or general chatbot responses. They do not provide a complete Arabic-first experience that adapts the same text to the reader while preserving meaning.

---

## 4. Proposed Solution

Waddeh analyzes Arabic content and converts it into a personalized reading experience.

The user can:

1. Paste Arabic text or upload a document.
2. View the detected reading difficulty.
3. Select the target reader.
4. Choose a simplification level.
5. Generate a clear Arabic version.
6. Compare the original and simplified text.
7. Click difficult words for explanations.
8. Translate the content into English.
9. Ask questions about the document.
10. Generate a summary, quiz, flashcards, or visual diagram.
11. Listen to the content.
12. Use Learning Mode to improve their Arabic over time.

---

## 5. Target Users

### Primary users

- School students.
- University students.
- Arabic learners.
- Non-native Arabic speakers.
- General Arabic readers.

### Secondary users

- Teachers.
- Parents.
- Government-service users.
- Researchers.
- Professionals.
- Older readers.
- People with reading or accessibility needs.

---

## 6. Platform Type

Waddeh will first be developed as a **responsive web application**.

### Why a web application?

- Judges can open it directly using a link.
- No installation is required.
- It works on computers, tablets, and phones.
- Document comparison is easier on larger screens.
- Development and testing are faster than building separate mobile applications.
- Updates can be published immediately.
- It can later become an installable Progressive Web App.

### Future direction

After the web version is stable, Waddeh can be released as:

- A Progressive Web App.
- Android and iOS applications.
- A browser extension.
- A Microsoft Word add-in.
- A Google Docs integration.
- A university learning-management-system integration.

---

## 7. Main User Journey

### Step 1 — Add content

The user can:

- Paste Arabic text.
- Upload a PDF.
- Upload a Word document.
- Upload an image.
- Scan a page using a phone camera.
- Add a website link in a future version.

### Step 2 — Analyze the content

Waddeh detects:

- The main topic.
- Estimated reading level.
- Sentence complexity.
- Difficult words.
- Technical terminology.
- Important names.
- Dates and deadlines.
- Conditions and requirements.
- Estimated reading time.

Example:

```text
Difficulty: Advanced
Estimated level: University
Reading time: 7 minutes

Reasons:
- Long sentences
- Rare vocabulary
- Legal terminology
```

### Step 3 — Select the reader

The user chooses:

- Child.
- School student.
- University student.
- General reader.
- Non-native Arabic learner.
- Professional.

### Step 4 — Select the difficulty level

The user uses a difficulty slider:

```text
Very Easy ← Easy ← Standard ← Advanced ← Original
```

### Step 5 — Generate the clear version

Example:

**Original Arabic**

> يتعين على المتقدم استيفاء جميع المتطلبات المنصوص عليها قبل انقضاء المهلة المحددة.

**Waddeh version**

> يجب على الشخص المتقدم إكمال جميع الشروط قبل انتهاء الوقت المحدد.

### Step 6 — Continue learning

The user can then:

- Compare the versions.
- Explain a word.
- Explain a sentence.
- Translate to English.
- Ask the chatbot.
- Generate a quiz.
- View a visual.
- Listen to the text.
- Save vocabulary.

---

## 8. Core Features

## 8.1 Adaptive Arabic Simplification

This is the main feature of Waddeh.

The system rewrites difficult Arabic using language suitable for the selected reader while preserving:

- Meaning.
- Names.
- Dates.
- Numbers.
- Deadlines.
- Conditions.
- Requirements.
- Warnings.
- Exceptions.
- Technical facts.

### Simplification levels

#### Level 1 — Very Easy

- Short sentences.
- Common vocabulary.
- One idea per sentence.
- Technical terms explained.
- Suitable for children and beginners.

#### Level 2 — Easy

- Simple Modern Standard Arabic.
- Short-to-medium sentences.
- Difficult vocabulary replaced or explained.
- Suitable for school students and non-native learners.

#### Level 3 — Standard

- Natural Modern Standard Arabic.
- Moderate sentence length.
- Important technical terms preserved.
- Suitable for general readers.

#### Level 4 — Advanced

- More formal vocabulary.
- Most academic terminology preserved.
- Complex ideas clarified without major rewriting.

#### Level 5 — Original

- Original document remains visible.
- Only optional explanations are provided.

---

## 8.2 Original and Simplified Comparison

The interface displays:

```text
Original Arabic | Clear Arabic | English
```

The comparison view can highlight:

- Changed words.
- Shortened sentences.
- Replaced expressions.
- Preserved names and numbers.
- Added explanations.

This helps the user understand both the content and the simplification process.

---

## 8.3 Difficult-Word Explanation

When the user selects a word, Waddeh provides:

- Meaning in the current sentence.
- Simple definition.
- Root letters.
- Synonyms.
- Antonyms.
- Example sentence.
- English translation.
- Pronunciation audio in a later version.

The sentence context must be sent with the word because Arabic words can have different meanings depending on usage.

---

## 8.4 Sentence Explanation

The user can highlight a sentence and select:

> وضّح هذه الجملة

Waddeh returns:

- A simpler Arabic explanation.
- A real-life example.
- A brief explanation of the difficult part.
- An optional English explanation.

---

## 8.5 Arabic-to-English Translation

English translation will be included as an accessibility feature, while Arabic simplification remains the main function.

Translation modes:

- Natural English translation.
- Simple English translation.
- English explanation.
- Bilingual Arabic-English comparison.
- Arabic terms shown beside their English meanings.

The translation must preserve:

- Names.
- Dates.
- Numbers.
- Requirements.
- Conditions.
- Technical meaning.

It should avoid direct word-for-word translation when that damages the intended meaning.

---

## 8.6 Smart Summary

The user can generate:

- One-sentence summary.
- Short paragraph.
- Main points.
- Study notes.
- Important definitions.
- Important people.
- Important dates.
- Timeline.
- Mind map structure.

---

## 8.7 Document Chatbot

The chatbot answers questions using only the selected text or uploaded document.

Example questions:

- ما الفكرة الرئيسية؟
- ماذا يعني الجزء الثاني؟
- ما الشروط المطلوبة؟
- أعطني مثالاً بسيطاً.
- ما آخر موعد مذكور؟
- اشرح هذا كأنني طالب مدرسة.
- Translate this section into English.
- اختبرني في هذا الموضوع.

The chatbot can answer in:

- Arabic.
- English.
- Both languages.

If the answer is not available in the document, it should say:

> لم أجد هذه المعلومة في المستند.

The chatbot should display the supporting page or paragraph whenever possible.

---

## 8.8 Quiz Generator

Quiz types:

- Multiple choice.
- True or false.
- Fill in the blank.
- Short answer.
- Vocabulary matching.

The user can select:

- Number of questions.
- Difficulty.
- Language.
- Question type.

After completion, Waddeh shows:

- Score.
- Correct answer.
- Explanation.
- Supporting text.

---

## 8.9 Visual Mode

Waddeh can transform suitable content into:

- Flowcharts.
- Timelines.
- Mind maps.
- Comparison tables.
- Step-by-step diagrams.

Example:

```text
تعبئة الطلب
     ↓
رفع المستندات
     ↓
مراجعة الطلب
     ↓
إعلان النتيجة
```

The AI should return structured diagram data, then the frontend renders it. This is more reliable than generating a random image.

---

## 8.10 Read-Aloud Mode

The application can read:

- Original Arabic.
- Simplified Arabic.
- English translation.

Controls:

- Play.
- Pause.
- Reading speed.
- Voice selection later.
- Sentence highlighting during playback.

---

## 8.11 Vocabulary Library

Users can save selected words with:

- Meaning.
- Root.
- Example.
- English translation.
- Source document.
- Learning status.

The system can later create spaced-repetition flashcards.

---

## 8.12 Learning Mode

Learning Mode prevents users from depending permanently on simplification.

It:

- Keeps the original text visible.
- Highlights changed expressions.
- Explains why a sentence was simplified.
- Introduces advanced words gradually.
- Asks short comprehension questions.
- Tracks repeated difficulties.
- Gradually reduces simplification as the reader improves.

This feature transforms Waddeh from a rewriting tool into an Arabic learning companion.

---

## 9. What Makes Waddeh Special

### 9.1 Arabic-first design

Waddeh is designed specifically for Arabic rather than being a general chatbot with an Arabic interface.

It considers:

- Right-to-left design.
- Arabic sentence structure.
- Formal Arabic.
- Arabic roots.
- Contextual word meanings.
- Academic and legal language.
- Different reader levels.

### 9.2 Personalized simplification

The same text can be adapted for:

- A child.
- A school student.
- A university student.
- A non-native learner.
- A professional.

### 9.3 Meaning-preservation checks

Waddeh focuses on preserving:

- Names.
- Dates.
- Numbers.
- Deadlines.
- Conditions.
- Requirements.
- Warnings.
- Exceptions.

A verification stage can compare extracted facts from the original and simplified versions.

### 9.4 Multiple learning formats

One document can become:

- Clear Arabic.
- English translation.
- Summary.
- Audio.
- Quiz.
- Flashcards.
- Diagram.
- Interactive conversation.

### 9.5 Grounded chatbot answers

The chatbot answers from the uploaded document and provides page references instead of responding only from general knowledge.

### 9.6 Learning instead of dependency

Learning Mode explains the changes and helps users improve their reading ability over time.

---

## 10. Recommended Technology Stack

## 10.1 Frontend

### Next.js

Used for:

- Application routing.
- Page structure.
- Server and client components.
- Responsive web application development.
- Future PWA support.

### React

Used to build interactive interface components.

### TypeScript

Used to:

- Reduce programming errors.
- Define API data structures.
- Make the project easier to maintain.

### Tailwind CSS

Used for:

- Responsive design.
- Consistent styling.
- Arabic right-to-left layouts.
- Faster interface development.

### Diagram library

Use one of:

- React Flow.
- Mermaid.

React Flow provides more control and interaction. Mermaid is faster for an initial prototype.

---

## 10.2 Backend

### Python

Used because of its strong AI and language-processing ecosystem.

### FastAPI

Used for:

- REST API endpoints.
- File uploads.
- Request validation.
- AI requests.
- Document processing.
- Chatbot logic.
- Automatic Swagger documentation.

### Pydantic

Used to validate requests and AI structured outputs.

### SQLAlchemy

Used for database models and queries if direct database control is needed.

---

## 10.3 Database and Storage

### PostgreSQL

Stores:

- Users.
- Documents.
- Simplified versions.
- Chat history.
- Quiz results.
- Vocabulary.
- User preferences.

### pgvector

Stores document embeddings for semantic search in the chatbot.

### Supabase

Recommended for the prototype because it can provide:

- PostgreSQL.
- Authentication.
- File storage.
- pgvector.
- Database dashboard.
- Access policies.

---

## 10.4 AI Services

Use an existing Arabic-capable language-model API for the first version.

The model performs:

- Arabic simplification.
- Text analysis.
- Translation.
- Summarization.
- Word explanation.
- Question answering.
- Quiz creation.
- Visual structure generation.

Training a large model from the beginning is not recommended because it requires:

- A large Arabic dataset.
- Expensive hardware.
- Extensive evaluation.
- More development time.

A future version can fine-tune a smaller model using verified pairs of complex and simplified Arabic text.

---

## 10.5 Document Processing

| Input | Technology |
|---|---|
| Plain text | Python processing |
| Text-based PDF | PyMuPDF |
| Word document | python-docx |
| Image | Arabic OCR |
| Scanned PDF | PDF processing plus OCR |
| Website content | HTML extraction in a later version |

---

## 10.6 Voice Services

| Feature | Technology |
|---|---|
| Arabic read aloud | Text-to-speech API or browser speech |
| English read aloud | Text-to-speech |
| Voice questions | Speech-to-text |
| Word pronunciation | Text-to-speech |

---

## 10.7 Deployment

Recommended setup:

```text
Frontend: Vercel
Backend: Render or Railway
Database: Supabase PostgreSQL
Storage: Supabase Storage
AI: Arabic-capable language-model API
```

---

## 11. System Architecture

```text
User
  │
  ▼
Next.js Web Application
  │
  ▼
FastAPI Backend
  │
  ├── Text analysis service
  ├── Arabic simplification service
  ├── Translation service
  ├── Summary service
  ├── Word explanation service
  ├── Quiz generator
  ├── Visual generator
  ├── PDF/OCR processor
  └── Document chatbot
          │
          ├── AI language model
          ├── PostgreSQL
          ├── pgvector
          └── File storage
```

The frontend must never contain the AI API key. All AI requests must pass through the backend.

---

## 12. Chatbot Implementation

The full chatbot will use **Retrieval-Augmented Generation (RAG)**.

### 12.1 Document processing

After a user uploads a document:

1. Extract the text.
2. Preserve page numbers.
3. Clean repeated headers and page numbers.
4. Split the text into smaller chunks.
5. Add overlap between nearby chunks.
6. Create an embedding for each chunk.
7. Store each chunk and embedding in pgvector.

Example stored chunk:

```json
{
  "document_id": 14,
  "page_number": 3,
  "chunk_index": 8,
  "text": "النص العربي الموجود في هذا الجزء...",
  "embedding": []
}
```

### 12.2 Question answering

When a question is asked:

1. Convert the question into an embedding.
2. Search the stored chunks.
3. Retrieve the most relevant three to five chunks.
4. Send the chunks and question to the language model.
5. Ask the model to answer only from the supplied context.
6. Return the answer and page references.

### 12.3 Core chatbot prompt

```text
أنت مساعد منصة "وضّح" لفهم النصوص العربية.

أجب اعتماداً فقط على السياق المرفق.
استخدم لغة عربية واضحة ومناسبة لمستوى المستخدم.
لا تضف معلومات غير موجودة في النص.
إذا لم تجد الإجابة، قل:
"لم أجد هذه المعلومة في المستند."

اذكر الصفحة أو الجزء الذي اعتمدت عليه.
اشرح المصطلحات الصعبة عند الحاجة.
```

### 12.4 Short-text prototype

For the first version, pasted text can be sent directly with the user question. RAG should be added when PDF and long-document support is implemented.

---

## 13. Suggested API Endpoints

```text
GET  /api/health
POST /api/analyze
POST /api/simplify
POST /api/translate
POST /api/summarize
POST /api/explain-word
POST /api/explain-sentence
POST /api/generate-quiz
POST /api/chat
POST /api/upload
POST /api/visualize
POST /api/text-to-speech
```

---

## 14. Suggested Database Tables

### users

```text
id
name
email
preferred_language
preferred_reading_level
created_at
```

### documents

```text
id
user_id
title
file_type
original_text
difficulty_score
created_at
```

### document_chunks

```text
id
document_id
page_number
chunk_index
content
embedding
```

### simplifications

```text
id
document_id
target_level
simplified_text
created_at
```

### translations

```text
id
document_id
target_language
translation_mode
translated_text
created_at
```

### conversations

```text
id
document_id
user_id
created_at
```

### messages

```text
id
conversation_id
role
content
source_chunks
created_at
```

### vocabulary

```text
id
user_id
word
meaning
root
example
translation
learning_status
```

### quizzes

```text
id
document_id
difficulty
language
questions_json
created_at
```

---

## 15. Suggested Project Structure

```text
waddeh/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── types/
│   ├── styles/
│   └── public/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   ├── analyzer.py
│   │   │   ├── simplifier.py
│   │   │   ├── translator.py
│   │   │   ├── summarizer.py
│   │   │   ├── word_explainer.py
│   │   │   ├── quiz_generator.py
│   │   │   ├── visual_generator.py
│   │   │   ├── document_processor.py
│   │   │   └── rag_service.py
│   │   ├── prompts/
│   │   └── database/
│   └── tests/
│
├── sample-documents/
├── documentation/
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

---

# 16. MASTER CHECKLIST

## Status Legend

- `[x]` Completed or decided.
- `[~]` In progress.
- `[ ]` Not started.
- `🔴` Essential for the competition prototype.
- `🟡` Strong additional feature.
- `⚪` Future expansion.

---

## Phase 1 — Project Definition

- [x] Confirm the project concept.
- [x] Confirm the name: **وضّح | Waddeh**.
- [x] Confirm the tagline: **لأن الفهم يبدأ بالوضوح**.
- [x] Select the **Smart Arabic** category.
- [x] Decide to avoid cybersecurity-related features.
- [x] Define Arabic simplification as the core function.
- [x] Include English translation as a supporting feature.
- [x] Decide to build a responsive web application first.
- [x] Define the initial target users.
- [x] Define the main user journey.
- [ ] Write the final official competition description.
- [ ] Confirm the competition submission fields.
- [ ] Confirm team members and responsibilities.
- [ ] Create a final project scope document.
- [ ] Collect real examples of difficult Arabic text.
- [ ] Select one strong competition demonstration document.

---

## Phase 2 — Branding

- [x] Choose the project name.
- [x] Choose the tagline.
- [ ] Create the logo.
- [ ] Choose the main brand colors.
- [ ] Choose Arabic interface fonts.
- [ ] Choose English interface fonts.
- [ ] Create the application icon.
- [ ] Create a simple design system.
- [ ] Design the landing-page hero section.
- [ ] Prepare a short Arabic description.
- [ ] Prepare a short English description.

---

## Phase 3 — Project Organization

- [ ] Create the GitHub repository: `waddeh`.
- [ ] Add `README.md`.
- [ ] Add `context.md`.
- [ ] Add `.gitignore`.
- [ ] Add `.env.example`.
- [ ] Select a software license.
- [ ] Create the main branch.
- [ ] Create a development branch.
- [ ] Create the frontend folder.
- [ ] Create the backend folder.
- [ ] Create the documentation folder.
- [ ] Create the sample-documents folder.
- [ ] Create a GitHub Project, Trello board, or Notion board.
- [ ] Add columns: Ideas, To Do, In Progress, Testing, Completed.
- [ ] Add the checklist tasks to the board.
- [ ] Assign each task to a team member.
- [ ] Add deadlines.

---

## Phase 4 — Technology Setup

### Frontend

- [ ] Install Node.js.
- [ ] Create the Next.js project.
- [ ] Enable TypeScript.
- [ ] Configure Tailwind CSS.
- [ ] Configure Arabic RTL support.
- [ ] Install an icon library.
- [ ] Install React Flow or Mermaid.
- [ ] Add environment-variable support.
- [ ] Test the frontend locally.

### Backend

- [ ] Install Python.
- [ ] Create a Python virtual environment.
- [ ] Install FastAPI.
- [ ] Install Uvicorn.
- [ ] Install Pydantic.
- [ ] Install SQLAlchemy if needed.
- [ ] Create `main.py`.
- [ ] Create `GET /api/health`.
- [ ] Test Swagger.
- [ ] Configure CORS.
- [ ] Test the backend locally.

### Database

- [ ] Create a Supabase project.
- [ ] Configure PostgreSQL.
- [ ] Enable pgvector.
- [ ] Create a storage bucket.
- [ ] Add database credentials to `.env`.
- [ ] Test the database connection.

### AI

- [ ] Select an Arabic-capable AI model/API.
- [ ] Create the API key.
- [ ] Store the key in the backend `.env`.
- [ ] Create `ai_service.py`.
- [ ] Send the first Arabic prompt.
- [ ] Receive the first Arabic response.
- [ ] Test structured JSON output.
- [ ] Add timeout and error handling.

---

## Phase 5 — User Interface Design

### Required pages

- [ ] Landing page.
- [ ] Main workspace.
- [ ] Upload page.
- [ ] Results page.
- [ ] Chatbot panel.
- [ ] Quiz page.
- [ ] Vocabulary page.
- [ ] About page.

### Main workspace components

- [ ] Arabic text input.
- [ ] Upload area.
- [ ] Target-reader selector.
- [ ] Difficulty slider.
- [ ] Simplify button.
- [ ] Translate button.
- [ ] Summarize button.
- [ ] Explain-word action.
- [ ] Explain-sentence action.
- [ ] Quiz button.
- [ ] Visualize button.
- [ ] Read-aloud button.
- [ ] Chatbot panel.
- [ ] Original tab.
- [ ] Clear Arabic tab.
- [ ] English tab.
- [ ] Side-by-side comparison.
- [ ] Copy button.
- [ ] Clear button.
- [ ] Example-text button.
- [ ] Loading animation.
- [ ] Error state.
- [ ] Empty state.
- [ ] Mobile layout.
- [ ] Tablet layout.
- [ ] Desktop layout.

---

## Phase 6 — Backend Foundation

- [ ] Create API folders.
- [ ] Create schemas.
- [ ] Create response models.
- [ ] Add global error handling.
- [ ] Add request validation.
- [ ] Add logging.
- [ ] Add API rate limiting.
- [ ] Add file validation.
- [ ] Add test endpoints.
- [ ] Connect frontend to backend.
- [ ] Confirm the browser never calls the AI API directly.

### Required endpoints

- [ ] `GET /api/health`
- [ ] `POST /api/analyze`
- [ ] `POST /api/simplify`
- [ ] `POST /api/translate`
- [ ] `POST /api/summarize`
- [ ] `POST /api/explain-word`
- [ ] `POST /api/explain-sentence`
- [ ] `POST /api/generate-quiz`
- [ ] `POST /api/chat`
- [ ] `POST /api/upload`
- [ ] `POST /api/visualize`
- [ ] `POST /api/text-to-speech`

---

## Phase 7 — Arabic Simplification 🔴

- [ ] Define the five difficulty levels.
- [ ] Define sentence-length rules for each level.
- [ ] Define vocabulary rules for each level.
- [ ] Define how technical terms are handled.
- [ ] Define target-reader options.
- [ ] Write the system prompt.
- [ ] Write level-specific prompts.
- [ ] Request structured JSON output.
- [ ] Validate the AI response.
- [ ] Display the simplified result.
- [ ] Preserve names.
- [ ] Preserve dates.
- [ ] Preserve numbers.
- [ ] Preserve deadlines.
- [ ] Preserve requirements.
- [ ] Preserve conditions.
- [ ] Preserve warnings.
- [ ] Preserve exceptions.
- [ ] Preserve technical facts.
- [ ] Compare extracted facts before and after.
- [ ] Flag possibly removed information.
- [ ] Test short Arabic text.
- [ ] Test long Arabic text.
- [ ] Test academic text.
- [ ] Test government text.
- [ ] Test scientific text.
- [ ] Test legal-style text.
- [ ] Test school-level text.

---

## Phase 8 — Difficulty Analyzer 🔴

- [ ] Measure sentence length.
- [ ] Detect difficult vocabulary.
- [ ] Detect technical vocabulary.
- [ ] Detect legal terminology.
- [ ] Detect academic terminology.
- [ ] Estimate reading time.
- [ ] Return a level from 1 to 5.
- [ ] Explain why the text is difficult.
- [ ] Display the result visually.
- [ ] Compare difficulty before and after simplification.
- [ ] Test the score using different document types.

---

## Phase 9 — Original/Clear/English Comparison 🔴

- [ ] Create three result tabs.
- [ ] Create side-by-side desktop layout.
- [ ] Create mobile tab layout.
- [ ] Match original and simplified paragraphs.
- [ ] Highlight changed words.
- [ ] Highlight preserved dates and numbers.
- [ ] Add copy buttons.
- [ ] Add export support later.
- [ ] Handle long documents.
- [ ] Handle right-to-left formatting correctly.

---

## Phase 10 — Difficult-Word Explanation 🔴

- [ ] Allow word selection.
- [ ] Send the selected sentence as context.
- [ ] Return meaning in context.
- [ ] Return a simple definition.
- [ ] Return root letters.
- [ ] Return synonyms.
- [ ] Return antonyms.
- [ ] Return an example sentence.
- [ ] Return English translation.
- [ ] Add save-to-vocabulary action.
- [ ] Add pronunciation later.
- [ ] Test words with multiple meanings.

---

## Phase 11 — Sentence Explanation 🔴

- [ ] Allow sentence highlighting.
- [ ] Add “وضّح هذه الجملة”.
- [ ] Return a simpler explanation.
- [ ] Return an everyday example.
- [ ] Return a short English explanation.
- [ ] Keep the answer appropriate for the selected reader.
- [ ] Add “explain more simply”.
- [ ] Add “give another example”.

---

## Phase 12 — English Translation 🔴

- [ ] Implement natural English translation.
- [ ] Implement simple English translation.
- [ ] Implement English explanation mode.
- [ ] Build bilingual sentence comparison.
- [ ] Preserve names.
- [ ] Preserve dates.
- [ ] Preserve numbers.
- [ ] Preserve conditions.
- [ ] Preserve technical meaning.
- [ ] Avoid damaging word-for-word translation.
- [ ] Explain culturally specific expressions.
- [ ] Test academic text.
- [ ] Test legal-style text.
- [ ] Test everyday text.

---

## Phase 13 — Summary Generator 🔴

- [ ] One-sentence summary.
- [ ] Short-paragraph summary.
- [ ] Main points.
- [ ] Study notes.
- [ ] Important definitions.
- [ ] Important names.
- [ ] Important dates.
- [ ] Timeline.
- [ ] Structured JSON output.
- [ ] Display each summary type.
- [ ] Preserve facts.
- [ ] Test summary accuracy.

---

## Phase 14 — Chatbot Prototype 🔴

### Short-text version

- [ ] Send pasted text with the user question.
- [ ] Restrict the answer to the supplied text.
- [ ] Add Arabic responses.
- [ ] Add English responses.
- [ ] Add bilingual responses.
- [ ] Add “explain more simply”.
- [ ] Add “give an example”.
- [ ] Add suggested follow-up questions.
- [ ] Return “لم أجد هذه المعلومة في المستند” when needed.
- [ ] Test unsupported questions.
- [ ] Test Arabic questions.
- [ ] Test English questions.

---

## Phase 15 — PDF and Document Upload 🟡

### PDF

- [ ] Install PyMuPDF.
- [ ] Accept PDF files.
- [ ] Validate file type.
- [ ] Validate file size.
- [ ] Extract text by page.
- [ ] Preserve page numbers.
- [ ] Clean repeated headers.
- [ ] Clean repeated footers.
- [ ] Detect scanned PDFs.
- [ ] Display extraction errors.
- [ ] Test Arabic text order.

### Word documents

- [ ] Install python-docx.
- [ ] Accept `.docx`.
- [ ] Extract headings.
- [ ] Extract paragraphs.
- [ ] Preserve order.
- [ ] Test Arabic Word documents.

### Images and scans

- [ ] Accept JPG.
- [ ] Accept PNG.
- [ ] Add Arabic OCR.
- [ ] Show extracted text.
- [ ] Allow manual correction.
- [ ] Show original image beside the extracted text.
- [ ] Send corrected text to Waddeh.

---

## Phase 16 — Full RAG Chatbot 🟡

### Document processing

- [ ] Clean extracted text.
- [ ] Separate text by page.
- [ ] Split text into chunks.
- [ ] Add chunk overlap.
- [ ] Save document ID.
- [ ] Save page number.
- [ ] Save chunk index.
- [ ] Generate embeddings.
- [ ] Store embeddings in pgvector.
- [ ] Test Arabic semantic search.

### Question answering

- [ ] Generate an embedding for the question.
- [ ] Search the closest chunks.
- [ ] Retrieve three to five chunks.
- [ ] Send context and question to the model.
- [ ] Restrict the model to the retrieved context.
- [ ] Return an Arabic answer.
- [ ] Return an English answer.
- [ ] Return supporting pages.
- [ ] Show the supporting paragraph.
- [ ] Handle no-answer cases.
- [ ] Test page-reference accuracy.
- [ ] Test long documents.

---

## Phase 17 — Quiz Generator 🔴

- [ ] Multiple-choice questions.
- [ ] True-or-false questions.
- [ ] Fill-in-the-blank questions.
- [ ] Short-answer questions.
- [ ] Vocabulary matching.
- [ ] Number-of-questions selector.
- [ ] Difficulty selector.
- [ ] Arabic questions.
- [ ] English questions.
- [ ] Bilingual questions later.
- [ ] Validate that answers are supported by the text.
- [ ] Display score.
- [ ] Explain incorrect answers.
- [ ] Allow retry.
- [ ] Test quiz accuracy.

---

## Phase 18 — Visual Mode 🟡

- [ ] Detect whether the text is suitable for a visual.
- [ ] Generate flowchart JSON.
- [ ] Generate timeline JSON.
- [ ] Generate mind-map JSON.
- [ ] Generate comparison-table JSON.
- [ ] Render using React Flow or Mermaid.
- [ ] Support Arabic right-to-left labels.
- [ ] Handle long labels.
- [ ] Add export as image.
- [ ] Show an explanation when no useful visual can be generated.
- [ ] Test government processes.
- [ ] Test scientific processes.
- [ ] Test historical timelines.

---

## Phase 19 — Text-to-Speech 🟡

- [ ] Add Arabic playback.
- [ ] Add simplified-Arabic playback.
- [ ] Add English playback.
- [ ] Add play.
- [ ] Add pause.
- [ ] Add restart.
- [ ] Add speed control.
- [ ] Highlight the current sentence.
- [ ] Add voice selection later.
- [ ] Test mobile playback.
- [ ] Test long text.

---

## Phase 20 — Vocabulary Library 🟡

- [ ] Save selected words.
- [ ] Store meaning.
- [ ] Store root.
- [ ] Store example.
- [ ] Store English translation.
- [ ] Store source document.
- [ ] Mark word as learned.
- [ ] Create flashcards.
- [ ] Add review mode.
- [ ] Add spaced repetition later.

---

## Phase 21 — Learning Mode 🟡

- [ ] Keep the original visible.
- [ ] Highlight simplified parts.
- [ ] Explain why each change was made.
- [ ] Introduce advanced vocabulary gradually.
- [ ] Ask a comprehension question.
- [ ] Track repeated weak areas.
- [ ] Adjust explanations to user performance later.
- [ ] Gradually reduce simplification later.
- [ ] Display progress later.

---

## Phase 22 — Accounts and Database ⚪

- [ ] Create user table.
- [ ] Add Supabase Authentication.
- [ ] Add email sign-up.
- [ ] Add login.
- [ ] Add logout.
- [ ] Save user reading level.
- [ ] Save documents.
- [ ] Save simplifications.
- [ ] Save translations.
- [ ] Save chat history.
- [ ] Save vocabulary.
- [ ] Save quiz results.
- [ ] Allow account deletion.
- [ ] Allow document deletion.

Accounts can be delayed until the main AI features are working.

---

## Phase 23 — Security and Privacy

- [ ] Keep all secrets in `.env`.
- [ ] Add `.env` to `.gitignore`.
- [ ] Add `.env.example` without real keys.
- [ ] Never expose the AI key in the browser.
- [ ] Validate file types.
- [ ] Limit file size.
- [ ] Rename uploaded files securely.
- [ ] Reject executable uploads.
- [ ] Sanitize file names.
- [ ] Add API rate limits.
- [ ] Restrict CORS origins.
- [ ] Add timeout handling.
- [ ] Use HTTPS in production.
- [ ] Avoid logging sensitive document content.
- [ ] Delete temporary files.
- [ ] Add a privacy notice.
- [ ] Allow users to delete uploaded content.
- [ ] Add clear AI limitations.
- [ ] Explain that legal or medical outputs are informational.

---

## Phase 24 — Testing

### Functional testing

- [ ] Text input works.
- [ ] Simplification works.
- [ ] All levels work.
- [ ] Translation works.
- [ ] Summary works.
- [ ] Word explanation works.
- [ ] Sentence explanation works.
- [ ] Quiz works.
- [ ] Chatbot works.
- [ ] PDF upload works.
- [ ] Page references work.
- [ ] Visual mode works.
- [ ] Text-to-speech works.
- [ ] RTL interface works.
- [ ] Mobile interface works.
- [ ] Desktop interface works.
- [ ] Error messages work.

### AI quality testing

Prepare examples from:

- [ ] Government documents.
- [ ] Academic documents.
- [ ] Scientific lessons.
- [ ] News articles.
- [ ] Legal-style documents.
- [ ] School lessons.
- [ ] Short text.
- [ ] Long documents.

Check every output for:

- [ ] Meaning preservation.
- [ ] Name preservation.
- [ ] Date preservation.
- [ ] Number preservation.
- [ ] Requirement preservation.
- [ ] No invented facts.
- [ ] Correct grammar.
- [ ] Suitable reading level.
- [ ] Correct translation.
- [ ] Accurate chatbot grounding.

### User testing

- [ ] Recruit at least 10–20 testers.
- [ ] Select a difficult Arabic sample.
- [ ] Measure understanding before Waddeh.
- [ ] Let users use Waddeh.
- [ ] Measure understanding after Waddeh.
- [ ] Measure time required.
- [ ] Ask users to rate usability.
- [ ] Ask which feature was most useful.
- [ ] Record genuine feedback.
- [ ] Fix repeated problems.
- [ ] Do not invent test results.

---

## Phase 25 — Deployment

### Frontend

- [ ] Deploy Next.js.
- [ ] Add production environment variables.
- [ ] Test the public link.
- [ ] Test desktop.
- [ ] Test mobile.

### Backend

- [ ] Deploy FastAPI.
- [ ] Add the production AI key.
- [ ] Configure CORS.
- [ ] Connect the production database.
- [ ] Add health checks.
- [ ] Test every endpoint.

### Database and storage

- [ ] Create production tables.
- [ ] Enable pgvector.
- [ ] Configure storage permissions.
- [ ] Add backups.
- [ ] Test file deletion.

### Final checks

- [ ] HTTPS works.
- [ ] API keys are hidden.
- [ ] Uploads work.
- [ ] AI responses work.
- [ ] Loading indicators work.
- [ ] Error handling works.
- [ ] Demo data is prepared.
- [ ] A backup local version is prepared.

---

## Phase 26 — Competition Submission

- [ ] Write the problem statement.
- [ ] Write the solution description.
- [ ] Explain the target audience.
- [ ] Explain how AI is used.
- [ ] Explain how Waddeh supports Arabic.
- [ ] Explain what makes it innovative.
- [ ] Explain its social and educational impact.
- [ ] Add screenshots.
- [ ] Add prototype link.
- [ ] Add demo video if allowed.
- [ ] Review all application fields.
- [ ] Submit before the deadline.
- [ ] Save proof of submission.

---

## Phase 27 — Presentation

Suggested slides:

1. [ ] Title and tagline.
2. [ ] The problem.
3. [ ] Target users.
4. [ ] The Waddeh solution.
5. [ ] How it works.
6. [ ] Core features.
7. [ ] Live demonstration.
8. [ ] AI and technology architecture.
9. [ ] What makes it special.
10. [ ] Testing and real results.
11. [ ] Impact on Arabic.
12. [ ] Future roadmap.
13. [ ] Team.
14. [ ] Closing statement.

---

## Phase 28 — Live Demonstration

Use one difficult Arabic document.

- [ ] Upload or paste the document.
- [ ] Show the difficulty score.
- [ ] Select a reader type.
- [ ] Move the difficulty slider.
- [ ] Generate the simplified version.
- [ ] Compare original and clear Arabic.
- [ ] Explain a difficult word.
- [ ] Translate to English.
- [ ] Ask the chatbot a question.
- [ ] Show the supporting page.
- [ ] Generate a visual.
- [ ] Generate a quiz.
- [ ] Play the simplified text aloud.
- [ ] Keep the demo under five minutes.
- [ ] Practice the demo multiple times.

### Backup material

- [ ] Record a demonstration video.
- [ ] Save screenshots.
- [ ] Save sample outputs.
- [ ] Prepare a local backup.
- [ ] Test on another computer.
- [ ] Test using mobile internet.
- [ ] Prepare answers to expected judge questions.

---

# 17. Recommended Development Order

## Competition MVP

Build these first:

1. 🔴 Arabic text input.
2. 🔴 Three simplification levels.
3. 🔴 Original-versus-clear comparison.
4. 🔴 Difficult-word explanation.
5. 🔴 English translation.
6. 🔴 Summary generation.
7. 🔴 Chat about pasted text.
8. 🔴 Quiz generation.

## Strong Competition Version

Add:

1. 🟡 PDF upload.
2. 🟡 Five-level difficulty slider.
3. 🟡 Difficulty analysis.
4. 🟡 Full RAG chatbot.
5. 🟡 Page references.
6. 🟡 Visual mode.
7. 🟡 Arabic text-to-speech.
8. 🟡 Vocabulary flashcards.
9. 🟡 Polished mobile design.

## Future Expansion

Add:

1. ⚪ Accounts and user history.
2. ⚪ OCR.
3. ⚪ Voice questions.
4. ⚪ Personalized learning progress.
5. ⚪ Teacher dashboard.
6. ⚪ Browser extension.
7. ⚪ Microsoft Word integration.
8. ⚪ Mobile applications.
9. ⚪ Fine-tuned Arabic simplification model.

---

# 18. Suggested Schedule

## 5–9 August 2026 — Foundation

- [ ] Create the repository.
- [ ] Add this context file.
- [ ] Create the project board.
- [ ] Set up Next.js.
- [ ] Set up FastAPI.
- [ ] Connect frontend and backend.
- [ ] Build the first Arabic input interface.
- [ ] Test the AI API.
- [ ] Return the first simplified output.

## 10–15 August 2026 — Core AI

- [ ] Build simplification levels.
- [ ] Add comparison mode.
- [ ] Add difficult-word explanations.
- [ ] Add sentence explanation.
- [ ] Add English translation.
- [ ] Add summary generation.
- [ ] Improve meaning-preservation prompts.

## 16–21 August 2026 — Advanced Prototype

- [ ] Add PDF upload.
- [ ] Add document processing.
- [ ] Build the document chatbot.
- [ ] Add page references.
- [ ] Add quiz generation.
- [ ] Add difficulty analysis.
- [ ] Add text-to-speech.

## 22–25 August 2026 — Memorable Features

- [ ] Add visual mode.
- [ ] Add vocabulary flashcards.
- [ ] Add Learning Mode basics.
- [ ] Improve Arabic design.
- [ ] Improve mobile responsiveness.
- [ ] Add loading and error states.

## 26–28 August 2026 — Testing

- [ ] Test with real users.
- [ ] Record real results.
- [ ] Fix high-priority bugs.
- [ ] Verify meaning preservation.
- [ ] Test multiple document types.
- [ ] Complete deployment.

## 29–30 August 2026 — Competition Preparation

- [ ] Complete the presentation.
- [ ] Record the backup demonstration.
- [ ] Practice the pitch.
- [ ] Review the competition requirements.
- [ ] Complete the submission.
- [ ] Submit before the deadline.

---

# 19. Immediate Next Tasks

Complete these first:

- [ ] Create the GitHub repository.
- [ ] Add this file as `context.md`.
- [ ] Create the Next.js frontend.
- [ ] Create the FastAPI backend.
- [ ] Create the Arabic RTL main page.
- [ ] Add an Arabic text input box.
- [ ] Create `POST /api/simplify`.
- [ ] Connect the backend to the AI model.
- [ ] Return one structured Arabic simplification.
- [ ] Display original and simplified Arabic side by side.
- [ ] Commit the first working version.

Once these steps are complete, Waddeh will have its first functional prototype.

---

# 20. Competition Pitch

> **Waddeh is an AI-powered Arabic reading companion that transforms difficult Arabic content into clear, personalized, and interactive explanations without changing its original meaning. Users can simplify text according to their reading level, compare the original and clear versions, understand difficult vocabulary, translate content into English, ask grounded questions, generate quizzes and diagrams, and listen to the content. Unlike general AI chatbots, Waddeh is designed specifically around Arabic readability, accessibility, and long-term learning.**

---

# 21. Important Project Principle

A prize cannot be guaranteed because judging depends on the competition criteria, competing projects, prototype quality, presentation, and the judges’ decisions.

The strongest version of Waddeh will focus on:

- A reliable working prototype.
- Clear value for Arabic readers.
- Meaning-preserving simplification.
- A polished Arabic-first interface.
- Grounded chatbot answers.
- A memorable live demonstration.
- Genuine user-testing results.
- Fewer complete features rather than many unfinished features.
