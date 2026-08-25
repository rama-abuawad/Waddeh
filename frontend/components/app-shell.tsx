"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, House, LogIn, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { useWaddeh } from "@/components/waddeh-provider";
import { copyFor } from "@/lib/v4-copy";

const navItems = [
  { href: "/", key: "home" as const, icon: House },
  { href: "/learning", key: "learning" as const, icon: BookOpenText },
  { href: "/profile", key: "profile" as const, icon: UserRound },
];

function ReadingSizeControl() {
  const { uiLanguage, readingSize, setReadingSize } = useWaddeh();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const choices = [
    { value: "smaller" as const, en: "Smaller", ar: "أصغر" },
    { value: "default" as const, en: "Default", ar: "افتراضي" },
    { value: "larger" as const, en: "Larger", ar: "أكبر" },
  ];
  const label = uiLanguage === "ar" ? "حجم القراءة" : "Reading size";

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-size="${readingSize}"]`)?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (rootRef.current && !event.composedPath().includes(rootRef.current)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open, readingSize]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    buttons[(currentIndex + delta + buttons.length) % buttons.length]?.focus();
  }

  return (
    <div ref={rootRef} className="v4-reading-size-control">
      <button
        ref={triggerRef}
        type="button"
        className="v4-reading-size-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="reading-size-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <b aria-hidden="true">Aa</b><span>{label}</span>
      </button>
      {open && (
        <div id="reading-size-menu" className="v4-reading-size-menu" role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
          {choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              role="menuitemradio"
              aria-checked={readingSize === choice.value}
              data-size={choice.value}
              onClick={() => { setReadingSize(choice.value); setOpen(false); triggerRef.current?.focus(); }}
            >
              <span>{uiLanguage === "ar" ? choice.ar : choice.en}</span><b aria-hidden="true">{choice.value === "smaller" ? "A" : choice.value === "larger" ? "A+" : "Aa"}</b>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { uiLanguage, setUiLanguage } = useWaddeh();
  const copy = copyFor(uiLanguage).shell;
  const usesHeroNavbar = pathname === "/" || pathname.startsWith("/learning");
  const isReadingWorkspace = pathname.startsWith("/reading/");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (pathname.startsWith("/auth")) return <>{children}</>;

  if (pathname === "/") {
    return (
      <div className="v4-app-shell v6-root-shell">
        <a className="v4-skip-link" href="#main-content">{uiLanguage === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
        <main id="main-content" className="v4-main v6-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="v4-app-shell">
      <a className="v4-skip-link" href="#main-content">{uiLanguage === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
      <header className={`v4-topbar ${usesHeroNavbar ? "is-home" : ""} ${isReadingWorkspace ? "is-reading" : ""}`}>
        <div className="v4-topbar-inner">
          <Link href="/" className="v4-wordmark" aria-label={uiLanguage === "ar" ? "وضّح — الرئيسية" : "Waddeh — Home"}>
            <Image src="/brand/Waddeh_Brand/waddeh-icon.svg" alt="" width={40} height={40} priority />
            <span><b>Waddeh</b><small>وضّح</small></span>
          </Link>
          <nav className="v4-desktop-nav" aria-label={uiLanguage === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
            <Link href="/" className={isActive(pathname, "/") ? "active" : ""}>{copy.home}</Link>
            <Link href="/learning" className={isActive(pathname, "/learning") ? "active" : ""}>{copy.learning}</Link>
            <Link href="/profile" className={isActive(pathname, "/profile") ? "active" : ""}>{copy.profile}</Link>
          </nav>
          <div className="v4-topbar-actions">
            <button type="button" className="v4-language-button" onClick={() => setUiLanguage(uiLanguage === "ar" ? "en" : "ar")}>{copy.language}</button>
            {!authLoading && <Link href={user ? "/profile" : "/auth"} className="v4-login-button">
              {user ? <UserRound aria-hidden="true" /> : <LogIn aria-hidden="true" />}
              <span className={user ? "max-w-32 truncate" : ""}>{user ? (user.displayName ?? user.email ?? copy.profile) : copy.signIn}</span>
            </Link>}
            {isReadingWorkspace ? <ReadingSizeControl /> : <Link href="/#start" className="v4-navbar-cta">
              <span>{copy.start}</span>
            </Link>}
          </div>
        </div>
      </header>
      <main id="main-content" className="v4-main">{children}</main>
      <nav className="v4-mobile-nav" aria-label={uiLanguage === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
        {navItems.map(({ href, key, icon: Icon }) => (
          <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""}>
            <Icon aria-hidden="true" />
            <span>{copy[key]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
