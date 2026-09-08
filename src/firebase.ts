import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { toast } from "sonner";

// Firebase конфигурация из .env / Vercel
// ======================
// Проверка конфигурации
// ======================
export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if keys exist or with placeholders to prevent crash
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const googleProvider = new GoogleAuthProvider();

// ======================
// Обработка ошибок
// ======================
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function getFirestoreErrorMessage(
  err: unknown,
  operationType: OperationType,
): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";

  if (code.includes("permission-denied")) {
    return "Недостаточно прав для доступа к облачной базе данных";
  }
  if (code.includes("unavailable") || code.includes("deadline-exceeded")) {
    return "Сервер базы данных недоступен (проверьте подключение)";
  }
  if (code.includes("resource-exhausted")) {
    return "Превышен лимит запросов к облачной базе";
  }
  if (code.includes("unauthenticated")) {
    return "Сессия авторизации истекла. Войдите заново";
  }

  switch (operationType) {
    case OperationType.WRITE:
    case OperationType.CREATE:
    case OperationType.UPDATE:
      return "Не удалось сохранить данные в облако";
    case OperationType.DELETE:
      return "Не удалось удалить данные в облаке";
    case OperationType.GET:
    case OperationType.LIST:
      return "Не удалось загрузить данные из облака";
    default:
      return "Ошибка синхронизации с облачной базой";
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };

  console.error("Firestore Error:", errInfo);

  // Показываем пользователю понятное уведомление без спама дубликатами
  const userMessage = getFirestoreErrorMessage(error, operationType);
  toast.error(userMessage, {
    id: `firestore-err-${operationType}`,
  });

  return errInfo;
}

// Auth functions
export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    console.error(
      "Firebase is not configured. Please add keys to environment.",
    );
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export default app;
