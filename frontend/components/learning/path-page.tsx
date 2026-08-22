"use client";

import { Check, ChevronDown, Route } from "lucide-react";
import { useState } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { MeaningThreadKind } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import { learnerLevels, placementQuestions } from "@/lib/waddeh-store";

function signalLabel(kind: MeaningThreadKind, language: "ar" | "en"): string {
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

export default function PathPage() {
  const { uiLanguage, profile, readings, setPreferredLevel, completePlacement } = useWaddeh();
  const copy = copyFor(uiLanguage).learning;
  const [placementOpen, setPlacementOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const currentLevel = learnerLevels.find((item) => item.value === profile.preferredLevel)!;
  const signals = (Object.entries(profile.difficultySignals) as Array<[MeaningThreadKind, number]>).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const bridgeReadings = readings.filter((reading) => reading.status === "ready" && reading.result?.kind === "standard").slice(0, 3);

  function continuePlacement() {
    if (choice === null) return;
    const nextScore = score + (choice === placementQuestions[step].correctIndex ? 1 : 0);
    if (step === placementQuestions.length - 1) {
      completePlacement(nextScore);
      setPlacementOpen(false); setStep(0); setScore(0); setChoice(null);
    } else {
      setScore(nextScore); setStep((value) => value + 1); setChoice(null);
    }
  }

  return (
    <div className="v4-path-page">
      <section className="v4-path-lead">
        <div className="v4-path-level"><span>{profile.preferredLevel}</span><div><p className="v4-kicker">{copy.level}</p><h2>{currentLevel[uiLanguage]}</h2><p>{profile.levelMode === "manual" ? (uiLanguage === "ar" ? "اخترت هذا المستوى؛ سيبقى ثابتاً حتى تغيّره." : "You chose this level; it stays fixed until you change it.") : profile.hasPlacementResult ? (uiLanguage === "ar" ? "بُني على إجاباتك ويتكيّف تدريجياً مع الفهم." : "Based on your answers and adjusted gradually through comprehension.") : (uiLanguage === "ar" ? "تقدير مبدئي يمكنك تأكيده باختبار قصير." : "An initial estimate you can confirm with a short check.")}</p></div></div>
        <div className="v4-path-actions"><button type="button" onClick={() => { setPlacementOpen((value) => !value); setManualOpen(false); }}>{copy.placement}<ChevronDown className={placementOpen ? "open" : ""} /></button><button type="button" onClick={() => { setManualOpen((value) => !value); setPlacementOpen(false); }}>{copy.manual}<ChevronDown className={manualOpen ? "open" : ""} /></button></div>

        {manualOpen && <div className="v4-manual-levels">{learnerLevels.map((item) => <button key={item.value} type="button" className={profile.preferredLevel === item.value && profile.levelMode === "manual" ? "active" : ""} onClick={() => { setPreferredLevel(item.value, "manual"); setManualOpen(false); }}><span>{item.value}</span><strong>{item[uiLanguage]}</strong><small>{uiLanguage === "ar" ? item.hintAr : item.hintEn}</small></button>)}</div>}

        {placementOpen && <div className="v4-placement"><header><span>{uiLanguage === "ar" ? `السؤال ${step + 1} من ${placementQuestions.length}` : `Question ${step + 1} of ${placementQuestions.length}`}</span><i><b style={{ width: `${((step + 1) / placementQuestions.length) * 100}%` }} /></i></header><blockquote dir="rtl">{placementQuestions[step].text}</blockquote><h3>{uiLanguage === "ar" ? placementQuestions[step].questionAr : placementQuestions[step].questionEn}</h3><div>{(uiLanguage === "ar" ? placementQuestions[step].choicesAr : placementQuestions[step].choicesEn).map((item, index) => <button key={item} type="button" disabled={choice !== null} className={`${choice === index ? "selected" : ""} ${choice !== null && index === placementQuestions[step].correctIndex ? "correct" : ""}`} onClick={() => setChoice(index)}><span>{String.fromCharCode(65 + index)}</span>{item}</button>)}</div>{choice !== null && <footer><p>{choice === placementQuestions[step].correctIndex ? (uiLanguage === "ar" ? "إجابة صحيحة." : "Correct.") : (uiLanguage === "ar" ? "سنستخدم هذه الإجابة لاختيار بداية أنسب." : "This helps Waddeh choose a better starting point.")}</p><button type="button" onClick={continuePlacement}>{step === placementQuestions.length - 1 ? (uiLanguage === "ar" ? "اعرض مستواي" : "Show my level") : (uiLanguage === "ar" ? "السؤال التالي" : "Next question")}</button></footer>}</div>}
      </section>

      <div className="v4-path-columns">
        <section><p className="v4-kicker">{copy.checks}</p><h2>{profile.understoodChecks + profile.reviewChecks} {uiLanguage === "ar" ? "إجابات مسجّلة" : "recorded answers"}</h2><p>{uiLanguage === "ar" ? `${profile.understoodChecks} فهمتها · ${profile.reviewChecks} احتاجت مراجعة` : `${profile.understoodChecks} understood · ${profile.reviewChecks} needed review`}</p></section>
        <section><p className="v4-kicker">{copy.bridge}</p><h2>{profile.highestBridgeLevel}</h2><p>{uiLanguage === "ar" ? "المستوى الأعلى الذي فتحته في مسار العودة إلى صياغة المصدر." : "The highest level reached while moving back toward source wording."}</p></section>
      </div>

      <section className="v4-needs-attention"><p className="v4-kicker">{copy.needsAttention}</p>{signals.length > 0 ? <div>{signals.map(([kind, count]) => <span key={kind}>{signalLabel(kind, uiLanguage)}<b>{count}</b></span>)}</div> : <p>{copy.noSignals}</p>}</section>

      {bridgeReadings.length > 0 && <section className="v4-reading-paths"><div><p className="v4-kicker">{uiLanguage === "ar" ? "من قراءاتك" : "From your readings"}</p><h2>{uiLanguage === "ar" ? "مسارات يمكنك العودة إليها" : "Paths you can revisit"}</h2></div>{bridgeReadings.map((reading) => { const result = reading.result?.kind === "standard" ? reading.result.data : null; return result && <article key={reading.id}><span><Route /></span><div><strong dir="rtl">{reading.title}</strong><p>{uiLanguage === "ar" ? result.bridge.guidance : result.bridge.guidance_english}</p></div><Check /></article>; })}</section>}
    </div>
  );
}
