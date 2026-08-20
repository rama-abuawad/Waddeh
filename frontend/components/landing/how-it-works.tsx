import type { UiLanguage } from '@/lib/ui-copy';

const steps = {
  ar: ['العربية الأصلية', 'تناسب مستواك', 'تعلّم الكلمات الصعبة', 'تعود تدريجيًا إلى الأصل'],
  en: ['Authentic Arabic', 'Adapted to your level', 'Learn difficult words', 'Progress back toward the original'],
} as const;

interface HowItWorksProps {
  uiLanguage: UiLanguage;
}

export default function HowItWorks({ uiLanguage }: HowItWorksProps) {
  const isArabic = uiLanguage === 'ar';
  const items = steps[uiLanguage];

  return (
    <section
      id="how-it-works"
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative z-10 border-y border-ink/10 bg-[#fbfaf5]/90 px-4 py-9 backdrop-blur-xl sm:px-6"
      aria-labelledby="how-it-works-title"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
        <div>
          <p className="text-xs font-black text-teal">{isArabic ? 'رحلة وضّح' : 'The Waddeh path'}</p>
          <h2 id="how-it-works-title" className="mt-2 text-balance text-2xl font-black text-ink sm:text-3xl">
            {isArabic ? 'من النص الأصلي إلى فهم أعمق، في خطوات قليلة.' : 'From original text to deeper understanding, quickly.'}
          </h2>
        </div>
        <ol className="grid w-full gap-2 text-start sm:grid-cols-4">
          {items.map((step, index) => (
            <li
              key={step}
              className="group flex min-h-20 items-center gap-3 rounded-[1.35rem] border border-ink/10 bg-white/72 px-4 py-3 shadow-[0_14px_40px_rgba(23,55,47,0.06)]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e4f2eb] text-xs font-black text-teal">
                {index + 1}
              </span>
              <span className="text-sm font-black leading-6 text-ink">{step}</span>
              {index < items.length - 1 && (
                <span className="ms-auto hidden text-ink/25 sm:block" aria-hidden="true">
                  {isArabic ? '←' : '→'}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
