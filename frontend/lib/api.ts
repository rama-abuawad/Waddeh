export type ReaderType = "child" | "general_reader" | "non_arabic_speaker";

export interface SimplifyPayload {
  text: string;
  reader: ReaderType;
  level: number;
}

export interface ChangeItem {
  original: string;
  clear: string;
  reason: string;
  reason_english: string;
}

export interface WordExplanation {
  word: string;
  diacritized_word: string;
  meaning: string;
  root: string;
  synonym: string;
  english: string;
}

export interface SimplificationResult {
  original_text: string;
  simplified_text: string;
  diacritized_text: string;
  english_translation: string;
  preserved_details: string[];
  preserved_details_english: string[];
  learning_cards: Array<{
    term: string;
    simple_meaning: string;
    english_meaning: string;
  }>;
  visual_steps: string[];
  visual_steps_english: string[];
  change_map: ChangeItem[];
  comprehension_check: {
    question: string;
    answer: string;
    question_english: string;
    answer_english: string;
  };
  reader: ReaderType;
  level: number;
  source_name: string | null;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs = 90_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { detail?: string | Array<{ msg?: string }> }
        | null;
      const detail = Array.isArray(body?.detail)
        ? body.detail[0]?.msg
        : body?.detail;
      throw new Error(detail || "تعذر إكمال الطلب. حاول مرة أخرى.");
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("استغرق الطلب وقتاً طويلاً. حاول مرة أخرى.");
    }
    if (error instanceof TypeError) {
      throw new Error("تعذر الاتصال بالخادم. تأكد من تشغيل الواجهة الخلفية.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function simplifyText(payload: SimplifyPayload): Promise<SimplificationResult> {
  return requestJson<SimplificationResult>("/api/simplify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function simplifyPdf(
  file: File,
  reader: ReaderType,
  level: number,
): Promise<SimplificationResult> {
  const query = new URLSearchParams({ reader, level: String(level) });
  return requestJson<SimplificationResult>(`/api/upload/pdf?${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  }, 120_000);
}

export function explainWord(payload: {
  word: string;
  context: string;
  reader: ReaderType;
}): Promise<WordExplanation> {
  return requestJson<WordExplanation>("/api/explain-word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, 60_000);
}
