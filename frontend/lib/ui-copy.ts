function arabicSavedWords(count: number): string {
  if (count === 0) return "لا كلمات محفوظة";
  if (count === 1) return "كلمة واحدة محفوظة";
  if (count === 2) return "كلمتان محفوظتان";
  return `${count} ${count <= 10 ? "كلمات" : "كلمة"} محفوظة`;
}

function arabicLearningSummary(readings: number, words: number): string {
  const readingSummary = readings === 0
    ? "لم تنجز قراءة بعد"
    : readings === 1
      ? "أنجزت قراءة واحدة"
      : readings === 2
        ? "أنجزت قراءتين"
        : `أنجزت ${readings} ${readings <= 10 ? "قراءات" : "قراءة"}`;
  const wordSummary = words === 0
    ? "لم تحفظ أي مفردة"
    : words === 1
      ? "حفظت مفردة واحدة"
      : words === 2
        ? "حفظت مفردتين"
        : `حفظت ${words} ${words <= 10 ? "مفردات" : "مفردة"}`;

  return `${readingSummary}، و${wordSummary}.`;
}

export const uiCopy = {
  ar: {
    homeLabel: "وضّح - الصفحة الرئيسية",
    languageLabel: "لغة الموقع",
    vocabularyButton: "مفرداتي",
    hero: {
      eyebrow: "Understand → Learn → Adapt → Progress",
      title: "افهم العربية الأصيلة",
      accent: " بمستواك اليوم.",
      description: "وضّح يحلل صعوبة النص، يكيّفه لعربية يمكنك قراءتها الآن، ثم يقودك خطوة بخطوة نحو الصياغة الأصلية.",
      secondary: "English supports the journey, but Arabic remains the destination.",
      cta: "ابدأ الرحلة",
    },
    featureShowcase: {
      eyebrow: "رحلة التعلّم",
      title: "من النص الأصلي إلى Bridge Mode",
      hint: "أضف المحتوى، ثم شاهد الصعوبة والتكييف وفحص المعنى والعودة التدريجية للأصل",
      items: [
        { label: "أضف نصاً أصيلاً", description: "ابدأ بمحتوى عربي حقيقي لا بتمرين معزول" },
        { label: "أدخل PDF في الرحلة", description: "يعبر المستند المسار نفسه: صعوبة، تكييف، تعلّم" },
        { label: "راجع مفرداتك", description: "الكلمات المحفوظة تساعدك على تقليل الدعم تدريجياً" },
      ],
    },
    audiences: {
      child: { label: "طفل", description: "جمل قصيرة وكلمات سهلة" },
      non_arabic_speaker: { label: "غير ناطق بالعربية", description: "عربية واضحة مع ترجمة إنجليزية" },
      general_reader: { label: "قارئ عام", description: "عربية واضحة ومباشرة" },
    },
    readerStep: { title: "لمن نكيّف العربية؟", subtitle: "اختر نمط القارئ كبداية" },
    sourceStep: { title: "أضف العربية الأصيلة", subtitle: "الصق نصاً عربياً أو ارفع ملف PDF" },
    source: {
      textTab: "نص عربي",
      pdfTab: "ملف PDF",
      inputLabel: "ضع النص العربي",
      placeholder: "الصق هنا نصاً عربياً تريد فهمه…",
      choosePdf: "اختر مستنداً عربياً",
      pdfReady: (size: string) => `${size} MB · جاهز للفهم`,
      pdfPrivacy: "حتى 10 MB · لا يُحفظ الملف على الخادم",
    },
    errors: {
      textTooShort: "أدخل نصاً عربياً لا يقل عن 20 حرفاً.",
      pdfRequired: "اختر ملف PDF عربي أولاً.",
      pdfTooLarge: "يجب ألا يتجاوز حجم الملف عشرة ميغابايت.",
      request: "تعذر إكمال الطلب. حاول مرة أخرى.",
      word: "تعذر شرح الكلمة.",
    },
    actions: {
      loading: "نحلل ونكيّف ونفحص…",
      wait: "يرجى الانتظار",
      start: "ابدأ",
      understandPdf: "ابدأ رحلة المستند",
      clarifyText: "ابدأ رحلة النص",
      sample: "جرّب بنص إداري قصير",
    },
    result: {
      ready: "النتيجة جاهزة",
      title: "رحلتك نحو النص الأصلي",
      tabsLabel: "عرض النتيجة",
      views: { clear: "العربية الواضحة", english: "English", original: "النص الأصلي" },
      wordHint: "اضغط على أي كلمة لفتح عدسة الكلمات.",
      wordButtonHint: "اضغط لشرح الكلمة",
      diacritics: "تشكيل الكلمات الصعبة",
    },
    wordLens: {
      loading: (word: string) => `جارٍ فهم كلمة «${word}»…`,
      close: "إغلاق",
      root: "الجذر",
      synonym: "مرادف",
      otherMeaning: "English",
      save: "احفظ في مفرداتي",
      saved: "محفوظة في مفرداتي ✓",
    },
    tools: {
      intro: "مسار التعلم من هذا النص",
      speech: "استمع للنص",
      stopSpeech: "إيقاف القراءة",
      speechDescription: "قراءة عربية أو إنجليزية",
      learning: "التعلّم والمفردات",
      savedCount: arabicSavedWords,
      changes: "خريطة الفروق",
      changesDescription: "ماذا تغيّر، ولماذا؟",
      check: "تحقق من فهمك",
      checkDescription: "سؤال قصير من النص",
      visual: "المحتوى في خطوات",
      visualDescription: "رؤية بصرية سريعة",
      trust: "Meaning Integrity",
      trustDescription: "فحص مستقل للتفاصيل الحساسة",
    },
    panels: {
      learningTitle: "تعلّم من النص نفسه",
      learningSummary: arabicLearningSummary,
      saveWord: "+ احفظ الكلمة",
      vocabulary: "مفرداتي",
      vocabularyDescription: "الكلمات التي حفظتها من قراءاتك.",
      emptyVocabulary: "لا توجد كلمات محفوظة بعد.",
      emptyVocabularyHint: "وضّح نصاً، ثم المس أي كلمة واحفظها من عدسة الكلمات.",
      removeWord: (word: string) => `حذف ${word}`,
      changeTitle: "خريطة التغيير",
      changeDescription: "نريك كيف أصبح التعبير أوضح من دون أن يبتعد عن أصله.",
      before: "قبل",
      after: "بعد",
      noChanges: "لم يحتج هذا المحتوى إلى تغييرات بارزة.",
      checkTitle: "هل وصلت الفكرة؟",
      showAnswer: "أظهر الإجابة",
      hideAnswer: "إخفاء الإجابة",
      understood: "فهمتها ✓",
      review: "أحتاج مراجعة",
      checkRecorded: "شكراً، يمكنك متابعة القراءة.",
      visualTitle: "المحتوى في خطوات",
      visualDescription: "مسار سريع يساعدك على رؤية ترتيب الأفكار.",
      trustTitle: "المعنى أولاً",
      trustDescription: "فحص مستقل يراجع التفاصيل الحساسة من دون ادعاء اليقين المطلق.",
      noDetails: "لم يتضمن المحتوى تفاصيل حساسة تحتاج إلى عرض منفصل.",
    },
    footer: {
      reminder: "راجع دائماً الأسماء والأرقام والمواعيد المهمة.",
      copied: "تم النسخ ✓",
      copy: "نسخ النص",
      newContent: "محتوى جديد",
    },
    principles: {
      kicker: "الفكرة التي تقود وضّح",
      title: "نقرّب العربية، ثم نعيدك إليها.",
      cards: [
        { title: "صعوبة مفهومة", body: "يرى المتعلم لماذا يبدو النص صعباً: طول الجمل، المفردات الرسمية، الأرقام، والتواريخ." },
        { title: "تكييف لا اختصار", body: "نضبط المفردات والبنية حسب المستوى المطلوب مع الحفاظ على المعلومات الحساسة." },
        { title: "Bridge Mode", body: "يتقدم القارئ عبر نسخ أغنى حتى يقترب من العربية الأصلية بثقة أكبر." },
      ],
    },
  },
  en: {
    homeLabel: "Waddeh - Home",
    languageLabel: "Website language",
    vocabularyButton: "My words",
    hero: {
      eyebrow: "Understand → Learn → Adapt → Progress",
      title: "Read authentic Arabic",
      accent: " at your level today.",
      description: "Waddeh analyzes difficulty, adapts Arabic to the learner, checks meaning integrity, and guides them back toward the original wording.",
      secondary: "",
      cta: "Start the journey",
    },
    featureShowcase: {
      eyebrow: "Learning journey",
      title: "From original Arabic to Bridge Mode",
      hint: "Add content, then see difficulty, adaptation, integrity, vocabulary, and progressive return to the original",
      items: [
        { label: "Add authentic Arabic", description: "Start with real Arabic, not isolated exercises" },
        { label: "Bring in a PDF", description: "Documents enter the same adaptive reading journey" },
        { label: "Review saved words", description: "Vocabulary helps reduce support over time" },
      ],
    },
    audiences: {
      child: { label: "Child", description: "Short sentences and simple words" },
      non_arabic_speaker: { label: "Non-Arabic speaker", description: "Clear Arabic with English translation" },
      general_reader: { label: "General reader", description: "Clear, direct Modern Standard Arabic" },
    },
    readerStep: { title: "Who is learning from this Arabic?", subtitle: "Choose a reader pattern" },
    sourceStep: { title: "Add authentic Arabic", subtitle: "Paste Arabic text or upload a PDF" },
    source: {
      textTab: "Arabic text",
      pdfTab: "PDF file",
      inputLabel: "Paste the Arabic text",
      placeholder: "Paste the Arabic text you want to understand…",
      choosePdf: "Choose an Arabic document",
      pdfReady: (size: string) => `${size} MB · Ready to understand`,
      pdfPrivacy: "Up to 10 MB · The file is not stored on the server",
    },
    errors: {
      textTooShort: "Please enter at least 20 characters of Arabic text.",
      pdfRequired: "Please choose an Arabic PDF first.",
      pdfTooLarge: "The PDF must be 10 MB or smaller.",
      request: "We couldn't complete the request. Please try again.",
      word: "We couldn't explain this word. Please try again.",
    },
    actions: {
      loading: "Analyzing, adapting, and checking…",
      wait: "Please wait",
      start: "Start",
      understandPdf: "Start document journey",
      clarifyText: "Start text journey",
      sample: "Try a short admin example",
    },
    result: {
      ready: "Your result is ready",
      title: "Your path back to the original",
      tabsLabel: "Result view",
      views: { clear: "Clear Arabic", english: "English", original: "Original Arabic" },
      wordHint: "Select any Arabic word to open Word Lens.",
      wordButtonHint: "Select to explain this word",
      diacritics: "Helpful Arabic diacritics",
    },
    wordLens: {
      loading: (word: string) => `Understanding “${word}”…`,
      close: "Close",
      root: "Arabic root",
      synonym: "Arabic synonym",
      otherMeaning: "Arabic meaning",
      save: "Save to my vocabulary",
      saved: "Saved to my vocabulary ✓",
    },
    tools: {
      intro: "Learning path from this text",
      speech: "Listen to the text",
      stopSpeech: "Stop reading",
      speechDescription: "Arabic or English read-aloud",
      learning: "Learning and vocabulary",
      savedCount: (count: number) => `${count} saved ${count === 1 ? "word" : "words"}`,
      changes: "Difference Map",
      changesDescription: "What changed, and why?",
      check: "Check your understanding",
      checkDescription: "A short question from the text",
      visual: "Content in steps",
      visualDescription: "A quick visual sequence",
      trust: "Meaning Integrity",
      trustDescription: "Independent checks for sensitive details",
    },
    panels: {
      learningTitle: "Learn from the text itself",
      learningSummary: (readings: number, words: number) => `${readings} ${readings === 1 ? "reading" : "readings"} completed and ${words} ${words === 1 ? "word" : "words"} saved.`,
      saveWord: "+ Save word",
      vocabulary: "My vocabulary",
      vocabularyDescription: "Words you have saved from your readings.",
      emptyVocabulary: "You have not saved any words yet.",
      emptyVocabularyHint: "Clarify a text, select an Arabic word, and save it from Word Lens.",
      removeWord: (word: string) => `Remove ${word}`,
      changeTitle: "Change Map",
      changeDescription: "See how each expression became clearer without moving away from its meaning.",
      before: "Before",
      after: "After",
      noChanges: "This content did not need any major wording changes.",
      checkTitle: "Did the idea come through?",
      showAnswer: "Show answer",
      hideAnswer: "Hide answer",
      understood: "I understood it ✓",
      review: "I need to review",
      checkRecorded: "Thanks—continue when you are ready.",
      visualTitle: "Content in steps",
      visualDescription: "A quick path through the order of the ideas.",
      trustTitle: "Meaning comes first",
      trustDescription: "Independent checks review sensitive details without claiming absolute certainty.",
      noDetails: "This content did not include critical details that need a separate list.",
    },
    footer: {
      reminder: "Always review important names, numbers, and deadlines.",
      copied: "Copied ✓",
      copy: "Copy text",
      newContent: "New content",
    },
    principles: {
      kicker: "The idea behind Waddeh",
      title: "We bring Arabic closer, then lead you back to it.",
      cards: [
        { title: "Readable difficulty", body: "Learners see why the source is hard: sentence length, formal wording, numbers, and dates." },
        { title: "Adaptation, not summary", body: "Waddeh controls vocabulary and structure for a target level while preserving sensitive facts." },
        { title: "Bridge Mode", body: "The learner moves through richer Arabic versions until the original wording becomes approachable." },
      ],
    },
  },
} as const;

export type UiLanguage = keyof typeof uiCopy;
