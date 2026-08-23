import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase-client";
import {
  STORAGE_KEYS,
  initialProfile,
  masteryFromEvidence,
  normalizeProfile,
  normalizeReadings,
  normalizeSavedWords,
  type LearningProfile,
  type ReadingRecord,
  type SavedWord,
  type UiLanguage,
} from "@/lib/waddeh-store";

const SCHEMA_VERSION = 1;
const LOCAL_META_KEY = "waddeh-sync-meta-v1";
const MIGRATION_KEY = "waddeh-guest-migration-v1";
const ACCOUNT_SEPARATOR = ":account:";

export interface DeletionState {
  readingIds: string[];
  vocabularyIds: string[];
}

export interface WaddehSnapshot {
  schemaVersion: number;
  uiLanguage: UiLanguage;
  profile: LearningProfile;
  readings: ReadingRecord[];
  savedWords: SavedWord[];
  deletions: DeletionState;
  updatedAt: string;
}

export interface AccountLoadResult {
  snapshot: WaddehSnapshot;
  cloudAvailable: boolean;
  migrationCompleted: boolean;
  error?: string;
}

function emptyDeletions(): DeletionState {
  return { readingIds: [], vocabularyIds: [] };
}

function scopedKey(key: string, uid?: string): string {
  return uid ? `${key}${ACCOUNT_SEPARATOR}${uid}` : key;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory app remains usable when a browser quota is exhausted.
  }
}

function localKeys(uid?: string) {
  return {
    language: scopedKey(STORAGE_KEYS.language, uid),
    vocabulary: scopedKey(STORAGE_KEYS.vocabulary, uid),
    profile: scopedKey(STORAGE_KEYS.profile, uid),
    readings: scopedKey(STORAGE_KEYS.readings, uid),
    meta: scopedKey(LOCAL_META_KEY, uid),
  };
}

export function loadLocalSnapshot(uid?: string): WaddehSnapshot {
  const keys = localKeys(uid);
  const storedLanguage = window.localStorage.getItem(keys.language);
  const meta = readJson<Partial<Pick<WaddehSnapshot, "schemaVersion" | "updatedAt" | "deletions">>>(keys.meta);
  return {
    schemaVersion: SCHEMA_VERSION,
    uiLanguage: storedLanguage === "en" ? "en" : "ar",
    profile: normalizeProfile(readJson<LearningProfile>(keys.profile)),
    readings: normalizeReadings(readJson<ReadingRecord[]>(keys.readings)),
    savedWords: normalizeSavedWords(readJson<SavedWord[]>(keys.vocabulary)),
    deletions: {
      readingIds: Array.isArray(meta?.deletions?.readingIds) ? meta.deletions.readingIds : [],
      vocabularyIds: Array.isArray(meta?.deletions?.vocabularyIds) ? meta.deletions.vocabularyIds : [],
    },
    updatedAt: typeof meta?.updatedAt === "string" ? meta.updatedAt : "1970-01-01T00:00:00.000Z",
  };
}

export function saveLocalSnapshot(snapshot: WaddehSnapshot, uid?: string): void {
  const keys = localKeys(uid);
  window.localStorage.setItem(keys.language, snapshot.uiLanguage);
  writeJson(keys.profile, snapshot.profile);
  writeJson(keys.vocabulary, snapshot.savedWords);
  try {
    writeJson(keys.readings, snapshot.readings.slice(0, 16));
  } catch {
    writeJson(keys.readings, snapshot.readings.slice(0, 6));
  }
  writeJson(keys.meta, {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: snapshot.updatedAt,
    deletions: snapshot.deletions,
  });
}

