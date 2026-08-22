"use client";

import Link from "next/link";
import { BookOpenText, Languages, LogIn, UserRound } from "lucide-react";

import { useWaddeh } from "@/components/waddeh-provider";
import { learnerLevels } from "@/lib/waddeh-store";

export default function ProfilePage() {
  const { uiLanguage, setUiLanguage, profile, savedWords, readings } = useWaddeh();
  const level = learnerLevels.find((item) => item.value === profile.preferredLevel);
  return (
    <div className="v4-profile-page">
      <section className="v4-profile-intro"><span><UserRound /></span><div><p className="v4-kicker">{uiLanguage === "ar" ? "الملف المحلي" : "Local profile"}</p><h1>{uiLanguage === "ar" ? "تعلّمك محفوظ على هذا الجهاز" : "Your learning stays on this device"}</h1><p>{uiLanguage === "ar" ? "يمكنك فهم العربية وحفظ الكلمات ومتابعة القراءات من دون حساب." : "You can understand Arabic, save words, and continue readings without an account."}</p></div></section>
      <div className="v4-profile-sections">
        <section><div><BookOpenText /><span><small>{uiLanguage === "ar" ? "ملخص محلي" : "Local summary"}</small><strong>{readings.filter((reading) => reading.status === "ready").length} {uiLanguage === "ar" ? "قراءات" : "readings"} · {savedWords.length} {uiLanguage === "ar" ? "كلمات" : "words"}</strong></span></div><Link href="/learning">{uiLanguage === "ar" ? "افتح تعلّمي" : "Open My Learning"}</Link></section>
        <section><div><Languages /><span><small>{uiLanguage === "ar" ? "لغة الواجهة" : "Interface language"}</small><strong>{uiLanguage === "ar" ? "العربية" : "English"}</strong></span></div><button type="button" onClick={() => setUiLanguage(uiLanguage === "ar" ? "en" : "ar")}>{uiLanguage === "ar" ? "English" : "العربية"}</button></section>
        <section><div><BookOpenText /><span><small>{uiLanguage === "ar" ? "مستوى القراءة" : "Reading level"}</small><strong>{level?.[uiLanguage]}</strong></span></div><Link href="/learning/path">{uiLanguage === "ar" ? "عدّل المسار" : "Adjust path"}</Link></section>
      </div>
      <section className="v4-profile-signin"><LogIn /><div><h2>{uiLanguage === "ar" ? "احتفظ بتعلّمك عبر الأجهزة" : "Keep learning across devices"}</h2><p>{uiLanguage === "ar" ? "تسجيل الدخول ما زال اختيارياً. المزامنة السحابية ستأتي بعد استقرار تجربة V4 الأساسية." : "Signing in remains optional. Cloud sync follows after the core V4 experience is stable."}</p></div><Link href="/auth">{uiLanguage === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></section>
    </div>
  );
}
