"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, FileText, Trash2 } from "lucide-react";
import { useState } from "react";

import { useWaddeh } from "@/components/waddeh-provider";
import { copyFor } from "@/lib/v4-copy";
import { readingPreview, type ReadingRecord } from "@/lib/waddeh-store";

type Filter = "all" | "text" | "pdf" | "poetry";

function groupFor(date: string, language: "ar" | "en"): string {
  const days = Math.floor((Date.now() - Date.parse(date)) / 86_400_000);
  if (days <= 0) return language === "ar" ? "اليوم" : "Today";
  if (days <= 7) return language === "ar" ? "هذا الأسبوع" : "This week";
  return language === "ar" ? "قبل ذلك" : "Earlier";
}

function matchesFilter(reading: ReadingRecord, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "poetry") return reading.mode === "poetry";
  if (filter === "pdf") return reading.source === "pdf";
  return reading.source === "text" && reading.mode === "standard";
}

export default function HistoryPage() {
  const { hydrated, uiLanguage, readings, deleteReading } = useWaddeh();
  const copy = copyFor(uiLanguage).learning;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const ready = readings.filter((reading) => reading.status === "ready" && matchesFilter(reading, filter) && `${reading.title} ${readingPreview(reading, uiLanguage)}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const groups = ready.reduce<Record<string, ReadingRecord[]>>((result, reading) => { const group = groupFor(reading.updatedAt, uiLanguage); (result[group] ??= []).push(reading); return result; }, {});

  if (!hydrated) return <div className="v4-learning-loading"><span /><span /></div>;
  return (
    <section className="v4-history-page">
      <div className="v4-collection-toolbar"><div className="v4-filter-row">{(["all", "text", "pdf", "poetry"] as Filter[]).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? copy.all : item === "text" ? (uiLanguage === "ar" ? "نصوص" : "Text") : item === "pdf" ? (uiLanguage === "ar" ? "مستندات" : "Documents") : (uiLanguage === "ar" ? "شعر" : "Poetry")}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiLanguage === "ar" ? "ابحث في قراءاتك…" : "Search your readings…"} /></div>
      {ready.length === 0 ? <div className="v4-collection-empty"><BookOpenText /><h2>{copy.emptyReadings}</h2><Link href="/#start">{copy.start}</Link></div> : Object.entries(groups).map(([group, items]) => <section key={group} className="v4-history-group"><h2>{group}</h2><div className="v4-history-list">{items.map((reading) => <article key={reading.id}><Link href={`/reading/${reading.id}`}><span className="v4-row-icon">{reading.source === "pdf" ? <FileText /> : <BookOpenText />}</span><div><small>{reading.mode === "poetry" ? (uiLanguage === "ar" ? "شعر" : "Poetry") : reading.source === "pdf" ? (uiLanguage === "ar" ? "مستند" : "Document") : (uiLanguage === "ar" ? "قراءة" : "Reading")}</small><strong dir="rtl">{reading.title}</strong><p>{readingPreview(reading, uiLanguage).slice(0, 180)}</p></div><ArrowRight className={uiLanguage === "ar" ? "rtl-arrow" : ""} /></Link>{confirmDelete === reading.id ? <div className="v4-inline-confirm"><span>{uiLanguage === "ar" ? "حذف هذه القراءة؟ ستبقى الكلمات المحفوظة." : "Delete this reading? Saved words will remain."}</span><button type="button" onClick={() => { deleteReading(reading.id); setConfirmDelete(null); }}>{uiLanguage === "ar" ? "حذف" : "Delete"}</button><button type="button" onClick={() => setConfirmDelete(null)}>{uiLanguage === "ar" ? "إلغاء" : "Cancel"}</button></div> : <button type="button" className="v4-row-delete" onClick={() => setConfirmDelete(reading.id)} aria-label={copy.remove}><Trash2 /></button>}</article>)}</div></section>)}
    </section>
  );
}
