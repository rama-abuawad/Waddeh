"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Bookmark, Route } from "lucide-react";

import { useWaddeh } from "@/components/waddeh-provider";
import { copyFor } from "@/lib/v4-copy";
import { learnerLevels, readingPreview } from "@/lib/waddeh-store";

export default function LearningOverview() {
  const { hydrated, uiLanguage, readings, savedWords, profile } = useWaddeh();
  const copy = copyFor(uiLanguage).learning;
  const recent = readings.filter((reading) => reading.status === "ready").sort((a, b) => Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt)).slice(0, 3);
  const review = savedWords.filter((word) => word.mastery !== "mastered").slice(0, 5);
  const level = learnerLevels.find((item) => item.value === profile.preferredLevel);

  if (!hydrated) return <div className="v4-learning-loading"><span /><span /><span /></div>;

  if (recent.length === 0 && savedWords.length === 0) {
    return <section className="v4-learning-empty"><BookOpenText /><h2>{uiLanguage === "ar" ? "ابدأ بفهم شيء يهمك" : "Start with Arabic that matters to you"}</h2><p>{uiLanguage === "ar" ? "ستظهر قراءاتك وكلماتك ومسارك هنا من دون الحاجة إلى حساب." : "Your readings, words, and path will appear here without requiring an account."}</p><Link href="/">{copy.start}</Link></section>;
  }

  return (
    <div className="v4-overview-grid">
      <section className="v4-overview-primary">
        <div className="v4-section-heading"><div><p className="v4-kicker">{copy.continue}</p><h2>{uiLanguage === "ar" ? "العربية التي ما زالت قريبة" : "Arabic still close at hand"}</h2></div><Link href="/learning/history">{copy.allReadings}<ArrowRight /></Link></div>
        <div className="v4-reading-rows">{recent.map((reading) => <Link key={reading.id} href={`/reading/${reading.id}`}><span className="v4-row-icon"><BookOpenText /></span><div><strong dir="rtl">{reading.title}</strong><p>{readingPreview(reading, uiLanguage).slice(0, 150)}</p><small>{new Intl.DateTimeFormat(uiLanguage === "ar" ? "ar-AE" : "en-AE", { dateStyle: "medium" }).format(new Date(reading.updatedAt))}</small></div><ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></Link>)}</div>
      </section>

      <aside className="v4-overview-side">
        <section><div className="v4-side-heading"><Bookmark /><div><p className="v4-kicker">{copy.readyReview}</p><h2>{review.length} {uiLanguage === "ar" ? "تنتظر عودة قصيرة" : "worth a quick return"}</h2></div></div>{review.length > 0 ? <div className="v4-word-chips">{review.map((word) => <Link key={word.id} href="/learning/vocabulary"><strong dir="rtl">{word.diacritized_word}</strong><span>{uiLanguage === "ar" ? word.meaning : word.english}</span></Link>)}</div> : <p>{uiLanguage === "ar" ? "لا توجد كلمات تحتاج مراجعة الآن." : "No words need review right now."}</p>}<Link className="v4-text-link" href="/learning/vocabulary">{copy.vocabulary}<ArrowRight /></Link></section>
        <section><div className="v4-side-heading"><Route /><div><p className="v4-kicker">{copy.path}</p><h2>{level?.[uiLanguage] ?? profile.preferredLevel}</h2></div></div><p>{profile.hasPlacementResult ? (uiLanguage === "ar" ? "نقطة البداية مبنية على إجاباتك وتتكيّف مع اختبارات الفهم." : "Your starting point comes from your answers and adapts through comprehension checks.") : (uiLanguage === "ar" ? "يمكنك تثبيت المستوى أو إجراء اختبار قصير." : "Choose a fixed level or take the short placement check.")}</p><Link className="v4-text-link" href="/learning/path">{copy.path}<ArrowRight /></Link></section>
      </aside>
    </div>
  );
}
