"use client";

import Link from "next/link";
import { Bookmark, Check, ChevronRight, Search, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import SpeechPlayer from "@/components/reading/speech-player";
import { useWaddeh } from "@/components/waddeh-provider";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { createTransferChallenge, type TransferChallengeResult } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import { buildSavedVocabularyQuiz, type SavedWord, type WordMasteryStatus } from "@/lib/waddeh-store";

type Filter = "all" | "word" | "expression" | "learning" | "mastered";

function masteryLabel(status: WordMasteryStatus, language: "ar" | "en") {
  const labels = { new: { ar: "جديدة", en: "New" }, learning: { ar: "قيد التعلّم", en: "Learning" }, mastered: { ar: "مألوفة", en: "Familiar" } } as const;
  return labels[status][language];
}

interface TransferState {
  word: SavedWord;
  loading: boolean;
  data?: TransferChallengeResult;
  choice?: number;
  error?: string;
}

export default function VocabularyPage() {
  const { uiLanguage, savedWords, profile, removeWord, recordVocabularyQuiz, recordTransferResult } = useWaddeh();
  const copy = copyFor(uiLanguage).learning;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SavedWord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewChoice, setReviewChoice] = useState<number | null>(null);
  const [transfer, setTransfer] = useState<TransferState | null>(null);
  const closeSelected = useCallback(() => setSelected(null), []);
  const closeReview = useCallback(() => setReviewOpen(false), []);
  const closeTransfer = useCallback(() => {
    setTransfer(null);
    window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".v4-transfer-button")?.focus());
  }, []);
  const selectedDialogRef = useModalDialog<HTMLElement>(selected !== null && transfer === null, closeSelected);
  const reviewDialogRef = useModalDialog<HTMLElement>(reviewOpen, closeReview);
  const transferDialogRef = useModalDialog<HTMLElement>(transfer !== null, closeTransfer);
  const quiz = buildSavedVocabularyQuiz(savedWords, reviewIndex);
  const learningCount = savedWords.filter((word) => word.mastery !== "mastered").length;
  const familiarCount = savedWords.length - learningCount;
  const visible = useMemo(() => savedWords.filter((word) => {
    if (filter === "word" && word.kind !== "word") return false;
    if (filter === "expression" && word.kind !== "expression") return false;
    if (filter === "learning" && word.mastery === "mastered") return false;
    if (filter === "mastered" && word.mastery !== "mastered") return false;
    return `${word.word} ${word.diacritized_word} ${word.meaning} ${word.english} ${word.root}`.toLowerCase().includes(query.toLowerCase());
  }), [filter, query, savedWords]);

  async function startTransfer(word: SavedWord) {
    setTransfer({ word, loading: true });
    try {
      const data = await createTransferChallenge({ word: word.word, meaning: word.meaning, english_meaning: word.english, source_context: word.example || word.meaning, reader: "general_reader", level: profile.preferredLevel });
      setTransfer({ word, loading: false, data });
    } catch (error) {
      setTransfer({ word, loading: false, error: error instanceof Error ? error.message : uiLanguage === "ar" ? "تعذر إعداد التحدّي." : "The challenge could not be prepared." });
    }
  }

  function chooseTransfer(index: number) {
    if (!transfer?.data || transfer.choice !== undefined) return;
    const correct = index === transfer.data.correct_choice_index;
    recordTransferResult(transfer.word.id, correct);
    setTransfer({ ...transfer, choice: index });
  }

  return (
    <section className="v4-vocabulary-page">
      <div className="v4-vocab-summary"><p>{uiLanguage === "ar" ? <><strong>{savedWords.length}</strong> محفوظة · <b>{learningCount}</b> قيد التعلّم · <b>{familiarCount}</b> مألوفة</> : <><strong>{savedWords.length}</strong> saved · <b>{learningCount}</b> learning · <b>{familiarCount}</b> familiar</>}</p><button type="button" disabled={savedWords.length < 2} onClick={() => { setReviewOpen(true); setReviewChoice(null); }}>{copy.review}</button></div>
      <div className="v4-collection-toolbar"><div className="v4-filter-row">{(["all", "word", "expression", "learning", "mastered"] as Filter[]).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? copy.all : item === "word" ? copy.words : item === "expression" ? copy.expressions : item === "learning" ? copy.learningFilter : copy.familiar}</button>)}</div><label className="v4-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label></div>
      {visible.length === 0 ? <div className="v4-collection-empty"><Bookmark /><h2>{copy.emptyWords}</h2><Link href="/#start">{copy.start}</Link></div> : <div className="v4-vocabulary-list">{visible.map((word) => <article key={word.id}><button type="button" className="v4-vocab-open" onClick={() => setSelected(word)}><strong dir="rtl">{word.diacritized_word}</strong><span>{uiLanguage === "ar" ? word.meaning : word.english}</span><small>{masteryLabel(word.mastery, uiLanguage)} · {word.supportCount} {uiLanguage === "ar" ? "مرات" : "encounters"}</small><ChevronRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></button><button type="button" className="v4-row-delete" onClick={() => removeWord(word.id)} aria-label={copy.remove}><Trash2 /></button></article>)}</div>}

      {selected && !transfer && <div className="v4-overlay" role="presentation" onMouseDown={closeSelected}><aside ref={selectedDialogRef} className="v4-sheet v4-vocab-detail" role="dialog" aria-modal="true" aria-labelledby="vocab-detail-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><div className="v4-sheet-handle" /><button type="button" className="v4-sheet-close" data-modal-autofocus onClick={closeSelected} aria-label={uiLanguage === "ar" ? "إغلاق" : "Close"}><X /></button><p className="v4-kicker">{selected.kind === "expression" ? copy.expressions : copy.words}</p><h2 id="vocab-detail-title" dir="rtl">{selected.diacritized_word}</h2><p className="v4-word-meaning">{uiLanguage === "ar" ? selected.meaning : selected.english}</p><div className="v4-word-facts"><div><small>{uiLanguage === "ar" ? "الجذر" : "Root"}</small><strong dir="rtl">{selected.root}</strong></div><div><small>{copy.familiar}</small><strong>{masteryLabel(selected.mastery, uiLanguage)}</strong></div><div><small>{uiLanguage === "ar" ? "مرات اللقاء" : "Encounters"}</small><strong>{selected.supportCount}</strong></div></div>{selected.example && <blockquote dir="rtl">{selected.example}</blockquote>}<SpeechPlayer text={selected.diacritized_word} language="ar" uiLanguage={uiLanguage} compact />{selected.sourceReadingId && <Link className="v4-text-link" href={`/reading/${selected.sourceReadingId}`}>{copy.source}: <span dir="rtl">{selected.sourceTitle}</span></Link>}<button type="button" className="v4-transfer-button" onClick={() => void startTransfer(selected)}>{uiLanguage === "ar" ? "جرّبها في سياق جديد" : "Try it in a new context"}</button></aside></div>}

      {reviewOpen && quiz && <div className="v4-overlay"><section ref={reviewDialogRef} className="v4-review-flow" role="dialog" aria-modal="true" aria-labelledby="review-title" tabIndex={-1}><button type="button" className="v4-sheet-close" data-modal-autofocus aria-label={uiLanguage === "ar" ? "إغلاق" : "Close"} onClick={closeReview}><X /></button><p className="v4-kicker">{copy.review}</p><h2 id="review-title" dir={uiLanguage === "ar" ? "rtl" : "ltr"}>{uiLanguage === "ar" ? <>ما معنى «<bdi dir="rtl">{quiz.target.diacritized_word}</bdi>»؟</> : <>What does “<bdi dir="rtl">{quiz.target.diacritized_word}</bdi>” mean?</>}</h2><div>{quiz.options.map((option, index) => { const answered = reviewChoice !== null; const correct = answered && index === quiz.correctIndex; const chosen = reviewChoice === index; return <button key={option.id} type="button" disabled={answered} className={`${chosen ? "selected" : ""} ${correct ? "correct" : ""}`} onClick={() => { setReviewChoice(index); recordVocabularyQuiz(quiz.target.id, index === quiz.correctIndex); }}><span>{String.fromCharCode(65 + index)}</span>{uiLanguage === "ar" ? option.meaning : option.english || option.meaning}</button>; })}</div>{reviewChoice !== null && <footer><strong>{reviewChoice === quiz.correctIndex ? (uiLanguage === "ar" ? "عرفتها" : "You knew it") : (uiLanguage === "ar" ? "لنثبّتها مرة أخرى" : "Let’s reinforce it")}</strong><p>{uiLanguage === "ar" ? quiz.target.meaning : quiz.target.english}</p><button type="button" onClick={() => { setReviewIndex((value) => value + 1); setReviewChoice(null); }}>{copy.next}</button></footer>}</section></div>}

      {transfer && <div className="v4-overlay"><section ref={transferDialogRef} className="v4-transfer-flow" role="dialog" aria-modal="true" aria-labelledby="transfer-title" tabIndex={-1}><button type="button" className="v4-sheet-close" data-modal-autofocus aria-label={uiLanguage === "ar" ? "إغلاق" : "Close"} onClick={closeTransfer}><X /></button><p className="v4-kicker">{uiLanguage === "ar" ? "سياق جديد" : "New context"}</p><h2 id="transfer-title" dir="rtl">{transfer.word.diacritized_word}</h2>{transfer.loading && <div className="v4-inline-loading"><span className="v4-spinner" />{uiLanguage === "ar" ? "نعدّ جملة جديدة…" : "Preparing a new sentence…"}</div>}{transfer.error && <p className="v4-form-error">{transfer.error}</p>}{transfer.data && <><blockquote dir="rtl">{transfer.data.prompt_arabic}</blockquote>{uiLanguage === "en" && <p>{transfer.data.prompt_english}</p>}<div>{transfer.data.choices_arabic.map((choice, index) => { const answered = transfer.choice !== undefined; return <button key={`${index}-${choice}`} type="button" disabled={answered} className={`${transfer.choice === index ? "selected" : ""} ${answered && index === transfer.data?.correct_choice_index ? "correct" : ""}`} onClick={() => chooseTransfer(index)}><strong dir="rtl">{choice}</strong>{uiLanguage === "en" && <small>{transfer.data?.choices_english[index]}</small>}</button>; })}</div>{transfer.choice !== undefined && <footer><Check /><p>{uiLanguage === "ar" ? transfer.data.explanation_arabic : transfer.data.explanation_english}</p></footer>}</>}</section></div>}
    </section>
  );
}
