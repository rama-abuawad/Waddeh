"use client";

import { Bookmark, X } from "lucide-react";
import { useEffect } from "react";

import SpeechPlayer from "@/components/reading/speech-player";
import type { WordExplanation } from "@/lib/api";
import type { UiLanguage } from "@/lib/waddeh-store";

export interface WordLensState {
  word: string;
  loading: boolean;
  data?: WordExplanation;
  error?: string;
}

export default function WordLensSheet({
  state,
  uiLanguage,
  saved,
  onSave,
  onClose,
}: {
  state: WordLensState;
  uiLanguage: UiLanguage;
  saved: boolean;
  onSave: (word: WordExplanation) => void;
  onClose: () => void;
}) {
  const isArabic = uiLanguage === "ar";
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  return (
    <div className="v4-overlay v4-word-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="v4-sheet v4-word-sheet" role="dialog" aria-modal="true" aria-labelledby="word-lens-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="v4-sheet-handle" aria-hidden="true" />
        <button autoFocus type="button" className="v4-sheet-close" onClick={onClose} aria-label={isArabic ? "إغلاق" : "Close"}><X /></button>
        <p className="v4-kicker">{isArabic ? "المعنى في هذا السياق" : "Meaning in this context"}</p>
        <h2 id="word-lens-title" dir="rtl" lang="ar">{state.data?.diacritized_word || state.word}</h2>
        {state.loading && <div className="v4-inline-loading"><span className="v4-spinner" />{isArabic ? "نفهم الكلمة داخل الجملة…" : "Understanding the word inside the sentence…"}</div>}
        {state.error && <p className="v4-form-error" role="alert">{state.error}</p>}
        {state.data && (
          <>
            <p className="v4-word-meaning" dir={isArabic ? "rtl" : "ltr"}>{isArabic ? state.data.meaning : state.data.english}</p>
            <div className="v4-word-facts">
              <div><small>{isArabic ? "الجذر" : "Root"}</small><strong dir="rtl">{state.data.root}</strong></div>
              <div><small>{isArabic ? "مرادف قريب" : "Close synonym"}</small><strong dir="rtl">{state.data.synonym}</strong></div>
              <div><small>{isArabic ? "المعنى الآخر" : "Other language"}</small><strong>{isArabic ? state.data.english : state.data.meaning}</strong></div>
            </div>
            {state.data.example && <blockquote dir="rtl" lang="ar">{state.data.example}</blockquote>}
            <SpeechPlayer text={state.data.diacritized_word || state.data.word} language="ar" uiLanguage={uiLanguage} compact />
            <button type="button" className={`v4-save-button ${saved ? "is-saved" : ""}`} disabled={saved} onClick={() => onSave(state.data!)}><Bookmark />{saved ? (isArabic ? "محفوظة" : "Saved") : (isArabic ? "احفظ الكلمة" : "Save word")}</button>
          </>
        )}
      </aside>
    </div>
  );
}
