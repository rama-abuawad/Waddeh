"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Paperclip, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import type { ReaderType } from "@/lib/api";
import { copyFor } from "@/lib/v4-copy";
import { validatePdfFile } from "@/lib/pdf-validation";
import { learnerLevels, type InputMode } from "@/lib/waddeh-store";

const standardExample = "يتعين على المتقدم تقديم 3 وثائق رسمية واستيفاء جميع الشروط قبل الساعة الخامسة مساءً يوم 30 أغسطس 2026. ويُشترط ألا يقل عمره عن 18 عاماً، ولن تُقبل الطلبات المتأخرة، باستثناء من حصل على موافقة خطية مسبقة.";
const poetryExample = "على قدر أهل العزم تأتي العزائمُ\nوتأتي على قدر الكرام المكارمُ";
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
  const selectedLevel = learnerLevels.find((item) => item.value === level);

  useEffect(() => {
    const element = textArea.current;
    if (!element) return;
    element.style.height = "0px";
    const height = Math.min(Math.max(element.scrollHeight, 192), 360);
    element.style.height = `${height}px`;
    element.style.overflowY = element.scrollHeight > 360 ? "auto" : "hidden";
  }, [mode, text]);

  async function acceptFile(nextFile: File | null) {
    if (!nextFile) return;
    const validationError = await validatePdfFile(nextFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setMode("standard");
    setFile(nextFile);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files?.[0] ?? null);
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
    <section id="start" className="v6-start-section" aria-labelledby="start-reading-title">
      <div className="v6-start-glow v6-start-glow-one" aria-hidden="true" />
      <div className="v6-start-glow v6-start-glow-two" aria-hidden="true" />
      <div className="v6-start-watermark" dir="rtl" aria-hidden="true">افهم</div>
      <div className="v6-start-inner">
        <header className="v6-start-heading">
          <p>{copy.eyebrow}</p>
          <h2 id="start-reading-title">{copy.title} <em className="serif-display">{copy.accent}</em></h2>
          <p>{copy.description}</p>
        </header>
        <div className="v6-start-card">
          <form id="reader-composer" className="v4-composer" onSubmit={handleSubmit}>
        <div className={`v4-composer-field ${dragging ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          {dragging && <div className="v4-drop-message"><Upload /> {copy.drop}</div>}
          {!file ? (
            <textarea ref={textArea} dir="rtl" lang="ar" rows={3} maxLength={mode === "poetry" ? 6000 : 15000} value={text} onChange={handleTextChange} placeholder={copy.placeholder} aria-label={copy.placeholder} />
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
              {mode === "standard" && <><input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => { void acceptFile(event.target.files?.[0] ?? null); event.target.value = ""; }} /><button type="button" className="v4-tool-button" onClick={() => fileInput.current?.click()}><Paperclip /> {copy.attach}</button></>}
              {!file && <button type="button" className="v4-tool-button" onClick={() => setText(mode === "poetry" ? poetryExample : standardExample)}>{copy.sample}</button>}
            </div>
            <button type="submit" className="v4-submit-button">{copy.submit}<ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></button>
          </div>
        </div>

        <section className="v4-reading-preferences" aria-labelledby="reading-preferences-title">
          <div className="v4-preferences-heading">
            <div><strong id="reading-preferences-title">{uiLanguage === "ar" ? "خيارات هذه القراءة" : "Choices for this reading"}</strong><small>{uiLanguage === "ar" ? "تؤثر في الشرح والتبسيط هنا فقط، ولا تغيّر مستواك الافتراضي." : "These shape this reading only and do not change your default level."}</small></div>
            <span>{selectedLevel?.[uiLanguage] ?? level}</span>
          </div>
          <div className="v4-preference-grid">
            <label><span>{uiLanguage === "ar" ? "لمن نوضّح؟" : "Who is reading?"}</span><small className="v4-preference-help">{uiLanguage === "ar" ? "نكيّف أسلوب الشرح والتبسيط ليناسب القارئ." : "Waddeh adapts its explanation and simplification style to the reader."}</small><select value={reader} onChange={(event) => setReader(event.target.value as ReaderType)}><option value="general_reader">{uiLanguage === "ar" ? "قارئ عام" : "General reader"}</option><option value="non_arabic_speaker">{uiLanguage === "ar" ? "غير ناطق بالعربية" : "Non-Arabic speaker"}</option><option value="child">{uiLanguage === "ar" ? "طفل" : "Child"}</option></select></label>
            <div><span>{uiLanguage === "ar" ? "درجة التبسيط لهذه القراءة" : "Adaptation for this reading"}</span><div className="v4-level-choices">{learnerLevels.map((item) => <button key={item.value} type="button" title={`${item.value} — ${item[uiLanguage]}`} aria-label={`${item.value} — ${item[uiLanguage]}`} aria-pressed={level === item.value} className={level === item.value ? "active" : ""} onClick={() => setLevelOverride(item.value)}>{item.value}</button>)}</div><small className="v4-selected-level">{level} — {selectedLevel?.[uiLanguage]} · {uiLanguage === "ar" ? selectedLevel?.hintAr : selectedLevel?.hintEn}</small></div>
          </div>
        </section>

        {error && <p className="v4-form-error" role="alert">{error}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
