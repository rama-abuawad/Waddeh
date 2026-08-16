"use client";

import { FormEvent, useEffect, useState } from "react";

import InteractiveArabic from "@/components/interactive-arabic";
import {
  MeaningThreadKind,
  PoetryResult,
  ReadingMemorySnapshot,
  ReadabilityAssessment,
  ReaderType,
  SimplificationResult,
  WordExplanation,
  assessReadability,
  explainPoetry,
  explainWord,
  simplifyPdf,
  simplifyText,
} from "@/lib/api";
import { UiLanguage, uiCopy } from "@/lib/ui-copy";

type ResultView = "clear" | "english" | "original";
type ResultTool = "bridge" | "threads" | "changes" | "check" | "learning" | "trust" | "visual";
type SourceMode = "text" | "pdf";
type WordMasteryStatus = "new" | "learning" | "mastered";

interface SavedWord extends WordExplanation {
  id: string;
  savedAt: string;
  mastery: WordMasteryStatus;
  supportCount: number;
  lastReviewedAt: string;
  quizAttempts: number;
  correctAnswers: number;
}

interface LearningProfile {
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

const initialDifficultySignals: Record<MeaningThreadKind, number> = {
  pronoun: 0,
  actor: 0,
  connector: 0,
  negation: 0,
  condition: 0,
  reference: 0,
};

const initialProfile: LearningProfile = {
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

const placementQuestions = [
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

const exampleText =
  "يتعين على المتقدم تقديم 3 وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً يوم 30 أغسطس 2026. ويُشترط ألا يقل عمره عن 18 عاماً، ولن تُقبل الطلبات المتأخرة، باستثناء من حصل على موافقة خطية مسبقة.";

const poetryExample =
  "على قدر أهل العزم تأتي العزائمُ\nوتأتي على قدر الكرام المكارمُ";

const audiences: Array<{
  value: ReaderType;
  marker: string;
  level: number;
}> = [
  { value: "child", marker: "أ", level: 1 },
  { value: "non_arabic_speaker", marker: "EN", level: 1 },
  { value: "general_reader", marker: "و", level: 2 },
];

const learnerLevels = [
  { value: 1, marker: "1", ar: "مبتدئ", en: "Beginner", hintAr: "جمل قصيرة جداً", hintEn: "Very short sentences" },
  { value: 2, marker: "2", ar: "سهل", en: "Easy", hintAr: "كلمات مألوفة", hintEn: "Familiar words" },
  { value: 3, marker: "3", ar: "متوسط", en: "Intermediate", hintAr: "فصحى واضحة", hintEn: "Clear Modern Standard Arabic" },
  { value: 4, marker: "4", ar: "متقدم", en: "Advanced", hintAr: "تفاصيل وتراكيب أكثر", hintEn: "More detail and structure" },
  { value: 5, marker: "5", ar: "كما ورد", en: "As written", hintAr: "من دون إعادة صياغة", hintEn: "No rewriting" },
];

const resultViews: ResultView[] = ["clear", "english", "original"];
const featureMarks = ["TXT", "PDF", "Aa", "POEM"];

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("ar");
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [reader, setReader] = useState<ReaderType>("general_reader");
  const [learnerLevel, setLearnerLevel] = useState(2);
  const [readabilityPreview, setReadabilityPreview] = useState<ReadabilityAssessment | null>(null);
  const [profile, setProfile] = useState<LearningProfile>(initialProfile);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [result, setResult] = useState<SimplificationResult | null>(null);
  const [resultView, setResultView] = useState<ResultView>("clear");
  const [activeTool, setActiveTool] = useState<ResultTool | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [comprehensionChoice, setComprehensionChoice] = useState<number | null>(null);
  const [wordQuizChoice, setWordQuizChoice] = useState<number | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placementStep, setPlacementStep] = useState(0);
  const [placementScore, setPlacementScore] = useState(0);
  const [placementChoice, setPlacementChoice] = useState<number | null>(null);
  const [manualLevelOpen, setManualLevelOpen] = useState(false);
  const [openedMeaningThread, setOpenedMeaningThread] = useState<number | null>(null);
  const [showDiacritics, setShowDiacritics] = useState(false);
  const [wordLens, setWordLens] = useState<{
    word: string;
    loading: boolean;
    data?: WordExplanation;
    error?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vocabularyOpen, setVocabularyOpen] = useState(false);
  const [savedWordQuizOpen, setSavedWordQuizOpen] = useState(false);
  const [savedWordQuizIndex, setSavedWordQuizIndex] = useState(0);
  const [savedWordQuizChoice, setSavedWordQuizChoice] = useState<number | null>(null);
  const [poetryText, setPoetryText] = useState("");
  const [poetryResult, setPoetryResult] = useState<PoetryResult | null>(null);
  const [poetryError, setPoetryError] = useState("");
  const [isPoetryLoading, setIsPoetryLoading] = useState(false);
  const t = uiCopy[uiLanguage];

  const isEnglishFirst = reader === "non_arabic_speaker";
  const selectedLevel = learnerLevel;
  const masteredWordCount = savedWords.filter((word) => word.mastery === "mastered").length;
  const learningWordCount = savedWords.length - masteredWordCount;
  const savedVocabularyQuiz = buildSavedVocabularyQuiz(savedWords, savedWordQuizIndex);

  useEffect(() => {
    const restoreProgress = window.setTimeout(() => {
      try {
        const storedWords = window.localStorage.getItem("waddeh-vocabulary");
        const storedProfile = window.localStorage.getItem("waddeh-learning-profile");
        const storedLanguage = window.localStorage.getItem("waddeh-language");
        if (storedWords) {
          const parsedWords = JSON.parse(storedWords) as Array<Partial<SavedWord> & WordExplanation>;
          setSavedWords(parsedWords.map((word) => ({
            ...word,
            id: word.id ?? crypto.randomUUID(),
            savedAt: word.savedAt ?? new Date().toISOString(),
            mastery: word.mastery ?? "new",
            supportCount: word.supportCount ?? 1,
            lastReviewedAt: word.lastReviewedAt ?? word.savedAt ?? new Date().toISOString(),
            quizAttempts: word.quizAttempts ?? 0,
            correctAnswers: word.correctAnswers ?? 0,
          })));
        }
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile) as Partial<LearningProfile>;
          const restoredProfile = {
            ...initialProfile,
            ...parsedProfile,
            difficultySignals: {
              ...initialDifficultySignals,
              ...parsedProfile.difficultySignals,
            },
          };
          setProfile(restoredProfile);
          setLearnerLevel(restoredProfile.preferredLevel);
        }
        if (storedLanguage === "ar" || storedLanguage === "en") setUiLanguage(storedLanguage);
      } catch {
        // Local progress is optional; the main reading experience still works.
      }
    }, 0);

    return () => {
      window.clearTimeout(restoreProgress);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("waddeh-language", uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    if (!vocabularyOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setVocabularyOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [vocabularyOpen]);

  function persistProfile(next: LearningProfile) {
    setProfile(next);
    window.localStorage.setItem("waddeh-learning-profile", JSON.stringify(next));
  }

  function persistWords(next: SavedWord[]) {
    setSavedWords(next);
    window.localStorage.setItem("waddeh-vocabulary", JSON.stringify(next));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setReadabilityPreview(null);
    setActiveTool(null);
    setShowMoreTools(false);
    setComprehensionChoice(null);
    setWordQuizChoice(null);
    setOpenedMeaningThread(null);
    setShowDiacritics(false);
    setWordLens(null);
    setCopied(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    if (sourceMode === "text" && text.trim().length < 20) {
      setError(t.errors.textTooShort);
      return;
    }
    if (sourceMode === "pdf" && !pdfFile) {
      setError(t.errors.pdfRequired);
      return;
    }

    setIsLoading(true);
    try {
      const readingMemory = buildReadingMemorySnapshot(savedWords, profile);
      if (sourceMode === "text") {
        const assessment = await assessReadability({ text: text.trim() });
        setReadabilityPreview(assessment);
      }
      const response = sourceMode === "pdf" && pdfFile
        ? await simplifyPdf(pdfFile, reader, selectedLevel, readingMemory)
        : await simplifyText({
            text: text.trim(),
            reader,
            level: selectedLevel,
            reading_memory: readingMemory,
          });
      setResult(response);
      setReadabilityPreview(response.readability);
      setResultView(uiLanguage === "en" || isEnglishFirst ? "english" : "clear");
      setActiveTool(null);
      persistProfile({
        ...profile,
        readings: profile.readings + 1,
        preferredLevel: selectedLevel,
        highestBridgeLevel: Math.max(profile.highestBridgeLevel, selectedLevel),
      });
    } catch (requestError) {
      setError(
        uiLanguage === "ar" && requestError instanceof Error
          ? requestError.message
          : t.errors.request,
      );
    } finally {
      setIsLoading(false);
    }
  }

  function visibleResult(): string {
    if (!result) return "";
    if (resultView === "english") return result.english_translation;
    if (resultView === "original") return result.original_text;
    return showDiacritics ? result.diacritized_text : result.simplified_text;
  }

  async function inspectWord(word: string) {
    if (!result) return;
    setWordLens({ word, loading: true });
    try {
      const data = await explainWord({
        word,
        context: result.simplified_text,
        reader,
      });
      setWordLens({ word, loading: false, data });
    } catch (requestError) {
      setWordLens({
        word,
        loading: false,
        error: uiLanguage === "ar" && requestError instanceof Error
          ? requestError.message
          : t.errors.word,
      });
    }
  }

  function saveWord(word: WordExplanation) {
    const existing = savedWords.find((item) => item.word === word.word && item.meaning === word.meaning);
    if (existing) {
      persistWords(savedWords.map((item) => item.id === existing.id
        ? {
            ...item,
            supportCount: item.supportCount + 1,
            mastery: masteryFromEvidence(
              item.quizAttempts,
              item.correctAnswers,
              item.supportCount + 1,
            ),
            lastReviewedAt: new Date().toISOString(),
          }
        : item));
      return;
    }
    persistWords([
      {
        ...word,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        mastery: "new",
        supportCount: 1,
        lastReviewedAt: new Date().toISOString(),
        quizAttempts: 0,
        correctAnswers: 0,
      },
      ...savedWords,
    ]);
  }

  function toggleMeaningThread(index: number, kind: MeaningThreadKind) {
    if (openedMeaningThread === index) {
      setOpenedMeaningThread(null);
      return;
    }

    setOpenedMeaningThread(index);
    persistProfile({
      ...profile,
      difficultySignals: {
        ...profile.difficultySignals,
        [kind]: Math.min(profile.difficultySignals[kind] + 1, 99),
      },
    });
  }

  function saveLearningCard(card: SimplificationResult["learning_cards"][number]) {
    saveWord({
      word: card.term,
      diacritized_word: card.term,
      meaning: card.simple_meaning,
      root: "—",
      synonym: "—",
      english: card.english_meaning,
      example: "",
      confidence: "medium",
    });
  }

  function savePoetryWord(word: PoetryResult["vocabulary"][number]) {
    saveWord({
      word: word.word,
      diacritized_word: word.diacritized_word,
      meaning: word.meaning,
      root: "—",
      synonym: "—",
      english: word.english,
      example: word.verse,
      confidence: "medium",
    });
  }

  function isPoetryWordSaved(word: PoetryResult["vocabulary"][number]): boolean {
    return savedWords.some((item) => item.word === word.word && item.meaning === word.meaning);
  }

  async function handlePoetrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPoetryError("");
    setPoetryResult(null);

    if (poetryText.trim().length < 10) {
      setPoetryError(t.poetry.error);
      return;
    }

    setIsPoetryLoading(true);
    try {
      const response = await explainPoetry({
        text: poetryText.trim(),
        reader,
        level: selectedLevel,
      });
      setPoetryResult(response);
      persistProfile({
        ...profile,
        readings: profile.readings + 1,
        preferredLevel: selectedLevel,
      });
    } catch (requestError) {
      setPoetryError(
        uiLanguage === "ar" && requestError instanceof Error
          ? requestError.message
          : t.errors.request,
      );
    } finally {
      setIsPoetryLoading(false);
    }
  }

  function recordComprehensionChoice(choiceIndex: number) {
    if (!result || comprehensionChoice !== null) return;
    const correct = choiceIndex === result.comprehension_check.correct_choice_index;
    const levelEvidence = [...profile.levelEvidence, correct];
    let nextLevel = learnerLevel;
    let lastLevelAdjustmentAt = profile.lastLevelAdjustmentAt;
    const evidenceSinceAdjustment = levelEvidence.slice(lastLevelAdjustmentAt);

    if (profile.levelMode === "automatic" && evidenceSinceAdjustment.length >= 3) {
      const accuracy = evidenceSinceAdjustment.filter(Boolean).length / evidenceSinceAdjustment.length;
      if (accuracy >= 0.8) nextLevel = Math.min(4, learnerLevel + 1);
      if (accuracy <= 0.34) nextLevel = Math.max(1, learnerLevel - 1);
      lastLevelAdjustmentAt = levelEvidence.length;
    }

    setComprehensionChoice(choiceIndex);
    setLearnerLevel(nextLevel);
    persistProfile({
      ...profile,
      preferredLevel: nextLevel,
      understoodChecks: profile.understoodChecks + (correct ? 1 : 0),
      reviewChecks: profile.reviewChecks + (correct ? 0 : 1),
      levelEvidence,
      lastLevelAdjustmentAt,
    });
  }

  function recordWordQuiz(choiceIndex: number) {
    if (!result || wordQuizChoice !== null || result.learning_cards.length < 2) return;
    const quizIndex = profile.readings % result.learning_cards.length;
    const card = result.learning_cards[quizIndex];
    const correct = choiceIndex === quizIndex;
    const existing = savedWords.find((word) => word.word === card.term);
    const attempts = (existing?.quizAttempts ?? 0) + 1;
    const correctAnswers = (existing?.correctAnswers ?? 0) + (correct ? 1 : 0);
    const supportCount = existing?.supportCount ?? 1;
    const mastery = masteryFromEvidence(attempts, correctAnswers, supportCount);

    const quizWord: SavedWord = {
      word: card.term,
      diacritized_word: existing?.diacritized_word ?? card.term,
      meaning: card.simple_meaning,
      root: existing?.root ?? "—",
      synonym: existing?.synonym ?? "—",
      english: card.english_meaning,
      example: existing?.example ?? "",
      confidence: existing?.confidence ?? "medium",
      id: existing?.id ?? crypto.randomUUID(),
      savedAt: existing?.savedAt ?? new Date().toISOString(),
      mastery,
      supportCount,
      lastReviewedAt: new Date().toISOString(),
      quizAttempts: attempts,
      correctAnswers,
    };

    persistWords(existing
      ? savedWords.map((word) => word.id === existing.id ? quizWord : word)
      : [quizWord, ...savedWords]);
    setWordQuizChoice(choiceIndex);
  }

  function recordSavedVocabularyQuiz(choiceIndex: number) {
    if (!savedVocabularyQuiz || savedWordQuizChoice !== null) return;
    const correct = choiceIndex === savedVocabularyQuiz.correctIndex;
    const target = savedVocabularyQuiz.target;
    const attempts = target.quizAttempts + 1;
    const correctAnswers = target.correctAnswers + (correct ? 1 : 0);
    const reviewedWord: SavedWord = {
      ...target,
      mastery: masteryFromEvidence(attempts, correctAnswers, target.supportCount),
      quizAttempts: attempts,
      correctAnswers,
      lastReviewedAt: new Date().toISOString(),
    };

    persistWords(savedWords.map((word) => word.id === target.id ? reviewedWord : word));
    setSavedWordQuizChoice(choiceIndex);
  }

  function continueSavedVocabularyQuiz() {
    setSavedWordQuizIndex((current) => current + 1);
    setSavedWordQuizChoice(null);
  }

  function continuePlacementCheck() {
    if (placementChoice === null) return;
    const question = placementQuestions[placementStep];
    const nextScore = placementScore + (placementChoice === question.correctIndex ? 1 : 0);

    if (placementStep === placementQuestions.length - 1) {
      const nextLevel = placementLevelFromScore(nextScore);
      setLearnerLevel(nextLevel);
      persistProfile({
        ...profile,
        preferredLevel: nextLevel,
        hasPlacementResult: true,
        levelMode: "automatic",
        levelEvidence: [],
        lastLevelAdjustmentAt: 0,
      });
      setPlacementOpen(false);
      setPlacementStep(0);
      setPlacementScore(0);
      setPlacementChoice(null);
      return;
    }

    setPlacementScore(nextScore);
    setPlacementStep((current) => current + 1);
    setPlacementChoice(null);
  }

  function startPlacementCheck() {
    setPlacementStep(0);
    setPlacementScore(0);
    setPlacementChoice(null);
    setManualLevelOpen(false);
    setPlacementOpen(true);
  }

  function chooseLevelManually(level: number) {
    setLearnerLevel(level);
    persistProfile({
      ...profile,
      preferredLevel: level,
      hasPlacementResult: false,
      levelMode: "manual",
      levelEvidence: [],
      lastLevelAdjustmentAt: 0,
    });
    setResult(null);
    setReadabilityPreview(null);
    setPlacementOpen(false);
    setManualLevelOpen(false);
  }

  function toggleTool(tool: ResultTool) {
    setActiveTool((current) => (current === tool ? null : tool));
  }

  function toggleSpeech() {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(visibleResult());
    utterance.lang = resultView === "english" ? "en-US" : "ar-SA";
    utterance.rate = 0.88;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  async function copyResult() {
    await navigator.clipboard.writeText(visibleResult());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetWorkspace() {
    setResult(null);
    setText("");
    setPdfFile(null);
    setError("");
    setReadabilityPreview(null);
    setWordLens(null);
    setActiveTool(null);
    setOpenedMeaningThread(null);
    setShowMoreTools(false);
    setComprehensionChoice(null);
    setWordQuizChoice(null);
  }

  function scrollToSection(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function activateFeature(index: number) {
    if (index === 0) {
      setSourceMode("text");
      scrollToSection("workspace");
      return;
    }
    if (index === 1) {
      setSourceMode("pdf");
      scrollToSection("workspace");
      return;
    }
    if (index === 2) {
      setVocabularyOpen(true);
      return;
    }
    if (index === 3) {
      scrollToSection("poetry");
    }
  }

  function loadDemoExample() {
    setSourceMode("text");
    setText(exampleText);
    setReader("general_reader");
    if (!profile.hasPlacementResult) setLearnerLevel(2);
    setResult(null);
    setReadabilityPreview(null);
    setError("");
    setActiveTool(null);
    setWordLens(null);
    window.setTimeout(() => document.getElementById("arabic-text")?.focus(), 0);
  }

  function loadPoetryExample() {
    setPoetryText(poetryExample);
    setPoetryResult(null);
    setPoetryError("");
    window.setTimeout(() => document.getElementById("poetry-text")?.focus(), 0);
  }

  return (
    <main
      lang={uiLanguage}
      dir={uiLanguage === "ar" ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-paper text-ink"
    >
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#workspace" className="flex items-center gap-3" aria-label={t.homeLabel}>
            <span className="grid size-11 place-items-center rounded-2xl bg-teal text-xl font-bold text-white shadow-lg shadow-teal/20">{uiLanguage === "ar" ? "و" : "W"}</span>
            <span>
              <span className="block text-xl font-black leading-none">{uiLanguage === "ar" ? "وضّح" : "Waddeh"}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">{uiLanguage === "ar" ? "Waddeh" : "وضّح"}</span>
            </span>
          </a>
          <div className="header-actions">
            <button type="button" className="about-header-button" onClick={() => scrollToSection("about")}>
              {uiLanguage === "ar" ? "عن وضّح" : "About"}
            </button>
            <button type="button" className="vocabulary-header-button" onClick={() => setVocabularyOpen(true)}>
              <span className="vocabulary-label">{t.vocabularyButton}</span>
              <span aria-label={t.tools.savedCount(savedWords.length)}>{savedWords.length}</span>
            </button>
            <div className="language-switch" dir="ltr" aria-label={t.languageLabel} role="group">
              <button type="button" aria-pressed={uiLanguage === "ar"} onClick={() => setUiLanguage("ar")} className={uiLanguage === "ar" ? "active" : ""}>العربية</button>
              <button type="button" aria-pressed={uiLanguage === "en"} onClick={() => setUiLanguage("en")} className={uiLanguage === "en" ? "active" : ""}>English</button>
            </div>
          </div>
        </div>
      </header>

      {vocabularyOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={() => setVocabularyOpen(false)}>
          <aside
            className="vocabulary-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vocabulary-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <p>{t.tools.learning}</p>
                <h2 id="vocabulary-title">{t.panels.vocabulary}</h2>
                <span>{t.panels.vocabularyDescription}</span>
              </div>
              <button autoFocus type="button" onClick={() => setVocabularyOpen(false)} aria-label={t.wordLens.close}>×</button>
            </div>
            <div className="reading-memory-summary" aria-label={uiLanguage === "ar" ? "ملخص مفرداتي" : "My vocabulary summary"}>
              <span><strong>{savedWords.length}</strong><small>{uiLanguage === "ar" ? "كلمات" : "Words"}</small></span>
              <span><strong>{learningWordCount}</strong><small>{uiLanguage === "ar" ? "قيد التعلّم" : "Learning"}</small></span>
              <span><strong>{masteredWordCount}</strong><small>{uiLanguage === "ar" ? "أتقنتها" : "Mastered"}</small></span>
            </div>
            {savedWords.length > 0 && (
              <section className={`saved-words-quiz ${savedWordQuizOpen ? "open" : ""}`}>
                <div className="saved-words-quiz-heading">
                  <div>
                    <p>{uiLanguage === "ar" ? "مراجعة اختيارية" : "Optional review"}</p>
                    <h3>{uiLanguage === "ar" ? "هل ما زلت تتذكّر الكلمات؟" : "Do you still remember the words?"}</h3>
                    <span>
                      {savedWords.length < 2
                        ? uiLanguage === "ar" ? "احفظ كلمة أخرى ليبدأ الاختبار." : "Save one more word to start the quiz."
                        : uiLanguage === "ar" ? "أسئلة قصيرة تحدّث درجة إتقانك من إجاباتك." : "Short questions update mastery from your answers."}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={savedWords.length < 2}
                    onClick={() => {
                      setSavedWordQuizOpen((current) => !current);
                      setSavedWordQuizChoice(null);
                    }}
                  >
                    {savedWordQuizOpen
                      ? uiLanguage === "ar" ? "إنهاء" : "Finish"
                      : uiLanguage === "ar" ? "اختبر نفسي" : "Test myself"}
                  </button>
                </div>

                {savedWordQuizOpen && savedVocabularyQuiz && (
                  <div className="saved-words-quiz-body" aria-live="polite">
                    <small>
                      {uiLanguage === "ar"
                        ? `الكلمة ${(savedWordQuizIndex % savedWords.length) + 1} من ${savedWords.length}`
                        : `Word ${(savedWordQuizIndex % savedWords.length) + 1} of ${savedWords.length}`}
                    </small>
                    <h4 dir="rtl">
                      {uiLanguage === "ar"
                        ? `ما معنى «${savedVocabularyQuiz.target.diacritized_word}»؟`
                        : `What does “${savedVocabularyQuiz.target.diacritized_word}” mean?`}
                    </h4>
                    <div className="saved-words-quiz-choices">
                      {savedVocabularyQuiz.options.map((option, index) => {
                        const answered = savedWordQuizChoice !== null;
                        const correct = answered && index === savedVocabularyQuiz.correctIndex;
                        const selected = savedWordQuizChoice === index;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={answered}
                            onClick={() => recordSavedVocabularyQuiz(index)}
                            className={`${selected ? "selected" : ""} ${correct ? "correct" : ""}`}
                          >
                            <span>{String.fromCharCode(65 + index)}</span>
                            <p>{uiLanguage === "ar" ? option.meaning : option.english || option.meaning}</p>
                          </button>
                        );
                      })}
                    </div>
                    {savedWordQuizChoice !== null && (
                      <div className="saved-words-quiz-feedback">
                        <div>
                          <strong>
                            {savedWordQuizChoice === savedVocabularyQuiz.correctIndex
                              ? uiLanguage === "ar" ? "أحسنت، ما زالت في ذاكرتك." : "Correct—you remembered it."
                              : uiLanguage === "ar" ? "لنثبّتها مرة أخرى." : "Let’s reinforce it once more."}
                          </strong>
                          <p>{uiLanguage === "ar" ? savedVocabularyQuiz.target.meaning : savedVocabularyQuiz.target.english || savedVocabularyQuiz.target.meaning}</p>
                        </div>
                        <button type="button" onClick={continueSavedVocabularyQuiz}>
                          {uiLanguage === "ar" ? "الكلمة التالية" : "Next word"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
            {savedWords.length > 0 ? (
              <div className="drawer-word-list">
                {savedWords.map((word) => (
                  <article key={word.id}>
                    <div className="drawer-word-copy">
                      <strong dir="rtl">{word.diacritized_word}</strong>
                      <p>{uiLanguage === "en" ? word.english : word.meaning}</p>
                    </div>
                    <div className="drawer-word-actions">
                      <span className={`mastery-badge mastery-${word.mastery}`}>
                        <strong>{masteryLabel(word.mastery, uiLanguage)}</strong>
                        <small>
                          {word.quizAttempts > 0
                            ? uiLanguage === "ar"
                              ? `${word.correctAnswers} من ${word.quizAttempts} صحيحة`
                              : `${word.correctAnswers}/${word.quizAttempts} correct`
                            : uiLanguage === "ar" ? "بانتظار أول اختبار" : "Awaiting first check"}
                        </small>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          persistWords(savedWords.filter((item) => item.id !== word.id));
                          setSavedWordQuizOpen(false);
                          setSavedWordQuizChoice(null);
                        }}
                        aria-label={t.panels.removeWord(word.word)}
                      >×</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-vocabulary">
                <span>Aa</span>
                <h3>{t.panels.emptyVocabulary}</h3>
                <p>{t.panels.emptyVocabularyHint}</p>
                <button type="button" onClick={() => { setVocabularyOpen(false); scrollToSection("workspace"); }}>{t.hero.cta}</button>
              </div>
            )}
          </aside>
        </div>
      )}

      <div key={uiLanguage} className="page-content relative z-10 mx-auto max-w-[90rem] px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="hero-kicker">{t.hero.eyebrow}</p>
            <h1 className="hero-title text-balance text-4xl font-black leading-[1.3] tracking-tight sm:text-5xl lg:text-[3.45rem]">
              {t.hero.title}<span className="text-teal">{t.hero.accent}</span>
            </h1>
            <p className="hero-description mt-5 text-pretty text-base leading-8 text-ink/60 sm:text-lg">
              {t.hero.description}
            </p>
            {t.hero.secondary && <p className="mt-1 text-sm text-ink/40">{t.hero.secondary}</p>}
            <a href="#workspace" className="hero-cta">
              <span>{t.hero.cta}</span><span aria-hidden="true">{uiLanguage === "ar" ? "←" : "→"}</span>
            </a>
          </div>

          <div className="feature-stage">
            <div className="feature-stage-heading">
              <span>{t.featureShowcase.eyebrow}</span>
              <h2>{t.featureShowcase.title}</h2>
              <p>{t.featureShowcase.hint}</p>
            </div>
            <div className="feature-list">
              {t.featureShowcase.items.map((feature, index) => (
                <button
                  key={feature.label}
                  type="button"
                  onClick={() => activateFeature(index)}
                  className="feature-node"
                  style={{ animationDelay: `${140 + index * 55}ms` }}
                >
                  <span>
                    {index === 0 && uiLanguage === "ar"
                      ? "نص"
                      : index === 3 && uiLanguage === "ar"
                        ? "بيت"
                        : featureMarks[index]}
                  </span>
                  <span><strong>{feature.label}</strong><small>{feature.description}</small></span>
                  <span aria-hidden="true">{uiLanguage === "ar" ? "←" : "→"}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace" className="mx-auto mt-10 max-w-7xl scroll-mt-6">
          <JourneyRail
            uiLanguage={uiLanguage}
            hasSource={sourceMode === "pdf" ? Boolean(pdfFile) : text.trim().length >= 20}
            hasReadability={Boolean(readabilityPreview ?? result?.readability)}
            hasResult={Boolean(result)}
            hasBridge={Boolean(result?.bridge?.levels?.length)}
            isLoading={isLoading}
            activeTool={activeTool}
          />
          <form onSubmit={handleSubmit} className="workspace-card">
            <div className="border-b border-ink/10 px-5 py-6 sm:px-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="step-number">1</span>
                <div>
                  <h2 className="font-black">{t.readerStep.title}</h2>
                  <p className="text-xs text-ink/40">{t.readerStep.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {audiences.map((audience) => {
                  const active = reader === audience.value;
                  const audienceCopy = t.audiences[audience.value];
                  return (
                    <button
                      key={audience.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setReader(audience.value);
                        if (profile.levelMode === "automatic" && !profile.hasPlacementResult) setLearnerLevel(audience.level);
                        setResult(null);
                        setReadabilityPreview(null);
                        setError("");
                      }}
                      className={`audience-card ${active ? "audience-card-active" : ""}`}
                    >
                      <span className={`audience-marker ${active ? "audience-marker-active" : ""}`}>
                        {uiLanguage === "en"
                          ? audience.value === "child" ? "C" : audience.value === "general_reader" ? "G" : "EN"
                          : audience.marker}
                      </span>
                      <span className="min-w-0 text-start">
                        <span className="block truncate text-sm font-black">{audienceCopy.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-ink/50">{audienceCopy.description}</span>
                      </span>
                      <span className={`selection-dot ${active ? "selection-dot-active" : ""}`} />
                    </button>
                  );
                })}
              </div>

              <div className="learner-level-block">
                <div className="learner-level-heading">
                  <span className="step-number">2</span>
                  <div>
                    <h2>{uiLanguage === "ar" ? "اختر كيف نحدّد نقطة البداية" : "Choose how to set your starting point"}</h2>
                    <p>
                      {uiLanguage === "ar"
                        ? "اختر مستواك بنفسك، أو دع «وضّح» يحدّده باختبار قصير."
                        : "Choose your own level, or let Waddeh find it with a short check."}
                    </p>
                  </div>
                </div>
                <div className="adaptive-level-card">
                  <span>{learnerLevel}</span>
                  <div>
                    <small>{uiLanguage === "ar" ? "مستواك الحالي" : "Current level"}</small>
                    <strong>{levelLabel(learnerLevel, uiLanguage)}</strong>
                    <p>
                      {profile.levelMode === "manual"
                        ? uiLanguage === "ar"
                          ? "اخترته بنفسك؛ سنسجّل نتائج اختباراتك من دون تغييره تلقائياً."
                          : "You chose it; quizzes are recorded without changing it automatically."
                        : profile.hasPlacementResult
                          ? uiLanguage === "ar"
                            ? "حُدّد من إجاباتك، وسيتغيّر تدريجياً مع اختبارات الفهم."
                            : "Based on your answers and adjusted gradually through comprehension checks."
                          : uiLanguage === "ar"
                            ? "هذا تقدير مبدئي إلى أن تجري الاختبار القصير."
                            : "This is an initial estimate until you take the short check."}
                    </p>
                  </div>
                  <div className="adaptive-level-actions">
                    <button
                      type="button"
                      className={profile.levelMode === "automatic" ? "active" : ""}
                      onClick={startPlacementCheck}
                    >
                      <strong>{uiLanguage === "ar" ? "دع وضّح يحدّد مستواي" : "Let Waddeh find my level"}</strong>
                      <small>{uiLanguage === "ar" ? "اختبار من 3 أسئلة" : "A 3-question check"}</small>
                    </button>
                    <button
                      type="button"
                      className={profile.levelMode === "manual" ? "active" : ""}
                      onClick={() => {
                        setPlacementOpen(false);
                        setManualLevelOpen((current) => !current);
                      }}
                    >
                      <strong>{uiLanguage === "ar" ? "أختار مستواي بنفسي" : "Choose my level"}</strong>
                      <small>{uiLanguage === "ar" ? "يبقى ثابتاً حتى تغيّره" : "Stays fixed until you change it"}</small>
                    </button>
                  </div>
                </div>

                {manualLevelOpen && (
                  <div className="manual-level-picker" aria-live="polite">
                    <p>{uiLanguage === "ar" ? "اختر الصياغة الأقرب لك الآن" : "Choose the wording that suits you now"}</p>
                    <div className="learner-level-grid" role="radiogroup" aria-label={uiLanguage === "ar" ? "اختيار المستوى" : "Choose level"}>
                      {learnerLevels.map((level) => {
                        const active = profile.levelMode === "manual" && learnerLevel === level.value;
                        return (
                          <button
                            key={level.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => chooseLevelManually(level.value)}
                            className={`level-chip ${active ? "level-chip-active" : ""}`}
                          >
                            <span>{level.marker}</span>
                            <strong>{uiLanguage === "ar" ? level.ar : level.en}</strong>
                            <small>{uiLanguage === "ar" ? level.hintAr : level.hintEn}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {placementOpen && (
                  <div className="placement-check" aria-live="polite">
                    <div className="placement-progress">
                      <span>{uiLanguage === "ar" ? `السؤال ${placementStep + 1} من ${placementQuestions.length}` : `Question ${placementStep + 1} of ${placementQuestions.length}`}</span>
                      <i style={{ width: `${((placementStep + 1) / placementQuestions.length) * 100}%` }} />
                    </div>
                    <blockquote dir="rtl">{placementQuestions[placementStep].text}</blockquote>
                    <h3>{uiLanguage === "ar" ? placementQuestions[placementStep].questionAr : placementQuestions[placementStep].questionEn}</h3>
                    <div className="placement-choices">
                      {(uiLanguage === "ar" ? placementQuestions[placementStep].choicesAr : placementQuestions[placementStep].choicesEn).map((choice, index) => {
                        const selected = placementChoice === index;
                        const correct = placementChoice !== null && index === placementQuestions[placementStep].correctIndex;
                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={placementChoice !== null}
                            onClick={() => setPlacementChoice(index)}
                            className={`${selected ? "selected" : ""} ${correct ? "correct" : ""}`}
                          >
                            <span>{String.fromCharCode(65 + index)}</span>{choice}
                          </button>
                        );
                      })}
                    </div>
                    {placementChoice !== null && (
                      <div className="placement-feedback">
                        <p>
                          {placementChoice === placementQuestions[placementStep].correctIndex
                            ? uiLanguage === "ar" ? "إجابة صحيحة." : "Correct."
                            : uiLanguage === "ar" ? "لا بأس، سنستخدم هذه الإجابة لاختيار البداية الأنسب." : "That’s okay—this helps choose a better starting point."}
                        </p>
                        <button type="button" onClick={continuePlacementCheck}>
                          {placementStep === placementQuestions.length - 1
                            ? uiLanguage === "ar" ? "اعرض مستواي" : "Show my level"
                            : uiLanguage === "ar" ? "السؤال التالي" : "Next question"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="step-number">3</span>
                  <div>
                    <h2 className="font-black">{t.sourceStep.title}</h2>
                    <p className="text-xs text-ink/40">{t.sourceStep.subtitle}</p>
                  </div>
                </div>
                <div className="source-tabs">
                  <button type="button" onClick={() => setSourceMode("text")} className={sourceMode === "text" ? "active" : ""}>{t.source.textTab}</button>
                  <button type="button" onClick={() => setSourceMode("pdf")} className={sourceMode === "pdf" ? "active" : ""}>{t.source.pdfTab}</button>
                </div>
              </div>

              {sourceMode === "text" ? (
                <div>
                  <div className="mb-2 flex justify-between gap-3">
                    <label htmlFor="arabic-text" className="text-sm font-bold">
                      {t.source.inputLabel}
                    </label>
                    <span className="text-xs tabular-nums text-ink/40">{text.length} / 15000</span>
                  </div>
                  <textarea
                    id="arabic-text"
                    dir="rtl"
                    rows={8}
                    maxLength={15000}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="text-input"
                    placeholder={t.source.placeholder}
                  />
                </div>
              ) : (
                <label htmlFor="pdf-file" className={`pdf-dropzone ${pdfFile ? "pdf-dropzone-ready" : ""}`}>
                  <input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 10 * 1024 * 1024) {
                        setError(t.errors.pdfTooLarge);
                        setPdfFile(null);
                        return;
                      }
                      setError("");
                      setPdfFile(file);
                    }}
                  />
                  <span className="pdf-mark">PDF</span>
                  <span>
                    <strong>{pdfFile ? pdfFile.name : t.source.choosePdf}</strong>
                    <small>
                      {pdfFile
                        ? t.source.pdfReady((pdfFile.size / 1024 / 1024).toFixed(2))
                        : t.source.pdfPrivacy}
                    </small>
                  </span>
                </label>
              )}

              {error && <p role="alert" className="error-message">{error}</p>}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={isLoading} className="primary-button">
                  <span>{isLoading ? t.actions.loading : sourceMode === "pdf" ? t.actions.understandPdf : t.actions.clarifyText}</span>
                  {!isLoading && <span aria-hidden="true" className="text-xl">{uiLanguage === "ar" ? "←" : "→"}</span>}
                  {isLoading && <span aria-hidden="true" className="loader" />}
                </button>
                {sourceMode === "text" && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={loadDemoExample}
                    className="secondary-button demo-example-button"
                  >
                    <span aria-hidden="true" className="demo-example-mark">✦</span>
                    <span><strong>{t.actions.sample}</strong></span>
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="journey-loading" role="status" aria-live="polite">
                  <span className="journey-loading-pulse" aria-hidden="true" />
                  <span>
                    <strong>{t.actions.loadingTitle}</strong>
                    <small>{t.actions.loadingDetail}</small>
                  </span>
                  <span className="journey-loading-steps" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                </div>
              )}
            </div>
          </form>

          {(readabilityPreview || result?.readability) && (
            <ReadabilityPanel
              assessment={(result?.readability ?? readabilityPreview)!}
              targetLevel={selectedLevel}
              uiLanguage={uiLanguage}
            />
          )}

          {result && (
            <section id="result" className="result-shell scroll-mt-6" aria-live="polite">
              <div className="result-header">
                <div>
                  <p className="text-xs font-black text-teal">{t.result.ready}</p>
                  <h2 className="mt-1 text-xl font-black">
                    {result.source_name ?? t.result.title}
                  </h2>
                </div>
                <div className="result-tabs" role="tablist" aria-label={t.result.tabsLabel}>
                  {resultViews
                    .filter((view) => view !== "original" || Boolean(result.original_text))
                    .map((view) => (
                      <button
                        key={view}
                        type="button"
                        role="tab"
                        aria-selected={resultView === view}
                        onClick={() => {
                          setResultView(view);
                          setCopied(false);
                          setShowDiacritics(false);
                          setWordLens(null);
                          window.speechSynthesis?.cancel();
                          setIsSpeaking(false);
                        }}
                        className={`result-tab ${resultView === view ? "result-tab-active" : ""}`}
                      >
                        {t.result.views[view]}
                      </button>
                    ))}
                </div>
              </div>

              <article role="tabpanel" dir={resultView === "english" ? "ltr" : "rtl"} className="result-reading">
                {resultView === "clear" && (
                  <div dir={uiLanguage === "ar" ? "rtl" : "ltr"} className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold text-ink/40">{t.result.wordHint}</p>
                    <label className="diacritics-toggle">
                      <input type="checkbox" checked={showDiacritics} onChange={(event) => setShowDiacritics(event.target.checked)} />
                      <span>{t.result.diacritics}</span>
                    </label>
                  </div>
                )}

                {resultView === "clear" ? (
                  <InteractiveArabic text={visibleResult()} onWord={inspectWord} wordHint={t.result.wordButtonHint} />
                ) : (
                  <p className="whitespace-pre-wrap text-lg leading-10 text-ink/80">{visibleResult()}</p>
                )}

                {wordLens && (
                  <div dir={uiLanguage === "ar" ? "rtl" : "ltr"} className="word-lens-card">
                    {wordLens.loading && <p>{t.wordLens.loading(wordLens.word)}</p>}
                    {wordLens.error && <p className="text-red-700">{wordLens.error}</p>}
                    {wordLens.data && (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-2xl font-black text-teal">{wordLens.data.diacritized_word}</p>
                            <p className="mt-2 leading-8 text-ink/75">
                              {uiLanguage === "en" ? wordLens.data.english : wordLens.data.meaning}
                            </p>
                          </div>
                          <button type="button" onClick={() => setWordLens(null)} aria-label={t.wordLens.close}>×</button>
                        </div>
                        <div className="word-facts">
                          <span><small>{t.wordLens.root}</small><strong dir="rtl">{wordLens.data.root}</strong></span>
                          <span><small>{t.wordLens.synonym}</small><strong dir="rtl">{wordLens.data.synonym}</strong></span>
                          <span dir={uiLanguage === "en" ? "rtl" : "ltr"}>
                            <small>{t.wordLens.otherMeaning}</small>
                            <strong>{uiLanguage === "en" ? wordLens.data.meaning : wordLens.data.english}</strong>
                          </span>
                        </div>
                        <button type="button" onClick={() => saveWord(wordLens.data!)} className="save-word-button">
                          {savedWords.some((item) => item.word === wordLens.data?.word) ? t.wordLens.saved : t.wordLens.save}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </article>

              <div id="result-tools" className="result-tools-section scroll-mt-6">
                <p className="mb-3 text-xs font-black text-ink/40">{t.tools.intro}</p>
                <div className="primary-tool-grid">
                  <button type="button" onClick={() => toggleTool("check")} className={`result-tool result-tool-primary ${activeTool === "check" ? "result-tool-active" : ""}`}>
                    <span className="tool-mark">{uiLanguage === "ar" ? "؟" : "?"}</span>
                    <span><strong>{t.tools.check}</strong><small>{uiLanguage === "ar" ? "سؤال قصير يؤكد فهمك" : "A short question to check understanding"}</small></span>
                  </button>
                  {result.meaning_threads.length > 0 && (
                    <button type="button" onClick={() => toggleTool("threads")} className={`result-tool result-tool-primary result-tool-thread ${activeTool === "threads" ? "result-tool-active" : ""}`}>
                      <span className="tool-mark">⌁</span>
                      <span>
                        <strong>{uiLanguage === "ar" ? "خيوط المعنى" : "Meaning Threads"}</strong>
                        <small>{uiLanguage === "ar" ? "تتبّع الضمائر والعلاقات داخل الجملة" : "Follow pronouns and relationships inside the sentence"}</small>
                      </span>
                    </button>
                  )}
                  <button type="button" onClick={() => toggleTool("bridge")} className={`result-tool result-tool-primary ${activeTool === "bridge" ? "result-tool-active" : ""}`}>
                    <span className="tool-mark">↗</span>
                    <span>
                      <strong>{uiLanguage === "ar" ? "مسار التدرّج" : "Progressive path"}</strong>
                      <small>{uiLanguage === "ar" ? "اقترب من صياغة المصدر خطوةً خطوة" : "Move toward the source wording step by step"}</small>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="more-tools-toggle"
                  aria-expanded={showMoreTools}
                  onClick={() => {
                    const next = !showMoreTools;
                    setShowMoreTools(next);
                    if (!next && ["learning", "changes", "visual", "trust"].includes(activeTool ?? "")) setActiveTool(null);
                  }}
                >
                  <span>{uiLanguage === "ar" ? "خيارات أخرى عند الحاجة" : "More options when needed"}</span>
                  <b aria-hidden="true">{showMoreTools ? "−" : "+"}</b>
                </button>

                {showMoreTools && (
                  <div className="secondary-tool-grid">
                    <button type="button" onClick={toggleSpeech} className="result-tool">
                      <span className="tool-mark">{isSpeaking ? "Ⅱ" : "▶"}</span>
                      <span><strong>{isSpeaking ? t.tools.stopSpeech : t.tools.speech}</strong><small>{t.tools.speechDescription}</small></span>
                    </button>
                    <button type="button" onClick={() => toggleTool("learning")} className={`result-tool ${activeTool === "learning" ? "result-tool-active" : ""}`}>
                      <span className="tool-mark">{uiLanguage === "ar" ? "أ" : "Aa"}</span>
                      <span><strong>{t.tools.learning}</strong><small>{t.tools.savedCount(savedWords.length)}</small></span>
                    </button>
                    <button type="button" onClick={() => toggleTool("changes")} className={`result-tool ${activeTool === "changes" ? "result-tool-active" : ""}`}>
                      <span className="tool-mark">⇄</span>
                      <span><strong>{t.tools.changes}</strong><small>{t.tools.changesDescription}</small></span>
                    </button>
                    {result.visual_steps.length > 0 && (
                      <button type="button" onClick={() => toggleTool("visual")} className={`result-tool ${activeTool === "visual" ? "result-tool-active" : ""}`}>
                        <span className="tool-mark">↳</span>
                        <span><strong>{t.tools.visual}</strong><small>{t.tools.visualDescription}</small></span>
                      </button>
                    )}
                    <button type="button" onClick={() => toggleTool("trust")} className={`result-tool ${activeTool === "trust" ? "result-tool-active" : ""}`}>
                      <span className="tool-mark tool-mark-trust">✓</span>
                      <span><strong>{t.tools.trust}</strong><small>{t.tools.trustDescription}</small></span>
                    </button>
                  </div>
                )}

                {activeTool && (
                  <div className="tool-panel">
                    {activeTool === "bridge" && (
                      <div>
                        <PanelHeading
                          title={uiLanguage === "ar" ? "مسار التدرّج في القراءة" : "Progressive Reading Path"}
                          description={uiLanguage === "ar" ? result.bridge.guidance : result.bridge.guidance_english}
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
                        <BridgeModePanel result={result} uiLanguage={uiLanguage} />
                      </div>
                    )}

                    {activeTool === "threads" && (
                      <div>
                        <PanelHeading
                          title={uiLanguage === "ar" ? "خيوط المعنى" : "Meaning Threads"}
                          description={
                            uiLanguage === "ar"
                              ? "افتح العلاقة لترى إلى من يعود الضمير، ومن قام بالفعل، وكيف ترتبط أجزاء الجملة."
                              : "Open a relation to see what a pronoun refers to, who performed an action, and how the sentence parts connect."
                          }
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
                        <MeaningThreadsPanel
                          result={result}
                          uiLanguage={uiLanguage}
                          openedIndex={openedMeaningThread}
                          onToggle={toggleMeaningThread}
                        />
                      </div>
                    )}

                    {activeTool === "learning" && (
                      <div>
                        <PanelHeading
                          title={t.panels.learningTitle}
                          description={t.panels.learningSummary(profile.readings, savedWords.length)}
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
                        {result.learning_cards.length >= 2 && (
                          <WordMasteryCheck
                            result={result}
                            readingCount={profile.readings}
                            uiLanguage={uiLanguage}
                            selectedChoice={wordQuizChoice}
                            onSelect={recordWordQuiz}
                          />
                        )}
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {result.learning_cards.map((card) => (
                            <article key={card.term} className="learning-card">
                              <p dir="rtl" className="text-lg font-black text-teal">{card.term}</p>
                              <p dir={uiLanguage === "en" ? "ltr" : "rtl"} className="mt-2 text-sm leading-7 text-ink/70">
                                {uiLanguage === "en" ? card.english_meaning : card.simple_meaning}
                              </p>
                              <p
                                dir={uiLanguage === "en" ? "rtl" : "ltr"}
                                className="mt-3 border-t border-ink/10 pt-3 text-xs font-bold text-ink/40"
                              >
                                {uiLanguage === "en" ? card.simple_meaning : card.english_meaning}
                              </p>
                              <button type="button" onClick={() => saveLearningCard(card)} className="mt-3 text-xs font-black text-teal">{t.panels.saveWord}</button>
                            </article>
                          ))}
                        </div>
                        {savedWords.length > 0 && (
                          <div className="saved-vocabulary">
                            <h4>{t.panels.vocabulary}</h4>
                            <div>
                              {savedWords.map((word) => (
                                <span key={word.id}>
                                  <strong dir="rtl">{word.diacritized_word}</strong>
                                  <small>{uiLanguage === "en" ? word.english : word.meaning}</small>
                                  <button type="button" onClick={() => persistWords(savedWords.filter((item) => item.id !== word.id))} aria-label={t.panels.removeWord(word.word)}>×</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTool === "changes" && (
                      <div>
                        <PanelHeading title={t.panels.changeTitle} description={t.panels.changeDescription} closeLabel={t.wordLens.close} onClose={() => setActiveTool(null)} />
                        {result.change_map.length > 0 ? (
                          <div className="change-map-list">
                            {result.change_map.map((change, index) => (
                              <article key={`${index}-${change.original}`}>
                                <div dir="rtl"><small>{t.panels.before}</small><p>{change.original}</p></div>
                                <span>{uiLanguage === "ar" ? "←" : "→"}</span>
                                <div dir="rtl"><small>{t.panels.after}</small><p>{change.clear}</p></div>
                                <p className="change-reason">{uiLanguage === "en" ? change.reason_english : change.reason}</p>
                              </article>
                            ))}
                          </div>
                        ) : <p className="mt-5 text-sm text-ink/60">{t.panels.noChanges}</p>}
                      </div>
                    )}

                    {activeTool === "check" && (
                      <div>
                        <PanelHeading
                          title={t.panels.checkTitle}
                          description={uiLanguage === "en" ? result.comprehension_check.question_english : result.comprehension_check.question}
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
                        <div className="comprehension-choices">
                          {(uiLanguage === "en" ? result.comprehension_check.choices_english : result.comprehension_check.choices).map((choice, index) => {
                            const answered = comprehensionChoice !== null;
                            const correct = answered && index === result.comprehension_check.correct_choice_index;
                            const selected = comprehensionChoice === index;
                            return (
                              <button
                                key={`${index}-${choice}`}
                                type="button"
                                disabled={answered}
                                onClick={() => recordComprehensionChoice(index)}
                                className={`${selected ? "selected" : ""} ${correct ? "correct" : ""}`}
                              >
                                <span>{String.fromCharCode(65 + index)}</span>
                                <p>{choice}</p>
                              </button>
                            );
                          })}
                        </div>
                        {comprehensionChoice !== null && (
                          <div className={`comprehension-feedback ${comprehensionChoice === result.comprehension_check.correct_choice_index ? "correct" : "review"}`}>
                            <strong>
                              {comprehensionChoice === result.comprehension_check.correct_choice_index
                                ? uiLanguage === "ar" ? "إجابة صحيحة" : "Correct"
                                : uiLanguage === "ar" ? "لنراجع الإجابة" : "Let’s review"}
                            </strong>
                            <p>{uiLanguage === "en" ? result.comprehension_check.answer_english : result.comprehension_check.answer}</p>
                            <small>
                              {profile.levelMode === "automatic"
                                ? uiLanguage === "ar"
                                  ? `ستساعد هذه النتيجة في ضبط مستواك تدريجياً. مستواك الحالي: ${levelLabel(learnerLevel, uiLanguage)}.`
                                  : `This result helps adjust your level gradually. Current level: ${levelLabel(learnerLevel, uiLanguage)}.`
                                : uiLanguage === "ar"
                                  ? `سجّلنا النتيجة، وسيبقى المستوى كما اخترته: ${levelLabel(learnerLevel, uiLanguage)}.`
                                  : `We recorded the result, and your chosen level stays fixed: ${levelLabel(learnerLevel, uiLanguage)}.`}
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTool === "visual" && (
                      <div>
                        <PanelHeading title={t.panels.visualTitle} description={t.panels.visualDescription} closeLabel={t.wordLens.close} onClose={() => setActiveTool(null)} />
                        <ol className="flow-list">
                          {(uiLanguage === "en" ? result.visual_steps_english : result.visual_steps).map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></li>)}
                        </ol>
                      </div>
                    )}

                    {activeTool === "trust" && (
                      <div>
                        <PanelHeading
                          title={uiLanguage === "ar" ? "سلامة المعنى" : "Meaning Integrity"}
                          description={
                            uiLanguage === "ar"
                              ? "نتأكد من بقاء الأرقام والتواريخ والشروط المهمة، وننبهك إذا احتاج شيء إلى المراجعة."
                              : "We check that numbers, dates, and important conditions remain, and flag anything that needs review."
                          }
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
                        <IntegrityPanel result={result} uiLanguage={uiLanguage} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="result-footer">
                <p className="hidden text-xs text-ink/40 sm:block">{t.footer.reminder}</p>
                <div className="ms-auto flex gap-2">
                  <button type="button" onClick={copyResult} className="compact-button">{copied ? t.footer.copied : t.footer.copy}</button>
                  <button type="button" onClick={resetWorkspace} className="compact-button">{t.footer.newContent}</button>
                </div>
              </div>
            </section>
          )}
        </section>

        <section id="poetry" className="poetry-section scroll-mt-24">
          <div className="poetry-intro">
            <p>{t.poetry.kicker}</p>
            <h2>{t.poetry.title}</h2>
            <span>{t.poetry.description}</span>
            <div className="poetry-promise" aria-hidden="true">
              <i>01</i><b>{t.poetry.overview}</b>
              <i>02</i><b>{t.poetry.linesTitle}</b>
              <i>03</i><b>{t.poetry.vocabularyTitle}</b>
            </div>
          </div>

          <form onSubmit={handlePoetrySubmit} className="poetry-form">
            <div className="poetry-input-heading">
              <label htmlFor="poetry-text">{t.poetry.inputLabel}</label>
              <span>{poetryText.length} / 6000</span>
            </div>
            <textarea
              id="poetry-text"
              dir="rtl"
              rows={7}
              maxLength={6000}
              value={poetryText}
              onChange={(event) => setPoetryText(event.target.value)}
              placeholder={t.poetry.placeholder}
              aria-describedby="poetry-hint"
            />
            <small id="poetry-hint">{t.poetry.hint}</small>
            {poetryError && <p role="alert" className="poetry-error">{poetryError}</p>}
            <div className="poetry-actions">
              <button type="submit" disabled={isPoetryLoading} className="primary-button">
                <span>{isPoetryLoading ? t.poetry.loading : t.poetry.submit}</span>
                {isPoetryLoading
                  ? <span aria-hidden="true" className="loader" />
                  : <span aria-hidden="true">{uiLanguage === "ar" ? "←" : "→"}</span>}
              </button>
              <button type="button" disabled={isPoetryLoading} onClick={loadPoetryExample} className="secondary-button">
                <span aria-hidden="true">✦</span>
                <strong>{t.poetry.sample}</strong>
              </button>
            </div>
          </form>

          {poetryResult && (
            <div className="poetry-result" aria-live="polite">
              <div className="poetry-result-heading">
                <span aria-hidden="true">◇</span>
                <div>
                  <p>{t.poetry.resultReady}</p>
                  <h3>{t.poetry.overview}</h3>
                </div>
              </div>

              <div className="poetry-overview-grid">
                <article dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
                  <small>{t.poetry.overview}</small>
                  <p>{uiLanguage === "ar" ? poetryResult.overview : poetryResult.overview_english}</p>
                </article>
                <article dir="ltr">
                  <small>{t.poetry.fullTranslation}</small>
                  <p className="whitespace-pre-line">{poetryResult.english_translation}</p>
                </article>
              </div>

              <div className="poetry-subheading">
                <div>
                  <h3>{t.poetry.linesTitle}</h3>
                  <p>{t.poetry.linesDescription}</p>
                </div>
                <span>{poetryResult.lines.length}</span>
              </div>
              <div className="poetry-lines">
                {poetryResult.lines.map((line, index) => (
                  <article key={`${index}-${line.verse}`} className="poetry-line-card">
                    <span className="poetry-line-number">{String(index + 1).padStart(2, "0")}</span>
                    <blockquote dir="rtl">{line.verse}</blockquote>
                    <div dir="rtl">
                      <small>{t.poetry.clearMeaning}</small>
                      <p>{line.clear_meaning}</p>
                    </div>
                    <div dir="ltr" className="poetry-translation">
                      <small>{t.poetry.translation}</small>
                      <p>{line.english_translation}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="poetry-subheading poetry-vocabulary-heading">
                <div>
                  <h3>{t.poetry.vocabularyTitle}</h3>
                  <p>{t.poetry.vocabularyDescription}</p>
                </div>
                <span>Aa</span>
              </div>
              <div className="poetry-vocabulary-grid">
                {poetryResult.vocabulary.map((word, index) => {
                  const saved = isPoetryWordSaved(word);
                  return (
                    <article key={`${index}-${word.word}`} className="poetry-vocabulary-card">
                      <strong dir="rtl">{word.diacritized_word}</strong>
                      <p dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
                        {uiLanguage === "ar" ? word.meaning : word.english}
                      </p>
                      <small dir={uiLanguage === "ar" ? "ltr" : "rtl"}>
                        {uiLanguage === "ar" ? word.english : word.meaning}
                      </small>
                      <blockquote dir="rtl"><b>{t.poetry.verseLabel}:</b> {word.verse}</blockquote>
                      <button type="button" disabled={saved} onClick={() => savePoetryWord(word)}>
                        {saved ? t.poetry.savedWord : t.poetry.saveWord}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section id="about" className="mx-auto mt-20 max-w-7xl scroll-mt-24 text-center">
          <p className="text-sm font-black text-teal">{t.principles.kicker}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-black leading-[1.5] sm:text-4xl">{t.principles.title}</h2>
          <div className="mt-8 grid gap-4 text-start md:grid-cols-3">
            {t.principles.cards.map((card, index) => (
              <article key={card.title} className="innovation-card">
                <span>0{index + 1}</span><h3>{card.title}</h3><p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelHeading({
  title,
  description,
  closeLabel,
  onClose,
}: {
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="panel-heading">
      <div><h3>{title}</h3><p>{description}</p></div>
      <button type="button" onClick={onClose} aria-label={closeLabel}>×</button>
    </div>
  );
}

function JourneyRail({
  uiLanguage,
  hasSource,
  hasReadability,
  hasResult,
  hasBridge,
  isLoading,
  activeTool,
}: {
  uiLanguage: UiLanguage;
  hasSource: boolean;
  hasReadability: boolean;
  hasResult: boolean;
  hasBridge: boolean;
  isLoading: boolean;
  activeTool: ResultTool | null;
}) {
  const steps = uiLanguage === "ar"
    ? ["أضف النص", "اعرف صعوبته", "اعرف مستواك", "افهم بوضوح", "تعلّم المفردات", "راجع المعنى", "تدرّج في الفهم"]
    : ["Add the text", "Check difficulty", "Find your level", "Understand clearly", "Learn vocabulary", "Review meaning", "Progress gradually"];

  let activeIndex = 0;
  if (hasResult) {
    if (activeTool === "bridge" && hasBridge) activeIndex = 6;
    else if (activeTool === "trust") activeIndex = 5;
    else if (["learning", "threads", "changes", "check", "visual"].includes(activeTool ?? "")) activeIndex = 4;
    else activeIndex = 3;
  } else if (isLoading || hasReadability) {
    activeIndex = hasReadability ? 3 : 1;
  } else if (hasSource) {
    activeIndex = 1;
  }

  return (
    <nav className="journey-rail" aria-label={uiLanguage === "ar" ? "رحلة وضّح" : "Waddeh journey"}>
      {steps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        const className = [
          "journey-step",
          isDone ? "journey-step-done" : "",
          isActive ? "journey-step-active" : "",
        ].filter(Boolean).join(" ");

        return (
          <span key={step} className={className} aria-current={isActive ? "step" : undefined}>
            <b>{isDone ? "✓" : index + 1}</b>
            <small>{step}</small>
          </span>
        );
      })}
    </nav>
  );
}

function ReadabilityPanel({
  assessment,
  targetLevel,
  uiLanguage,
}: {
  assessment: ReadabilityAssessment;
  targetLevel: number;
  uiLanguage: UiLanguage;
}) {
  const signals = assessment.deterministic;
  const estimate = assessment.heuristic_estimate;
  const reasons = estimate.reasons.length > 0 ? estimate.reasons : signals.reasons;

  return (
    <section className="readability-panel" aria-live="polite">
      <div>
        <p>{uiLanguage === "ar" ? "صعوبة النص" : "Text difficulty"}</p>
        <h2>{levelLabelFromReadability(estimate.estimated_level, uiLanguage)}</h2>
        <span>
          {uiLanguage === "ar"
            ? `المستوى المختار: ${levelLabel(targetLevel, uiLanguage)} · تقدير أولي`
            : `Selected level: ${levelLabel(targetLevel, uiLanguage)} · initial estimate`}
        </span>
      </div>
      <div className="readability-metrics">
        <Metric label={uiLanguage === "ar" ? "الجمل" : "Sentences"} value={signals.sentence_count} />
        <Metric label={uiLanguage === "ar" ? "متوسط الكلمات" : "Avg words"} value={signals.average_sentence_length} />
        <Metric label={uiLanguage === "ar" ? "جمل طويلة" : "Long sentences"} value={signals.long_sentence_count} />
        <Metric label={uiLanguage === "ar" ? "أرقام/تواريخ" : "Numbers/dates"} value={signals.numeric_item_count + signals.date_reference_count} />
      </div>
      <ul>
        {reasons.slice(0, 4).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}

function BridgeModePanel({
  result,
  uiLanguage,
}: {
  result: SimplificationResult;
  uiLanguage: UiLanguage;
}) {
  return (
    <div className="bridge-panel">
      {result.bridge.levels.map((level, index) => (
        <article key={`${level.level}-${index}`}>
          <div className="bridge-level-heading">
            <span>{index + 1}</span>
            <div>
              <h4>{uiLanguage === "ar" ? level.label_ar : level.label_en}</h4>
              <p>{levelLabel(level.level, uiLanguage)}</p>
            </div>
          </div>
          <p dir="rtl" className="bridge-text">{level.text}</p>
          {level.reintroduced_items.length > 0 && (
            <div className="bridge-transitions">
              {level.reintroduced_items.map((item) => (
                <span key={`${item.simpler_phrase}-${item.richer_phrase}`}>
                  <strong dir="rtl">{item.simpler_phrase} → {item.richer_phrase}</strong>
                  <small>{uiLanguage === "ar" ? item.explanation : item.explanation_english}</small>
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function MeaningThreadsPanel({
  result,
  uiLanguage,
  openedIndex,
  onToggle,
}: {
  result: SimplificationResult;
  uiLanguage: UiLanguage;
  openedIndex: number | null;
  onToggle: (index: number, kind: MeaningThreadKind) => void;
}) {
  return (
    <div className="meaning-threads-list">
      {result.meaning_threads.map((thread, index) => {
        const isOpen = openedIndex === index;
        return (
          <article key={`${index}-${thread.focus}-${thread.connects_to}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => onToggle(index, thread.kind)}
            >
              <div className="meaning-thread-heading">
                <span>{meaningThreadKindLabel(thread.kind, uiLanguage)}</span>
                <b aria-hidden="true">{isOpen ? "−" : "+"}</b>
              </div>
              <p dir="rtl" className="meaning-thread-sentence">{thread.sentence}</p>
              <div dir="rtl" className="meaning-thread-link">
                <strong>{thread.focus}</strong>
                <span aria-hidden="true">←</span>
                <strong>{thread.connects_to}</strong>
              </div>
              <small>{uiLanguage === "ar" ? thread.relation : thread.relation_english}</small>
              {isOpen && (
                <div className="meaning-thread-explanation">
                  <p>{uiLanguage === "ar" ? thread.explanation : thread.explanation_english}</p>
                  <span>
                    {uiLanguage === "ar"
                      ? "سجّلت «مفرداتي» أنك طلبت مساعدة في هذا النوع من العلاقات."
                      : "My Vocabulary recorded that you requested help with this type of relation."}
                  </span>
                </div>
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function WordMasteryCheck({
  result,
  readingCount,
  uiLanguage,
  selectedChoice,
  onSelect,
}: {
  result: SimplificationResult;
  readingCount: number;
  uiLanguage: UiLanguage;
  selectedChoice: number | null;
  onSelect: (index: number) => void;
}) {
  const quizIndex = readingCount % result.learning_cards.length;
  const quizCard = result.learning_cards[quizIndex];
  const correct = selectedChoice === quizIndex;

  return (
    <section className="word-mastery-check">
      <p>{uiLanguage === "ar" ? "اختبار من هذا النص" : "Check from this text"}</p>
      <h4 dir="rtl">
        {uiLanguage === "ar"
          ? `ما معنى «${quizCard.term}» هنا؟`
          : `What does “${quizCard.term}” mean here?`}
      </h4>
      <div>
        {result.learning_cards.map((card, index) => (
          <button
            key={`${index}-${card.term}`}
            type="button"
            disabled={selectedChoice !== null}
            onClick={() => onSelect(index)}
            className={`${selectedChoice === index ? "selected" : ""} ${selectedChoice !== null && index === quizIndex ? "correct" : ""}`}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {uiLanguage === "ar" ? card.simple_meaning : card.english_meaning}
          </button>
        ))}
      </div>
      {selectedChoice !== null && (
        <aside className={correct ? "correct" : "review"}>
          <strong>{correct ? uiLanguage === "ar" ? "أحسنت" : "Correct" : uiLanguage === "ar" ? "الإجابة الأقرب" : "The best answer"}</strong>
          <p>{uiLanguage === "ar" ? quizCard.simple_meaning : quizCard.english_meaning}</p>
          <small>
            {uiLanguage === "ar"
              ? "سجّلت «مفرداتي» النتيجة. لا تُعدّ الكلمة متقنة إلا بعد نجاحك فيها أكثر من مرة."
              : "My Vocabulary recorded the result. A word is mastered only after more than one successful check."}
          </small>
        </aside>
      )}
    </section>
  );
}

function IntegrityPanel({
  result,
  uiLanguage,
}: {
  result: SimplificationResult;
  uiLanguage: UiLanguage;
}) {
  const report = result.meaning_integrity;
  const checks = report.deterministic_checks.slice(0, 10);
  const preserved = uiLanguage === "en"
    ? result.preserved_details_english
    : [...report.preserved_items, ...result.preserved_details];

  return (
    <div className="integrity-panel">
      <div className={`integrity-status integrity-status-${report.status}`}>
        <strong>{integrityStatusLabel(report.status, uiLanguage)}</strong>
        <span>{uiLanguage === "ar" ? `درجة المراجعة: ${confidenceLabel(report.confidence, uiLanguage)}` : `Review confidence: ${confidenceLabel(report.confidence, uiLanguage)}`}</span>
      </div>
      {checks.length > 0 && (
        <div className="integrity-checks">
          {checks.map((check) => (
            <span key={`${check.kind}-${check.value}`}>
              <b>{check.status === "preserved" ? "✓" : "!"}</b>
              <small>{integrityKindLabel(check.kind, uiLanguage)}: {check.value}</small>
            </span>
          ))}
        </div>
      )}
      {preserved.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {preserved.slice(0, 10).map((detail) => <li key={detail} className="trust-chip">✓ {detail}</li>)}
        </ul>
      )}
      {report.missing_items.length > 0 && (
        <ul className="integrity-warnings">
          {report.missing_items.map((item) => <li key={item}>! {item}</li>)}
        </ul>
      )}
      {report.warnings.length > 0 && (
        <ul className="integrity-warnings">
          {report.warnings.map((warning) => <li key={warning}>! {warning}</li>)}
        </ul>
      )}
      {preserved.length === 0 && checks.length === 0 && report.warnings.length === 0 && (
        <p className="mt-5 text-sm text-ink/60">{uiLanguage === "ar" ? tFallbackNoDetailsAr : "No deterministic details were available for a separate display."}</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

function levelLabel(level: number, uiLanguage: UiLanguage): string {
  const match = learnerLevels.find((item) => item.value === level);
  if (!match) return uiLanguage === "ar" ? "غير محدد" : "Not set";
  return uiLanguage === "ar" ? match.ar : match.en;
}

function levelLabelFromReadability(level: ReadabilityAssessment["heuristic_estimate"]["estimated_level"], uiLanguage: UiLanguage): string {
  const labels = {
    beginner: uiLanguage === "ar" ? "مبتدئ" : "Beginner",
    easy: uiLanguage === "ar" ? "سهل" : "Easy",
    standard: uiLanguage === "ar" ? "متوسط" : "Intermediate",
    advanced: uiLanguage === "ar" ? "متقدم" : "Advanced",
  };
  return level ? labels[level] : uiLanguage === "ar" ? "غير محدد" : "Not available";
}

function confidenceLabel(confidence: string, uiLanguage: UiLanguage): string {
  const labels: Record<string, string> = uiLanguage === "ar"
    ? { low: "منخفضة", medium: "متوسطة", high: "عالية" }
    : { low: "low", medium: "medium", high: "high" };
  return labels[confidence] ?? confidence;
}

function integrityKindLabel(kind: string, uiLanguage: UiLanguage): string {
  if (uiLanguage === "en") {
    const englishLabels: Record<string, string> = {
      percentage: "Percentage",
      currency: "Amount",
      date: "Date",
      time: "Time",
      number: "Number",
      list_count: "List items",
    };
    return englishLabels[kind] ?? kind;
  }

  const arabicLabels: Record<string, string> = {
    percentage: "نسبة",
    currency: "مبلغ",
    date: "تاريخ",
    time: "وقت",
    number: "رقم",
    list_count: "عناصر القائمة",
  };
  return arabicLabels[kind] ?? "تفصيل مهم";
}

function integrityStatusLabel(status: string, uiLanguage: UiLanguage): string {
  if (status === "needs_attention") {
    return uiLanguage === "ar" ? "يحتاج مراجعة" : "Needs attention";
  }
  if (status === "unavailable") {
    return uiLanguage === "ar" ? "غير متاح بالكامل" : "Partly unavailable";
  }
  return uiLanguage === "ar" ? "لم تظهر مشكلة" : "No issue detected";
}

function masteryLabel(status: WordMasteryStatus, uiLanguage: UiLanguage): string {
  const labels: Record<WordMasteryStatus, { ar: string; en: string }> = {
    new: { ar: "جديدة", en: "New" },
    learning: { ar: "قيد التعلّم", en: "Learning" },
    mastered: { ar: "أتقنتها", en: "Mastered" },
  };
  return labels[status][uiLanguage];
}

function meaningThreadKindLabel(kind: MeaningThreadKind, uiLanguage: UiLanguage): string {
  const labels: Record<MeaningThreadKind, { ar: string; en: string }> = {
    pronoun: { ar: "مرجع الضمير", en: "Pronoun reference" },
    actor: { ar: "من قام بالفعل؟", en: "Who acted?" },
    connector: { ar: "رابط بين فكرتين", en: "Idea connector" },
    negation: { ar: "نطاق النفي", en: "Scope of negation" },
    condition: { ar: "الشرط والنتيجة", en: "Condition and result" },
    reference: { ar: "مرجع العبارة", en: "Phrase reference" },
  };
  return labels[kind][uiLanguage];
}

function buildReadingMemorySnapshot(
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

function masteryFromEvidence(
  attempts: number,
  correctAnswers: number,
  supportCount: number,
): WordMasteryStatus {
  if (attempts >= 2 && correctAnswers >= 2 && correctAnswers / attempts >= 0.67) return "mastered";
  if (attempts > 0 || supportCount > 1) return "learning";
  return "new";
}

function buildSavedVocabularyQuiz(
  savedWords: SavedWord[],
  quizIndex: number,
): { target: SavedWord; options: SavedWord[]; correctIndex: number } | null {
  if (savedWords.length < 2) return null;

  const targetIndex = quizIndex % savedWords.length;
  const target = savedWords[targetIndex];
  const distractors = savedWords
    .filter((word) => word.id !== target.id)
    .slice(0, 2);
  const candidates = [target, ...distractors];
  const rotation = quizIndex % candidates.length;
  const options = [...candidates.slice(rotation), ...candidates.slice(0, rotation)];

  return {
    target,
    options,
    correctIndex: options.findIndex((word) => word.id === target.id),
  };
}

function placementLevelFromScore(score: number): number {
  if (score <= 0) return 1;
  if (score === 1) return 2;
  if (score === 2) return 3;
  return 4;
}

const tFallbackNoDetailsAr = "لم نجد أرقاماً أو مواعيد أو شروطاً تحتاج إلى مراجعة منفصلة.";
