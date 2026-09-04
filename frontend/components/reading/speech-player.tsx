"use client";

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";

import { CLOUD_TTS_MAX_CHARACTERS, useSpeechPlayer } from "@/hooks/use-speech-player";
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
  const isTooLong = text.trim().length > CLOUD_TTS_MAX_CHARACTERS;
  const isActive = player.status === "playing" || player.status === "paused";
  const progress = player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0;
  const notice = isTooLong
    ? isArabic
      ? `هذا النص طويل جداً للتشغيل الصوتي. الصوت متاح للنصوص التي لا تتجاوز ${CLOUD_TTS_MAX_CHARACTERS} حرف.`
      : `This passage is too long for audio. Audio is available for passages up to ${CLOUD_TTS_MAX_CHARACTERS} characters.`
    : player.unavailable
      ? isArabic ? "الصوت غير متاح على هذا الجهاز الآن." : "Audio is unavailable on this device right now."
    : player.source === "device"
      ? isArabic ? "نستخدم صوت الجهاز لأن الصوت السحابي غير متاح." : "Using the device voice while cloud audio is unavailable."
      : "";
  const label = compact
    ? isArabic ? "استمع" : "Hear it"
    : isArabic ? "استمع إلى المقطع" : "Listen to the passage";
  const sublabel = isArabic ? "العربية" : "Arabic";

  return (
    <div className={`v4-audio ${compact ? "v4-audio-compact" : ""}`}>
      <button
        type="button"
        className="v4-audio-play"
        onClick={() => void player.toggle(text, language)}
        disabled={isTooLong}
        aria-label={isArabic ? (player.status === "playing" ? "إيقاف مؤقت" : "استمع") : (player.status === "playing" ? "Pause" : "Listen")}
      >
        {player.status === "loading" ? <span className="v4-spinner" /> : player.status === "playing" ? <Pause /> : <Play />}
      </button>
      <div className="v4-audio-body">
        <div className="v4-audio-heading">
          <span><Volume2 /> {label}<em>· {sublabel}</em></span>
        </div>
        <div className="v4-audio-progress">
          <div className={`v4-audio-wave ${player.status === "playing" ? "is-playing" : ""}`} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <span key={index} style={{ animationDelay: `${index * 90}ms`, opacity: progress >= index * 12.5 ? 1 : 0.34 }} />
            ))}
          </div>
          <span className="v4-audio-time">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
        </div>
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
