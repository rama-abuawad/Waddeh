"use client";

import Link from "next/link";
import { BookOpenCheck, ChevronDown, GitBranch, Languages, Route, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { MeaningThread, MeaningThreadKind } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import type { ReadingRecord, UiLanguage } from "@/lib/waddeh-store";

export type ExploreTool = "check" | "threads" | "insights" | "path" | "details";

function threadLabel(kind: MeaningThreadKind, language: UiLanguage): string {
  const labels: Record<MeaningThreadKind, { ar: string; en: string }> = {
    pronoun: { ar: "مرجع الضمير", en: "Pronoun reference" },
    actor: { ar: "من قام بالفعل؟", en: "Who acted?" },
    connector: { ar: "رابط الأفكار", en: "Idea connector" },
    negation: { ar: "نطاق النفي", en: "Scope of negation" },
    condition: { ar: "الشرط والنتيجة", en: "Condition and result" },
    reference: { ar: "مرجع العبارة", en: "Phrase reference" },
  };
  return labels[kind][language];
}

function MeaningThreads({ threads, language }: { threads: MeaningThread[]; language: UiLanguage }) {
  const { recordMeaningThread } = useWaddeh();
  const [opened, setOpened] = useState<number | null>(null);
  return (
    <div className="v4-thread-list">
      {threads.map((thread, index) => (
        <article key={`${index}-${thread.focus}`}>
          <button type="button" aria-expanded={opened === index} onClick={() => {
            const next = opened === index ? null : index;
            setOpened(next);
            if (next !== null) recordMeaningThread(thread.kind);
          }}>
            <span><small>{threadLabel(thread.kind, language)}</small><strong dir="rtl">{thread.focus} ← {thread.connects_to}</strong></span>
            <ChevronDown className={opened === index ? "open" : ""} />
          </button>
          {opened === index && <div><p dir="rtl">{thread.sentence}</p><strong>{language === "ar" ? thread.relation : thread.relation_english}</strong><p>{language === "ar" ? thread.explanation : thread.explanation_english}</p></div>}
        </article>
      ))}
    </div>
  );
}

export default function ExplorePanel({
  reading,
  active,
  onActive,
  onClose,
  mobile = false,
}: {
  reading: ReadingRecord;
  active: ExploreTool | null;
  onActive: (tool: ExploreTool | null) => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  const { uiLanguage, recordComprehension } = useWaddeh();
  const copy = copyFor(uiLanguage).reading;
  const result = reading.result;
  const standard = result?.kind === "standard" ? result.data : null;
  const poetry = result?.kind === "poetry" ? result.data : null;
  const hasInsights = Boolean(
    standard && (standard.cultural_meanings.length || standard.change_map.length || standard.visual_steps.length)
      || poetry?.cultural_meanings.length,
  );
  const tools: Array<{ id: ExploreTool; label: string; note: string; icon: typeof BookOpenCheck; show: boolean }> = [
    { id: "check", label: copy.test, note: uiLanguage === "ar" ? "سؤال واحد من النص" : "One focused question", icon: BookOpenCheck, show: Boolean(standard?.comprehension_check) },
    { id: "threads", label: copy.threads, note: uiLanguage === "ar" ? "تتبّع العلاقات داخل الجملة" : "Follow relationships in the sentence", icon: GitBranch, show: Boolean(standard?.meaning_threads.length) },
    { id: "insights", label: copy.insights, note: uiLanguage === "ar" ? "تعبيرات وبنية تستحق الانتباه" : "Expressions and structure worth noticing", icon: Languages, show: hasInsights },
    { id: "path", label: copy.path, note: uiLanguage === "ar" ? "اقترب من صياغة المصدر" : "Move toward the source wording", icon: Route, show: Boolean(standard?.bridge.levels.length) },
    { id: "details", label: copy.details, note: uiLanguage === "ar" ? "الأصل، الصعوبة، وسلامة المعنى" : "Source, difficulty, and integrity", icon: ShieldCheck, show: Boolean(standard) },
  ];

  return (
    <div className={`v4-explore-panel ${mobile ? "is-mobile" : ""}`}>
      <div className="v4-explore-heading">
        <div><p className="v4-kicker">{copy.explore}</p><h2>{copy.exploreTitle}</h2></div>
        {onClose && <button type="button" onClick={onClose} aria-label={copy.close}><X /></button>}
      </div>
      <div className="v4-explore-actions">
        {tools.filter((tool) => tool.show).map(({ id, label, note, icon: Icon }) => (
          <button key={id} type="button" className={active === id ? "active" : ""} onClick={() => onActive(active === id ? null : id)}>
            <span><Icon /></span><span><strong>{label}</strong><small>{note}</small></span>
          </button>
        ))}
      </div>

      {active && <section className="v4-explore-content">
        {active === "check" && standard && (
          <div className="v4-comprehension">
            <h3>{uiLanguage === "ar" ? standard.comprehension_check.question : standard.comprehension_check.question_english}</h3>
            <div>
              {(uiLanguage === "ar" ? standard.comprehension_check.choices : standard.comprehension_check.choices_english).map((choice, index) => {
                const answered = reading.comprehensionChoice !== undefined;
                const correct = answered && index === standard.comprehension_check.correct_choice_index;
                const selected = reading.comprehensionChoice === index;
                return <button key={`${index}-${choice}`} type="button" disabled={answered} className={`${selected ? "selected" : ""} ${correct ? "correct" : ""}`} onClick={() => recordComprehension(reading.id, index)}><span>{String.fromCharCode(65 + index)}</span>{choice}</button>;
              })}
            </div>
            {reading.comprehensionChoice !== undefined && <aside className={reading.comprehensionChoice === standard.comprehension_check.correct_choice_index ? "correct" : "review"}><strong>{reading.comprehensionChoice === standard.comprehension_check.correct_choice_index ? (uiLanguage === "ar" ? "وصل المعنى" : "Meaning understood") : (uiLanguage === "ar" ? "لنراجعها" : "Review this")}</strong><p>{uiLanguage === "ar" ? standard.comprehension_check.answer : standard.comprehension_check.answer_english}</p></aside>}
          </div>
        )}

        {active === "threads" && standard && <MeaningThreads threads={standard.meaning_threads} language={uiLanguage} />}

        {active === "insights" && (
          <div className="v4-insights">
            {(standard?.cultural_meanings ?? poetry?.cultural_meanings ?? []).map((item, index) => <article key={`${index}-${item.expression}`}><strong dir="rtl">{item.expression}</strong><p>{uiLanguage === "ar" ? item.intended_meaning : item.english_meaning}</p><small>{uiLanguage === "ar" ? item.cultural_context : item.cultural_context_english}</small></article>)}
            {standard?.change_map.slice(0, 3).map((change, index) => <article key={`${index}-${change.original}`}><strong dir="rtl">{change.original} ← {change.clear}</strong><p>{uiLanguage === "ar" ? change.reason : change.reason_english}</p></article>)}
            {(uiLanguage === "ar" ? standard?.visual_steps : standard?.visual_steps_english)?.map((step, index) => <article key={`${index}-${step}`}><strong>{index + 1}</strong><p>{step}</p></article>)}
          </div>
        )}

        {active === "path" && standard && (
          <div className="v4-bridge-list">
            <p>{uiLanguage === "ar" ? standard.bridge.guidance : standard.bridge.guidance_english}</p>
            {standard.bridge.levels.map((level) => <article key={level.level}><span>{level.level}</span><div><small>{uiLanguage === "ar" ? level.label_ar : level.label_en}</small><p dir="rtl">{level.text}</p>{level.reintroduced_items.map((item, index) => <blockquote key={`${index}-${item.richer_phrase}`}><strong dir="rtl">{item.simpler_phrase} ← {item.richer_phrase}</strong><small>{uiLanguage === "ar" ? item.explanation : item.explanation_english}</small></blockquote>)}</div></article>)}
            <Link href="/learning/path">{copy.viewPath}</Link>
          </div>
        )}

        {active === "details" && standard && (
          <div className="v4-reading-details">
            {standard.original_text && <details><summary>{copy.original}</summary><p dir="rtl">{standard.original_text}</p></details>}
            <details><summary>{copy.readability}</summary><div className="v4-detail-metrics"><span><strong>{standard.readability.deterministic.sentence_count}</strong>{uiLanguage === "ar" ? "جمل" : "Sentences"}</span><span><strong>{standard.readability.deterministic.word_count}</strong>{uiLanguage === "ar" ? "كلمات" : "Words"}</span><span><strong>{standard.readability.deterministic.average_sentence_length}</strong>{uiLanguage === "ar" ? "متوسط الجملة" : "Avg. sentence"}</span></div></details>
            <details><summary>{copy.integrity}</summary><div className="v4-integrity"><strong>{standard.meaning_integrity.status === "needs_attention" ? (uiLanguage === "ar" ? "يحتاج إلى مراجعة" : "Needs review") : (uiLanguage === "ar" ? "لم نرصد مشكلة" : "No issue detected")}</strong>{standard.meaning_integrity.warnings.map((warning) => <p key={warning}>{warning}</p>)}{standard.preserved_details.map((detail) => <span key={detail} dir="rtl">{detail}</span>)}</div></details>
          </div>
        )}
      </section>}
    </div>
  );
}
