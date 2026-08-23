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
    { href: "/learning/map", label: copy.map },
  ];
  const activeItem = items.find((item) => item.exact ? pathname === item.href : pathname.startsWith(item.href)) ?? items[0];
  const descriptions = {
    "/learning/vocabulary": uiLanguage === "ar" ? "الكلمات والتعبيرات التي حفظتها من قراءاتك." : "Words and expressions saved from your readings.",
    "/learning/history": uiLanguage === "ar" ? "العربية التي يمكنك العودة إليها ومتابعة فهمها." : "Arabic you can return to and keep understanding.",
    "/learning/path": uiLanguage === "ar" ? "تقدّمك من العربية الأوضح نحو صياغة المصدر." : "Your progress from clearer Arabic toward the source wording.",
    "/learning/map": uiLanguage === "ar" ? "صورة واضحة لما تفهمه الآن، وما ينمو مع كل قراءة." : "A clear view of what you understand now and what grows with each reading.",
  } as const;
  const description = pathname === "/learning" ? copy.description : descriptions[pathname as keyof typeof descriptions];
  return (
    <header className="v4-learning-header">
      <div><p className="v4-kicker">{copy.title}</p><h1>{pathname === "/learning" ? copy.title : activeItem.label}</h1>{description && <p className="v4-learning-description">{description}</p>}</div>
      <div className="v4-learning-nav-wrap">
        <nav aria-label={uiLanguage === "ar" ? "أقسام تعلّمي" : "My Learning sections"}>
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={active ? "active" : ""}>{item.label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
