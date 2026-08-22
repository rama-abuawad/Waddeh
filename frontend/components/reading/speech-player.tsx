"use client";

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";

import { useSpeechPlayer } from "@/hooks/use-speech-player";
import type { UiLanguage } from "@/lib/waddeh-store";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function SpeechPlayer({
  text,
  language,
  uiLanguage,
  compact = false,
}: {
  text: string;
  language: "ar" | "en";
  uiLanguage: UiLanguage;
  compact?: boolean;
}) {
  const player = useSpeechPlayer();
  const isArabic = uiLanguage === "ar";
  const isActive = player.status === "playing" || player.status === "paused";
  const progress = player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0;
  const notice = player.unavailable
    ? isArabic ? "الصوت غير متاح على هذا الجهاز الآن." : "Audio is unavailable on this device right now."
    : player.source === "device"
      ? isArabic ? "نستخدم صوت الجهاز لأن الصوت السحابي غير متاح." : "Using the device voice while cloud audio is unavailable."
      : "";

  return (
    <div className={`v4-audio ${compact ? "v4-audio-compact" : ""}`}>
      <button
        type="button"
        className="v4-audio-play"
        onClick={() => void player.toggle(text, language)}
        aria-label={isArabic ? (player.status === "playing" ? "إيقاف مؤقت" : "استمع") : (player.status === "playing" ? "Pause" : "Listen")}
      >
        {player.status === "loading" ? <span className="v4-spinner" /> : player.status === "playing" ? <Pause /> : <Play />}
      </button>
      <div className="v4-audio-body">
        <div className="v4-audio-heading">
          <span><Volume2 /> {isArabic ? "استمع إلى العربية" : "Listen to the Arabic"}</span>
          {!compact && <span className="v4-audio-time">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>}
        </div>
        {!compact && (
          <div className="v4-audio-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
        {notice && <small role="status">{notice}</small>}
      </div>
      {!compact && (
        <div className="v4-audio-speeds" aria-label={isArabic ? "سرعة التشغيل" : "Playback speed"}>
          {[0.75, 1, 1.25].map((speed) => (
            <button key={speed} type="button" className={player.speed === speed ? "active" : ""} onClick={() => player.setSpeed(speed)}>
              {speed}×
            </button>
          ))}
        </div>
      )}
      {isActive && (
        <button type="button" className="v4-audio-stop" onClick={player.stop} aria-label={isArabic ? "إعادة من البداية" : "Restart"}>
          <RotateCcw />
        </button>
      )}
    </div>
  );
}
