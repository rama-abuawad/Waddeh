"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useWaddeh } from "@/components/waddeh-provider";
import { copyFor } from "@/lib/v4-copy";

export default function LearningHeader() {
  const pathname = usePathname();
  const { uiLanguage } = useWaddeh();
  const copy = copyFor(uiLanguage).learning;
  const items = [
    { href: "/learning", label: copy.overview, exact: true },
    { href: "/learning/vocabulary", label: copy.vocabulary },
    { href: "/learning/history", label: copy.history },
    { href: "/learning/path", label: copy.path },
  ];
  return (
    <header className="v4-learning-header">
      <div><p className="v4-kicker">{copy.title}</p><h1>{copy.description}</h1></div>
      <nav aria-label={uiLanguage === "ar" ? "أقسام تعلّمي" : "My Learning sections"}>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}>{item.label}</Link>;
        })}
      </nav>
    </header>
  );
}