function dateValue(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeReadings(left: ReadingRecord[], right: ReadingRecord[], deleted: Set<string>): ReadingRecord[] {
  const byId = new Map<string, ReadingRecord>();
  for (const reading of [...left, ...right]) {
    if (deleted.has(reading.id)) continue;
    const current = byId.get(reading.id);
    if (!current || dateValue(reading.updatedAt) >= dateValue(current.updatedAt)) byId.set(reading.id, reading);
  }
  return normalizeReadings([...byId.values()].sort((a, b) => dateValue(b.lastOpenedAt) - dateValue(a.lastOpenedAt)));
}

function wordKey(word: SavedWord): string {
  return `${word.word.trim().toLocaleLowerCase("ar")}|${word.meaning.trim().toLocaleLowerCase()}`;
}

function mergeVocabulary(left: SavedWord[], right: SavedWord[], deleted: Set<string>): SavedWord[] {
  const byMeaning = new Map<string, SavedWord>();
  for (const word of [...left, ...right]) {
    if (deleted.has(word.id)) continue;
    const key = wordKey(word);
    const current = byMeaning.get(key);
    if (!current) {
      byMeaning.set(key, word);
      continue;
    }
    const latest = dateValue(word.lastReviewedAt) >= dateValue(current.lastReviewedAt) ? word : current;
    const quizAttempts = Math.max(current.quizAttempts, word.quizAttempts);
    const correctAnswers = Math.max(current.correctAnswers, word.correctAnswers);
    const supportCount = Math.max(current.supportCount, word.supportCount);
    const transferAttempts = Math.max(current.transferAttempts, word.transferAttempts);
    const transferCorrectAnswers = Math.max(current.transferCorrectAnswers, word.transferCorrectAnswers);
    byMeaning.set(key, {
      ...latest,
      quizAttempts,
      correctAnswers,
      supportCount,
      transferAttempts,
      transferCorrectAnswers,
      mastery: masteryFromEvidence(quizAttempts, correctAnswers, supportCount, transferAttempts, transferCorrectAnswers),
    });
  }
  return normalizeSavedWords([...byMeaning.values()].sort((a, b) => dateValue(b.lastReviewedAt) - dateValue(a.lastReviewedAt)));
}

function mergeProfile(left: LearningProfile, right: LearningProfile, preferRight: boolean): LearningProfile {
  const preferred = preferRight ? right : left;
  const evidence = left.levelEvidence.length >= right.levelEvidence.length ? left.levelEvidence : right.levelEvidence;
  return normalizeProfile({
    ...preferred,
    readings: Math.max(left.readings, right.readings),
    highestBridgeLevel: Math.max(left.highestBridgeLevel, right.highestBridgeLevel),
    understoodChecks: Math.max(left.understoodChecks, right.understoodChecks),
    reviewChecks: Math.max(left.reviewChecks, right.reviewChecks),
    difficultySignals: Object.fromEntries(
      Object.keys(initialProfile.difficultySignals).map((key) => [
        key,
        Math.max(left.difficultySignals[key as keyof typeof left.difficultySignals], right.difficultySignals[key as keyof typeof right.difficultySignals]),
      ]),
    ) as LearningProfile["difficultySignals"],
    levelEvidence: evidence,
    lastLevelAdjustmentAt: Math.max(left.lastLevelAdjustmentAt, right.lastLevelAdjustmentAt),
    hasPlacementResult: left.hasPlacementResult || right.hasPlacementResult,
  });
}

export function mergeSnapshots(left: WaddehSnapshot, right: WaddehSnapshot): WaddehSnapshot {
  const preferRight = dateValue(right.updatedAt) > dateValue(left.updatedAt);
  const deletions = {
    readingIds: [...new Set([...left.deletions.readingIds, ...right.deletions.readingIds])].slice(-200),
    vocabularyIds: [...new Set([...left.deletions.vocabularyIds, ...right.deletions.vocabularyIds])].slice(-500),
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    uiLanguage: preferRight ? right.uiLanguage : left.uiLanguage,
    profile: mergeProfile(left.profile, right.profile, preferRight),
    readings: mergeReadings(left.readings, right.readings, new Set(deletions.readingIds)),
    savedWords: mergeVocabulary(left.savedWords, right.savedWords, new Set(deletions.vocabularyIds)),
    deletions,
    updatedAt: new Date().toISOString(),
  };
}

function cleanData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 9000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Cloud sync timed out.")), timeoutMs);
    promise.then((value) => {
      window.clearTimeout(timeout);
      resolve(value);
    }, (error) => {
      window.clearTimeout(timeout);
      reject(error);
    });
  });
}

async function loadCloudSnapshot(db: Firestore, uid: string): Promise<WaddehSnapshot | null> {
  const userRef = doc(db, "users", uid);
  const [userDocument, readingDocuments, vocabularyDocuments] = await Promise.all([
    getDoc(userRef),
    getDocs(collection(userRef, "readings")),
    getDocs(collection(userRef, "vocabulary")),
  ]);
  if (!userDocument.exists() && readingDocuments.empty && vocabularyDocuments.empty) return null;
  const data = userDocument.data() as DocumentData;
  const deletions: DeletionState = {
    readingIds: Array.isArray(data.deletions?.readingIds) ? data.deletions.readingIds : [],
    vocabularyIds: Array.isArray(data.deletions?.vocabularyIds) ? data.deletions.vocabularyIds : [],
  };
  return {
    schemaVersion: Number(data.schemaVersion) || SCHEMA_VERSION,
    uiLanguage: data.uiLanguage === "en" ? "en" : "ar",
    profile: normalizeProfile(data.profile as LearningProfile | undefined),
    readings: normalizeReadings(readingDocuments.docs.map((item) => item.data())),
    savedWords: normalizeSavedWords(vocabularyDocuments.docs.map((item) => item.data() as SavedWord)),
    deletions,
    updatedAt: typeof data.clientUpdatedAt === "string" ? data.clientUpdatedAt : "1970-01-01T00:00:00.000Z",
  };
}

