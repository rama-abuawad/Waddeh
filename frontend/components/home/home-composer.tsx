"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, FileText, Focus, Languages, Paperclip, TrendingUp, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { ReaderType } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import { learnerLevels, type InputMode } from "@/lib/waddeh-store";

const standardExample = "يتعين على المتقدم تقديم 3 وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً يوم 30 أغسطس 2026. ويُشترط ألا يقل عمره عن 18 عاماً، ولن تُقبل الطلبات المتأخرة، باستثناء من حصل على موافقة خطية مسبقة.";
const poetryExample = "على قدر أهل العزم تأتي العزائمُ\nوتأتي على قدر الكرام المكارمُ";
const solutionIcons = [Focus, Languages, TrendingUp];

export default function HomeComposer() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const { uiLanguage, profile, createReading } = useWaddeh();
  const copy = copyFor(uiLanguage).home;
  const [mode, setMode] = useState<InputMode>("standard");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reader, setReader] = useState<ReaderType>("general_reader");
  const [levelOverride, setLevelOverride] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const level = levelOverride ?? profile.preferredLevel;

  useEffect(() => {
    const element = textArea.current;
    if (!element) return;
    element.style.height = "0px";
    const height = Math.min(Math.max(element.scrollHeight, 192), 360);
    element.style.height = `${height}px`;
    element.style.overflowY = element.scrollHeight > 360 ? "auto" : "hidden";
  }, [mode, text]);

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

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  return (
    <div className="v4-home">
      <section className="v4-home-intro" aria-labelledby="home-title">
        <div className="v4-home-intro-copy">
          <p className="v4-kicker">{copy.eyebrow}</p>
          <h1 id="home-title"><span>{copy.title}</span><strong>{copy.accent}</strong></h1>
          <p>{copy.description}</p>
        </div>
        <aside id="how-it-works" className="v4-solution-card" aria-labelledby="solution-title">
          <p className="v4-kicker">{copy.solutionEyebrow}</p>
          <h2 id="solution-title">{copy.solutionTitle}</h2>
          <p>{copy.solutionDescription}</p>
          <div className="v4-solution-features">
            {copy.solutionItems.map((item, index) => {
              const Icon = solutionIcons[index];
              return (
                <article key={item.title}>
                  <span><Icon aria-hidden="true" /></span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
        <a className="v4-hero-scroll" href="#reader-composer">
          <span>{copy.scrollToComposer}</span>
          <ArrowDown aria-hidden="true" />
        </a>
      </section>

      <form id="reader-composer" className="v4-composer" onSubmit={handleSubmit}>
        <div className={`v4-composer-field ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          {dragging && <div className="v4-drop-message"><Upload /> {copy.drop}</div>}
          {!file ? (
            <textarea ref={textArea} dir="rtl" lang="ar" rows={3} maxLength={mode === "poetry" ? 6000 : 15000} value={text} onChange={handleTextChange} placeholder={copy.placeholder} autoFocus />
          ) : (
            <div className="v4-attachment">
              <span><FileText /></span>
              <div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</small></div>
              <button type="button" onClick={() => setFile(null)} aria-label={copy.removeAttachment}><X /></button>
            </div>
          )}

          <div className="v4-composer-toolbar">
            <div className="v4-composer-options">
              <div className="v4-mode-switch" role="tablist" aria-label={uiLanguage === "ar" ? "نوع القراءة" : "Reading mode"}>
                <button type="button" role="tab" aria-selected={mode === "standard"} className={mode === "standard" ? "active" : ""} onClick={() => setMode("standard")}>{copy.standard}</button>
                <button type="button" role="tab" aria-selected={mode === "poetry"} className={mode === "poetry" ? "active" : ""} onClick={() => { setMode("poetry"); setFile(null); }}>{copy.poetry}</button>
              </div>
              <span className="v4-composer-toolbar-divider" aria-hidden="true" />
              {mode === "standard" && <><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => acceptFile(event.target.files?.[0] ?? null)} /><button type="button" className="v4-tool-button" onClick={() => fileInput.current?.click()}><Paperclip /> {copy.attach}</button></>}
              {!file && <button type="button" className="v4-tool-button" onClick={() => setText(mode === "poetry" ? poetryExample : standardExample)}>{copy.sample}</button>}
            </div>
            <button type="submit" className="v4-submit-button">{copy.submit}<ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></button>
          </div>
        </div>

        <section className="v4-reading-preferences" aria-labelledby="reading-preferences-title">
          <div className="v4-preferences-heading">
            <strong id="reading-preferences-title">{copy.preferences}</strong>
            <span>{learnerLevels.find((item) => item.value === level)?.[uiLanguage] ?? level}</span>
          </div>
          <div className="v4-preference-grid">
            <label><span>{uiLanguage === "ar" ? "لمن نوضّح؟" : "Who is reading?"}</span><select value={reader} onChange={(event) => setReader(event.target.value as ReaderType)}><option value="general_reader">{uiLanguage === "ar" ? "قارئ عام" : "General reader"}</option><option value="non_arabic_speaker">{uiLanguage === "ar" ? "غير ناطق بالعربية" : "Non-Arabic speaker"}</option><option value="child">{uiLanguage === "ar" ? "طفل" : "Child"}</option></select></label>
            <div><span>{uiLanguage === "ar" ? "درجة التبسيط" : "Adaptation level"}</span><div className="v4-level-choices">{learnerLevels.map((item) => <button key={item.value} type="button" aria-pressed={level === item.value} className={level === item.value ? "active" : ""} onClick={() => setLevelOverride(item.value)}>{item.value}</button>)}</div></div>
          </div>
        </section>

        {error && <p className="v4-form-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
