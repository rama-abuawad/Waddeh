"use client";

import { FormEvent, useEffect, useState } from "react";

import InteractiveArabic from "@/components/interactive-arabic";
import {
  ReaderType,
  SimplificationResult,
  WordExplanation,
  explainWord,
  simplifyPdf,
  simplifyText,
} from "@/lib/api";
import { UiLanguage, uiCopy } from "@/lib/ui-copy";

type ResultView = "clear" | "english" | "original";
type ResultTool = "changes" | "check" | "learning" | "trust" | "visual";
type SourceMode = "text" | "pdf";

interface SavedWord extends WordExplanation {
  id: string;
  savedAt: string;
}

interface LearningProfile {
  readings: number;
}

const initialProfile: LearningProfile = { readings: 0 };

const exampleText =
  "يتعين على المتقدم استيفاء جميع المتطلبات المنصوص عليها قبل انقضاء المهلة المحددة، ولن تُقبل الطلبات التي تُرسل بعد تاريخ 30 أغسطس 2026.";

const audiences: Array<{
  value: ReaderType;
  marker: string;
  level: number;
}> = [
  { value: "child", marker: "أ", level: 1 },
  { value: "non_arabic_speaker", marker: "EN", level: 1 },
  { value: "general_reader", marker: "و", level: 2 },
];

