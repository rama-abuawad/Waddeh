"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenText, FileText, Paperclip, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { ReaderType } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import { learnerLevels, readingPreview, type InputMode } from "@/lib/waddeh-store";

const standardExample = "يتعين على المتقدم تقديم 3 وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً يوم 30 أغسطس 2026. ويُشترط ألا يقل عمره عن 18 عاماً، ولن تُقبل الطلبات المتأخرة، باستثناء من حصل على موافقة خطية مسبقة.";
const poetryExample = "على قدر أهل العزم تأتي العزائمُ\nوتأتي على قدر الكرام المكارمُ";

export default function HomeComposer() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const { hydrated, uiLanguage, profile, readings, createReading } = useWaddeh();
  const copy = copyFor(uiLanguage).home;
  const [mode, setMode] = useState<InputMode>("standard");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reader, setReader] = useState<ReaderType>("general_reader");
  const [levelOverride, setLevelOverride] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const level = levelOverride ?? profile.preferredLevel;

  const continueItems = readings
    .filter((reading) => reading.status === "ready")
    .sort((left, right) => Date.parse(right.lastOpenedAt) - Date.parse(left.lastOpenedAt))
    .slice(0, 3);

  function acceptFile(nextFile: File | null) {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError(copy.pdfOnly);
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError(copy.pdfLarge);
      return;
    }
    setMode("standard");
    setFile(nextFile);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!file) {
      const minimum = mode === "poetry" ? 10 : 20;
      if (text.trim().length < minimum) {
        setError(mode === "poetry" ? copy.poetryShort : copy.textShort);
        return;
      }
    }
    const id = createReading({
      mode,
      source: file ? "pdf" : "text",
      text,
      file: file ?? undefined,
      reader,
      level,
    });
    router.push(`/reading/${id}`);
  }

  return (
    <div className="v4-home">
      <section className="v4-home-intro" aria-labelledby="home-title">
        <p className="v4-kicker">{copy.eyebrow}</p>
        <h1 id="home-title"><span>{copy.title}</span><strong>{copy.accent}</strong></h1>
        <p>{copy.description}</p>
      </section>

      <form className="v4-composer" onSubmit={handleSubmit}>
        <div className="v4-mode-switch" role="tablist" aria-label={uiLanguage === "ar" ? "نوع القراءة" : "Reading mode"}>
          <button type="button" role="tab" aria-selected={mode === "standard"} className={mode === "standard" ? "active" : ""} onClick={() => setMode("standard")}>{copy.standard}</button>
          <button type="button" role="tab" aria-selected={mode === "poetry"} className={mode === "poetry" ? "active" : ""} onClick={() => { setMode("poetry"); setFile(null); }}>{copy.poetry}</button>
        </div>

        <div className={`v4-composer-field ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          {dragging && <div className="v4-drop-message"><Upload /> {copy.drop}</div>}
          {!file ? (
            <textarea dir="rtl" lang="ar" rows={7} maxLength={mode === "poetry" ? 6000 : 15000} value={text} onChange={(event) => setText(event.target.value)} placeholder={copy.placeholder} autoFocus />
          ) : (
            <div className="v4-attachment">
              <span><FileText /></span>
              <div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</small></div>
              <button type="button" onClick={() => setFile(null)} aria-label={copy.removeAttachment}><X /></button>
            </div>
          )}

          <div className="v4-composer-toolbar">
            <div>
              {mode === "standard" && <><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => acceptFile(event.target.files?.[0] ?? null)} /><button type="button" className="v4-tool-button" onClick={() => fileInput.current?.click()}><Paperclip /> {copy.attach}</button></>}
              {!file && <button type="button" className="v4-tool-button" onClick={() => setText(mode === "poetry" ? poetryExample : standardExample)}>{copy.sample}</button>}
            </div>
            <button type="submit" className="v4-submit-button">{copy.submit}<ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></button>
          </div>
        </div>

        <details className="v4-reading-preferences">
          <summary>{copy.preferences}: {learnerLevels.find((item) => item.value === level)?.[uiLanguage] ?? level}</summary>
          <div className="v4-preference-grid">
            <label><span>{uiLanguage === "ar" ? "لمن نوضّح؟" : "Who is reading?"}</span><select value={reader} onChange={(event) => setReader(event.target.value as ReaderType)}><option value="general_reader">{uiLanguage === "ar" ? "قارئ عام" : "General reader"}</option><option value="non_arabic_speaker">{uiLanguage === "ar" ? "غير ناطق بالعربية" : "Non-Arabic speaker"}</option><option value="child">{uiLanguage === "ar" ? "طفل" : "Child"}</option></select></label>
            <div><span>{uiLanguage === "ar" ? "درجة التبسيط" : "Adaptation level"}</span><div className="v4-level-choices">{learnerLevels.map((item) => <button key={item.value} type="button" className={level === item.value ? "active" : ""} onClick={() => setLevelOverride(item.value)}>{item.value}</button>)}</div></div>
          </div>
        </details>

        {error && <p className="v4-form-error" role="alert">{error}</p>}
      </form>

      {hydrated && continueItems.length > 0 && (
        <section className="v4-continue" aria-labelledby="continue-title">
          <div className="v4-section-heading"><div><p className="v4-kicker">{copy.continue}</p><h2 id="continue-title">{uiLanguage === "ar" ? "ارجع إلى العربية التي بدأت بها" : "Return to the Arabic you started"}</h2></div><Link href="/learning">{copy.viewLearning}<ArrowRight /></Link></div>
          <div className="v4-continue-list">
            {continueItems.map((reading) => <Link key={reading.id} href={`/reading/${reading.id}`}><span><BookOpenText /></span><div><strong dir="rtl">{reading.title}</strong><p>{readingPreview(reading, uiLanguage).slice(0, 120)}</p></div><ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></Link>)}
          </div>
        </section>
      )}
    </div>
  );
}
