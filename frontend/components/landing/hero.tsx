'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';

import type { UiLanguage } from '@/lib/ui-copy';
import LandingNavbar from './navbar';
import ScrollIndicator from './scroll-indicator';

interface WaddehHeroProps {
  uiLanguage: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
}

const heroCopy = {
  ar: {
    dir: 'rtl',
    label: 'قراءة عربية متكيّفة',
    headline: ['افهم العربية.', 'من دون أن تتركها خلفك.'],
    subheading:
      'يوائم وضّح العربية الأصلية مع مستواك، ويعلّمك ما يهم، ثم يقودك تدريجيًا إلى النص الأصلي.',
    primary: 'ابدأ القراءة',
    secondary: 'كيف يعمل',
    scroll: 'مرّر لتفهم',
  },
  en: {
    dir: 'ltr',
    label: 'Adaptive Arabic reading',
    headline: ['Understand Arabic.', 'Stay close to the original.'],
    subheading:
      'Waddeh adapts real Arabic to your level, then guides you back to the original.',
    primary: 'Start reading',
    secondary: 'How it works',
    scroll: 'Scroll to understand',
  },
} as const;

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.16,
    },
  },
};

const driftUp: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', damping: 18, stiffness: 55 },
  },
};

const languageContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: 'easeOut',
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
};

const languageItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
};

export default function WaddehHero({
  uiLanguage,
  onLanguageChange,
}: WaddehHeroProps) {
  const copy = heroCopy[uiLanguage];

  return (
    <section
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-[#073f38] text-white sm:min-h-[640px]"
      aria-labelledby="landing-hero-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(5, 62, 56, 0.34) 0%, rgba(5, 62, 56, 0.22) 38%, rgba(5, 62, 56, 0.88) 100%), url("/hero/waddeh-hero.jpg"), radial-gradient(circle at 50% 82%, rgba(157, 229, 210, 0.34), transparent 34%), linear-gradient(145deg, #f8f6f1 0%, #9de5d2 38%, #064f46 100%)',
          backgroundPosition: 'center, center bottom, center, center',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(ellipse_at_center,rgba(5,62,56,0.16),rgba(5,62,56,0.74)_58%,rgba(5,62,56,0.96)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.24),transparent_22%,transparent_78%,rgba(0,0,0,0.18))]"
      />

      <motion.div
        className="relative z-10 flex h-full min-h-0 flex-col"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <motion.div variants={driftUp}>
          <LandingNavbar uiLanguage={uiLanguage} onLanguageChange={onLanguageChange} />
        </motion.div>

        <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 items-center justify-center px-6 pb-28 pt-5 text-center sm:px-8 sm:pb-32 sm:pt-8 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={uiLanguage}
              dir={copy.dir}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={languageContentVariants}
              className="flex w-full max-w-[22.5rem] flex-col items-center sm:max-w-6xl"
            >
              <motion.p
                variants={languageItemVariants}
                className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black text-white/80 shadow-[0_12px_38px_rgba(5,62,56,0.12)] backdrop-blur-xl"
              >
                {copy.label}
              </motion.p>
              <motion.h1
                id="landing-hero-title"
                variants={languageItemVariants}
                className="mt-5 max-w-6xl text-balance text-[clamp(2.55rem,10.9vw,4.45rem)] font-black leading-[0.9] tracking-normal text-white sm:mt-7 sm:text-[clamp(4.35rem,8.9vw,8.25rem)]"
              >
                <span className="block">{copy.headline[0]}</span>
                <span className="mt-2 block text-white/90">{copy.headline[1]}</span>
              </motion.h1>
              <motion.p
                variants={languageItemVariants}
                className="mt-5 max-w-[21rem] text-pretty text-sm font-bold leading-7 text-white/70 sm:mt-7 sm:max-w-3xl sm:text-lg sm:leading-8"
              >
                {copy.subheading}
              </motion.p>
              <motion.div
                variants={languageItemVariants}
                className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row"
              >
                <a
                  href="#reader"
                  className="inline-flex min-h-12 min-w-44 items-center justify-center rounded-full bg-[#0f806c] px-7 text-sm font-black text-white shadow-[0_20px_55px_rgba(6,79,70,0.34)] transition-transform hover:-translate-y-0.5 hover:bg-[#064f46] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75 active:scale-[0.98]"
                >
                  {copy.primary}
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 min-w-44 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 text-sm font-black text-white backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/75 active:scale-[0.98]"
                >
                  {copy.secondary}
                </a>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 sm:bottom-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={uiLanguage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <ScrollIndicator label={copy.scroll} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
