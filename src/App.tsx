import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MonthData, Bank, AppSettings } from './types';
import { getCurrentMonthId, getNextMonthId } from './utils/date';
import { CurrentMonth } from './views/CurrentMonth';
import { Archive } from './views/Archive';
import { Settings } from './views/Settings';
import {
  History,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import {
  auth,
  db,
  loginWithGoogle,
  logout,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';

import { Toaster } from 'sonner';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { BANKS } from './constants';

const WalletIcon = ({ className = 'w-6 h-6' }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M95.5,104h320a87.73,87.73,0,0,1,11.18.71,66,66,0,0,0-77.51-55.56L86,94.08l-.3,0a66,66,0,0,0-41.07,26.13A87.57,87.57,0,0,1,95.5,104Z" />
      <path d="M415.5,128H95.5a64.07,64.07,0,0,0-64,64V384a64.07,64.07,0,0,0,64,64h320a64.07,64.07,0,0,0,64-64V192A64.07,64.07,0,0,0,415.5,128ZM368,320a32,32,0,1,1,32-32A32,32,0,0,1,368,320Z" />
      <path d="M32,259.5V160c0-21.67,12-58,53.65-65.87C121,87.5,156,87.5,156,87.5s23,16,4,16S141.5,128,160,128s0,23.5,0,23.5L85.5,236Z" />
    </svg>
  );
};

const AuthButton = ({
  user,
  isMobile = false,
  isSyncing,
  onLogoutClick,
  theme,
}: {
  user: FirebaseUser | null;
  isMobile?: boolean;
  isSyncing: boolean;
  onLogoutClick: () => void;
  theme: string;
}) => {
  if (user) {
    return (
      <div className={clsx('flex items-center', isMobile ? 'gap-1' : 'w-full')}>
        <div
          onClick={() => isMobile && onLogoutClick()}
          className={clsx(
            'flex items-center group transition-all',
            isMobile
              ? 'relative w-9 h-9 justify-center bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-full cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95'
              : 'px-4 py-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 w-full gap-3 rounded-2xl',
          )}
        >
          {isSyncing && isMobile && (
            <div
              className="absolute bg-blue-500 rounded-full border-2 border-slate-50 dark:border-[#111] animate-pulse z-10 shrink-0 pointer-events-none -top-1 -right-1 w-3 h-3"
              title="Синхронизация..."
            />
          )}
          <div className={clsx("relative shrink-0", isMobile ? "w-full h-full" : "w-8 h-8")}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-full h-full rounded-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center">
                <User className={clsx("text-[var(--accent-color)]", isMobile ? "w-5 h-5": "w-4 h-4")} />
              </div>
            )}
            {isSyncing && !isMobile && (
              <div
                className="absolute bg-blue-500 rounded-full border-2 border-slate-50 dark:border-[#111] animate-pulse z-10 shrink-0 pointer-events-none -top-0.5 -right-0.5 w-2.5 h-2.5"
                title="Синхронизация..."
              />
            )}
          </div>
          {!isMobile && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {user.displayName || 'Пользователь'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          )}
          {!isMobile && (
            <div className="relative shrink-0 flex items-center justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogoutClick();
                }}
                className="p-2 transition-colors rounded-xl cursor-pointer flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={loginWithGoogle}
      className={clsx(
        'flex items-center gap-2 rounded-2xl transition-all font-bold text-sm cursor-pointer shadow-lg shadow-[var(--accent-color)]/20 hover:bg-[var(--accent-color)] hover:brightness-110 active:scale-95 shrink-0',
        isMobile
          ? 'h-8 px-4 bg-[var(--accent-color)] text-white'
          : 'px-4 py-3 w-full bg-[var(--accent-color)] text-white justify-center',
      )}
      title="Войти в облако"
    >
      <LogIn className="w-4 h-4" />
      <span className={isMobile ? 'text-[10px] uppercase tracking-wider font-black' : ''}>
        Войти
      </span>
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'current' | 'archive' | 'settings'
  >('current');

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('app-tab-change', { detail: { activeTab } })
    );
  }, [activeTab]);

  // Scroll to top instantly when active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  // Handle tab clicks with scroll to top on double click
  const handleTabClick = useCallback((tab: 'current' | 'archive' | 'settings') => {
    if (activeTab === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveTab(tab);
    }
  }, [activeTab]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<any | null>(() => {
    const lastKnown = localStorage.getItem('cashback_last_known_user');
    if (lastKnown === 'true') {
      return {
        uid: localStorage.getItem('cashback_cached_uid') || 'cached',
        displayName: localStorage.getItem('cashback_cached_name') || 'Пользователь',
        email: localStorage.getItem('cashback_cached_email') || '',
        photoURL: localStorage.getItem('cashback_cached_photo') || null,
        isPlaceholder: true,
      };
    }
    return null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  // Local storage as fallback/initial state
  const [allData, setAllData] = useLocalStorage<MonthData[]>(
    'cashback_data',
    [],
  );
  const [customBanks, setCustomBanks] = useLocalStorage<Bank[]>(
    'custom_banks',
    [],
  );
  const [deletedCustomBanks, setDeletedCustomBanks] = useLocalStorage<Bank[]>(
    'deleted_custom_banks',
    [],
  );
  const [customCategories, setCustomCategories] = useLocalStorage<string[]>(
    'custom_categories',
    [],
  );
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  const [settings, setSettings] = useLocalStorage<AppSettings>('app_settings', {
    logoShape: 'circle',
    accentColor: '#10b981', // emerald-500
    percentBlockBg: '#ecfdf5', // emerald-50
    percentBlockText: '#047857', // emerald-700
    fontColor: '#6b7280', // gray-500
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        localStorage.setItem('cashback_last_known_user', 'true');
        localStorage.setItem('cashback_cached_uid', u.uid);
        localStorage.setItem('cashback_cached_name', u.displayName || 'Пользователь');
        localStorage.setItem('cashback_cached_email', u.email || '');
        localStorage.setItem('cashback_cached_photo', u.photoURL || '');
      } else {
        setUser(null);
        localStorage.removeItem('cashback_last_known_user');
        localStorage.removeItem('cashback_cached_uid');
        localStorage.removeItem('cashback_cached_name');
        localStorage.removeItem('cashback_cached_email');
        localStorage.removeItem('cashback_cached_photo');
        setHasInitialSync(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync settings and custom data from Firestore
  useEffect(() => {
    if (!user || user.isPlaceholder) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.settings) setSettings(data.settings);
          if (data.theme) setTheme(data.theme);
          if (data.customBanks) setCustomBanks(data.customBanks);
          if (data.customCategories) setCustomCategories(data.customCategories);
          if (data.deletedCustomBanks) setDeletedCustomBanks(data.deletedCustomBanks);
        } else {
          // Initialize user document if it doesn't exist with local data
          const initialUserData = JSON.parse(
            JSON.stringify({
              settings,
              theme,
              customBanks,
              deletedCustomBanks,
              customCategories,
            }),
          );

          setDoc(userDocRef, initialUserData).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`),
          );
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`),
    );

    return () => unsubscribe();
  }, [user]);

  // Sync month data from Firestore
  useEffect(() => {
    if (!user || user.isPlaceholder) return;

    const monthsQuery = query(
      collection(db, 'months'),
      where('uid', '==', user.uid),
    );
    const unsubscribe = onSnapshot(
      monthsQuery,
      (snapshot) => {
        if (snapshot.empty && allData.length > 0 && !hasUploadedLocalRef.current) {
          hasUploadedLocalRef.current = true;
          // First time user with local data - upload it
          allData.forEach((month) => {
            const monthDocId = `${user.uid}_${month.monthId}`;
            // Sanitize entries to remove undefined values
            const sanitizedEntries = JSON.parse(
              JSON.stringify(month.entries || []),
            );

            setDoc(doc(db, 'months', monthDocId), {
              monthId: month.monthId,
              entries: sanitizedEntries,
              uid: user.uid,
            }).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'months'),
            );
          });
        } else if (!snapshot.empty) {
          const months: MonthData[] = snapshot.docs.map((doc) => ({
            monthId: doc.data().monthId,
            entries: doc.data().entries || [],
          }));
          setAllData(months);
        }
        setHasInitialSync(true);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'months'),
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to save data to Firestore
  const saveToFirestore = useCallback(
    async (type: 'settings' | 'month', payload: any) => {
      if (!user || user.isPlaceholder) return;
      setIsSyncing(true);
      try {
        // Sanitize payload to remove undefined values which Firestore doesn't support
        const sanitizedPayload = JSON.parse(JSON.stringify(payload));

        if (type === 'settings') {
          await setDoc(doc(db, 'users', user.uid), sanitizedPayload, {
            merge: true,
          });
        } else if (type === 'month') {
          const monthDocId = `${user.uid}_${payload.monthId}`;
          await setDoc(doc(db, 'months', monthDocId), {
            monthId: payload.monthId,
            entries: sanitizedPayload.entries || [],
            uid: user.uid,
          });
        }
        // Keep sync indicator visible for at least 800ms for user feedback
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          type === 'settings' ? `users/${user.uid}` : 'months',
        );
      } finally {
        setIsSyncing(false);
      }
    },
    [user],
  );

  const handleExportAllData = useCallback(() => {
    const exportData = {
      allData,
      customBanks,
      deletedCustomBanks,
      customCategories,
      settings,
      theme,
      version: '1.0',
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cashback_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [allData, customBanks, deletedCustomBanks, customCategories, settings, theme]);

  const handleImportAllData = useCallback(
    async (jsonData: any) => {
      try {
        if (!jsonData.allData || !Array.isArray(jsonData.allData)) {
          throw new Error('Invalid backup format');
        }

        setAllData(jsonData.allData);
        if (jsonData.customBanks) setCustomBanks(jsonData.customBanks);
        if (jsonData.deletedCustomBanks) setDeletedCustomBanks(jsonData.deletedCustomBanks);
        if (jsonData.customCategories)
          setCustomCategories(jsonData.customCategories);
        if (jsonData.settings) setSettings(jsonData.settings);
        if (jsonData.theme) setTheme(jsonData.theme);

        // If logged in, sync to Firestore
        if (user && !user.isPlaceholder) {
          setIsSyncing(true);
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(
            userDocRef,
            {
              settings: jsonData.settings || settings,
              theme: jsonData.theme || theme,
              customBanks: jsonData.customBanks || customBanks,
              deletedCustomBanks: jsonData.deletedCustomBanks || deletedCustomBanks,
              customCategories: jsonData.customCategories || customCategories,
              uid: user.uid,
            },
            { merge: true },
          );

          // Sync months
          for (const month of jsonData.allData) {
            const monthDocId = `${user.uid}_${month.monthId}`;
            await setDoc(doc(db, 'months', monthDocId), {
              monthId: month.monthId,
              entries: month.entries,
              uid: user.uid,
            });
          }
          setIsSyncing(false);
        }
        return true;
      } catch (error) {
        console.error('Import error:', error);
        setIsSyncing(false);
        throw error;
      }
    },
    [
      user,
      settings,
      theme,
      customBanks,
      deletedCustomBanks,
      customCategories,
      setAllData,
      setCustomBanks,
      setDeletedCustomBanks,
      setCustomCategories,
      setSettings,
      setTheme,
    ],
  );

  const [headerVisible, setHeaderVisible] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [navExpanded, setNavExpanded] = useState(true);

  const currentMonthId = getCurrentMonthId();
  const nextMonthId = getNextMonthId();
  const [selectedMonthId, setSelectedMonthId] = useState(currentMonthId);
  const hasUploadedLocalRef = useRef(false);

  // Cleanup all months from any legacy deleted/unrecognized custom banks
  useEffect(() => {
    if (user && !hasInitialSync) return;
    if (allData.length === 0) return;

    let hasChanges = false;
    const cleaned = allData.map((month) => {
      const filteredEntries = month.entries.filter((entry) => {
        const isStandard = BANKS.some((b) => b.id === entry.bankId);
        const isActiveCustom = customBanks.some((b) => b.id === entry.bankId);
        if (entry.bankId === 'custom') return true;
        const keep = isStandard || isActiveCustom;
        if (!keep) {
          hasChanges = true;
        }
        return keep;
      });
      if (filteredEntries.length !== month.entries.length) {
        return { ...month, entries: filteredEntries };
      }
      return month;
    });

    if (hasChanges) {
      setAllData(cleaned);
      if (user) {
        cleaned.forEach((m) => {
          const original = allData.find((orig) => orig.monthId === m.monthId);
          if (original && original.entries.length !== m.entries.length) {
            saveToFirestore('month', m);
          }
        });
      }
    }
  }, [hasInitialSync, user, customBanks, allData, setAllData, saveToFirestore]);

  // Completely clear any remembered deleted custom banks once to start fresh as requested
  useEffect(() => {
    if (user && !hasInitialSync) return;
    if (deletedCustomBanks.length > 0) {
      setDeletedCustomBanks([]);
      if (user) {
        saveToFirestore('settings', { deletedCustomBanks: [] });
      }
    }
  }, [hasInitialSync, user, deletedCustomBanks.length, setDeletedCustomBanks, saveToFirestore]);

  // Reset selectedMonthId if it's not current or next
  useEffect(() => {
    // Removed restriction to allow switching anytime
  }, [currentMonthId, selectedMonthId]);

  // Handle header and nav visibility on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      if (currentScrollY > 100) {
        setHeaderVisible(!isScrollingDown);
        setNavVisible(!isScrollingDown);
        if (isScrollingDown) {
          setNavExpanded(false);
        }
      } else {
        setHeaderVisible(true);
        setNavVisible(true);
        setNavExpanded(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme and custom styles to document
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom colors
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--percent-bg', settings.percentBlockBg);
    root.style.setProperty('--percent-text', settings.percentBlockText);
    root.style.setProperty('--app-font-color', settings.fontColor);

    const targetColor = isDark ? '#0A0A0A' : '#FAFAFA';
    
    // Remove any meta theme-color tags with 'media' attribute to prevent Safari conflicts
    document.querySelectorAll('meta[name="theme-color"][media]').forEach(el => el.remove());

    // Update or create the main theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', targetColor);

    // Also style the root document element background to match, preventing white/black flash during rubber-banding elastic scroll
    root.style.backgroundColor = targetColor;

    // Дополнительно - force repaint
    document.documentElement.style.setProperty('--theme-color', targetColor);
  }, [theme, settings]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      saveToFirestore('settings', { theme: newTheme });
    }
  };

  useEffect(() => {
    if (!allData.find((d) => d.monthId === selectedMonthId)) {
      setAllData((prev) => [
        ...prev,
        { monthId: selectedMonthId, entries: [] },
      ]);
    }
  }, [selectedMonthId, allData, setAllData]);

  const currentMonthData = useMemo(
    () =>
      allData.find((d) => d.monthId === selectedMonthId) || {
        monthId: selectedMonthId,
        entries: [],
      },
    [allData, selectedMonthId],
  );

  const archiveData = useMemo(
    () =>
      allData
        .filter((d) => d.monthId !== currentMonthId)
        .sort((a, b) => b.monthId.localeCompare(a.monthId)),
    [allData, currentMonthId],
  );

  const handleUpdateCurrentMonth = useCallback(
    (updatedData: MonthData) => {
      setAllData((prev) => {
        const exists = prev.find((d) => d.monthId === updatedData.monthId);
        if (exists) {
          return prev.map((d) =>
            d.monthId === updatedData.monthId ? updatedData : d,
          );
        } else {
          return [...prev, updatedData];
        }
      });
      if (user) {
        saveToFirestore('month', updatedData);
      }
    },
    [user, saveToFirestore],
  );

  const deleteMonthEntry = useCallback(
    (monthId: string, entryId: string) => {
      const updatedMonth = allData.find((m) => m.monthId === monthId);
      if (!updatedMonth) return;

      const newEntries = updatedMonth.entries.filter((e) => e.id !== entryId);
      const newMonthData = { ...updatedMonth, entries: newEntries };

      setAllData((prev) =>
        prev.map((month) => (month.monthId === monthId ? newMonthData : month)),
      );

      if (user) {
        saveToFirestore('month', newMonthData);
      }
    },
    [allData, user, saveToFirestore],
  );

  const handleDeleteMonth = useCallback(
    (monthId: string) => {
      setAllData((prev) => prev.filter((m) => m.monthId !== monthId));

      if (user) {
        // In Firestore, we delete the document
        const monthDocId = `${user.uid}_${monthId}`;
        import('firebase/firestore').then(({ deleteDoc, doc }) => {
          deleteDoc(doc(db, 'months', monthDocId)).catch((err) =>
            handleFirestoreError(
              err,
              OperationType.DELETE,
              `months/${monthDocId}`,
            ),
          );
        });
      }
    },
    [user],
  );

  const handleDeleteCustomBank = useCallback(
    (bankId: string) => {
      const bankToBackup = customBanks.find((b) => b.id === bankId);
      const newBanks = customBanks.filter((b) => b.id !== bankId);
      setCustomBanks(newBanks);

      let nextDeleted = deletedCustomBanks;
      if (bankToBackup && !deletedCustomBanks.some((b) => b.id === bankId)) {
        nextDeleted = [...deletedCustomBanks, bankToBackup];
        setDeletedCustomBanks(nextDeleted);
      }

      if (user) {
        saveToFirestore('settings', { 
          customBanks: newBanks,
          deletedCustomBanks: nextDeleted
        });
      }
    },
    [customBanks, deletedCustomBanks, user, saveToFirestore, setDeletedCustomBanks],
  );

  const handleAddCustomBank = useCallback(
    (bank: Bank) => {
      if (!customBanks.find((b) => b.id === bank.id)) {
        const newBanks = [...customBanks, bank];
        setCustomBanks(newBanks);
        if (user) {
          saveToFirestore('settings', { customBanks: newBanks });
        }
      }
    },
    [customBanks, user, saveToFirestore],
  );

  const handleAddCustomCategory = useCallback(
    (category: string) => {
      if (!customCategories.includes(category)) {
        const newCategories = [...customCategories, category];
        setCustomCategories(newCategories);
        if (user) {
          saveToFirestore('settings', { customCategories: newCategories });
        }
      }
    },
    [customCategories, user, saveToFirestore],
  );

  const handleUpdateSettings = useCallback(
    (newSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      const nextSettings =
        typeof newSettings === 'function' ? newSettings(settings) : newSettings;
      setSettings(nextSettings);
      if (user) {
        saveToFirestore('settings', { settings: nextSettings });
      }
    },
    [settings, user, saveToFirestore],
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] dark:bg-[#0A0A0A] font-sans transition-colors duration-300 flex flex-col md:flex-row">
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutModalOpen(false);
        }}
        title="Выход из аккаунта"
        message="Вы уверены, что хотите выйти из аккаунта? Синхронизация данных будет приостановлена."
        confirmText="Выйти"
        variant="danger"
      />
      <Toaster
        theme={theme}
        position="top-center"
        expand={false}
        richColors
        toastOptions={{
          style: {
            borderRadius: '20px',
            padding: '14px 24px',
            border: '1px solid',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(32px)',
          },
          className:
            'bg-white/70 dark:bg-[#1c1c1e]/70 border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
        }}
      />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] h-[100dvh] sticky top-0 bg-white dark:bg-[#111] border-r border-slate-100 dark:border-white/5 z-40 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="px-6 py-10 flex flex-col h-full">
          <div className="flex items-center mb-12 px-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-sm">
                <WalletIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                  Cashback
                </h1>
                <p className="text-[10px] font-bold text-[var(--accent-color)] uppercase tracking-widest mt-1">
                  Tracker Pro
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              title={
                theme === 'light'
                  ? 'Включить темную тему'
                  : 'Включить светлую тему'
              }
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="flex flex-col gap-2.5 flex-1">
            <button
              onClick={() => handleTabClick('current')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'current'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <WalletIcon className="w-5 h-5 shrink-0" />
              <span className="leading-none mt-[1px]">Кэшбек</span>
            </button>
            <button
              onClick={() => handleTabClick('archive')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'archive'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <History className="w-5 h-5 shrink-0" />
              <span className="leading-none mt-[1px]">Архив</span>
            </button>
            <button
              onClick={() => handleTabClick('settings')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'settings'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <SettingsIcon className="w-5 h-5 shrink-0" />
              <span className="leading-none mt-[1px]">Настройки</span>
            </button>
          </nav>

          <div className="mt-auto">
            <AuthButton
              user={user}
              isSyncing={isSyncing}
              onLogoutClick={() => setIsLogoutModalOpen(true)}
              theme={theme}
            />
          </div>
        </div>
      </aside>

      {/* Floating Header */}
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 transition-transform duration-300 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden',
          !headerVisible && '-translate-y-full',
        )}
      >
        <div className="max-w-3xl mx-auto bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-2xl border border-slate-100 dark:border-white/5 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-sm">
              <WalletIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                Cashback
              </h1>
              <p className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest mt-0.5">
                Tracker Pro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AuthButton
              isMobile
              user={user}
              isSyncing={isSyncing}
              onLogoutClick={() => setIsLogoutModalOpen(true)}
              theme={theme}
            />
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              title={
                theme === 'light'
                  ? 'Включить темную тему'
                  : 'Включить светлую тему'
              }
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-scroll-container"
        className="flex-1 scrollbar-hide app-content-text pt-[calc(5.25rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))] md:pt-12 md:pb-12 relative"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-3 lg:pt-0 lg:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'current' ? (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <CurrentMonth
                  isExiting={activeTab !== 'current'}
                  data={currentMonthData}
                  selectedMonthId={selectedMonthId}
                  onMonthChange={setSelectedMonthId}
                  onUpdate={handleUpdateCurrentMonth}
                  onDeleteEntry={(entryId) =>
                    deleteMonthEntry(selectedMonthId, entryId)
                  }
                  customBanks={customBanks}
                  deletedCustomBanks={deletedCustomBanks}
                  customCategories={customCategories}
                  onAddCustomBank={handleAddCustomBank}
                  onDeleteCustomBank={handleDeleteCustomBank}
                  onAddCustomCategory={handleAddCustomCategory}
                  globalLogoShape={settings.logoShape}
                  allMonthIds={allData.map((d) => d.monthId)}
                />
              </motion.div>
            ) : activeTab === 'archive' ? (
              <motion.div
                key="archive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Archive
                  allData={archiveData}
                  customBanks={customBanks}
                  deletedCustomBanks={deletedCustomBanks}
                  customCategories={customCategories}
                  onDeleteEntry={deleteMonthEntry}
                  onDeleteMonth={handleDeleteMonth}
                  globalLogoShape={settings.logoShape}
                />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Settings
                  settings={settings}
                  setSettings={handleUpdateSettings}
                  customBanks={customBanks}
                  currentMonthData={currentMonthData}
                  userEmail={user?.email}
                  onExportJSON={handleExportAllData}
                  onImportJSON={handleImportAllData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div
        className={clsx(
          'md:hidden fixed left-0 right-0 z-50 px-3 flex justify-center transition-all duration-300',
          !navVisible && navExpanded && 'translate-y-[200%]',
        )}
        style={{ bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) - 0.25rem))' }}
      >
        <motion.nav
          initial={false}
          animate={{
            maxWidth: navExpanded ? 320 : 180,
            borderRadius: 20,
            height: navExpanded ? 68 : 56,
          }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-2xl border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.4)] flex items-center px-1 overflow-hidden"
          onClick={() => !navExpanded && setNavExpanded(true)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTabClick('current');
            }}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0',
              activeTab === 'current'
                ? 'text-[var(--accent-color)]'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
            )}
          >
            <motion.div
              className={clsx(
                'p-1.5 rounded-xl flex items-center justify-center',
                activeTab === 'current'
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  : 'bg-transparent text-slate-500 dark:text-slate-400',
              )}
              animate={{ scale: activeTab === 'current' ? 1.1 : 1 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <motion.div
                animate={{ scale: navExpanded ? 1 : 0.85 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <WalletIcon className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: navExpanded ? 1 : 0,
                height: navExpanded ? 14 : 0,
                marginTop: navExpanded ? 1 : 0,
                scale: navExpanded ? 1 : 0.8,
                width: navExpanded ? 'auto' : 0,
              }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden flex items-center justify-center"
            >
              <span className="text-[9px] font-bold tracking-wider uppercase whitespace-nowrap">
                Кэшбек
              </span>
            </motion.div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTabClick('archive');
            }}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0',
              activeTab === 'archive'
                ? 'text-[var(--accent-color)]'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
            )}
          >
            <motion.div
              className={clsx(
                'p-1.5 rounded-xl flex items-center justify-center',
                activeTab === 'archive'
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  : 'bg-transparent text-slate-500 dark:text-slate-400',
              )}
              animate={{ scale: activeTab === 'archive' ? 1.1 : 1 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <motion.div
                animate={{ scale: navExpanded ? 1 : 0.85 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <History className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: navExpanded ? 1 : 0,
                height: navExpanded ? 14 : 0,
                marginTop: navExpanded ? 1 : 0,
                scale: navExpanded ? 1 : 0.8,
                width: navExpanded ? 'auto' : 0,
              }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden flex items-center justify-center"
            >
              <span className="text-[9px] font-bold tracking-wider uppercase whitespace-nowrap">
                Архив
              </span>
            </motion.div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTabClick('settings');
            }}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0',
              activeTab === 'settings'
                ? 'text-[var(--accent-color)]'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
            )}
          >
            <motion.div
              className={clsx(
                'p-1.5 rounded-xl flex items-center justify-center',
                activeTab === 'settings'
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  : 'bg-transparent text-slate-500 dark:text-slate-400',
              )}
              animate={{ scale: activeTab === 'settings' ? 1.1 : 1 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <motion.div
                animate={{ scale: navExpanded ? 1 : 0.85 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <SettingsIcon className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: navExpanded ? 1 : 0,
                height: navExpanded ? 14 : 0,
                marginTop: navExpanded ? 1 : 0,
                scale: navExpanded ? 1 : 0.8,
                width: navExpanded ? 'auto' : 0,
              }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden flex items-center justify-center"
            >
              <span className="text-[9px] font-bold tracking-wider uppercase whitespace-nowrap">
                Настройки
              </span>
            </motion.div>
          </button>
        </motion.nav>
      </div>
    </div>
  );
}
