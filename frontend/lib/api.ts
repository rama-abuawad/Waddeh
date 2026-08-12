export type ReaderType = "child" | "general_reader" | "non_arabic_speaker";
export type ConfidenceLevel = "low" | "medium" | "high";
export type IntegrityStatus = "no_issue_detected" | "needs_attention" | "unavailable";
export type IntegrityItemStatus = "preserved" | "missing" | "changed" | "no_issue_detected";
export type ReadabilityLevel = "beginner" | "easy" | "standard" | "advanced";

export interface SimplifyPayload {
  text: string;
  reader: ReaderType;
  level: number;
}

export interface ReadabilityRequest {
  text: string;
}

export interface ReadabilityAssessment {
  deterministic: {
    sentence_count: number;
    word_count: number;
    average_sentence_length: number;
    long_sentence_count: number;
    long_sentence_examples: string[];
    difficult_vocabulary_indicators: string[];
    formal_vocabulary_indicators: string[];
    technical_vocabulary_indicators: string[];
    numeric_item_count: number;
    date_reference_count: number;
    reasons: string[];
  };
  heuristic_estimate: {
    status: "available" | "heuristic" | "unavailable";
    estimated_level: ReadabilityLevel | null;
    recommended_level: number | null;
    confidence: ConfidenceLevel;
    reasons: string[];
  };
  ai_estimate: {
    status: "available" | "heuristic" | "unavailable";
    estimated_level: ReadabilityLevel | null;
    recommended_level: number | null;
    confidence: ConfidenceLevel;
    reasons: string[];
  };
}

export interface ChangeItem {
  original: string;
  clear: string;
  reason: string;
  reason_english: string;
}

export interface AdaptationStrategy {
  target_level: number;
  target_level_label: string;
  vocabulary_control: string;
  sentence_control: string;
  explanation_control: string;
  terminology_policy: string;
}

export interface BridgeTransition {
  simpler_phrase: string;
  richer_phrase: string;
  explanation: string;
  explanation_english: string;
}

export interface BridgeLevel {
  level: number;
  label_ar: string;
  label_en: string;
  text: string;
  reintroduced_items: BridgeTransition[];
}

export interface BridgeMode {
  current_level: number;
  guidance: string;
  guidance_english: string;
  levels: BridgeLevel[];
}

export interface MeaningIntegrityReport {
  status: IntegrityStatus;
  confidence: ConfidenceLevel;
  deterministic_checks: Array<{
    kind: string;
    value: string;
    source_count: number;
    adapted_count: number;
    status: IntegrityItemStatus;
    note: string;
  }>;
  preserved_items: string[];
  changed_items: string[];
  missing_items: string[];
  warnings: string[];
  semantic_verification: {
    status: IntegrityStatus;
    confidence: ConfidenceLevel;
    preserved_items: string[];
    changed_items: string[];
    missing_items: string[];
    warnings: string[];
  } | null;
}

export interface WordExplanation {
  word: string;
  diacritized_word: string;
  meaning: string;
  root: string;
  synonym: string;
  english: string;
  example: string;
  confidence: ConfidenceLevel;
}

export interface SimplificationResult {
  original_text: string;
  adaptation_strategy: AdaptationStrategy;
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
  bridge: BridgeMode;
  comprehension_check: {
    question: string;
    answer: string;
    question_english: string;
    answer_english: string;
  };
  reader: ReaderType;
  level: number;
  readability: ReadabilityAssessment;
  meaning_integrity: MeaningIntegrityReport;
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

export function assessReadability(payload: ReadabilityRequest): Promise<ReadabilityAssessment> {
  return requestJson<ReadabilityAssessment>("/api/readability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, 30_000);
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