async function commitInChunks(db: Firestore, operations: Array<(batch: ReturnType<typeof writeBatch>) => void>): Promise<void> {
  for (let index = 0; index < operations.length; index += 400) {
    const batch = writeBatch(db);
    operations.slice(index, index + 400).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

async function writeCloudSnapshot(db: Firestore, uid: string, snapshot: WaddehSnapshot): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userData = cleanData({
    schemaVersion: SCHEMA_VERSION,
    uiLanguage: snapshot.uiLanguage,
    profile: snapshot.profile,
    deletions: snapshot.deletions,
    clientUpdatedAt: snapshot.updatedAt,
  });
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
    (batch) => batch.set(userRef, { ...userData, updatedAt: serverTimestamp() }, { merge: true }),
  ];
  for (const reading of snapshot.readings) {
    operations.push((batch) => batch.set(doc(userRef, "readings", reading.id), cleanData(reading)));
  }
  for (const word of snapshot.savedWords) {
    operations.push((batch) => batch.set(doc(userRef, "vocabulary", word.id), cleanData(word)));
  }
  for (const id of snapshot.deletions.readingIds) {
    operations.push((batch) => batch.delete(doc(userRef, "readings", id)));
  }
  for (const id of snapshot.deletions.vocabularyIds) {
    operations.push((batch) => batch.delete(doc(userRef, "vocabulary", id)));
  }
  await commitInChunks(db, operations);
}

function migrationOwner(): string | null {
  return window.localStorage.getItem(MIGRATION_KEY);
}

export async function loadAccountSnapshot(uid: string, guestSnapshot: WaddehSnapshot): Promise<AccountLoadResult> {
  const services = getFirebaseServices();
  const accountCache = loadLocalSnapshot(uid);
  if (!services) return {
    snapshot: accountCache,
    cloudAvailable: false,
    migrationCompleted: false,
    error: "Firebase is not configured.",
  };

  const shouldMigrateGuest = migrationOwner() === null;
  try {
    const cloud = await withTimeout(loadCloudSnapshot(services.db, uid));
    let merged = cloud ? mergeSnapshots(accountCache, cloud) : accountCache;
    if (shouldMigrateGuest) merged = mergeSnapshots(merged, { ...guestSnapshot, updatedAt: new Date().toISOString() });
    saveLocalSnapshot(merged, uid);
    await withTimeout(writeCloudSnapshot(services.db, uid, merged));
    if (shouldMigrateGuest) window.localStorage.setItem(MIGRATION_KEY, uid);
    return { snapshot: merged, cloudAvailable: true, migrationCompleted: shouldMigrateGuest };
  } catch (error) {
    const fallback = shouldMigrateGuest
      ? mergeSnapshots(accountCache, { ...guestSnapshot, updatedAt: new Date().toISOString() })
      : accountCache;
    saveLocalSnapshot(fallback, uid);
    return {
      snapshot: fallback,
      cloudAvailable: false,
      migrationCompleted: false,
      error: error instanceof Error ? error.message : "Cloud sync is unavailable.",
    };
  }
}

export async function syncAccountSnapshot(uid: string, snapshot: WaddehSnapshot): Promise<void> {
  const services = getFirebaseServices();
  if (!services) throw new Error("Firebase is not configured.");
  const cloud = await withTimeout(loadCloudSnapshot(services.db, uid));
  const merged = cloud ? mergeSnapshots(cloud, snapshot) : snapshot;
  saveLocalSnapshot(merged, uid);
  await withTimeout(writeCloudSnapshot(services.db, uid, merged));
  if (migrationOwner() === null) window.localStorage.setItem(MIGRATION_KEY, uid);
}

export function createSnapshot(
  uiLanguage: UiLanguage,
  profile: LearningProfile,
  readings: ReadingRecord[],
  savedWords: SavedWord[],
  deletions: DeletionState = emptyDeletions(),
): WaddehSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    uiLanguage,
    profile,
    readings: readings.slice(0, 16),
    savedWords,
    deletions,
    updatedAt: new Date().toISOString(),
  };
}
