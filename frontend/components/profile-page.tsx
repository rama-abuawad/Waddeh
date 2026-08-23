"use client";

import Link from "next/link";
import { BookOpenText, Cloud, Languages, LogIn, LogOut, MailCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { authErrorMessage, useAuth } from "@/components/auth-provider";
import { useWaddeh } from "@/components/waddeh-provider";
import { learnerLevels } from "@/lib/waddeh-store";

export default function ProfilePage() {
  const { uiLanguage, setUiLanguage, profile, savedWords, readings, cloudSync } = useWaddeh();
  const { user, loading, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState("");
  const level = learnerLevels.find((item) => item.value === profile.preferredLevel);
  const syncLabel = cloudSync.state === "synced"
    ? uiLanguage === "ar" ? "تمت المزامنة" : "Synced"
    : cloudSync.state === "syncing"
      ? uiLanguage === "ar" ? "جارٍ الحفظ…" : "Saving…"
      : cloudSync.state === "offline"
        ? uiLanguage === "ar" ? "محفوظ محلياً — سنحاول المزامنة لاحقاً" : "Saved locally — sync will retry later"
        : uiLanguage === "ar" ? "محفوظ على هذا الجهاز" : "Saved on this device";

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
    } catch (error) {
      setSignOutError(authErrorMessage(error, uiLanguage));
    }
  };

  return (
    <div className="v4-profile-page">
      <section className="v4-profile-intro"><span><UserRound /></span><div><p className="v4-kicker">{user ? (uiLanguage === "ar" ? "حساب وضّح" : "Waddeh account") : (uiLanguage === "ar" ? "الملف المحلي" : "Local profile")}</p><h1>{user ? (user.displayName ?? user.email ?? (uiLanguage === "ar" ? "ملفك الشخصي" : "Your profile")) : (uiLanguage === "ar" ? "تعلّمك محفوظ على هذا الجهاز" : "Your learning stays on this device")}</h1><p>{user ? (uiLanguage === "ar" ? "يتوفر تقدمك على أجهزتك عند الاتصال، ويظل وضّح قابلاً للاستخدام إذا انقطع الاتصال." : "Your progress is available across devices when connected, and Waddeh remains usable offline.") : (uiLanguage === "ar" ? "يمكنك فهم العربية وحفظ الكلمات ومتابعة القراءات من دون حساب." : "You can understand Arabic, save words, and continue readings without an account.")}</p></div></section>
      <div className="v4-profile-sections">
        <section><div><BookOpenText /><span><small>{user ? (uiLanguage === "ar" ? "ملخص التعلّم" : "Learning summary") : (uiLanguage === "ar" ? "ملخص محلي" : "Local summary")}</small><strong>{readings.filter((reading) => reading.status === "ready").length} {uiLanguage === "ar" ? "قراءات" : "readings"} · {savedWords.length} {uiLanguage === "ar" ? "كلمات" : "words"}</strong></span></div><Link href="/learning">{uiLanguage === "ar" ? "افتح تعلّمي" : "Open My Learning"}</Link></section>
        <section><div><Languages /><span><small>{uiLanguage === "ar" ? "لغة الواجهة" : "Interface language"}</small><strong>{uiLanguage === "ar" ? "العربية" : "English"}</strong></span></div><button type="button" onClick={() => setUiLanguage(uiLanguage === "ar" ? "en" : "ar")}>{uiLanguage === "ar" ? "English" : "العربية"}</button></section>
        <section><div><BookOpenText /><span><small>{uiLanguage === "ar" ? "مستوى القراءة" : "Reading level"}</small><strong>{level?.[uiLanguage]}</strong></span></div><Link href="/learning/path">{uiLanguage === "ar" ? "عدّل المسار" : "Adjust path"}</Link></section>
        {user && <section><div><Cloud /><span><small>{uiLanguage === "ar" ? "حالة الحفظ" : "Save status"}</small><strong>{syncLabel}</strong></span></div><span aria-hidden="true" /></section>}
        {user?.email && <section><div><MailCheck /><span><small>{uiLanguage === "ar" ? "البريد الإلكتروني" : "Email"}</small><strong dir="ltr">{user.email}</strong></span></div><span>{user.emailVerified ? (uiLanguage === "ar" ? "موثّق" : "Verified") : (uiLanguage === "ar" ? "بانتظار التوثيق" : "Verification pending")}</span></section>}
      </div>
      {!loading && (user ? <section className="v4-profile-signin"><LogOut /><div><h2>{uiLanguage === "ar" ? "إدارة الجلسة" : "Account session"}</h2><p>{uiLanguage === "ar" ? "تسجيل الخروج يعيدك إلى ملف الضيف المحلي من دون حذف بيانات حسابك." : "Signing out returns to the local guest profile without deleting account data."}</p>{signOutError && <p role="alert">{signOutError}</p>}</div><button type="button" onClick={handleSignOut}>{uiLanguage === "ar" ? "تسجيل الخروج" : "Sign out"}</button></section> : <section className="v4-profile-signin"><LogIn /><div><h2>{uiLanguage === "ar" ? "تعلّم بطريقتك" : "Learn your way"}</h2><p>{uiLanguage === "ar" ? "تسجيل الدخول اختياري. عند إنشاء حساب، تُنسخ بيانات الضيف بأمان وتبقى نسختها المحلية محفوظة." : "Signing in is optional. When you create an account, guest data is safely copied while the local version is retained."}</p></div><Link href="/auth">{uiLanguage === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></section>)}
    </div>
  );
}
