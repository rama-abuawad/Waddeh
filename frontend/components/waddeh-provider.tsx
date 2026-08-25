"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/auth-provider";
import {
  explainPoetry,
  simplifyPdf,
  simplifyText,
  type MeaningThreadKind,
  type WordExplanation,
} from "@/lib/api";
import {
  buildReadingMemorySnapshot,
  clampLevel,
  createLocalId,
  deriveReadingTitle,
  initialProfile,
  masteryFromEvidence,
  placementLevelFromScore,
  type LearningProfile,
  type NewReadingInput,
  type ReadingRecord,
  type ReadingSize,
  type ReadingTab,
  type SavedItemKind,
  type SavedWord,
  type UiLanguage,
} from "@/lib/waddeh-store";
import {
  createSnapshot,
  loadAccountSnapshot,
  loadLocalSnapshot,
  saveLocalSnapshot,
  syncAccountSnapshot,
  type DeletionState,
  type WaddehSnapshot,
} from "@/lib/waddeh-repository";

interface SaveWordOptions {
  kind?: SavedItemKind;
  sourceReadingId?: string;
  sourceTitle?: string;
}

interface WaddehContextValue {
  hydrated: boolean;
  uiLanguage: UiLanguage;
  setUiLanguage: (language: UiLanguage) => void;
  readingSize: ReadingSize;
  setReadingSize: (size: ReadingSize) => void;
  savedWords: SavedWord[];
  profile: LearningProfile;
  readings: ReadingRecord[];
  cloudSync: {
    state: "guest" | "syncing" | "synced" | "offline";
    lastSyncedAt?: string;
    error?: string;
  };
  createReading: (input: NewReadingInput) => string;
  processReading: (id: string) => Promise<void>;
  retryReading: (id: string) => void;
  reattachPdf: (id: string, file: File) => void;
  reopenReading: (id: string) => void;
  deleteReading: (id: string) => void;
  setReadingTab: (id: string, tab: ReadingTab) => void;
  saveWord: (word: WordExplanation, options?: SaveWordOptions) => void;
  removeWord: (id: string) => void;
  recordVocabularyQuiz: (id: string, correct: boolean) => void;
  recordTransferResult: (id: string, correct: boolean) => void;
  recordComprehension: (readingId: string, choiceIndex: number) => void;
  recordMeaningThread: (kind: MeaningThreadKind) => void;
  setPreferredLevel: (level: number, mode?: LearningProfile["levelMode"]) => void;
  completePlacement: (score: number) => void;
}

const WaddehContext = createContext<WaddehContextValue | null>(null);
const READING_SIZE_KEY = "waddeh-reading-size-v1";

