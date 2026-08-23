"use client";

import { BarChart3, BookOpenText, CheckCircle2, Compass, Route } from "lucide-react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { MeaningThreadKind } from "@/lib/api";
import { learnerLevels } from "@/lib/waddeh-store";

function focusLabel(kind: MeaningThreadKind, language: "ar" | "en"): string {
  const labels: Record<MeaningThreadKind, { ar: string; en: string }> = {
    pronoun: { ar: "الضمائر", en: "Pronouns" },
    actor: { ar: "الفاعل", en: "Actors" },
    connector: { ar: "روابط الأفكار", en: "Connectors" },
    negation: { ar: "النفي", en: "Negation" },
    condition: { ar: "الشرط والنتيجة", en: "Conditions" },
    reference: { ar: "مراجع العبارات", en: "References" },
  };
  return labels[kind][language];
}

export default function LearningMapPage() {
  const { hydrated, uiLanguage, profile, readings, savedWords } = useWaddeh();
  const isArabic = uiLanguage === "ar";

  if (!hydrated) return <div className="v4-learning-loading"><span /><span /><span /></div>;

  const completedReadings = readings.filter((reading) => reading.status === "ready");
  const learningWords = savedWords.filter((word) => word.mastery === "learning").length;
  const masteredWords = savedWords.filter((word) => word.mastery === "mastered").length;
  const totalChecks = profile.understoodChecks + profile.reviewChecks;
  const understandingRate = totalChecks > 0 ? Math.round((profile.understoodChecks / totalChecks) * 100) : null;
  const topFocus = (Object.entries(profile.difficultySignals) as Array<[MeaningThreadKind, number]>)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1])[0];

  return (
    <div className="v4-learning-map">
      <section className="v4-map-intro">
        <span><Compass /></span>
        <div>
          <p className="v4-kicker">{isArabic ? "خريطة التعلّم" : "Learning Map"}</p>
          <h2>{isArabic ? "تتّضح رحلتك مع كل نص." : "Your path becomes clearer with every text."}</h2>
          <p>{isArabic ? "هذه الخريطة تجمع ما قرأته، وما راجعته، وما يحتاج إلى عودة هادئة." : "This map brings together what you have read, reviewed, and may want to revisit."}</p>
        </div>
      </section>

      <section className="v4-map-metrics" aria-label={isArabic ? "ملخص التعلّم" : "Learning summary"}>
        <article><span><BookOpenText /></span><div><b>{completedReadings.length}</b><p>{isArabic ? "قراءة مكتملة" : "completed readings"}</p></div></article>
        <article><span><BarChart3 /></span><div><b>{savedWords.length}</b><p>{isArabic ? `كلمة محفوظة · ${learningWords} قيد التعلّم` : `saved words · ${learningWords} in progress`}</p></div></article>
        <article><span><CheckCircle2 /></span><div><b>{understandingRate === null ? "—" : `${profile.understoodChecks} / ${totalChecks}`}</b><p>{totalChecks === 0 ? (isArabic ? "بانتظار أول اختبار فهم" : "waiting for a first comprehension check") : (isArabic ? `${understandingRate}% صحيحة في اختبارات الفهم` : `${understandingRate}% correct across comprehension checks`)}</p></div></article>
      </section>

      <section className="v4-map-route" aria-labelledby="map-route-title">
        <div className="v4-map-section-heading"><div><p className="v4-kicker">{isArabic ? "مسارك الآن" : "Your current route"}</p><h2 id="map-route-title">{isArabic ? "من الوضوح إلى النص كما كُتب" : "From clarity to the text as written"}</h2></div><span><Route /></span></div>
        <ol>
          {learnerLevels.map((level) => {
            const reached = level.value <= profile.highestBridgeLevel;
            const current = level.value === profile.preferredLevel;
            return <li key={level.value} className={`${reached ? "reached" : ""} ${current ? "current" : ""}`}><span>{reached ? <CheckCircle2 /> : level.value}</span><div><strong>{level[uiLanguage]}</strong><small>{isArabic ? level.hintAr : level.hintEn}</small></div>{current && <em>{isArabic ? "مستواك الحالي" : "Your current level"}</em>}</li>;
          })}
        </ol>
      </section>

      <section className="v4-map-insight">
        <div><p className="v4-kicker">{isArabic ? "قراءة الخريطة" : "Reading your map"}</p><h2>{topFocus ? (isArabic ? `أعطِ ${focusLabel(topFocus[0], uiLanguage)} مساحة أكبر في القراءة القادمة.` : `Give ${focusLabel(topFocus[0], uiLanguage).toLowerCase()} more attention in your next reading.`) : (isArabic ? "أضف قراءة وافتح خيوط المعنى لتبدأ الخريطة بالكشف عن مسارك." : "Add a reading and open Meaning Threads to let the map reveal your path.")}</h2></div>
        <p>{masteredWords > 0 ? (isArabic ? `${masteredWords} من كلماتك أصبحت مستقرة في ذاكرتك، وما تبقّى ينمو مع المراجعة والاستخدام.` : `${masteredWords} of your saved words are established; the rest grow through review and use.`) : (isArabic ? "لا نحكم على التقدّم من قراءة واحدة؛ تتكوّن الصورة كلما فهمت نصاً وعدت إلى مفرداته." : "Progress is not judged from one reading; the picture takes shape as you understand texts and revisit their vocabulary.")}</p>
      </section>
    </div>
  );
}
