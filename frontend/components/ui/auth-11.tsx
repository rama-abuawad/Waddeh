'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, type Variants } from 'motion/react';

type AuthMode = 'signIn' | 'create';
type AuthLanguage = 'ar' | 'en';

const authImages = [
  '/auth/waddeh-reading-1.jpg',
  '/auth/waddeh-reading-2.jpg',
  '/auth/waddeh-reading-3.jpg',
];
const brandIcon = '/brand/Waddeh_Brand/waddeh-icon.svg';

const copy = {
  ar: {
    dir: 'rtl',
    product: 'Waddeh',
    languageToggle: 'English',
    languageLabel: 'العربية',
    eyebrow: 'رفيق القراءة العربية',
    imageHeadline: 'افهم النص، واحفظ معناه',
    imageSubhead: 'مسار هادئ من العربية الواضحة إلى النص الأصلي.',
    scenes: [
      {
        alt: 'مسار قراءة عربي واضح مع بطاقات نصية',
        label: 'عربية واضحة',
      },
      {
        alt: 'جسر بصري بين النص المبسط والنص الأصلي',
        label: 'جسر للأصل',
      },
      {
        alt: 'ذاكرة قراءة تحفظ المفردات والمعنى',
        label: 'ذاكرة القراءة',
      },
    ],
    modes: {
      signIn: {
        tab: 'تسجيل الدخول',
        title: ['عد إلى مسارك', 'في وضّح'],
        accent: 'بثقة.',
        subtitle: 'تابع ذاكرة القراءة والمفردات من حيث توقفت.',
        primary: 'تسجيل الدخول',
        switchPrompt: 'ليس لديك حساب؟',
        switchAction: 'أنشئ حسابًا',
      },
      create: {
        tab: 'إنشاء حساب',
        title: ['ابدأ ذاكرة قراءة', 'تكبر معك'],
        accent: 'بوضوح.',
        subtitle: 'احفظ تقدمك نحو العربية الأصلية.',
        primary: 'إنشاء حساب',
        switchPrompt: 'لديك حساب؟',
        switchAction: 'تسجيل الدخول',
      },
    },
    google: 'Google',
    guest: 'الدخول كضيف',
    divider: 'أو عبر البريد',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
  },
  en: {
    dir: 'ltr',
    product: 'Waddeh',
    languageToggle: 'العربية',
    languageLabel: 'English',
    eyebrow: 'Adaptive Arabic reading',
    imageHeadline: 'Understand the text, keep the meaning',
    imageSubhead: 'A calm path from clear Arabic back to the original.',
    scenes: [
      {
        alt: 'A clear Arabic reading path with layered text cards',
        label: 'Clear Arabic',
      },
      {
        alt: 'A visual bridge between simplified and original Arabic text',
        label: 'Bridge to original',
      },
      {
        alt: 'Reading memory preserving vocabulary and meaning',
        label: 'Reading Memory',
      },
    ],
    modes: {
      signIn: {
        tab: 'Sign in',
        title: ['Return to', 'Waddeh'],
        accent: 'with clarity.',
        subtitle: 'Pick up your reading memory and vocabulary.',
        primary: 'Sign in',
        switchPrompt: 'New to Waddeh?',
        switchAction: 'Create account',
      },
      create: {
        tab: 'Create account',
        title: ['Start your', 'reading memory'],
        accent: 'gently.',
        subtitle: 'Save progress toward authentic Arabic.',
        primary: 'Create account',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in',
      },
    },
    google: 'Google',
    guest: 'Guest access',
    divider: 'Or continue with email',
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
  const [language, setLanguage] = useState<AuthLanguage>('ar');
  const [activeImage, setActiveImage] = useState(0);

  const content = copy[language];
  const modeCopy = content.modes[mode];
  const direction = content.dir;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % authImages.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <main
      dir="ltr"
      className="flex min-h-dvh w-full flex-col overflow-hidden bg-[#fbfaf5] font-sans text-[#17372f] antialiased selection:bg-[#0e6b5c]/20 selection:text-[#17372f] dark:bg-[#050505] dark:text-neutral-200 dark:selection:bg-white/20 dark:selection:text-white lg:flex-row"
    >
      <section className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-dvh lg:w-[52%] xl:w-[54%]">
        <div className="relative h-full min-h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-[32px] border border-[#17372f]/10 bg-[#0d3f36] shadow-2xl dark:border-white/10 dark:bg-[#050505]">
          <motion.img
            key={authImages[activeImage]}
            src={authImages[activeImage]}
            alt={content.scenes[activeImage].alt}
            initial={{ opacity: 0, scale: 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#12362f]/92 via-[#12362f]/22 to-transparent dark:from-[#050505] dark:via-[#050505]/20" />

          <div
            dir={direction}
            className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center px-8 pb-12 text-center"
          >
            <motion.p
              key={`${language}-${activeImage}-label`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-4 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md"
            >
              {content.scenes[activeImage].label}
            </motion.p>
            <h1 className="max-w-[34rem] text-3xl leading-tight font-medium tracking-normal text-balance text-white md:text-4xl lg:text-5xl">
              {content.imageHeadline}
            </h1>
            <p className="mt-4 max-w-[28rem] text-sm leading-7 text-white/70">
              {content.imageSubhead}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              {authImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  onClick={() => setActiveImage(index)}
                  className={`h-1 rounded-full transition-all ${
                    activeImage === index ? 'w-7 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        dir={direction}
        className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-8 text-start sm:px-10 lg:w-[48%] lg:px-12 lg:py-2 xl:w-[46%]"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[408px]"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 flex items-center justify-between gap-4"
          >
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
                <p className="text-sm font-black text-[#17372f] dark:text-white">
                  {content.product}
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#17372f]/50 dark:text-neutral-500">
                  {content.eyebrow}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="rounded-full border border-[#17372f]/10 bg-white/75 px-4 py-2 text-xs font-black text-[#0e6b5c] shadow-sm transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#141414] dark:text-white"
            >
              {content.languageToggle}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6 text-start">
            <div className="mb-5 inline-flex rounded-full border border-[#17372f]/10 bg-white/75 p-1 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              {(['signIn', 'create'] as const).map((authMode) => (
                <button
                  key={authMode}
                  type="button"
                  onClick={() => setMode(authMode)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition-all ${
                    mode === authMode
                      ? 'bg-[#17372f] text-white shadow-sm dark:bg-white dark:text-[#050505]'
                      : 'text-[#17372f]/55 hover:text-[#17372f] dark:text-neutral-500 dark:hover:text-white'
                  }`}
                >
                  {content.modes[authMode].tab}
                </button>
              ))}
            </div>
            <h2 className="text-3xl leading-tight font-medium tracking-normal text-balance text-[#17372f] md:text-[36px] dark:text-white">
              {modeCopy.title[0]}
              <br />
              {modeCopy.title[1]}{' '}
              <span className="font-serif font-light italic">
                {modeCopy.accent}
              </span>
            </h2>
            <p className="mt-4 max-w-[24rem] text-sm leading-7 text-[#17372f]/60 dark:text-neutral-400">
              {modeCopy.subtitle}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <button
              type="button"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#17372f]/10 bg-white px-3 py-3 text-xs font-bold leading-none text-[#17372f] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#f5fbf8] active:scale-[0.98] dark:border-white/10 dark:bg-[#141414] dark:text-white dark:hover:bg-[#1f1f1f]"
            >
              <GoogleIcon className="text-[16px]" />
              <span className="whitespace-nowrap">{content.google}</span>
            </button>
            <Link
              href="/"
              className="flex min-h-12 items-center justify-center rounded-full border border-[#0e6b5c]/20 bg-[#e4f2eb] px-3 py-3 text-xs font-black leading-none text-[#0e6b5c] transition-transform hover:-translate-y-0.5 hover:bg-[#d8ece4] active:scale-[0.98] dark:border-white/10 dark:bg-[#141414] dark:text-white dark:hover:bg-[#1f1f1f]"
            >
              {content.guest}
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative mb-6 flex items-center"
          >
            <div className="grow border-t border-[#17372f]/10 dark:border-white/10"></div>
            <span className="px-4 text-[11px] font-black tracking-normal text-[#17372f]/45 dark:text-neutral-500">
              {content.divider}
            </span>
            <div className="grow border-t border-[#17372f]/10 dark:border-white/10"></div>
          </motion.div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-black text-[#17372f] dark:text-neutral-200"
              >
                {content.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={content.emailPlaceholder}
                className="w-full rounded-[14px] border border-[#17372f]/10 bg-white px-4 py-3 text-sm text-[#17372f] transition-colors placeholder:text-[#17372f]/35 focus:border-[#0e6b5c]/45 focus:bg-white focus:ring-1 focus:ring-[#0e6b5c]/35 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:bg-[#111] dark:focus:ring-neutral-500"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-black text-[#17372f] dark:text-neutral-200"
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
                className="w-full rounded-[14px] border border-[#17372f]/10 bg-white px-4 py-3 text-sm text-[#17372f] transition-colors placeholder:text-[#17372f]/35 focus:border-[#0e6b5c]/45 focus:bg-white focus:ring-1 focus:ring-[#0e6b5c]/35 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:bg-[#111] dark:focus:ring-neutral-500"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-3">
              <button
                type="submit"
                className="w-full rounded-full bg-[#0e6b5c] py-3.5 text-sm font-black text-white shadow-[0_16px_36px_rgba(14,107,92,0.22)] transition-transform hover:bg-[#17372f] active:scale-[0.98] dark:bg-[#eaeaea] dark:text-black dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] dark:hover:bg-white"
              >
                {modeCopy.primary}
              </button>
            </motion.div>
          </form>

          <motion.div
            variants={itemVariants}
            className="mt-5 text-[13px] font-bold text-[#17372f]/55 dark:text-neutral-400"
          >
            {modeCopy.switchPrompt}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signIn' ? 'create' : 'signIn')}
              className="font-black text-[#0e6b5c] hover:underline dark:text-white"
            >
              {modeCopy.switchAction}
            </button>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
