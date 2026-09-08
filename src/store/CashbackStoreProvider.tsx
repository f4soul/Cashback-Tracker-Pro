import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";

import { MonthData, Bank, AppSettings, BackupData } from "../types";
import { getCurrentMonthId } from "../utils/date";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useThemeSync } from "../hooks/useThemeSync";

export interface CashbackState {
  allData: MonthData[];
  selectedMonthId: string;
  customBanks: Bank[];
  deletedCustomBanks: Bank[];
  customCategories: string[];
  settings: AppSettings;
  theme: "light" | "dark";
  isSyncing: boolean;
  hasInitialSync: boolean;
}

export type CashbackAction =
  | { type: "SET_ALL_DATA"; payload: MonthData[] }
  | { type: "SET_SELECTED_MONTH_ID"; payload: string }
  | { type: "SET_CUSTOM_BANKS"; payload: Bank[] }
  | { type: "SET_DELETED_CUSTOM_BANKS"; payload: Bank[] }
  | { type: "SET_CUSTOM_CATEGORIES"; payload: string[] }
  | { type: "SET_SETTINGS"; payload: AppSettings }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_IS_SYNCING"; payload: boolean }
  | { type: "SET_HAS_INITIAL_SYNC"; payload: boolean }
  | { type: "UPDATE_MONTH"; payload: MonthData }
  | {
      type: "DELETE_MONTH_ENTRY";
      payload: { monthId: string; entryId: string };
    }
  | { type: "DELETE_MONTH"; payload: string }
  | { type: "ADD_CUSTOM_BANK"; payload: Bank }
  | { type: "DELETE_CUSTOM_BANK"; payload: string }
  | { type: "ADD_CUSTOM_CATEGORY"; payload: string }
  | {
      type: "IMPORT_DATA";
      payload: {
        allData: MonthData[];
        customBanks?: Bank[];
        deletedCustomBanks?: Bank[];
        customCategories?: string[];
        settings?: AppSettings;
        theme?: "light" | "dark";
      };
    };

const defaultSettings: AppSettings = {
  logoShape: "circle",
  accentColor: "#10b981",
  percentBlockBg: "#ecfdf5",
  percentBlockText: "#047857",
  fontColor: "#6b7280",
};

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
}

function getInitialState(): CashbackState {
  return {
    allData: loadFromLocalStorage<MonthData[]>("cashback_data", []),
    selectedMonthId: getCurrentMonthId(),
    customBanks: loadFromLocalStorage<Bank[]>("custom_banks", []),
    deletedCustomBanks: loadFromLocalStorage<Bank[]>(
      "deleted_custom_banks",
      [],
    ),
    customCategories: loadFromLocalStorage<string[]>("custom_categories", []),
    settings: loadFromLocalStorage<AppSettings>(
      "app_settings",
      defaultSettings,
    ),
    theme: loadFromLocalStorage<"light" | "dark">("theme", "light"),
    isSyncing: false,
    hasInitialSync: false,
  };
}