const resultViews: ResultView[] = ["clear", "english", "original"];
const featureMarks = ["TXT", "PDF", "Aa"];

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("ar");
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [reader, setReader] = useState<ReaderType>("general_reader");
  const [profile, setProfile] = useState<LearningProfile>(initialProfile);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [result, setResult] = useState<SimplificationResult | null>(null);
  const [resultView, setResultView] = useState<ResultView>("clear");
  const [activeTool, setActiveTool] = useState<ResultTool | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [checkRated, setCheckRated] = useState(false);
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
  const t = uiCopy[uiLanguage];

  const selectedAudience =
    audiences.find((audience) => audience.value === reader) ?? audiences[2];
  const isEnglishFirst = reader === "non_arabic_speaker";
  const selectedLevel = selectedAudience.level;

  useEffect(() => {
    const restoreProgress = window.setTimeout(() => {
      try {
        const storedWords = window.localStorage.getItem("waddeh-vocabulary");
        const storedProfile = window.localStorage.getItem("waddeh-learning-profile");
        const storedLanguage = window.localStorage.getItem("waddeh-language");
        if (storedWords) setSavedWords(JSON.parse(storedWords) as SavedWord[]);
        if (storedProfile) setProfile(JSON.parse(storedProfile) as LearningProfile);
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
    setActiveTool(null);
    setShowAnswer(false);
    setCheckRated(false);
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
      const response = sourceMode === "pdf" && pdfFile
        ? await simplifyPdf(pdfFile, reader, selectedLevel)
        : await simplifyText({ text: text.trim(), reader, level: selectedLevel });
      setResult(response);
      setResultView(uiLanguage === "en" || isEnglishFirst ? "english" : "clear");
      persistProfile({ ...profile, readings: profile.readings + 1 });
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
    if (savedWords.some((item) => item.word === word.word && item.meaning === word.meaning)) return;
    persistWords([
      { ...word, id: crypto.randomUUID(), savedAt: new Date().toISOString() },
      ...savedWords,
    ]);
  }

  function saveLearningCard(card: SimplificationResult["learning_cards"][number]) {
    saveWord({
      word: card.term,
      diacritized_word: card.term,
      meaning: card.simple_meaning,
      root: "—",
      synonym: "—",
      english: card.english_meaning,
    });
  }

  function rateCheck() {
    if (checkRated) return;
    setCheckRated(true);
  }

  function toggleTool(tool: ResultTool) {
    setActiveTool((current) => (current === tool ? null : tool));
    if (tool !== "check") setShowAnswer(false);
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
    setWordLens(null);
    setActiveTool(null);
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#workspace" className="flex items-center gap-3" aria-label={t.homeLabel}>
            <span className="grid size-11 place-items-center rounded-2xl bg-teal text-xl font-bold text-white shadow-lg shadow-teal/20">{uiLanguage === "ar" ? "و" : "W"}</span>
            <span>
              <span className="block text-xl font-black leading-none">{uiLanguage === "ar" ? "وضّح" : "Waddeh"}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">{uiLanguage === "ar" ? "Waddeh" : "وضّح"}</span>
            </span>
          </a>
          <div className="header-actions">
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
            {savedWords.length > 0 ? (
              <div className="drawer-word-list">
                {savedWords.map((word) => (
                  <article key={word.id}>
                    <div>
                      <strong dir="rtl">{word.diacritized_word}</strong>
                      <p>{uiLanguage === "en" ? word.english : word.meaning}</p>
                    </div>
                    <button type="button" onClick={() => persistWords(savedWords.filter((item) => item.id !== word.id))} aria-label={t.panels.removeWord(word.word)}>×</button>
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

      <div key={uiLanguage} className="page-content relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="hero-kicker">{t.hero.eyebrow}</p>
            <h1 className="hero-title text-balance text-4xl font-black leading-[1.3] tracking-tight sm:text-5xl lg:text-[3.45rem]">
              {t.hero.title}<span className="text-teal">{t.hero.accent}</span>
            </h1>
            <p className="hero-description mt-5 text-pretty text-base leading-8 text-ink/60 sm:text-lg">
              {t.hero.description}
            </p>
            {uiLanguage === "ar" && <p className="mt-1 text-sm text-ink/40">{t.hero.secondary}</p>}
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
                  <span>{index === 0 && uiLanguage === "ar" ? "نص" : featureMarks[index]}</span>
                  <span><strong>{feature.label}</strong><small>{feature.description}</small></span>
                  <span aria-hidden="true">{uiLanguage === "ar" ? "←" : "→"}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace" className="mx-auto mt-10 max-w-4xl scroll-mt-6">
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
                        setResult(null);
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

            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="step-number">2</span>
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
                    onClick={() => {
                      setText(exampleText);
                      setResult(null);
                      setError("");
                    }}
                    className="secondary-button"
                  >
                    {t.actions.sample}
                  </button>
                )}
              </div>
            </div>
          </form>

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
                <div className="tool-grid">
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
                  <button type="button" onClick={() => toggleTool("check")} className={`result-tool ${activeTool === "check" ? "result-tool-active" : ""}`}>
                    <span className="tool-mark">{uiLanguage === "ar" ? "؟" : "?"}</span>
                    <span><strong>{t.tools.check}</strong><small>{t.tools.checkDescription}</small></span>
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

                {activeTool && (
                  <div className="tool-panel">
                    {activeTool === "learning" && (
                      <div>
                        <PanelHeading
                          title={t.panels.learningTitle}
                          description={t.panels.learningSummary(profile.readings, savedWords.length)}
                          closeLabel={t.wordLens.close}
                          onClose={() => setActiveTool(null)}
                        />
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
                        <button type="button" onClick={() => setShowAnswer((current) => !current)} className="mt-5 rounded-xl bg-teal px-5 py-3 text-sm font-black text-white">
                          {showAnswer ? t.panels.hideAnswer : t.panels.showAnswer}
                        </button>
                        {showAnswer && (
                          <div className="mt-4 rounded-xl bg-white p-4">
                            <p className="leading-8 text-ink/75">
                              {uiLanguage === "en" ? result.comprehension_check.answer_english : result.comprehension_check.answer}
                            </p>
                            {!checkRated ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button type="button" onClick={rateCheck} className="check-rate-button">{t.panels.understood}</button>
                                <button type="button" onClick={rateCheck} className="check-rate-button">{t.panels.review}</button>
                              </div>
                            ) : <p className="mt-3 text-xs font-bold text-teal">{t.panels.checkRecorded}</p>}
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
                        <PanelHeading title={t.panels.trustTitle} description={t.panels.trustDescription} closeLabel={t.wordLens.close} onClose={() => setActiveTool(null)} />
                        {result.preserved_details.length > 0 ? (
                          <ul className="mt-5 flex flex-wrap gap-2">
                            {(uiLanguage === "en" ? result.preserved_details_english : result.preserved_details).map((detail) => <li key={detail} className="trust-chip">✓ {detail}</li>)}
                          </ul>
                        ) : <p className="mt-5 text-sm text-ink/60">{t.panels.noDetails}</p>}
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

        <section className="mx-auto mt-20 max-w-5xl text-center">
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
