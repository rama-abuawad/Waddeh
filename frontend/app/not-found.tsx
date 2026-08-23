"use client";

import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { useWaddeh } from "@/components/waddeh-provider";

export default function NotFound() {
  const { uiLanguage } = useWaddeh();
  return <div className="v4-state-page"><BookOpenText /><h1>{uiLanguage === "ar" ? "هذه الصفحة ليست هنا" : "This page is not here"}</h1><p>{uiLanguage === "ar" ? "يمكنك العودة إلى وضّح وبدء قراءة جديدة." : "Return to Waddeh and start understanding a new Arabic text."}</p><Link href="/">{uiLanguage === "ar" ? "العودة إلى الرئيسية" : "Return home"}</Link></div>;
}