function cashbackReducer(
  state: CashbackState,
  action: CashbackAction,
): CashbackState {
  switch (action.type) {
    case "SET_ALL_DATA":
      return { ...state, allData: action.payload };

    case "SET_SELECTED_MONTH_ID":
      return { ...state, selectedMonthId: action.payload };

    case "SET_CUSTOM_BANKS":
      return { ...state, customBanks: action.payload };

    case "SET_DELETED_CUSTOM_BANKS":
      return { ...state, deletedCustomBanks: action.payload };

    case "SET_CUSTOM_CATEGORIES":
      return { ...state, customCategories: action.payload };

    case "SET_SETTINGS":
      return { ...state, settings: action.payload };

    case "SET_THEME":
      return { ...state, theme: action.payload };

    case "SET_IS_SYNCING":
      return { ...state, isSyncing: action.payload };

    case "SET_HAS_INITIAL_SYNC":
      return { ...state, hasInitialSync: action.payload };

    case "UPDATE_MONTH": {
      const exists = state.allData.some(
        (d) => d.monthId === action.payload.monthId,
      );
      const nextAllData = exists
        ? state.allData.map((d) =>
            d.monthId === action.payload.monthId ? action.payload : d,
          )
        : [...state.allData, action.payload];
      return { ...state, allData: nextAllData };
    }

    case "DELETE_MONTH_ENTRY": {
      const targetMonth = state.allData.find(
        (m) => m.monthId === action.payload.monthId,
      );
      if (!targetMonth) return state;
      const newEntries = targetMonth.entries.filter(
        (e) => e.id !== action.payload.entryId,
      );
      const newMonthData = { ...targetMonth, entries: newEntries };
      return {
        ...state,
        allData: state.allData.map((m) =>
          m.monthId === action.payload.monthId ? newMonthData : m,
        ),
      };
    }

    case "DELETE_MONTH":
      return {
        ...state,
        allData: state.allData.filter((m) => m.monthId !== action.payload),
      };

    case "ADD_CUSTOM_BANK": {
      if (state.customBanks.some((b) => b.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        customBanks: [...state.customBanks, action.payload],
      };
    }

    case "DELETE_CUSTOM_BANK": {
      const newBanks = state.customBanks.filter((b) => b.id !== action.payload);
      return {
        ...state,
        customBanks: newBanks,
      };
    }

    case "ADD_CUSTOM_CATEGORY": {
      if (state.customCategories.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        customCategories: [...state.customCategories, action.payload],
      };
    }

    case "IMPORT_DATA":
      return {
        ...state,
        allData: action.payload.allData,
        customBanks: action.payload.customBanks ?? state.customBanks,
        deletedCustomBanks:
          action.payload.deletedCustomBanks ?? state.deletedCustomBanks,
        customCategories:
          action.payload.customCategories ?? state.customCategories,
        settings: action.payload.settings ?? state.settings,
        theme: action.payload.theme ?? state.theme,
      };

    default:
      return state;
  }
}

function useDebouncedStorage<T>(key: string, value: T, delay = 300) {
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }, delay);
    return () => clearTimeout(handler);
  }, [key, value, delay]);
}

export interface CashbackStoreContextValue {
  // State
  allData: MonthData[];
  selectedMonthId: string;
  customBanks: Bank[];
  deletedCustomBanks: Bank[];
  customCategories: string[];
  settings: AppSettings;
  theme: "light" | "dark";
  isSyncing: boolean;
  hasInitialSync: boolean;

  // Derivations
  currentMonthData: MonthData;
  archiveData: MonthData[];

  // Setters
  setAllData: (
    value: MonthData[] | ((prev: MonthData[]) => MonthData[]),
  ) => void;
  setSelectedMonthId: React.Dispatch<React.SetStateAction<string>>;
  setCustomBanks: (value: Bank[] | ((prev: Bank[]) => Bank[])) => void;
  setDeletedCustomBanks: (value: Bank[] | ((prev: Bank[]) => Bank[])) => void;
  setCustomCategories: (
    value: string[] | ((prev: string[]) => string[]),
  ) => void;
  setSettings: (
    value: AppSettings | ((prev: AppSettings) => AppSettings),
  ) => void;
  setTheme: (
    value: ("light" | "dark") | ((prev: "light" | "dark") => "light" | "dark"),
  ) => void;

  // Actions
  handleUpdateCurrentMonth: (updatedData: MonthData) => void;
  deleteMonthEntry: (monthId: string, entryId: string) => void;
  handleDeleteMonth: (monthId: string) => void;
  handleDeleteCustomBank: (bankId: string) => void;
  handleAddCustomBank: (bank: Bank) => void;
  handleAddCustomCategory: (category: string) => void;
  saveToFirestore: (type: "settings" | "month", payload: unknown) => void;
  handleExportAllData: () => void;
  handleImportAllData: (jsonData: unknown) => Promise<boolean>;
  toggleTheme: () => void;
  handleUpdateSettings: (
    newSettings: AppSettings | ((prev: AppSettings) => AppSettings),
  ) => void;
}

const CashbackStoreContext = createContext<CashbackStoreContextValue | null>(
  null,
);

