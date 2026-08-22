import type {
  MeaningThreadKind,
  PoetryResult,
  ReaderType,
  ReadingMemorySnapshot,
  SimplificationResult,
  WordExplanation,
} from "@/lib/api";

export type UiLanguage = "ar" | "en";
export type InputMode = "standard" | "poetry";
export type ReadingSource = "text" | "pdf";
export type ReadingStatus = "pending" | "processing" | "ready" | "error";
export type ReadingTab = "understand" | "simplify" | "learn";
export type WordMasteryStatus = "new" | "learning" | "mastered";
export type SavedItemKind = "word" | "expression";

export interface SavedWord extends WordExplanation {
  id: string;
  kind: SavedItemKind;
  savedAt: string;
  mastery: WordMasteryStatus;
  supportCount: number;
  lastReviewedAt: string;
  quizAttempts: number;
  correctAnswers: number;
  transferAttempts: number;
  transferCorrectAnswers: number;
  sourceReadingId?: string;
  sourceTitle?: string;
}

export interface LearningProfile {
  readings: number;
  preferredLevel: number;
  highestBridgeLevel: number;
  difficultySignals: Record<MeaningThreadKind, number>;
  understoodChecks: number;
  reviewChecks: number;
  levelEvidence: boolean[];
  lastLevelAdjustmentAt: number;
  hasPlacementResult: boolean;
  levelMode: "automatic" | "manual";
}

export type ReadingResult =
  | { kind: "standard"; data: SimplificationResult }
  | { kind: "poetry"; data: PoetryResult };

export interface ReadingRecord {
  id: string;
  mode: InputMode;
  source: ReadingSource;
  sourceText: string;
  sourceName?: string;
  reader: ReaderType;
  level: number;
  status: ReadingStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  title: string;
  error?: string;
  result?: ReadingResult;
  selectedTab: ReadingTab;
  comprehensionChoice?: number;
  pinned?: boolean;
}

export interface NewReadingInput {
  mode: InputMode;
  source: ReadingSource;
  text: string;
  file?: File;
  reader: ReaderType;
  level: number;
}

export const STORAGE_KEYS = {
  language: "waddeh-language",
  vocabulary: "waddeh-vocabulary",
  profile: "waddeh-learning-profile",
  readings: "waddeh-readings-v4",
} as const;

export const initialDifficultySignals: Record<MeaningThreadKind, number> = {
  pronoun: 0,
  actor: 0,
  connector: 0,
  negation: 0,
  condition: 0,
  reference: 0,
};

export const initialProfile: LearningProfile = {
  readings: 0,
  preferredLevel: 2,
  highestBridgeLevel: 2,
  difficultySignals: initialDifficultySignals,
  understoodChecks: 0,
  reviewChecks: 0,
  levelEvidence: [],
  lastLevelAdjustmentAt: 0,
  hasPlacementResult: false,
  levelMode: "automatic",
};

export const learnerLevels = [
  { value: 1, ar: "مبتدئ", en: "Beginner", hintAr: "جمل قصيرة جداً", hintEn: "Very short sentences" },
  { value: 2, ar: "سهل", en: "Easy", hintAr: "كلمات مألوفة", hintEn: "Familiar words" },
  { value: 3, ar: "متوسط", en: "Intermediate", hintAr: "فصحى واضحة", hintEn: "Clear Modern Standard Arabic" },
  { value: 4, ar: "متقدم", en: "Advanced", hintAr: "تفاصيل وتراكيب أكثر", hintEn: "More detail and structure" },
  { value: 5, ar: "كما ورد", en: "As written", hintAr: "من دون إعادة صياغة", hintEn: "No rewriting" },
] as const;

export const placementQuestions = [
  {
    text: "وصلت مريم إلى البيت قبل الغروب بقليل.",
    questionAr: "متى وصلت مريم؟",
    questionEn: "When did Maryam arrive?",
    choicesAr: ["بعد منتصف الليل", "قبل الغروب", "في الصباح"],
    choicesEn: ["After midnight", "Before sunset", "In the morning"],
    correctIndex: 1,
  },
  {
    text: "رغم أن الطريق كان طويلاً، واصل المسافر رحلته لأنه أراد الوصول قبل المساء.",
    questionAr: "لماذا واصل المسافر رحلته؟",
    questionEn: "Why did the traveller continue?",
    choicesAr: ["لأن الطريق كان قصيراً", "لأنه أراد الوصول قبل المساء", "لأنه عاد إلى منزله"],
    choicesEn: ["Because the road was short", "Because he wanted to arrive before evening", "Because he returned home"],
    correctIndex: 1,
  },
  {
    text: "لن يبدأ تنفيذ القرار إلا بعد أن تصادق عليه اللجنة، ما لم يطرأ ظرف يستدعي تأجيله.",
    questionAr: "ما الشرط الأساسي لبدء تنفيذ القرار؟",
    questionEn: "What is the main condition for implementing the decision?",
    choicesAr: ["أن تصادق عليه اللجنة", "أن يُلغى الاجتماع", "أن يطلب أحد الأعضاء تأجيله"],
    choicesEn: ["The committee must approve it", "The meeting must be cancelled", "A member must request a delay"],
    correctIndex: 0,
  },
] as const;

