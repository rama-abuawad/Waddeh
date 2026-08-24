"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Bookmark,
  Check,
  FileText,
  Languages,
  Sparkles,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { useAuth } from "@/components/auth-provider";
import type { UiLanguage } from "@/lib/waddeh-store";

interface LandingExperimentProps {
  uiLanguage: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
}

const landingCopy = {
  en: {
    nav: { how: "How it works", features: "Features", about: "About", learning: "My Learning", signIn: "Sign in", language: "العربية" },
    hero: {
      eyebrow: "Adaptive Arabic reading",
      title: "Every text you understand",
      accent: "becomes part of your language.",
      description: "Waddeh brings Arabic closer to your level, explains vocabulary in context, then helps you return to the same text with deeper understanding.",
      primary: "Start understanding",
      secondary: "See how it works",
      standard: "Standard reading",
      poetry: "Poetry",
      pdf: "PDF documents",
      explore: "Explore Waddeh",
    },
    card: {
      kicker: "THE ARABIC YOU ARE READING",
      meaning: "Natural meaning",
      translation: "Arabic is closer than it seems. Every text you understand becomes part of your language.",
      closer: "closer",
      save: "Save",
    },
    about: {
      kicker: "The Waddeh idea",
      titleBefore: "We bring meaning",
      titleCloser: "closer",
      titleMiddle: "and turn every reading into a chance to",
      titleLearn: "learn.",
      points: [
        "Understand the Arabic you actually want to read instead of replacing it with a separate translation.",
        "Adapt difficult passages to your reading level while keeping names, numbers, and important details in place.",
        "Save vocabulary, revisit it in context, and build a learning path from the texts that matter to you.",
      ],
    },
    reading: {
      kicker: "Inside a reading",
      title: "Stay with the Arabic,",
      accent: "with support beside you.",
      description: "Waddeh keeps the source text at the center, then layers in a natural meaning, clearer Arabic, vocabulary, and listening only when you need them.",
      listen: "Listen",
      save: "Save",
      label: "THE ARABIC YOU ARE READING",
      meaning: "Natural meaning",
      translation: "The applicant must submit three official documents and meet all requirements before 5:00 PM.",
      vocabulary: "to fulfill / satisfy",
    },
    philosophy: {
      heading: "Meaning",
      learning: "Learning",
      mapKicker: "MY LEARNING",
      mapTitle: "From one reading to the next.",
      savedWords: "saved words",
      ready: "ready to review",
      level: "reading level",
      wordStates: ["Review", "Familiar", "Learning"],
      words: ["to fulfill", "closer", "determination"],
      understandKicker: "Understand now",
      understandTitle: "Support appears where the difficulty is.",
      understandDescription: "Natural meaning, context, clearer Arabic, and difficult vocabulary stay tied to the sentence you are reading.",
      rememberKicker: "Remember later",
      rememberTitle: "The reading becomes part of your learning history.",
      rememberDescription: "Saved words, comprehension checks, and previous readings give you something to return to instead of starting from zero every time.",
    },
    services: {
      kicker: "One reading, three layers",
      title: "Read. Understand.",
      accent: "Learn.",
      intro: "Waddeh is designed as a reading companion, not a replacement for the Arabic in front of you.",
      cards: [
        { tag: "Understand", title: "Clearer, never less", description: "Read Arabic text or a PDF with names, numbers, and important details kept in place while the meaning becomes easier to enter." },
        { tag: "Explore", title: "Come closer to the poem", description: "Explore verses, imagery, and natural meaning without flattening the language or turning poetry into a plain translation." },
        { tag: "Learn", title: "Learn from every text", description: "Save vocabulary, review it in a new context, and follow a learning path built from what you actually read." },
      ],
      prompt: "Bring the Arabic text you already want to understand.",
      promptDetail: "Paste a passage, open a poem, or attach a PDF.",
      cta: "Start understanding",
    },
  },
  ar: {
    nav: { how: "كيف يعمل", features: "المزايا", about: "عن وضّح", learning: "تعلّمي", signIn: "تسجيل الدخول", language: "English" },
    hero: {
      eyebrow: "قراءة عربية متكيّفة",
      title: "كل نص تفهمه،",
      accent: "يصبح جزءاً من لغتك.",
      description: "وضّح يقرّب العربية إلى مستواك، ويشرح مفرداتها في سياقها، ثم يساعدك على العودة إلى النص نفسه بفهم أعمق.",
      primary: "ابدأ الفهم",
      secondary: "اكتشف كيف يعمل",
      standard: "قراءة عادية",
      poetry: "شعر",
      pdf: "مستندات PDF",
      explore: "اكتشف وضّح",
    },
    card: {
      kicker: "العربية التي تقرؤها",
      meaning: "المعنى الطبيعي",
      translation: "العربية أقرب مما تبدو. وكل نص تفهمه يصبح جزءاً من لغتك.",
      closer: "أكثر قرباً",
      save: "احفظ",
    },
    about: {
      kicker: "فكرة وضّح",
      titleBefore: "نقرّب المعنى",
      titleCloser: "إليك",
      titleMiddle: "ونحوّل كل قراءة إلى فرصة كي",
      titleLearn: "تتعلّم.",
      points: [
        "افهم العربية التي تريد قراءتها فعلاً، بدلاً من استبدالها بترجمة منفصلة.",
        "كيّف المقاطع الصعبة مع مستواك مع إبقاء الأسماء والأرقام والتفاصيل المهمة في موضعها.",
        "احفظ المفردات، وعد إليها في سياقها، وابنِ مساراً تعليمياً من النصوص التي تهمك.",
      ],
    },
    reading: {
      kicker: "داخل القراءة",
      title: "ابقَ مع العربية.",
      accent: "واجعل المساندة إلى جانبها.",
      description: "يبقي وضّح النص الأصلي في المركز، ثم يضيف المعنى الطبيعي والعربية الأوضح والمفردات والاستماع حين تحتاج إليها.",
      listen: "استمع",
      save: "احفظ",
      label: "العربية التي تقرؤها",
      meaning: "المعنى الطبيعي",
      translation: "يجب على المتقدم تقديم ثلاث وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً.",
      vocabulary: "الإتمام أو الوفاء بالشرط",
    },
    philosophy: {
      heading: "المعنى",
      learning: "التعلّم",
      mapKicker: "تعلّمي",
      mapTitle: "من قراءة إلى التي تليها.",
      savedWords: "كلمة محفوظة",
      ready: "جاهزة للمراجعة",
      level: "مستوى القراءة",
      wordStates: ["راجع", "مألوفة", "أتعلّمها"],
      words: ["الإتمام والوفاء", "أكثر قرباً", "قوة الإرادة"],
      understandKicker: "افهم الآن",
      understandTitle: "تظهر المساندة حيث تكمن الصعوبة.",
      understandDescription: "يبقى المعنى الطبيعي والسياق والعربية الأوضح والمفردات الصعبة مرتبطاً بالجملة التي تقرؤها.",
      rememberKicker: "تذكّر لاحقاً",
      rememberTitle: "تصبح القراءة جزءاً من تاريخ تعلّمك.",
      rememberDescription: "تمنحك الكلمات المحفوظة واختبارات الفهم والقراءات السابقة شيئاً تعود إليه بدلاً من البدء من الصفر كل مرة.",
    },
    services: {
      kicker: "قراءة واحدة، ثلاث طبقات",
      title: "اقرأ. افهم.",
      accent: "تعلّم.",
      intro: "صُمّم وضّح رفيقاً للقراءة، لا بديلاً عن العربية التي أمامك.",
      cards: [
        { tag: "افهم", title: "أوضح، لا أقل", description: "اقرأ نصاً عربياً أو ملف PDF مع إبقاء الأسماء والأرقام والتفاصيل المهمة في موضعها، بينما يصبح الدخول إلى المعنى أسهل." },
        { tag: "استكشف", title: "اقترب من القصيدة", description: "استكشف الأبيات والصور والمعنى الطبيعي من دون تسطيح اللغة أو تحويل الشعر إلى ترجمة جامدة." },
        { tag: "تعلّم", title: "تعلّم من كل نص", description: "احفظ المفردات، وراجعها في سياق جديد، واتبع مساراً تعليمياً مبنياً على ما تقرؤه فعلاً." },
      ],
      prompt: "أحضر النص العربي الذي تريد فهمه.",
      promptDetail: "الصق مقطعاً، أو افتح قصيدة، أو أرفق ملف PDF.",
      cta: "ابدأ الفهم",
    },
  },
} as const;

