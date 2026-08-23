import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;
let persistenceReady: Promise<void> | null = null;

export function getFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigured || typeof window === "undefined") return null;
  if (services) return services;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }

  persistenceReady ??= setPersistence(auth, browserLocalPersistence);
  services = { app, auth, db };
  return services;
}

export async function ensureFirebaseAuthPersistence(): Promise<void> {
  getFirebaseServices();
  await persistenceReady;
}