export function CashbackStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    cashbackReducer,
    undefined,
    getInitialState,
  );

  // User from Firebase Auth listener
  const { user } = useAuth();
  const currentUser = user;
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Theme and UI settings managed by dedicated useThemeSync
  const {
    theme,
    setTheme: setSystemTheme,
    settings,
    setSettings: setSystemSettings,
  } = useThemeSync();

  // Keep debounced localStorage in sync for data
  useDebouncedStorage("cashback_data", state.allData);
  useDebouncedStorage("custom_banks", state.customBanks);
  useDebouncedStorage("deleted_custom_banks", state.deletedCustomBanks);
  useDebouncedStorage("custom_categories", state.customCategories);

  // Stable ref for state and theme settings
  const stateRef = useRef({
    allData: state.allData,
    selectedMonthId: state.selectedMonthId,
    customBanks: state.customBanks,
    deletedCustomBanks: state.deletedCustomBanks,
    customCategories: state.customCategories,
    settings,
    theme,
  });

  useEffect(() => {
    stateRef.current = {
      allData: state.allData,
      selectedMonthId: state.selectedMonthId,
      customBanks: state.customBanks,
      deletedCustomBanks: state.deletedCustomBanks,
      customCategories: state.customCategories,
      settings,
      theme,
    };
  }, [
    state.allData,
    state.selectedMonthId,
    state.customBanks,
    state.deletedCustomBanks,
    state.customCategories,
    settings,
    theme,
  ]);

  // Sync refs and flags
  const debounceTimers = useRef<{
    settings?: ReturnType<typeof setTimeout>;
    month?: ReturnType<typeof setTimeout>;
  }>({});
  const activeWrites = useRef<{ settings: boolean; month: boolean }>({
    settings: false,
    month: false,
  });
  const isMounted = useRef(true);
  const hasUploadedLocalRef = useRef(false);

  // Tracking dual-source initial sync completion (both userDoc and months collection)
  const userDocLoadedRef = useRef(false);
  const monthsDocLoadedRef = useRef(false);
  const hasInitialSyncRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const timers = debounceTimers.current;
    return () => {
      isMounted.current = false;
      if (timers.settings) {
        clearTimeout(timers.settings);
      }
      if (timers.month) {
        clearTimeout(timers.month);
      }
    };
  }, []);

  const checkInitialSyncDone = useCallback(() => {
    if (userDocLoadedRef.current && monthsDocLoadedRef.current) {
      hasInitialSyncRef.current = true;
      dispatch({ type: "SET_HAS_INITIAL_SYNC", payload: true });
    }
  }, []);

  // Reset sync gates when user changes or logs out
  useEffect(() => {
    userDocLoadedRef.current = false;
    monthsDocLoadedRef.current = false;
    hasInitialSyncRef.current = false;
    hasUploadedLocalRef.current = false;
    dispatch({ type: "SET_HAS_INITIAL_SYNC", payload: false });
    if (debounceTimers.current.settings) {
      clearTimeout(debounceTimers.current.settings);
      debounceTimers.current.settings = undefined;
    }
    if (debounceTimers.current.month) {
      clearTimeout(debounceTimers.current.month);
      debounceTimers.current.month = undefined;
    }
    activeWrites.current = { settings: false, month: false };
    dispatch({ type: "SET_IS_SYNCING", payload: false });
  }, [currentUser?.uid]);

  // Firestore user doc sync (settings and custom data)
  useEffect(() => {
    const user = currentUser;
    if (!user || "isPlaceholder" in user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.settings) {
            dispatch({ type: "SET_SETTINGS", payload: data.settings });
            setSystemSettings(data.settings);
          }
          if (data.theme) {
            dispatch({ type: "SET_THEME", payload: data.theme });
            setSystemTheme(data.theme);
          }
          if (data.customBanks) {
            dispatch({ type: "SET_CUSTOM_BANKS", payload: data.customBanks });
          }
          if (data.customCategories) {
            dispatch({
              type: "SET_CUSTOM_CATEGORIES",
              payload: data.customCategories,
            });
          }
          if (data.deletedCustomBanks) {
            dispatch({
              type: "SET_DELETED_CUSTOM_BANKS",
              payload: data.deletedCustomBanks,
            });
          }
        } else {
          // Initialize user document if it doesn't exist with local data
          const initialUserData = JSON.parse(
            JSON.stringify({
              settings: stateRef.current.settings,
              theme: stateRef.current.theme,
              customBanks: stateRef.current.customBanks,
              deletedCustomBanks: stateRef.current.deletedCustomBanks,
              customCategories: stateRef.current.customCategories,
            }),
          );

          setDoc(userDocRef, initialUserData).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`),
          );
        }

        userDocLoadedRef.current = true;
        checkInitialSyncDone();
      },
      (err) => {
        userDocLoadedRef.current = true;
        checkInitialSyncDone();
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      },
    );

    return () => unsubscribe();
  }, [currentUser, checkInitialSyncDone, setSystemSettings, setSystemTheme]);

  // Firestore month data sync
  useEffect(() => {
    const user = currentUser;
    if (!user || "isPlaceholder" in user) return;

    const monthsQuery = query(
      collection(db, "months"),
      where("uid", "==", user.uid),
    );
    const unsubscribe = onSnapshot(
      monthsQuery,
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        const cloudMonths: MonthData[] = snapshot.docs.map((d) => ({
          monthId: d.data().monthId,
          entries: d.data().entries || [],
        }));

        if (!hasUploadedLocalRef.current) {
          hasUploadedLocalRef.current = true;

          const cloudMonthIds = new Set(cloudMonths.map((m) => m.monthId));
          const localMonthsToUpload = stateRef.current.allData.filter(
            (m) =>
              m.entries &&
              m.entries.length > 0 &&
              !cloudMonthIds.has(m.monthId),
          );

          if (localMonthsToUpload.length > 0) {
            const batch = writeBatch(db);
            localMonthsToUpload.forEach((month) => {
              const monthDocId = `${user.uid}_${month.monthId}`;
              const sanitizedEntries = JSON.parse(
                JSON.stringify(month.entries || []),
              );
              batch.set(doc(db, "months", monthDocId), {
                monthId: month.monthId,
                entries: sanitizedEntries,
                uid: user.uid,
              });
            });

            batch
              .commit()
              .catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, "months"),
              );
          }

          dispatch({
            type: "SET_ALL_DATA",
            payload: [...cloudMonths, ...localMonthsToUpload],
          });
        } else {
          dispatch({ type: "SET_ALL_DATA", payload: cloudMonths });
        }

        monthsDocLoadedRef.current = true;
        checkInitialSyncDone();
      },
      (err) => {
        monthsDocLoadedRef.current = true;
        checkInitialSyncDone();
        handleFirestoreError(err, OperationType.GET, "months");
      },
    );

    return () => unsubscribe();
  }, [currentUser, checkInitialSyncDone]);

  // Debounced save to Firestore (500ms)
  const saveToFirestore = useCallback(
    (type: "settings" | "month", payload: unknown) => {
      const user = currentUserRef.current;
      if (!user || "isPlaceholder" in user) return;
      if (!hasInitialSyncRef.current) return;

      if (type === "month") {
        const monthPayload = payload as MonthData;
        const entries = monthPayload?.entries || [];
        if (entries.length === 0) return;
      }

      if (debounceTimers.current[type]) {
        clearTimeout(debounceTimers.current[type]);
      }

      dispatch({ type: "SET_IS_SYNCING", payload: true });

      debounceTimers.current[type] = setTimeout(async () => {
        debounceTimers.current[type] = undefined;
        if (!hasInitialSyncRef.current) {
          activeWrites.current[type] = false;
          if (isMounted.current) {
            dispatch({ type: "SET_IS_SYNCING", payload: false });
          }
          return;
        }

        activeWrites.current[type] = true;
        if (isMounted.current) {
          dispatch({ type: "SET_IS_SYNCING", payload: true });
        }

        try {
          const sanitizedPayload = JSON.parse(JSON.stringify(payload));
          if (type === "settings") {
            const finalPayload = {
              settings: stateRef.current.settings,
              theme: stateRef.current.theme,
              customBanks: stateRef.current.customBanks,
              deletedCustomBanks: stateRef.current.deletedCustomBanks,
              customCategories: stateRef.current.customCategories,
              ...sanitizedPayload,
            };
            await setDoc(doc(db, "users", user.uid), finalPayload, {
              merge: true,
            });
          } else if (type === "month") {
            const entries = sanitizedPayload.entries || [];
            if (entries.length === 0) return;

            const monthDocId = `${user.uid}_${(payload as MonthData).monthId}`;
            await setDoc(doc(db, "months", monthDocId), {
              monthId: (payload as MonthData).monthId,
              entries,
              uid: user.uid,
            });
          }
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.WRITE,
            type === "settings" ? `users/${user.uid}` : "months",
          );
        } finally {
          activeWrites.current[type] = false;
          if (
            !debounceTimers.current.settings &&
            !debounceTimers.current.month &&
            !activeWrites.current.settings &&
            !activeWrites.current.month
          ) {
            if (isMounted.current) {
              dispatch({ type: "SET_IS_SYNCING", payload: false });
            }
          }
        }
      }, 500);
    },
    [],
  );


  // Setters
  const setAllData = useCallback(
    (value: MonthData[] | ((prev: MonthData[]) => MonthData[])) => {
      dispatch({
        type: "SET_ALL_DATA",
        payload:
          typeof value === "function" ? value(stateRef.current.allData) : value,
      });
    },
    [],
  );

  const setSelectedMonthId = useCallback(
    (value: React.SetStateAction<string>) => {
      dispatch({
        type: "SET_SELECTED_MONTH_ID",
        payload:
          typeof value === "function"
            ? value(stateRef.current.selectedMonthId)
            : value,
      });
    },
    [],
  );

  const setCustomBanks = useCallback(
    (value: Bank[] | ((prev: Bank[]) => Bank[])) => {
      dispatch({
        type: "SET_CUSTOM_BANKS",
        payload:
          typeof value === "function"
            ? value(stateRef.current.customBanks)
            : value,
      });
    },
    [],
  );

  const setDeletedCustomBanks = useCallback(
    (value: Bank[] | ((prev: Bank[]) => Bank[])) => {
      dispatch({
        type: "SET_DELETED_CUSTOM_BANKS",
        payload:
          typeof value === "function"
            ? value(stateRef.current.deletedCustomBanks)
            : value,
      });
    },
    [],
  );

  const setCustomCategories = useCallback(
    (value: string[] | ((prev: string[]) => string[])) => {
      dispatch({
        type: "SET_CUSTOM_CATEGORIES",
        payload:
          typeof value === "function"
            ? value(stateRef.current.customCategories)
            : value,
      });
    },
    [],
  );

  const setSettings = useCallback(
    (value: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      setSystemSettings(value);
      dispatch({
        type: "SET_SETTINGS",
        payload:
          typeof value === "function"
            ? value(stateRef.current.settings)
            : value,
      });
    },
    [setSystemSettings],
  );

  const setTheme = useCallback(
    (
      value:
        ("light" | "dark") | ((prev: "light" | "dark") => "light" | "dark"),
    ) => {
      setSystemTheme(value);
      dispatch({
        type: "SET_THEME",
        payload:
          typeof value === "function" ? value(stateRef.current.theme) : value,
      });
    },
    [setSystemTheme],
  );

  // CRUD Actions
  const handleUpdateCurrentMonth = useCallback(
    (updatedData: MonthData) => {
      dispatch({ type: "UPDATE_MONTH", payload: updatedData });
      if (currentUserRef.current) {
        saveToFirestore("month", updatedData);
      }
    },
    [saveToFirestore],
  );

  const deleteMonthEntry = useCallback(
    (monthId: string, entryId: string) => {
      const targetMonth = stateRef.current.allData.find(
        (m) => m.monthId === monthId,
      );
      if (!targetMonth) return;

      const newEntries = targetMonth.entries.filter((e) => e.id !== entryId);
      const newMonthData = { ...targetMonth, entries: newEntries };

      dispatch({
        type: "DELETE_MONTH_ENTRY",
        payload: { monthId, entryId },
      });
      if (currentUserRef.current) {
        saveToFirestore("month", newMonthData);
      }
    },
    [saveToFirestore],
  );

  const handleDeleteMonth = useCallback((monthId: string) => {
    dispatch({ type: "DELETE_MONTH", payload: monthId });
    const user = currentUserRef.current;
    if (user && !("isPlaceholder" in user)) {
      const monthDocId = `${user.uid}_${monthId}`;
      deleteDoc(doc(db, "months", monthDocId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `months/${monthDocId}`),
      );
    }
  }, []);

  const handleDeleteCustomBank = useCallback(
    (bankId: string) => {
      const newBanks = stateRef.current.customBanks.filter(
        (b) => b.id !== bankId,
      );

      dispatch({ type: "DELETE_CUSTOM_BANK", payload: bankId });
      if (currentUserRef.current) {
        saveToFirestore("settings", {
          customBanks: newBanks,
        });
      }
    },
    [saveToFirestore],
  );

  const handleAddCustomBank = useCallback(
    (bank: Bank) => {
      if (!stateRef.current.customBanks.some((b) => b.id === bank.id)) {
        const newBanks = [...stateRef.current.customBanks, bank];
        dispatch({ type: "ADD_CUSTOM_BANK", payload: bank });
        if (currentUserRef.current) {
          saveToFirestore("settings", { customBanks: newBanks });
        }
      }
    },
    [saveToFirestore],
  );

  const handleAddCustomCategory = useCallback(
    (category: string) => {
      if (!stateRef.current.customCategories.includes(category)) {
        const newCategories = [...stateRef.current.customCategories, category];
        dispatch({ type: "ADD_CUSTOM_CATEGORY", payload: category });
        if (currentUserRef.current) {
          saveToFirestore("settings", { customCategories: newCategories });
        }
      }
    },
    [saveToFirestore],
  );

  const handleExportAllData = useCallback(() => {
    const currentState = stateRef.current;
    const exportData = {
      allData: currentState.allData,
      customBanks: currentState.customBanks,
      deletedCustomBanks: currentState.deletedCustomBanks,
      customCategories: currentState.customCategories,
      settings: currentState.settings,
      theme: currentState.theme,
      version: "1.0",
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cashback_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportAllData = useCallback(
    async (jsonData: unknown) => {
      const user = currentUserRef.current;
      try {
        const data = jsonData as BackupData;
        if (!data || !data.allData || !Array.isArray(data.allData)) {
          throw new Error("Неверный формат файла резервной копии");
        }

        dispatch({
          type: "IMPORT_DATA",
          payload: {
            allData: data.allData,
            customBanks: data.customBanks,
            deletedCustomBanks: data.deletedCustomBanks,
            customCategories: data.customCategories,
            settings: data.settings,
            theme: data.theme,
          },
        });

        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.theme) {
          setTheme(data.theme);
        }

        const totalMonths = data.allData.length;
        let savedCount = 0;
        let errorCount = 0;

        // If logged in, sync to Firestore
        if (user && !("isPlaceholder" in user)) {
          dispatch({ type: "SET_IS_SYNCING", payload: true });
          try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(
              userDocRef,
              {
                settings: data.settings || stateRef.current.settings,
                theme: data.theme || stateRef.current.theme,
                customBanks: data.customBanks || stateRef.current.customBanks,
                deletedCustomBanks:
                  data.deletedCustomBanks ||
                  stateRef.current.deletedCustomBanks,
                customCategories:
                  data.customCategories || stateRef.current.customCategories,
                uid: user.uid,
              },
              { merge: true },
            );
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }

          // Chunk months into groups of 500 operations (Firestore batch limit)
          const CHUNK_SIZE = 500;
          const chunks: MonthData[][] = [];
          for (let i = 0; i < data.allData.length; i += CHUNK_SIZE) {
            chunks.push(data.allData.slice(i, i + CHUNK_SIZE));
          }

          // Sequential batch writes
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const batch = writeBatch(db);
            for (const month of chunk) {
              const monthDocId = `${user.uid}_${month.monthId}`;
              const ref = doc(db, "months", monthDocId);
              const sanitizedEntries = JSON.parse(
                JSON.stringify(month.entries || []),
              );
              batch.set(ref, {
                monthId: month.monthId,
                entries: sanitizedEntries,
                uid: user.uid,
              });
            }

            try {
              await batch.commit();
              savedCount += chunk.length;
            } catch (err) {
              errorCount += chunk.length;
              handleFirestoreError(
                err,
                OperationType.WRITE,
                `months/batch-chunk-${i + 1}`,
              );
            }
          }

          if (isMounted.current) {
            dispatch({ type: "SET_IS_SYNCING", payload: false });
          }

          const report = {
            total: totalMonths,
            savedCount,
            errorCount,
          };
          console.info("Импорт данных в облако завершён:", report);

          if (errorCount > 0) {
            toast.error(
              `Импорт в облако: сохранено ${savedCount} из ${totalMonths} (ошибок: ${errorCount})`,
              { id: "import-report" },
            );
            return false;
          } else if (totalMonths > 0) {
            toast.success(`В облако успешно сохранено ${savedCount} месяцев`, {
              id: "import-report",
            });
          }

          return true;
        }

        return true;
      } catch (error) {
        console.error("Import error:", error);
        if (isMounted.current) {
          dispatch({ type: "SET_IS_SYNCING", payload: false });
        }
        throw error;
      }
    },
    [setSettings, setTheme],
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    const user = currentUserRef.current;
    if (user && !("isPlaceholder" in user)) {
      saveToFirestore("settings", { theme: newTheme });
    }
  }, [theme, setTheme, saveToFirestore]);

  const handleUpdateSettings = useCallback(
    (newSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      const nextSettings =
        typeof newSettings === "function" ? newSettings(settings) : newSettings;
      setSettings(nextSettings);
      const user = currentUserRef.current;
      if (user && !("isPlaceholder" in user)) {
        saveToFirestore("settings", { settings: nextSettings });
      }
    },
    [settings, setSettings, saveToFirestore],
  );

  // Derivations
  const currentMonthData = useMemo(
    () =>
      state.allData.find((d) => d.monthId === state.selectedMonthId) || {
        monthId: state.selectedMonthId,
        entries: [],
      },
    [state.allData, state.selectedMonthId],
  );

  const archiveData = useMemo(() => {
    const currentMonthId = getCurrentMonthId();
    return state.allData
      .filter((d) => d.monthId < currentMonthId)
      .sort((a, b) => b.monthId.localeCompare(a.monthId));
  }, [state.allData]);

  const value = useMemo<CashbackStoreContextValue>(
    () => ({
      // State
      allData: state.allData,
      selectedMonthId: state.selectedMonthId,
      customBanks: state.customBanks,
      deletedCustomBanks: state.deletedCustomBanks,
      customCategories: state.customCategories,
      settings,
      theme,
      isSyncing: state.isSyncing,
      hasInitialSync: state.hasInitialSync,

      // Derivations
      currentMonthData,
      archiveData,

      // Setters
      setAllData,
      setSelectedMonthId,
      setCustomBanks,
      setDeletedCustomBanks,
      setCustomCategories,
      setSettings,
      setTheme,

      // Actions
      handleUpdateCurrentMonth,
      deleteMonthEntry,
      handleDeleteMonth,
      handleDeleteCustomBank,
      handleAddCustomBank,
      handleAddCustomCategory,
      saveToFirestore,
      handleExportAllData,
      handleImportAllData,
      toggleTheme,
      handleUpdateSettings,
    }),
    [
      state.allData,
      state.selectedMonthId,
      state.customBanks,
      state.deletedCustomBanks,
      state.customCategories,
      settings,
      theme,
      state.isSyncing,
      state.hasInitialSync,
      currentMonthData,
      archiveData,
      setAllData,
      setSelectedMonthId,
      setCustomBanks,
      setDeletedCustomBanks,
      setCustomCategories,
      setSettings,
      setTheme,
      handleUpdateCurrentMonth,
      deleteMonthEntry,
      handleDeleteMonth,
      handleDeleteCustomBank,
      handleAddCustomBank,
      handleAddCustomCategory,
      saveToFirestore,
      handleExportAllData,
      handleImportAllData,
      toggleTheme,
      handleUpdateSettings,
    ],
  );

  return (
    <CashbackStoreContext.Provider value={value}>
      {children}
    </CashbackStoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCashbackStore() {
  const context = useContext(CashbackStoreContext);
  if (!context) {
    throw new Error(
      "useCashbackStore must be used within a CashbackStoreProvider",
    );
  }
  return context;
}
