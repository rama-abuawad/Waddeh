"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, Copy, FilePlus2, FileText, Menu, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import InteractiveArabic from "@/components/interactive-arabic";
import ExplorePanel, { type ExploreTool } from "@/components/reading/explore-panel";
import SpeechPlayer from "@/components/reading/speech-player";
import WordLensSheet, { type WordLensState } from "@/components/reading/word-lens-sheet";
import { useWaddeh } from "@/components/waddeh-provider";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { explainWord, type CulturalMeaningItem, type WordExplanation } from "@/lib/api";
import { validatePdfFile } from "@/lib/pdf-validation";
import { copyFor } from "@/lib/v4-copy";
import { readingArabic, wordCount, type ReadingTab } from "@/lib/waddeh-store";

function ReadingLoader({ language, messages, note }: { language: "ar" | "en"; messages: readonly string[]; note: string }) {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => setMessageIndex((index) => (index + 1) % messages.length), 1_900);
    return () => window.clearInterval(interval);
  }, [messages.length]);
  return (
    <section className="v4-reading-loader" role="status" aria-live="polite" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="v4-loader-message"><p className="v4-kicker">Waddeh</p><h1>{messages[messageIndex]}</h1><p>{note}</p><small>{language === "ar" ? "قد يستغرق هذا ما يصل إلى دقيقة." : "This might take up to a minute."}</small></div>
      <div className="v4-reading-skeleton" aria-hidden="true">
        <div className="v4-skeleton-main">
          <section className="v4-skeleton-arabic"><header><span className="v4-skeleton-label" /><span className="v4-skeleton-audio" /></header><div><i /><i /><i /><i /></div></section>
          <div className="v4-skeleton-tabs"><span /><span /><span /></div>
          <section className="v4-skeleton-meaning"><span className="v4-skeleton-label" /><i /><i /></section>
        </div>
        <aside className="v4-skeleton-explore"><span className="v4-skeleton-label" /><i /><i /><i /><i /></aside>
      </div>
    </section>
  );
}

function SavedButton({ saved, label, savedLabel, onClick }: { saved: boolean; label: string; savedLabel: string; onClick: () => void }) {
  return <button type="button" className={`v4-inline-save ${saved ? "is-saved" : ""}`} disabled={saved} onClick={onClick}>{saved ? <Check /> : <Bookmark />}{saved ? savedLabel : label}</button>;
}

function expressionAsWord(item: CulturalMeaningItem): WordExplanation {
  return {
    word: item.expression,
    diacritized_word: item.expression,
    meaning: item.intended_meaning,
    root: "—",
    synonym: "—",
    english: item.english_meaning,
    example: item.expression,
    confidence: item.confidence,
  };
}

