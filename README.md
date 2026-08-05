# وضّح | Waddeh

**لأن الفهم يبدأ بالوضوح — Because understanding starts with clarity.**

Waddeh is an Arabic-first reading companion that makes difficult Arabic clearer without removing its meaning. It supports Arabic learners, children, general readers, and people who do not speak Arabic through a bilingual, mobile-friendly experience.

## Why Waddeh?

Most tools either translate Arabic or shorten it. Waddeh helps the reader understand the Arabic itself, then learn from it.

- Keeps important names, dates, numbers, conditions, and warnings.
- Explains Arabic according to the selected reader.
- Shows a complete English translation when needed.
- Helps the reader progress instead of depending permanently on simplification.

## Competition features

- **Arabic Word Lens:** select a word to see its contextual meaning, helpful تشكيل, root, synonym, and English meaning.
- **PDF understanding:** upload an Arabic PDF up to 10 MB and understand it as one connected document.
- **Optional تشكيل:** reveal diacritics only for difficult or ambiguous words.
- **Saved vocabulary:** keep useful words in a private, device-local vocabulary list.
- **Adaptive learning:** adjust the reading level using completed readings and comprehension checks.
- **Change Map:** see selected original phrases, their clearer versions, and why they changed.
- **Bilingual interface:** switch the complete website between Arabic RTL and English LTR.
- **PWA and mobile support:** use Waddeh as a responsive website or installable app.
- **Read aloud:** listen to the Arabic or English result in the browser.

## What is required?

Only one external credential is required: **your Gemini API key**.

Waddeh also starts a local backend with the project. This is not another paid API or another account. It keeps the Gemini key out of the browser and securely handles the AI requests.

## Quick start on Windows

### 1. First-time setup

Open CMD inside the cloned project folder and run:

```bat
npm.cmd install
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
copy .env.example .env
notepad .env
```

In Notepad, set your Gemini key:

```env
GEMINI_API_KEY=your_private_key_here
AI_MODEL=gemini-3.6-flash
```

Save and close the file. Never commit the real `.env` file.

### 2. Start Waddeh

Open two CMD windows in the project folder and keep both open.

In the first window, start the secure backend:

```bat
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In the second window, start the website:

```bat
npm.cmd run dev:frontend
```

Wait until the frontend displays `Ready`, then open:

**http://localhost:3000**

If an older PWA version appears, press `Ctrl + F5` once.

## Suggested judge demo

1. Switch between Arabic and English to show the complete bilingual interface.
2. Choose a reader and use the prepared Arabic example.
3. Generate the clear result and compare Clear Arabic, English, and Original Arabic.
4. Select an Arabic word to open Word Lens and save it to the vocabulary list.
5. Turn on helpful تشكيل.
6. Open Change Map and the comprehension check.
7. Upload a sample Arabic PDF and show document understanding.
8. Resize the browser or open the site on a phone to demonstrate the responsive PWA.

## Privacy during the demo

- The Gemini key stays in the local `.env` file and is never sent to browser code.
- Gemini interactions are configured as stateless with `store=false`.
- Uploaded PDFs are sent for the active AI request and are not written to local server storage.
- Saved vocabulary and adaptive progress stay in the browser on that device.

Use non-sensitive sample documents during judging.

## Project structure

```text
waddeh/
├── frontend/           Next.js, TypeScript, Tailwind CSS, RTL/LTR, PWA
├── backend/            FastAPI and server-side Gemini integration
├── documentation/      Architecture and development notes
├── sample-documents/   Safe documents for demonstrations
├── context.md          Product scope and roadmap
└── .env.example        Safe configuration template
```

## Main technologies

- Next.js, React, TypeScript, and Tailwind CSS
- FastAPI, Python, Pydantic, and HTTPX
- Gemini Interactions API with structured responses
- Browser speech synthesis, local storage, and PWA service worker

## Validation

```bat
npm.cmd run lint:frontend
npm.cmd exec --workspace frontend -- tsc --noEmit
backend\.venv\Scripts\python.exe -m pytest backend\tests
```

See [context.md](./context.md) for the complete product vision and [documentation/architecture.md](./documentation/architecture.md) for the architecture.

## License

No open-source license has been selected. All rights are reserved.
