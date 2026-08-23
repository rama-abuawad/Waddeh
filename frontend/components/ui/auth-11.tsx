'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';

import { useWaddeh } from '@/components/waddeh-provider';

type AuthMode = 'signIn' | 'create';
const brandIcon = '/brand/Waddeh_Brand/waddeh-icon.svg';

const copy = {
  ar: {
    dir: 'rtl',
    product: 'Waddeh',
    languageToggle: 'English',
    eyebrow: 'رفيق القراءة العربية',
    modes: {
      signIn: {
        tab: 'تسجيل الدخول',
        title: 'مرحباً بعودتك',
        subtitle: 'تابع من حيث توقفت.',
        primary: 'تسجيل الدخول',
        switchPrompt: 'ليس لديك حساب؟',
        switchAction: 'أنشئ حسابًا',
      },
      create: {
        tab: 'إنشاء حساب',
        title: 'أنشئ حسابك',
        subtitle: 'ابدأ بحفظ تقدمك في قراءة العربية.',
        primary: 'إنشاء حساب',
        switchPrompt: 'لديك حساب؟',
        switchAction: 'تسجيل الدخول',
      },
    },
    google: 'المتابعة باستخدام Google',
    guest: 'المتابعة كضيف',
    divider: 'أو',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
  },
  en: {
    dir: 'ltr',
    product: 'Waddeh',
    languageToggle: 'العربية',
    eyebrow: 'Adaptive Arabic reading',
    modes: {
      signIn: {
        tab: 'Sign in',
        title: 'Welcome back',
        subtitle: 'Continue where you left off.',
        primary: 'Sign in',
        switchPrompt: 'New to Waddeh?',
        switchAction: 'Create account',
      },
      create: {
        tab: 'Create account',
        title: 'Create your account',
        subtitle: 'Start saving your Arabic reading progress.',
        primary: 'Create account',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in',
      },
    },
    google: 'Continue with Google',
    guest: 'Continue as guest',
    divider: 'or',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
  },
} as const;

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function Auth11() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const { uiLanguage: language, setUiLanguage: setLanguage } = useWaddeh();

  const content = copy[language];
  const modeCopy = content.modes[mode];
  const direction = content.dir;

  return (
    <main
      dir="ltr"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#fbfaf5] px-6 py-20 font-sans text-[#17372f] antialiased selection:bg-[#0e6b5c]/20 selection:text-[#17372f] dark:bg-[#050505] dark:text-neutral-200 dark:selection:bg-white/20 dark:selection:text-white sm:px-10 sm:py-12"
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#41b78c]/[0.08] blur-3xl dark:bg-[#41b78c]/10"
      />

      <button
        type="button"
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="absolute right-5 top-5 z-10 rounded-xl border border-[#17372f]/10 bg-white/45 px-3.5 py-2 text-xs font-black text-[#0e6b5c] transition-colors hover:border-[#0e6b5c]/25 hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:right-8 sm:top-8"
      >
        {content.languageToggle}
      </button>

      <section
        dir={direction}
        className="relative z-10 flex w-full justify-center text-start"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[460px]"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={brandIcon}
                alt=""
                width={44}
                height={44}
                priority
                className="size-11 shrink-0 rounded-2xl shadow-[0_12px_28px_rgba(14,107,92,0.18)]"
              />
              <div>
                <p className="text-base font-black text-[#17372f] dark:text-white">
                  {content.product}
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#17372f]/50 dark:text-neutral-500">
                  {content.eyebrow}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-7 text-start">
            <div className="mb-6 flex gap-7 border-b border-[#17372f]/10 dark:border-white/10">
              {(['signIn', 'create'] as const).map((authMode) => (
                <button
                  key={authMode}
                  type="button"
                  onClick={() => setMode(authMode)}
                  className={`relative px-1 pb-3 text-sm font-black transition-colors ${
                    mode === authMode
                      ? 'text-[#0e6b5c] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-[#0e6b5c] dark:text-white dark:after:bg-white'
                      : 'text-[#17372f]/55 hover:text-[#17372f] dark:text-neutral-500 dark:hover:text-white'
                  }`}
                >
                  {content.modes[authMode].tab}
                </button>
              ))}
            </div>
            <h2 className="text-3xl leading-tight font-black tracking-normal text-balance text-[#17372f] dark:text-white">
              {modeCopy.title}
            </h2>
            <p className="mt-2 max-w-[24rem] text-sm leading-6 text-[#17372f]/58 dark:text-neutral-400">
              {modeCopy.subtitle}
            </p>
          </div>

          <div className="mb-6 grid gap-3">
            <button
              type="button"
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-[#17372f]/10 bg-white/70 px-4 py-3 text-sm font-black leading-none text-[#17372f] transition-colors hover:border-[#0e6b5c]/25 hover:bg-white active:bg-[#f5fbf8] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <GoogleIcon className="text-[16px]" />
              <span>{content.google}</span>
            </button>
            <Link
              href="/"
              className="flex min-h-[50px] w-full items-center justify-center rounded-2xl border border-[#0e6b5c]/16 bg-[#e4f2eb]/70 px-4 py-3 text-sm font-black leading-none text-[#0e6b5c] transition-colors hover:border-[#0e6b5c]/28 hover:bg-[#d8ece4] active:bg-[#cfe5dc] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {content.guest}
            </Link>
          </div>

          <div className="relative mb-6 flex items-center">
            <div className="grow border-t border-[#17372f]/10 dark:border-white/10"></div>
            <span className="px-4 text-xs font-black tracking-normal text-[#17372f]/38 dark:text-neutral-500">
              {content.divider}
            </span>
            <div className="grow border-t border-[#17372f]/10 dark:border-white/10"></div>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-black text-[#17372f]/86 dark:text-neutral-200"
              >
                {content.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={content.emailPlaceholder}
                className="h-[52px] w-full rounded-2xl border border-[#17372f]/12 bg-white/68 px-4 text-sm text-[#17372f] transition-colors placeholder:text-[#17372f]/35 focus:border-[#0e6b5c]/60 focus:bg-white focus:ring-2 focus:ring-[#0e6b5c]/12 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-[#8ee2c1]/50 dark:focus:bg-white/[0.08] dark:focus:ring-[#8ee2c1]/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-black text-[#17372f]/86 dark:text-neutral-200"
              >
                {content.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === 'signIn' ? 'current-password' : 'new-password'
                }
                placeholder={content.passwordPlaceholder}
                className="h-[52px] w-full rounded-2xl border border-[#17372f]/12 bg-white/68 px-4 text-sm text-[#17372f] transition-colors placeholder:text-[#17372f]/35 focus:border-[#0e6b5c]/60 focus:bg-white focus:ring-2 focus:ring-[#0e6b5c]/12 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-[#8ee2c1]/50 dark:focus:bg-white/[0.08] dark:focus:ring-[#8ee2c1]/10"
              />
            </div>

            <div className="mt-2">
              <button
                type="submit"
                className="h-[52px] w-full rounded-2xl bg-[#0e6b5c] px-4 text-sm font-black text-white transition-colors hover:bg-[#17372f] active:bg-[#0a574b] dark:bg-[#eaeaea] dark:text-black dark:hover:bg-white"
              >
                {modeCopy.primary}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-[13px] font-bold text-[#17372f]/52 dark:text-neutral-400">
            {modeCopy.switchPrompt}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signIn' ? 'create' : 'signIn')}
              className="font-black text-[#0e6b5c] hover:underline dark:text-white"
            >
              {modeCopy.switchAction}
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
