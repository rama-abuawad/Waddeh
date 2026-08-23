"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, House, LogIn, UserRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { useWaddeh } from "@/components/waddeh-provider";
import { copyFor } from "@/lib/v4-copy";

const navItems = [
  { href: "/", key: "home" as const, icon: House },
  { href: "/learning", key: "learning" as const, icon: BookOpenText },
  { href: "/profile", key: "profile" as const, icon: UserRound },
];

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
      <header className={`v4-topbar ${usesHeroNavbar ? "is-home" : ""}`}>
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
            <Link href="/#start" className="v4-navbar-cta">
              <span>{copy.start}</span>
            </Link>
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
