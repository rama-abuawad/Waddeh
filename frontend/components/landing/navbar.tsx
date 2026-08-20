'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { UiLanguage } from '@/lib/ui-copy';

interface LandingNavbarProps {
  uiLanguage: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
}

export default function LandingNavbar({
  uiLanguage,
  onLanguageChange,
}: LandingNavbarProps) {
  const isArabic = uiLanguage === 'ar';

  return (
    <nav className="relative z-20 mx-auto flex w-full max-w-[90rem] items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-10">
      <a
        href="#reader"
        aria-label={isArabic ? 'وضّح - انتقل إلى القارئ' : 'Waddeh - go to reader'}
        className="flex min-w-0 items-center gap-3 rounded-full border border-white/15 bg-white/10 px-2.5 py-2 text-white shadow-[0_16px_55px_rgba(5,62,56,0.16)] backdrop-blur-xl transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75 sm:px-3"
      >
        <Image
          src="/brand/Waddeh_Brand/waddeh-icon.svg"
          alt=""
          width={40}
          height={40}
          priority
          className="size-9 shrink-0 rounded-2xl sm:size-10"
        />
        <span className="hidden leading-none sm:block">
          <span className="block text-sm font-black">Waddeh</span>
          <span className="mt-1 block text-[11px] font-bold text-white/60">وضّح</span>
        </span>
      </a>

      <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
        <a
          href="#how-it-works"
          className="hidden min-h-10 items-center rounded-full px-4 text-sm font-black text-white/75 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75 sm:inline-flex"
        >
          {isArabic ? 'كيف يعمل' : 'How it works'}
        </a>
        <div
          dir="ltr"
          className="inline-flex rounded-full border border-white/15 bg-white/10 p-1 shadow-[0_12px_36px_rgba(5,62,56,0.14)] backdrop-blur-xl"
          aria-label={isArabic ? 'اختيار اللغة' : 'Language'}
          role="group"
        >
          <button
            type="button"
            aria-pressed={isArabic}
            onClick={() => onLanguageChange('ar')}
            className={`min-h-9 rounded-full px-2.5 text-xs font-black transition-all sm:px-3 ${
              isArabic ? 'bg-white text-[#064f46]' : 'text-white/60 hover:text-white'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            aria-pressed={!isArabic}
            onClick={() => onLanguageChange('en')}
            className={`min-h-9 rounded-full px-2.5 text-xs font-black transition-all sm:px-3 ${
              !isArabic ? 'bg-white text-[#064f46]' : 'text-white/60 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
        <Link
          href="/auth"
          className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-white px-3 text-xs font-black text-[#064f46] shadow-[0_18px_46px_rgba(5,62,56,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75 active:scale-[0.98] sm:min-h-11 sm:px-4 sm:text-sm"
        >
          {isArabic ? 'تسجيل الدخول' : 'Sign in'}
        </Link>
      </div>
    </nav>
  );
}