export default function ReadingExperience({ readingId }: { readingId: string }) {
  const router = useRouter();
  const {
    hydrated,
    uiLanguage,
    readingSize,
    readings,
    savedWords,
    processReading,
    retryReading,
    reattachPdf,
    reopenReading,
    setReadingTab,
    saveWord,
  } = useWaddeh();
  const copy = copyFor(uiLanguage).reading;
  const reading = readings.find((item) => item.id === readingId);
  const [activeTool, setActiveTool] = useState<ExploreTool | null>(null);
  const [mobileExplore, setMobileExplore] = useState(false);
  const [showDiacritics, setShowDiacritics] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [wordLens, setWordLens] = useState<WordLensState | null>(null);
  const [copied, setCopied] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const recoveryFileInput = useRef<HTMLInputElement>(null);
  const closeMobileExplore = useCallback(() => setMobileExplore(false), []);
  const mobileExploreRef = useModalDialog<HTMLDivElement>(mobileExplore, closeMobileExplore);

  useEffect(() => {
    if (!hydrated || !reading) return;
    if (reading.status === "pending") void processReading(reading.id);
  }, [hydrated, processReading, reading]);

  useEffect(() => {
    if (reading?.status === "ready") reopenReading(reading.id);
    // Reopen should be recorded only when this ready reading first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading?.id, reading?.status]);

  const closeWordLens = useCallback(() => setWordLens(null), []);

  async function handleRecoveryFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!reading || !file) return;
    const validationError = await validatePdfFile(file);
    if (validationError) {
      setAttachmentError(validationError);
      return;
    }
    setAttachmentError("");
    reattachPdf(reading.id, file);
  }

  async function inspectWord(word: string) {
    if (!reading?.result) return;
    setWordLens({ word, loading: true });
    const context = reading.result.kind === "standard" ? reading.result.data.simplified_text : reading.result.data.original_text;
    try {
      const data = await explainWord({ word, context, reader: reading.reader });
      setWordLens({ word, loading: false, data });
    } catch (error) {
      setWordLens({
        word,
        loading: false,
        error: error instanceof Error ? error.message : uiLanguage === "ar" ? "تعذر شرح الكلمة." : "The word could not be explained.",
      });
    }
  }

  const standard = reading?.result?.kind === "standard" ? reading.result.data : null;
  const poetry = reading?.result?.kind === "poetry" ? reading.result.data : null;
  const arabicText = reading ? readingArabic(reading) : "";
  const compact = wordCount(arabicText) <= 12;
  const selectedTab = reading?.selectedTab ?? "understand";
  const sourceLabel = reading?.source === "pdf"
    ? uiLanguage === "ar" ? "مستند PDF" : "PDF document"
    : reading?.mode === "poetry"
      ? uiLanguage === "ar" ? "شعر" : "Poetry"
      : uiLanguage === "ar" ? "نص عربي" : "Arabic text";

  const copyCurrent = useCallback(async () => {
    if (!reading?.result) return;
    let value = arabicText;
    if (reading.result.kind === "standard") {
      value = selectedTab === "understand" ? reading.result.data.english_translation : selectedTab === "simplify" ? (showDiacritics ? reading.result.data.diacritized_text : reading.result.data.simplified_text) : reading.result.data.learning_cards.map((card) => `${card.term}: ${card.simple_meaning}`).join("\n");
    } else if (selectedTab === "understand") value = reading.result.data.english_translation;
    else if (selectedTab === "simplify") value = reading.result.data.lines.map((line) => `${line.verse}\n${line.clear_meaning}`).join("\n\n");
    else value = reading.result.data.vocabulary.map((word) => `${word.word}: ${word.meaning}`).join("\n");
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }, [arabicText, reading, selectedTab, showDiacritics]);

  if (!hydrated || reading?.status === "pending" || reading?.status === "processing") {
    return <div className="v4-reading-page"><ReadingLoader language={uiLanguage} messages={copy.processing} note={copy.processingNote} /></div>;
  }

  if (!reading) {
    return <div className="v4-state-page"><FileText /><h1>{uiLanguage === "ar" ? "لم نجد هذه القراءة" : "This reading was not found"}</h1><p>{uiLanguage === "ar" ? "ربما أزيلت من هذا الجهاز." : "It may have been removed from this device."}</p><Link href="/#start">{copy.newReading}</Link></div>;
  }

  if (reading.status === "error") {
    const needsPdf = reading.recovery === "pdf_file_missing";
    const interrupted = reading.recovery === "interrupted";
    return <div className="v4-state-page">
      {needsPdf ? <FilePlus2 /> : <FileText />}
      <h1>{needsPdf
        ? uiLanguage === "ar" ? "أرفق ملف PDF مرة أخرى" : "Attach the PDF again"
        : interrupted
          ? uiLanguage === "ar" ? "توقفت هذه القراءة" : "This reading was interrupted"
          : uiLanguage === "ar" ? "تعذر تجهيز القراءة" : "The reading could not be prepared"}</h1>
      <p>{needsPdf
        ? uiLanguage === "ar" ? "لا نخزّن الملف على جهازك بعد إغلاق الصفحة. اختر الملف الأصلي مرة أخرى لنكمل القراءة نفسها." : "Waddeh does not store the file after the page closes. Select the original PDF again to continue this reading."
        : interrupted
          ? uiLanguage === "ar" ? "أُغلقت الصفحة قبل اكتمال التجهيز. يمكنك إعادة المحاولة بأمان." : "The page closed before preparation finished. You can safely try again."
          : reading.error}</p>
      {attachmentError && <p className="v4-form-error" role="alert">{attachmentError}</p>}
      <div>
        {needsPdf ? <><input ref={recoveryFileInput} type="file" accept="application/pdf,.pdf" hidden onChange={handleRecoveryFile} /><button type="button" onClick={() => recoveryFileInput.current?.click()}>{uiLanguage === "ar" ? "اختر ملف PDF" : "Choose PDF"}</button></> : <button type="button" onClick={() => retryReading(reading.id)}>{copy.retry}</button>}
        <Link href="/#start">{copy.newReading}</Link>
      </div>
    </div>;
  }

  return (
    <div className={`v4-reading-page reading-size-${readingSize} ${compact ? "is-compact" : ""}`}>
      <header className="v4-reading-header">
        <button type="button" aria-label={copy.back} onClick={() => router.back()}><ArrowLeft className={uiLanguage === "ar" ? "rtl-arrow" : ""} /><span>{copy.back}</span></button>
        <div><span>{sourceLabel}</span><strong dir="rtl">{reading.title}</strong></div>
        <Link href="/#start" aria-label={copy.newReading}><span>{copy.newReading}</span><Plus aria-hidden="true" /></Link>
      </header>

      <div className={`v4-reading-layout ${activeTool || wordLens ? "is-explore-active" : ""}`}>
        <article className="v4-reading-main">
          <section className="v4-arabic-surface" aria-labelledby="arabic-title">
            <header className="v4-reading-surface-header">
              <div className="v4-reading-section-label"><span id="arabic-title">{copy.arabic}</span><small>{sourceLabel}</small></div>
              <SpeechPlayer text={arabicText} language="ar" uiLanguage={uiLanguage} />
            </header>
            <div className="v4-arabic-text" dir="rtl" lang="ar"><InteractiveArabic text={arabicText} onWord={inspectWord} activeWord={wordLens?.word} wordHint={uiLanguage === "ar" ? "اضغط لمعرفة المعنى في السياق" : "Select for meaning in context"} /></div>
          </section>

          <div className="v4-reading-tabs" role="tablist" aria-label={uiLanguage === "ar" ? "طريقة الفهم" : "Reading mode"}>
            {(["understand", "simplify", "learn"] as ReadingTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={selectedTab === tab} className={selectedTab === tab ? "active" : ""} onClick={() => setReadingTab(reading.id, tab)}>{copy[tab]}</button>)}
          </div>

          <section key={selectedTab} className="v4-mode-content" role="tabpanel">
            {standard && selectedTab === "understand" && (
              <div className="v4-understand-mode">
                <div className="v4-mode-heading"><p className="v4-kicker">{copy.understand}</p><h1>{copy.naturalMeaning}</h1></div>
                <p className="v4-natural-meaning" dir="ltr">{standard.english_translation}</p>
                {standard.cultural_meanings.length > 0 && <div className="v4-context-notes"><h2>{copy.explanation}</h2>{standard.cultural_meanings.slice(0, compact ? 1 : 3).map((item) => <article key={item.expression}><strong dir="rtl">{item.expression}</strong><p>{uiLanguage === "ar" ? item.intended_meaning : item.english_meaning}</p><small>{uiLanguage === "ar" ? item.cultural_context : item.cultural_context_english}</small></article>)}</div>}
              </div>
            )}

            {standard && selectedTab === "simplify" && (
              <div className="v4-simplify-mode">
                <div className="v4-mode-heading v4-mode-heading-row"><div><p className="v4-kicker">{copy.simplify}</p><h1>{copy.clearerArabic}</h1></div><label><input type="checkbox" checked={showDiacritics} onChange={(event) => setShowDiacritics(event.target.checked)} />{copy.diacritics}</label></div>
                <div className="v4-clear-arabic" dir="rtl" lang="ar"><InteractiveArabic text={showDiacritics ? standard.diacritized_text : standard.simplified_text} onWord={inspectWord} activeWord={wordLens?.word} wordHint={uiLanguage === "ar" ? "اضغط لمعرفة المعنى" : "Select for meaning"} /></div>
                {standard.change_map.length > 0 && <div className="v4-change-map"><button type="button" aria-expanded={showChanges} onClick={() => setShowChanges((value) => !value)}>{copy.changes}<ChevronDown className={showChanges ? "open" : ""} /></button>{showChanges && <div>{standard.change_map.map((change, index) => <article key={`${index}-${change.original}`}><div><small>{copy.before}</small><p dir="rtl">{change.original}</p></div><ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /><div><small>{copy.after}</small><p dir="rtl">{change.clear}</p></div><aside>{uiLanguage === "ar" ? change.reason : change.reason_english}</aside></article>)}</div>}</div>}
              </div>
            )}

            {standard && selectedTab === "learn" && (
              <div className="v4-learn-mode">
                <div className="v4-mode-heading"><p className="v4-kicker">{copy.learn}</p><h1>{uiLanguage === "ar" ? "تعلّم من هذه العربية" : "Learn from this Arabic"}</h1></div>
                {standard.cultural_meanings.length > 0 && <section><h2>{copy.expressions}</h2><div className="v4-expression-list">{standard.cultural_meanings.map((item) => { const saved = savedWords.some((word) => word.word === item.expression && word.meaning === item.intended_meaning); return <article key={item.expression}><div className="v4-expression-copy"><div><strong dir="rtl">{item.expression}</strong><p>{uiLanguage === "ar" ? item.intended_meaning : item.english_meaning}</p></div><small>{uiLanguage === "ar" ? item.cultural_context : item.cultural_context_english}</small></div><SavedButton saved={saved} label={copy.save} savedLabel={copy.saved} onClick={() => saveWord(expressionAsWord(item), { kind: "expression", sourceReadingId: reading.id, sourceTitle: reading.title })} /></article>; })}</div></section>}
                {standard.learning_cards.length > 0 ? <section><h2>{copy.vocabulary}</h2><div className="v4-reading-vocabulary">{standard.learning_cards.map((card) => { const saved = savedWords.some((word) => word.word === card.term && word.meaning === card.simple_meaning); return <article key={card.term}><strong dir="rtl">{card.term}</strong><p dir={uiLanguage === "ar" ? "rtl" : "ltr"}>{uiLanguage === "ar" ? card.simple_meaning : card.english_meaning}</p><small>{uiLanguage === "ar" ? card.english_meaning : card.simple_meaning}</small><SavedButton saved={saved} label={copy.save} savedLabel={copy.saved} onClick={() => saveWord({ word: card.term, diacritized_word: card.term, meaning: card.simple_meaning, root: "—", synonym: "—", english: card.english_meaning, example: standard.simplified_text, confidence: "medium" }, { sourceReadingId: reading.id, sourceTitle: reading.title })} /></article>; })}</div></section> : standard.cultural_meanings.length === 0 && <p className="v4-quiet-empty">{copy.noLearning}</p>}
                <Link className="v4-text-link" href="/learning/vocabulary">{uiLanguage === "ar" ? "افتح مفرداتي" : "Open my vocabulary"}<ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></Link>
              </div>
            )}

            {poetry && selectedTab === "understand" && <div className="v4-understand-mode"><div className="v4-mode-heading"><p className="v4-kicker">{copy.understand}</p><h1>{uiLanguage === "ar" ? "المعنى العام" : "The central meaning"}</h1></div><p className="v4-natural-meaning">{uiLanguage === "ar" ? poetry.overview : poetry.overview_english}</p><div className="v4-poetry-translation"><h2>{copy.naturalMeaning}</h2><p dir="ltr">{poetry.english_translation}</p></div></div>}

            {poetry && selectedTab === "simplify" && <div className="v4-simplify-mode"><div className="v4-mode-heading"><p className="v4-kicker">{copy.simplify}</p><h1>{uiLanguage === "ar" ? "بيتاً بيتاً" : "Line by line"}</h1></div><div className="v4-poetry-lines">{poetry.lines.map((line, index) => <article key={`${index}-${line.verse}`}><span>{String(index + 1).padStart(2, "0")}</span><blockquote dir="rtl">{line.verse}</blockquote><p dir="rtl">{line.clear_meaning}</p><small dir="ltr">{line.english_translation}</small></article>)}</div></div>}

            {poetry && selectedTab === "learn" && <div className="v4-learn-mode"><div className="v4-mode-heading"><p className="v4-kicker">{copy.learn}</p><h1>{uiLanguage === "ar" ? "تعلّم من القصيدة" : "Learn from the poem"}</h1></div>{poetry.cultural_meanings.length > 0 && <section><h2>{copy.expressions}</h2><div className="v4-expression-list">{poetry.cultural_meanings.map((item) => { const saved = savedWords.some((word) => word.word === item.expression && word.meaning === item.intended_meaning); return <article key={item.expression}><div className="v4-expression-copy"><div><strong dir="rtl">{item.expression}</strong><p>{uiLanguage === "ar" ? item.intended_meaning : item.english_meaning}</p></div>{(item.cultural_context || item.cultural_context_english) && <small>{uiLanguage === "ar" ? item.cultural_context : item.cultural_context_english}</small>}</div><SavedButton saved={saved} label={copy.save} savedLabel={copy.saved} onClick={() => saveWord(expressionAsWord(item), { kind: "expression", sourceReadingId: reading.id, sourceTitle: reading.title })} /></article>; })}</div></section>}<section><h2>{copy.vocabulary}</h2><div className="v4-reading-vocabulary">{poetry.vocabulary.map((item) => { const saved = savedWords.some((word) => word.word === item.word && word.meaning === item.meaning); return <article key={item.word}><strong dir="rtl">{item.diacritized_word}</strong><p>{uiLanguage === "ar" ? item.meaning : item.english}</p><small dir="rtl">{item.verse}</small><SavedButton saved={saved} label={copy.save} savedLabel={copy.saved} onClick={() => saveWord({ word: item.word, diacritized_word: item.diacritized_word, meaning: item.meaning, root: "—", synonym: "—", english: item.english, example: item.verse, confidence: "medium" }, { sourceReadingId: reading.id, sourceTitle: reading.title })} /></article>; })}</div></section></div>}
          </section>

          <footer className="v4-reading-footer"><button type="button" onClick={() => void copyCurrent()}><Copy />{copied ? copy.copied : copy.copy}</button><Link href="/learning">{uiLanguage === "ar" ? "أكمل في تعلّمي" : "Continue in My Learning"}<ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></Link></footer>
        </article>

        <aside className="v4-desktop-explore"><ExplorePanel reading={reading} active={activeTool} onActive={setActiveTool} wordLens={wordLens} wordLensSaved={Boolean(wordLens?.data && savedWords.some((word) => word.word === wordLens.data?.word && word.meaning === wordLens.data?.meaning))} onSaveWord={(word) => saveWord(word, { sourceReadingId: reading.id, sourceTitle: reading.title })} onCloseWordLens={closeWordLens} /></aside>
      </div>

      <button type="button" className="v4-mobile-explore-trigger" onClick={() => setMobileExplore(true)}><Menu />{copy.explore}</button>
      {mobileExplore && <div className="v4-overlay v4-explore-overlay" role="presentation" onMouseDown={closeMobileExplore}><div ref={mobileExploreRef} className="v4-sheet v4-explore-sheet" role="dialog" aria-modal="true" aria-label={copy.exploreTitle} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><div className="v4-sheet-handle" /><ExplorePanel reading={reading} active={activeTool} onActive={setActiveTool} onClose={closeMobileExplore} mobile /></div></div>}

      {wordLens && <WordLensSheet state={wordLens} uiLanguage={uiLanguage} saved={Boolean(wordLens.data && savedWords.some((word) => word.word === wordLens.data?.word && word.meaning === wordLens.data?.meaning))} onSave={(word) => saveWord(word, { sourceReadingId: reading.id, sourceTitle: reading.title })} onClose={closeWordLens} />}
    </div>
  );
}