export default function WaddehProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>("ar");
  const [readingSize, setReadingSizeState] = useState<ReadingSize>("default");
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [profile, setProfile] = useState<LearningProfile>(initialProfile);
  const [readings, setReadings] = useState<ReadingRecord[]>([]);
  const [deletions, setDeletions] = useState<DeletionState>({ readingIds: [], vocabularyIds: [] });
  const [cloudSync, setCloudSync] = useState<WaddehContextValue["cloudSync"]>({ state: "guest" });
  const readingsRef = useRef<ReadingRecord[]>([]);
  const savedWordsRef = useRef<SavedWord[]>([]);
  const profileRef = useRef<LearningProfile>(initialProfile);
  const pendingFiles = useRef(new Map<string, File>());
  const processing = useRef(new Set<string>());
  const activeUid = useRef<string | null>(null);
  const switchingScope = useRef(false);

  useLayoutEffect(() => {
    const snapshot = loadLocalSnapshot();
    const storedReadingSize = window.localStorage.getItem(READING_SIZE_KEY);
    setUiLanguageState(snapshot.uiLanguage);
    setSavedWords(snapshot.savedWords);
    setProfile(snapshot.profile);
    setReadings(snapshot.readings);
    setDeletions(snapshot.deletions);
    const normalizedReadingSize = storedReadingSize === "smaller" || storedReadingSize === "larger" ? storedReadingSize : "default";
    setReadingSizeState(normalizedReadingSize);
    setHydrated(true);
  }, []);

  useEffect(() => {
    readingsRef.current = readings;
  }, [readings]);

  useEffect(() => {
    savedWordsRef.current = savedWords;
  }, [savedWords]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === "ar" ? "rtl" : "ltr";
  }, [uiLanguage]);

  const setReadingSize = useCallback((size: ReadingSize) => {
    setReadingSizeState(size);
    try {
      window.localStorage.setItem(READING_SIZE_KEY, size);
    } catch {
      // The current in-memory preference remains usable when storage is unavailable.
    }
  }, []);

  const applySnapshot = useCallback((snapshot: WaddehSnapshot) => {
    setUiLanguageState(snapshot.uiLanguage);
    setProfile(snapshot.profile);
    setReadings(snapshot.readings);
    setSavedWords(snapshot.savedWords);
    setDeletions(snapshot.deletions);
    readingsRef.current = snapshot.readings;
    savedWordsRef.current = snapshot.savedWords;
    profileRef.current = snapshot.profile;
  }, []);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    const nextUid = user?.uid ?? null;
    if (nextUid === activeUid.current) return;
    let cancelled = false;
    switchingScope.current = true;

    if (!nextUid) {
      const guestSnapshot = loadLocalSnapshot();
      activeUid.current = null;
      applySnapshot(guestSnapshot);
      setCloudSync({ state: "guest" });
      window.setTimeout(() => { switchingScope.current = false; }, 0);
      return;
    }

    setCloudSync({ state: "syncing" });
    const guestSnapshot = loadLocalSnapshot();
    loadAccountSnapshot(nextUid, guestSnapshot).then((result) => {
      if (cancelled) return;
      activeUid.current = nextUid;
      applySnapshot(result.snapshot);
      setCloudSync(result.cloudAvailable
        ? { state: "synced", lastSyncedAt: new Date().toISOString() }
        : { state: "offline", error: result.error });
      window.setTimeout(() => { switchingScope.current = false; }, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, authLoading, hydrated, user?.uid]);

  useEffect(() => {
    if (!hydrated || authLoading || switchingScope.current) return;
    const snapshot = createSnapshot(uiLanguage, profile, readings, savedWords, deletions);
    const uid = activeUid.current;
    saveLocalSnapshot(snapshot, uid ?? undefined);
    if (!uid) return;
    setCloudSync((current) => current.state === "syncing" ? current : { ...current, state: "syncing" });
    const timeout = window.setTimeout(() => {
      syncAccountSnapshot(uid, snapshot).then(() => {
        if (activeUid.current === uid) setCloudSync({ state: "synced", lastSyncedAt: new Date().toISOString() });
      }).catch((error) => {
        if (activeUid.current === uid) setCloudSync({
          state: "offline",
          error: error instanceof Error ? error.message : "Cloud sync is unavailable.",
        });
      });
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [authLoading, deletions, hydrated, profile, readings, savedWords, uiLanguage]);

  useEffect(() => {
    if (!hydrated || authLoading || cloudSync.state !== "offline") return;
    const retry = () => {
      const uid = activeUid.current;
      if (!uid) return;
      const snapshot = createSnapshot(uiLanguage, profile, readings, savedWords, deletions);
      setCloudSync({ state: "syncing" });
      syncAccountSnapshot(uid, snapshot).then(() => {
        if (activeUid.current === uid) setCloudSync({ state: "synced", lastSyncedAt: new Date().toISOString() });
      }).catch((error) => {
        if (activeUid.current === uid) setCloudSync({
          state: "offline",
          error: error instanceof Error ? error.message : "Cloud sync is unavailable.",
        });
      });
    };
    const timeout = window.setTimeout(retry, 15_000);
    window.addEventListener("online", retry);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("online", retry);
    };
  }, [authLoading, cloudSync.state, deletions, hydrated, profile, readings, savedWords, uiLanguage]);

  const setUiLanguage = useCallback((language: UiLanguage) => setUiLanguageState(language), []);

  const updateReading = useCallback((id: string, updater: (record: ReadingRecord) => ReadingRecord) => {
    setReadings((current) => current.map((record) => (record.id === id ? updater(record) : record)));
  }, []);

  const createReading = useCallback((input: NewReadingInput) => {
    const id = createLocalId();
    const now = new Date().toISOString();
    const sourceName = input.file?.name;
    if (input.file) pendingFiles.current.set(id, input.file);
    const record: ReadingRecord = {
      id,
      mode: input.mode,
      source: input.source,
      sourceText: input.text.trim(),
      sourceName,
      reader: input.reader,
      level: clampLevel(input.level),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      title: deriveReadingTitle(input.mode, input.source, input.text, sourceName),
      selectedTab: "understand",
    };
    setReadings((current) => [record, ...current.filter((item) => item.id !== id)].slice(0, 16));
    readingsRef.current = [record, ...readingsRef.current.filter((item) => item.id !== id)].slice(0, 16);
    return id;
  }, []);

  const processReading = useCallback(async (id: string) => {
    const record = readingsRef.current.find((item) => item.id === id);
    if (!record || record.status === "ready" || processing.current.has(id)) return;
    processing.current.add(id);
    const now = new Date().toISOString();
    updateReading(id, (item) => ({ ...item, status: "processing", error: undefined, recovery: undefined, updatedAt: now }));

    try {
      const memory = buildReadingMemorySnapshot(savedWordsRef.current, profileRef.current);
      const result = record.mode === "poetry"
        ? { kind: "poetry" as const, data: await explainPoetry({ text: record.sourceText, reader: record.reader, level: record.level }) }
        : record.source === "pdf"
          ? (() => {
              const file = pendingFiles.current.get(id);
              if (!file) throw new Error("PDF_FILE_MISSING");
              return simplifyPdf(file, record.reader, record.level, memory).then((data) => ({ kind: "standard" as const, data }));
            })()
          : simplifyText({
              text: record.sourceText,
              reader: record.reader,
              level: record.level,
              reading_memory: memory,
            }).then((data) => ({ kind: "standard" as const, data }));
      const resolved = await result;
      const completedAt = new Date().toISOString();
      updateReading(id, (item) => ({
        ...item,
        status: "ready",
        recovery: undefined,
        result: resolved,
        sourceName: resolved.kind === "standard" ? resolved.data.source_name ?? item.sourceName : item.sourceName,
        title: deriveReadingTitle(item.mode, item.source, item.sourceText, resolved.kind === "standard" ? resolved.data.source_name ?? item.sourceName : item.sourceName),
        updatedAt: completedAt,
        lastOpenedAt: completedAt,
      }));
      setProfile((current) => ({
        ...current,
        readings: current.readings + 1,
        highestBridgeLevel: resolved.kind === "standard"
          ? Math.max(current.highestBridgeLevel, resolved.data.bridge.current_level)
          : current.highestBridgeLevel,
      }));
      pendingFiles.current.delete(id);
    } catch (error) {
      const pdfMissing = error instanceof Error && error.message === "PDF_FILE_MISSING";
      updateReading(id, (item) => ({
        ...item,
        status: "error",
        error: pdfMissing ? undefined : error instanceof Error ? error.message : "The reading could not be prepared.",
        recovery: pdfMissing ? "pdf_file_missing" : undefined,
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      processing.current.delete(id);
    }
  }, [updateReading]);

  const retryReading = useCallback((id: string) => {
    updateReading(id, (record) => record.source === "pdf" && !pendingFiles.current.has(id)
      ? { ...record, status: "error", error: undefined, recovery: "pdf_file_missing", updatedAt: new Date().toISOString() }
      : { ...record, status: "pending", error: undefined, recovery: undefined, updatedAt: new Date().toISOString() });
  }, [updateReading]);

  const reattachPdf = useCallback((id: string, file: File) => {
    const record = readingsRef.current.find((item) => item.id === id);
    if (!record || record.source !== "pdf") return;
    pendingFiles.current.set(id, file);
    updateReading(id, (item) => ({
      ...item,
      sourceName: file.name,
      title: file.name,
      status: "pending",
      error: undefined,
      recovery: undefined,
      updatedAt: new Date().toISOString(),
    }));
  }, [updateReading]);

  const reopenReading = useCallback((id: string) => {
    updateReading(id, (record) => ({ ...record, lastOpenedAt: new Date().toISOString() }));
  }, [updateReading]);

  const deleteReading = useCallback((id: string) => {
    pendingFiles.current.delete(id);
    setReadings((current) => current.filter((record) => record.id !== id));
    setDeletions((current) => ({
      ...current,
      readingIds: [...new Set([...current.readingIds, id])].slice(-200),
    }));
  }, []);

  const setReadingTab = useCallback((id: string, tab: ReadingTab) => {
    updateReading(id, (record) => ({ ...record, selectedTab: tab, updatedAt: new Date().toISOString() }));
  }, [updateReading]);

  const saveWord = useCallback((word: WordExplanation, options: SaveWordOptions = {}) => {
    setSavedWords((current) => {
      const existing = current.find((item) => item.word === word.word && item.meaning === word.meaning);
      if (existing) {
        return current.map((item) => item.id === existing.id ? {
          ...item,
          supportCount: item.supportCount + 1,
          mastery: masteryFromEvidence(
            item.quizAttempts,
            item.correctAnswers,
            item.supportCount + 1,
            item.transferAttempts,
            item.transferCorrectAnswers,
          ),
          lastReviewedAt: new Date().toISOString(),
          sourceReadingId: options.sourceReadingId ?? item.sourceReadingId,
          sourceTitle: options.sourceTitle ?? item.sourceTitle,
          kind: options.kind ?? item.kind,
        } : item);
      }
      const now = new Date().toISOString();
      return [{
        ...word,
        id: createLocalId(),
        kind: options.kind ?? "word",
        savedAt: now,
        mastery: "new",
        supportCount: 1,
        lastReviewedAt: now,
        quizAttempts: 0,
        correctAnswers: 0,
        transferAttempts: 0,
        transferCorrectAnswers: 0,
        sourceReadingId: options.sourceReadingId,
        sourceTitle: options.sourceTitle,
      }, ...current];
    });
  }, []);

  const removeWord = useCallback((id: string) => {
    setSavedWords((current) => current.filter((word) => word.id !== id));
    setDeletions((current) => ({
      ...current,
      vocabularyIds: [...new Set([...current.vocabularyIds, id])].slice(-500),
    }));
  }, []);

  const recordVocabularyQuiz = useCallback((id: string, correct: boolean) => {
    setSavedWords((current) => current.map((word) => {
      if (word.id !== id) return word;
      const quizAttempts = word.quizAttempts + 1;
      const correctAnswers = word.correctAnswers + (correct ? 1 : 0);
      return {
        ...word,
        quizAttempts,
        correctAnswers,
        mastery: masteryFromEvidence(quizAttempts, correctAnswers, word.supportCount, word.transferAttempts, word.transferCorrectAnswers),
        lastReviewedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const recordTransferResult = useCallback((id: string, correct: boolean) => {
    setSavedWords((current) => current.map((word) => {
      if (word.id !== id) return word;
      const transferAttempts = word.transferAttempts + 1;
      const transferCorrectAnswers = word.transferCorrectAnswers + (correct ? 1 : 0);
      return {
        ...word,
        transferAttempts,
        transferCorrectAnswers,
        mastery: masteryFromEvidence(word.quizAttempts, word.correctAnswers, word.supportCount, transferAttempts, transferCorrectAnswers),
        lastReviewedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const recordComprehension = useCallback((readingId: string, choiceIndex: number) => {
    const record = readingsRef.current.find((item) => item.id === readingId);
    if (!record?.result || record.result.kind !== "standard" || record.comprehensionChoice !== undefined) return;
    const correct = choiceIndex === record.result.data.comprehension_check.correct_choice_index;
    updateReading(readingId, (item) => ({ ...item, comprehensionChoice: choiceIndex, updatedAt: new Date().toISOString() }));
    setProfile((current) => {
      const levelEvidence = [...current.levelEvidence, correct];
      let preferredLevel = current.preferredLevel;
      let lastLevelAdjustmentAt = current.lastLevelAdjustmentAt;
      const evidence = levelEvidence.slice(lastLevelAdjustmentAt);
      if (current.levelMode === "automatic" && evidence.length >= 3) {
        const accuracy = evidence.filter(Boolean).length / evidence.length;
        if (accuracy >= 0.8) preferredLevel = Math.min(4, preferredLevel + 1);
        if (accuracy <= 0.34) preferredLevel = Math.max(1, preferredLevel - 1);
        lastLevelAdjustmentAt = levelEvidence.length;
      }
      return {
        ...current,
        preferredLevel,
        understoodChecks: current.understoodChecks + (correct ? 1 : 0),
        reviewChecks: current.reviewChecks + (correct ? 0 : 1),
        levelEvidence,
        lastLevelAdjustmentAt,
      };
    });
  }, [updateReading]);

  const recordMeaningThread = useCallback((kind: MeaningThreadKind) => {
    setProfile((current) => ({
      ...current,
      difficultySignals: {
        ...current.difficultySignals,
        [kind]: Math.min(99, current.difficultySignals[kind] + 1),
      },
    }));
  }, []);

  const setPreferredLevel = useCallback((level: number, mode: LearningProfile["levelMode"] = "manual") => {
    setProfile((current) => ({
      ...current,
      preferredLevel: clampLevel(level),
      levelMode: mode,
      hasPlacementResult: mode === "automatic" ? current.hasPlacementResult : false,
      levelEvidence: [],
      lastLevelAdjustmentAt: 0,
    }));
  }, []);

  const completePlacement = useCallback((score: number) => {
    setProfile((current) => ({
      ...current,
      preferredLevel: placementLevelFromScore(score),
      hasPlacementResult: true,
      levelMode: "automatic",
      levelEvidence: [],
      lastLevelAdjustmentAt: 0,
    }));
  }, []);

  const value = useMemo<WaddehContextValue>(() => ({
    hydrated,
    uiLanguage,
    setUiLanguage,
    readingSize,
    setReadingSize,
    savedWords,
    profile,
    readings,
    cloudSync,
    createReading,
    processReading,
    retryReading,
    reattachPdf,
    reopenReading,
    deleteReading,
    setReadingTab,
    saveWord,
    removeWord,
    recordVocabularyQuiz,
    recordTransferResult,
    recordComprehension,
    recordMeaningThread,
    setPreferredLevel,
    completePlacement,
  }), [
    hydrated, uiLanguage, setUiLanguage, readingSize, setReadingSize, savedWords, profile, readings, cloudSync, createReading,
    processReading, retryReading, reattachPdf, reopenReading, deleteReading, setReadingTab, saveWord,
    removeWord, recordVocabularyQuiz, recordTransferResult, recordComprehension,
    recordMeaningThread, setPreferredLevel, completePlacement,
  ]);

  return <WaddehContext.Provider value={value}>{children}</WaddehContext.Provider>;
}

export function useWaddeh(): WaddehContextValue {
  const value = useContext(WaddehContext);
  if (!value) throw new Error("useWaddeh must be used inside WaddehProvider.");
  return value;
}
