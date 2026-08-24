"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SpeechRequestError,
  generateSpeechBlob,
  type SpeechFailureReason,
} from "@/lib/api";

export type SpeechStatus = "idle" | "loading" | "playing" | "paused";
export type SpeechSource = "cloud" | "device" | null;

const audioCache = new Map<string, Blob>();
const AUDIO_CACHE_LIMIT = 10;
const CLOUD_TTS_MAX_CHARACTERS = 600;

async function browserVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return [];
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return existing;
  return await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    const timeout = window.setTimeout(finish, 1_200);
    synth.addEventListener("voiceschanged", finish);
  });
}

function findVoice(language: "ar" | "en", voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferred = language === "ar" ? ["ar-AE", "ar-SA", "ar"] : ["en-US", "en-GB", "en"];
  for (const locale of preferred) {
    const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
    if (exact) return exact;
    const prefix = voices.find((voice) => voice.lang.toLowerCase().startsWith(`${locale.toLowerCase()}-`));
    if (prefix) return prefix;
  }
  return null;
}

export function useSpeechPlayer() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [source, setSource] = useState<SpeechSource>(null);
  const [speed, setSpeedState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [noticeReason, setNoticeReason] = useState<SpeechFailureReason | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const requestId = useRef(0);

  const releaseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    audioRef.current = null;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  const stop = useCallback(() => {
    requestId.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    releaseAudio();
    setStatus("idle");
    setSource(null);
    setCurrentTime(0);
    setDuration(0);
    setNoticeReason(null);
    setUnavailable(false);
  }, [releaseAudio]);

  useEffect(() => stop, [stop]);

  const playBlob = useCallback(async (blob: Blob, activeRequest: number) => {
    if (activeRequest !== requestId.current) return;
    releaseAudio();
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audio.preload = "metadata";
    audio.playbackRate = speed;
    audioRef.current = audio;
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      setStatus("idle");
      setCurrentTime(0);
    };
    audio.onerror = () => {
      setUnavailable(true);
      setStatus("idle");
    };
    setSource("cloud");
    setNoticeReason(null);
    setUnavailable(false);
    await audio.play();
    setStatus("playing");
  }, [releaseAudio, speed]);

  const playDevice = useCallback(async (
    text: string,
    language: "ar" | "en",
    reason: SpeechFailureReason,
    activeRequest: number,
  ) => {
    if (activeRequest !== requestId.current || !("speechSynthesis" in window)) {
      setUnavailable(true);
      setNoticeReason(reason);
      setStatus("idle");
      return;
    }
    const voice = findVoice(language, await browserVoices());
    if (activeRequest !== requestId.current) return;
    if (!voice) {
      setUnavailable(true);
      setNoticeReason(reason);
      setStatus("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = speed === 0.75 ? 0.78 : speed === 1.25 ? 1.08 : 0.9;
    utterance.onend = () => {
      if (activeRequest === requestId.current) setStatus("idle");
    };
    utterance.onerror = () => {
      if (activeRequest !== requestId.current) return;
      setUnavailable(true);
      setStatus("idle");
    };
    utteranceRef.current = utterance;
    setSource("device");
    setNoticeReason(reason);
    setUnavailable(false);
    setDuration(0);
    setCurrentTime(0);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  }, [speed]);

  const start = useCallback(async (text: string, language: "ar" | "en") => {
    const cleanText = text.trim();
    if (!cleanText) return;
    requestId.current += 1;
    const activeRequest = requestId.current;
    controllerRef.current?.abort();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    releaseAudio();
    setStatus("loading");
    setUnavailable(false);
    setNoticeReason(null);
    setCurrentTime(0);
    setDuration(0);
    if (cleanText.length > CLOUD_TTS_MAX_CHARACTERS) {
      await playDevice(cleanText, language, "provider_rejected", activeRequest);
      return;
    }
    const cacheKey = `${language}:${cleanText}`;
    const cached = audioCache.get(cacheKey);
    if (cached) {
      try {
        await playBlob(cached, activeRequest);
      } catch {
        await playDevice(cleanText, language, "invalid_audio", activeRequest);
      }
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const blob = await generateSpeechBlob(cleanText, language, controller.signal);
      if (activeRequest !== requestId.current) return;
      if (audioCache.size >= AUDIO_CACHE_LIMIT) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, blob);
      await playBlob(blob, activeRequest);
    } catch (error) {
      if (controller.signal.aborted || activeRequest !== requestId.current) return;
      const reason = error instanceof SpeechRequestError ? error.reason : "unknown";
      await playDevice(cleanText, language, reason, activeRequest);
    }
  }, [playBlob, playDevice, releaseAudio]);

  const toggle = useCallback(async (text: string, language: "ar" | "en") => {
    if (status === "playing") {
      if (source === "cloud" && audioRef.current) audioRef.current.pause();
      if (source === "device" && "speechSynthesis" in window) window.speechSynthesis.pause();
      setStatus("paused");
      return;
    }
    if (status === "paused") {
      if (source === "cloud" && audioRef.current) await audioRef.current.play();
      if (source === "device" && "speechSynthesis" in window) window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    await start(text, language);
  }, [source, start, status]);

  const setSpeed = useCallback((nextSpeed: number) => {
    setSpeedState(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  }, []);

  return {
    status,
    source,
    speed,
    currentTime,
    duration,
    noticeReason,
    unavailable,
    toggle,
    stop,
    setSpeed,
  };
}