function HeroReadingCard({ uiLanguage }: { uiLanguage: UiLanguage }) {
  const copy = landingCopy[uiLanguage].card;
  return (
    <div className="hero-reading-card" aria-hidden="true">
      <div className="hero-reading-card-back" />
      <div className="hero-reading-paper">
        <div className="hero-paper-rule" />
        <p className="hero-paper-kicker">{copy.kicker}</p>
        <p className="hero-paper-arabic" dir="rtl" lang="ar">اللغة العربية أقرب مما تبدو، وكل نص تفهمه يصبح جزءاً من لغتك.</p>
        <div className="hero-paper-meaning">
          <span>{copy.meaning}</span>
          <p>{copy.translation}</p>
        </div>
        <div className="hero-paper-word">
          <b dir="rtl">أقرب</b>
          <span>{copy.closer}</span>
          <em>{copy.save}</em>
        </div>
      </div>
    </div>
  );
}

function LandingNavbar({ uiLanguage, onLanguageChange }: LandingExperimentProps) {
  const { user, loading } = useAuth();
  const copy = landingCopy[uiLanguage].nav;
  const nextLanguage = uiLanguage === "ar" ? "en" : "ar";
  return (
    <nav className="hero-navbar relative z-30 px-4 py-5 sm:px-6 sm:py-6" aria-label={uiLanguage === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
      <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-6">
          <a href="#start" className="flex items-center gap-3 text-white" aria-label={uiLanguage === "ar" ? "وضّح — ابدأ قراءة" : "Waddeh — start a reading"}>
            <Image src="/brand/Waddeh_Brand/waddeh-icon.svg" alt="" width={36} height={36} priority className="h-9 w-9 rounded-xl" />
            <div className="leading-none">
              <span className="block text-[1.05rem] font-semibold tracking-[-0.04em]">Waddeh</span>
              <span className="font-arabic mt-1 block text-[0.7rem] text-white/55" dir="rtl">وضّح</span>
            </div>
          </a>
          <div className="hidden items-center gap-7 md:flex">
            <a className="text-sm font-medium text-white/68 transition-colors hover:text-white" href="#experience">{copy.how}</a>
            <a className="text-sm font-medium text-white/68 transition-colors hover:text-white" href="#features">{copy.features}</a>
            <a className="text-sm font-medium text-white/68 transition-colors hover:text-white" href="#about">{copy.about}</a>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/learning" className="inline-flex min-h-11 items-center gap-2 rounded-full px-2.5 text-xs font-semibold text-white/72 transition-colors hover:text-white sm:px-3" aria-label={copy.learning}>
            <BookOpenText size={15} aria-hidden="true" /><span className="hidden lg:inline">{copy.learning}</span>
          </Link>
          <button type="button" onClick={() => onLanguageChange(nextLanguage)} className="min-h-11 rounded-full px-3 py-2 text-xs font-semibold text-white/72 transition-colors hover:text-white sm:px-4" aria-label={uiLanguage === "ar" ? "Switch to English" : "التبديل إلى العربية"}>{copy.language}</button>
          {!loading && (user ? (
            <Link href="/profile" className="liquid-glass inline-flex min-h-11 max-w-32 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white sm:max-w-44 sm:px-4" aria-label={uiLanguage === "ar" ? "فتح الملف الشخصي" : "Open profile"}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/12 text-[.65rem]">{(user.displayName ?? user.email ?? "W")[0].toUpperCase()}</span>
              <span className="hidden truncate sm:inline">{user.displayName ?? user.email}</span>
            </Link>
          ) : (
            <Link href="/auth" className="liquid-glass inline-flex min-h-11 items-center rounded-full px-4 py-2.5 text-xs font-semibold text-white sm:px-5">{copy.signIn}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function HeroSection(props: LandingExperimentProps) {
  const { uiLanguage } = props;
  const copy = landingCopy[uiLanguage].hero;
  const chips = [
    { icon: BookOpenText, label: copy.standard },
    { icon: Languages, label: copy.poetry },
    { icon: FileText, label: copy.pdf },
  ];
  return (
    <section className="waddeh-hero relative flex min-h-screen flex-col overflow-hidden">
      <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
      <div className="hero-watermark hero-watermark-one" dir="rtl">وضّح</div><div className="hero-watermark hero-watermark-two" dir="rtl">اقرأ</div>
      <HeroReadingCard uiLanguage={uiLanguage} />
      <LandingNavbar {...props} />
      <div className="hero-content relative z-20 flex flex-1 items-center px-6 pb-14 pt-8 sm:px-8 md:pb-20 lg:px-10">
        <div className="hero-grid mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,.92fr)]">
          <div className="hero-copy max-w-[42rem]">
            <p className="hero-eyebrow mb-5 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[#9DE5D2]/78">{copy.eyebrow}</p>
            <h1 className="hero-heading text-[3.7rem] font-medium leading-[0.94] tracking-[-0.06em] text-white sm:text-[4.8rem] md:text-[5.45rem] lg:text-[5.25rem] xl:text-[5.75rem]">
              {copy.title}{" "}<em className="serif-display font-normal italic tracking-[-0.035em] text-[#D9F4EC]/86">{copy.accent}</em>
            </h1>
            <p className="hero-description mt-7 max-w-[35rem] text-[1rem] leading-7 text-white/67 sm:text-[1.08rem]">{copy.description}</p>
            <div className="hero-actions mt-9 flex flex-wrap items-center gap-3">
              <a href="#start" className="group inline-flex items-center gap-3 rounded-full bg-[#fffef9] px-5 py-3 text-sm font-semibold text-[#084e44] shadow-[0_12px_28px_rgba(3,29,24,.18)] transition-transform hover:-translate-y-0.5">
                {copy.primary}<span className="grid h-7 w-7 place-items-center rounded-full bg-[#dce9df] text-[#0e6b5c] transition-transform group-hover:translate-x-0.5"><ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} size={15} strokeWidth={1.8} /></span>
              </a>
              <a href="#experience" className="liquid-glass rounded-full px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:text-white">{copy.secondary}</a>
            </div>
            <div className="hero-chips mt-7 flex flex-wrap gap-2.5">
              {chips.map(({ icon: Icon, label }) => <span key={label} className="hero-chip"><Icon size={14} strokeWidth={1.7} />{label}</span>)}
            </div>
          </div>
          <div className="hero-card-space hidden min-h-[36rem] lg:block" />
        </div>
      </div>
      <a href="#about" className="hero-explore relative z-20 mx-auto mb-7 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/40 transition-colors hover:text-white/70">{copy.explore}<ArrowDown size={14} /></a>
    </section>
  );
}

function AboutSection({ uiLanguage }: { uiLanguage: UiLanguage }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const copy = landingCopy[uiLanguage].about;
  return (
    <section id="about" className="relative overflow-hidden bg-[#faf8f2] px-6 pb-16 pt-28 md:pb-24 md:pt-40">
      <div className="paper-orbit paper-orbit-one" /><div className="paper-orbit paper-orbit-two" />
      <div ref={ref} className="relative mx-auto max-w-6xl">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-7 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#0e6b5c]">{copy.kicker}</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="max-w-5xl text-[2.8rem] leading-[1.06] tracking-[-0.045em] text-[#18302a] md:text-[4.5rem] lg:text-[5.5rem]">
          {copy.titleBefore}{" "}<em className="serif-display italic text-[#0e6b5c]">{copy.titleCloser}</em>{" "}{copy.titleMiddle}{" "}<em className="serif-display italic text-[#0e6b5c]">{copy.titleLearn}</em>
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay: 0.2 }} className="mt-12 grid max-w-5xl gap-6 border-t border-[#18302a]/10 pt-8 text-[#47605a] md:grid-cols-3">
          {copy.points.map((point) => <p key={point} className="text-sm leading-6">{point}</p>)}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedVideoSection({ uiLanguage }: { uiLanguage: UiLanguage }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const copy = landingCopy[uiLanguage].reading;
  return (
    <section id="experience" className="overflow-hidden bg-[#faf8f2] px-6 pb-24 pt-8 md:pb-36 md:pt-12">
      <motion.div ref={ref} initial={{ opacity: 0, y: 60 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9 }} className="reading-stage relative mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
        <div className="reading-stage-glow" /><div className="reading-stage-mark" dir="rtl">معنى</div>
        <div className="relative z-10 grid min-h-[42rem] items-center gap-8 p-5 md:p-8 lg:grid-cols-[.76fr_1.24fr] lg:p-10">
          <div className="max-w-md px-2 py-8 md:px-5">
            <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#9DE5D2]/70">{copy.kicker}</p>
            <h3 className="text-4xl leading-[1.05] tracking-[-0.04em] text-white md:text-5xl">{copy.title}{" "}<em className="serif-display italic text-[#D9F4EC]/78">{copy.accent}</em></h3>
            <p className="mt-6 text-sm leading-7 text-white/62 md:text-base">{copy.description}</p>
          </div>
          <div className="reading-workspace">
            <div className="workspace-toolbar"><div className="workspace-dots"><i /><i /><i /></div><div className="workspace-actions"><span><Volume2 size={14} />{copy.listen}</span><span><Bookmark size={14} />{copy.save}</span></div></div>
            <div className="workspace-paper">
              <div className="workspace-rule" /><span className="workspace-label">{copy.label}</span>
              <p className="workspace-arabic" dir="rtl" lang="ar">يتعين على المتقدم تقديم ثلاث وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً.</p>
              <div className="workspace-annotation"><span>{copy.meaning}</span><p>{copy.translation}</p></div>
              <div className="workspace-vocab"><b dir="rtl">استيفاء</b><span>{copy.vocabulary}</span><em>{copy.save}</em></div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function PhilosophySection({ uiLanguage }: { uiLanguage: UiLanguage }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const copy = landingCopy[uiLanguage].philosophy;
  const arabicWords = ["استيفاء", "أقرب", "العزائم"];
  return (
    <section className="overflow-hidden bg-[#0a4f45] px-6 py-28 md:py-40">
      <div ref={ref} className="mx-auto max-w-6xl">
        <motion.h2 initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-16 text-[3.25rem] tracking-[-0.05em] text-white md:mb-24 md:text-[5.5rem] lg:text-[6.3rem]">{copy.heading}{" "}<em className="serif-display italic text-[#9DE5D2]/55">×</em>{" "}{copy.learning}</motion.h2>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="learning-map-card">
            <div className="learning-map-head"><div><span>{copy.mapKicker}</span><h3>{copy.mapTitle}</h3></div><Sparkles size={20} /></div>
            <div className="learning-map-progress"><div><b>17</b><span>{copy.savedWords}</span></div><div><b>6</b><span>{copy.ready}</span></div><div><b>B1</b><span>{copy.level}</span></div></div>
            <div className="learning-map-list">{arabicWords.map((word, index) => <div key={word}><span className="map-check"><Check size={14} /></span><b dir="rtl">{word}</b><span>{copy.words[index]}</span><em>{copy.wordStates[index]}</em></div>)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.18 }} className="flex flex-col justify-center">
            <div className="pb-10 md:pb-12"><p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#9DE5D2]/58">{copy.understandKicker}</p><h3 className="text-3xl tracking-[-0.035em] text-white md:text-4xl">{copy.understandTitle}</h3><p className="mt-5 text-base leading-7 text-white/62 md:text-lg">{copy.understandDescription}</p></div>
            <div className="h-px w-full bg-white/10" />
            <div className="pt-10 md:pt-12"><p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#9DE5D2]/58">{copy.rememberKicker}</p><h3 className="text-3xl tracking-[-0.035em] text-white md:text-4xl">{copy.rememberTitle}</h3><p className="mt-5 text-base leading-7 text-white/62 md:text-lg">{copy.rememberDescription}</p></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ uiLanguage }: { uiLanguage: UiLanguage }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const copy = landingCopy[uiLanguage].services;
  const services = [
    { icon: BookOpenText, mock: "standard" },
    { icon: Languages, mock: "poetry" },
    { icon: TrendingUp, mock: "learning" },
  ];
  return (
    <section id="features" className="relative overflow-hidden bg-[#faf8f2] px-6 py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(65,183,140,0.07)_0%,_transparent_62%)]" />
      <div ref={ref} className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-14 flex items-end justify-between gap-8">
          <div><p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#0e6b5c]">{copy.kicker}</p><h2 className="max-w-3xl text-[2.8rem] leading-[1.04] tracking-[-0.045em] text-[#18302a] md:text-[4.3rem]">{copy.title}{" "}<em className="serif-display italic text-[#0e6b5c]">{copy.accent}</em></h2></div>
          <p className="hidden max-w-xs text-sm leading-6 text-[#47605a] md:block">{copy.intro}</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {services.map((service, index) => { const Icon = service.icon; const card = copy.cards[index]; return (
            <motion.article key={service.mock} initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.12 + index * 0.12 }} className="feature-card group">
              <div className={`feature-visual feature-visual-${service.mock}`}><div className="feature-mini-paper"><span className="feature-mini-rule" />{service.mock === "standard" && <><b dir="rtl">النص الأصلي</b><i /><i /><i className="mint" /></>}{service.mock === "poetry" && <><b dir="rtl">على قدر أهل العزم</b><i /><i className="mint" /><i /></>}{service.mock === "learning" && <><b dir="rtl">مفرداتي</b><i className="mint" /><i /><i className="mint short" /></>}</div></div>
              <div className="p-6 md:p-7"><div className="mb-6 flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#0e6b5c]"><Icon size={15} />{card.tag}</span><span className="grid h-9 w-9 place-items-center rounded-full border border-[#18302a]/10 text-[#47605a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0e6b5c]"><ArrowUpRight size={17} /></span></div><h3 className="mb-3 text-2xl tracking-[-0.035em] text-[#18302a]">{card.title}</h3><p className="text-sm leading-6 text-[#47605a]">{card.description}</p></div>
            </motion.article>
          ); })}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[#18302a]/10 pt-8 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-[#18302a]">{copy.prompt}</p><p className="mt-1 text-sm text-[#47605a]">{copy.promptDetail}</p></div><a href="#start" className="inline-flex items-center gap-3 rounded-full bg-[#0e6b5c] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(14,107,92,.18)] transition-transform hover:-translate-y-0.5">{copy.cta}<ArrowUpRight size={16} /></a></div>
      </div>
    </section>
  );
}

export default function LandingExperiment({ uiLanguage, onLanguageChange }: LandingExperimentProps) {
  return (
    <div className="v6-landing" dir={uiLanguage === "ar" ? "rtl" : "ltr"}>
      <HeroSection uiLanguage={uiLanguage} onLanguageChange={onLanguageChange} />
      <AboutSection uiLanguage={uiLanguage} />
      <FeaturedVideoSection uiLanguage={uiLanguage} />
      <PhilosophySection uiLanguage={uiLanguage} />
      <ServicesSection uiLanguage={uiLanguage} />
    </div>
  );
}