export function normalizeProfile(value: Partial<LearningProfile> | null | undefined): LearningProfile {
  return {
    ...initialProfile,
    ...value,
    preferredLevel: clampLevel(value?.preferredLevel ?? initialProfile.preferredLevel),
    highestBridgeLevel: clampLevel(value?.highestBridgeLevel ?? initialProfile.highestBridgeLevel),
    difficultySignals: {
      ...initialDifficultySignals,
      ...value?.difficultySignals,
    },
    levelEvidence: Array.isArray(value?.levelEvidence) ? value.levelEvidence.filter((item): item is boolean => typeof item === "boolean") : [],
  };
}

export function normalizeSavedWords(
  value: Array<Partial<SavedWord> & WordExplanation> | null | undefined,
): SavedWord[] {
  if (!Array.isArray(value)) return [];
  return value.map((word) => ({
    ...word,
    id: word.id ?? createLocalId(),
    kind: word.kind ?? "word",
    savedAt: word.savedAt ?? new Date().toISOString(),
    mastery: word.mastery ?? "new",
    supportCount: word.supportCount ?? 1,
    lastReviewedAt: word.lastReviewedAt ?? word.savedAt ?? new Date().toISOString(),
    quizAttempts: word.quizAttempts ?? 0,
    correctAnswers: word.correctAnswers ?? 0,
    transferAttempts: word.transferAttempts ?? 0,
    transferCorrectAnswers: word.transferCorrectAnswers ?? 0,
  }));
}

export function normalizeReadings(value: unknown): ReadingRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ReadingRecord => Boolean(item && typeof item === "object" && "id" in item))
    .map((record) => ({
      ...record,
      status: record.status === "processing" ? "pending" : record.status,
      selectedTab: record.selectedTab ?? "understand",
      lastOpenedAt: record.lastOpenedAt ?? record.updatedAt ?? record.createdAt,
      title: record.title || deriveReadingTitle(record.mode, record.source, record.sourceText, record.sourceName),
    }))
    .slice(0, 16);
}

export function createLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `reading-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function deriveReadingTitle(
  mode: InputMode,
  source: ReadingSource,
  text: string,
  sourceName?: string,
): string {
  if (source === "pdf") return sourceName || "Arabic document";
  const firstLine = text.trim().split(/\r?\n/u)[0] || (mode === "poetry" ? "Arabic poem" : "Arabic reading");
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine;
}

export function clampLevel(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

export function placementLevelFromScore(score: number): number {
  if (score <= 0) return 1;
  if (score === 1) return 2;
  if (score === 2) return 3;
  return 4;
}

export function masteryFromEvidence(
  attempts: number,
  correctAnswers: number,
  supportCount: number,
  transferAttempts = 0,
  transferCorrectAnswers = 0,
): WordMasteryStatus {
  const recallIsStrong = attempts >= 2 && correctAnswers >= 2 && correctAnswers / attempts >= 0.67;
  const transferIsProven = transferAttempts >= 1 && transferCorrectAnswers >= 1;
  if (recallIsStrong && transferIsProven) return "mastered";
  if (attempts > 0 || transferAttempts > 0 || supportCount > 1) return "learning";
  return "new";
}

export function buildReadingMemorySnapshot(
  savedWords: SavedWord[],
  profile: LearningProfile,
): ReadingMemorySnapshot {
  const uniqueTerms = (words: SavedWord[]) => Array.from(new Set(words.map((word) => word.word))).slice(0, 8);
  const difficultyFocus = (Object.entries(profile.difficultySignals) as Array<[MeaningThreadKind, number]>)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([kind]) => kind);

  return {
    mastered_terms: uniqueTerms(savedWords.filter((word) => word.mastery === "mastered")),
    learning_terms: uniqueTerms(savedWords.filter((word) => word.mastery !== "mastered")),
    difficulty_focus: difficultyFocus,
  };
}

export function buildSavedVocabularyQuiz(
  savedWords: SavedWord[],
  quizIndex: number,
): { target: SavedWord; options: SavedWord[]; correctIndex: number } | null {
  if (savedWords.length < 2) return null;
  const targetIndex = quizIndex % savedWords.length;
  const target = savedWords[targetIndex];
  const distractors = savedWords.filter((word) => word.id !== target.id).slice(0, 2);
  const candidates = [target, ...distractors];
  const rotation = quizIndex % candidates.length;
  const options = [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
  return { target, options, correctIndex: options.findIndex((word) => word.id === target.id) };
}

export function readingArabic(record: ReadingRecord): string {
  if (!record.result) return record.sourceText;
  return record.result.data.original_text || (
    record.result.kind === "standard" ? record.result.data.simplified_text : record.sourceText
  );
}

export function readingPreview(record: ReadingRecord, language: UiLanguage): string {
  if (!record.result) return record.sourceName || record.sourceText;
  if (record.result.kind === "poetry") {
    return language === "ar" ? record.result.data.overview : record.result.data.overview_english;
  }
  return language === "ar" ? record.result.data.simplified_text : record.result.data.english_translation;
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}
