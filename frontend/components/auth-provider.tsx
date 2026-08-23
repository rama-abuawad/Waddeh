"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import {
  ensureFirebaseAuthPersistence,
  getFirebaseServices,
  isFirebaseConfigured,
} from "@/lib/firebase-client";

export interface WaddehUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: WaddehUser | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: User | null): WaddehUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

function requireServices() {
  const services = getFirebaseServices();
  if (!services) throw new Error("FIREBASE_NOT_CONFIGURED");
  return services;
}

export function authErrorMessage(error: unknown, language: "ar" | "en"): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : String(error);
  const messages = language === "ar" ? {
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/email-already-in-use": "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
    "auth/weak-password": "استخدم كلمة مرور لا تقل عن 6 أحرف.",
    "auth/invalid-email": "أدخل بريداً إلكترونياً صالحاً.",
    "auth/popup-closed-by-user": "أُغلقت نافذة Google قبل إكمال تسجيل الدخول.",
    "auth/popup-blocked": "منع المتصفح نافذة Google. اسمح بالنوافذ المنبثقة وحاول مجدداً.",
    "auth/network-request-failed": "تعذر الاتصال بخدمة الحسابات. تحقق من اتصالك وحاول مجدداً.",
    FIREBASE_NOT_CONFIGURED: "لم يتم ربط هذا الإصدار بمشروع Firebase بعد. يمكنك المتابعة كضيف.",
  } : {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "The Google window closed before sign-in completed.",
    "auth/popup-blocked": "The browser blocked the Google window. Allow pop-ups and try again.",
    "auth/network-request-failed": "The account service could not be reached. Check your connection and try again.",
    FIREBASE_NOT_CONFIGURED: "This build is not connected to a Firebase project yet. You can continue as a guest.",
  };
  const key = Object.keys(messages).find((candidate) => code.includes(candidate));
  return key ? messages[key as keyof typeof messages] : language === "ar"
    ? "تعذر إكمال العملية. حاول مجدداً."
    : "The request could not be completed. Please try again.";
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [user, setUser] = useState<WaddehUser | null>(null);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;
    let active = true;
    ensureFirebaseAuthPersistence().catch(() => undefined);
    const unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
      if (!active) return;
      setUser(normalizeUser(nextUser));
      setLoading(false);
    }, () => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = requireServices();
    await ensureFirebaseAuthPersistence();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { auth } = requireServices();
    await ensureFirebaseAuthPersistence();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const createAccount = useCallback(async (email: string, password: string) => {
    const { auth } = requireServices();
    await ensureFirebaseAuthPersistence();
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (!credential.user.emailVerified) await sendEmailVerification(credential.user).catch(() => undefined);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { auth } = requireServices();
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    const { auth } = requireServices();
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isFirebaseConfigured,
    loading,
    user,
    signInWithGoogle,
    signInWithEmail,
    createAccount,
    resetPassword,
    signOut,
  }), [createAccount, loading, resetPassword, signInWithEmail, signInWithGoogle, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
