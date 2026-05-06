import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MonthData, Bank, AppSettings } from './types';
import { getCurrentMonthId, getNextMonthId } from './utils/date';
import { CurrentMonth } from './views/CurrentMonth';
import { Archive } from './views/Archive';
import { Settings } from './views/Settings';
import {
  Wallet,
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
            'flex items-center relative group transition-all',
            isMobile
              ? 'w-10 h-10 justify-center bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-full cursor-pointer'
              : 'px-4 py-3 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 w-full gap-3 rounded-3xl',
          )}
        >
          {isSyncing && (
            <div
              className={clsx(
                'absolute bg-blue-500 rounded-full border-2 border-white dark:border-[#1c1c1e] animate-pulse z-10',
                isMobile
                  ? 'top-0 right-0 w-2.5 h-2.5'
                  : '-top-1 -right-1 w-3 h-3',
              )}
              title="Синхронизация..."
            />
          )}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ''}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
          )}
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
        'flex items-center gap-2 rounded-2xl transition-all font-bold text-sm cursor-pointer shadow-lg shadow-[var(--accent-color)]/20 hover:bg-[var(--accent-color)] hover:brightness-110 active:scale-95',
        isMobile
          ? 'px-3 py-2 bg-[var(--accent-color)] text-white'
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
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
      setUser(u);
      setIsAuthReady(true);
      if (!u) setHasInitialSync(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync settings and custom data from Firestore
  useEffect(() => {
    if (!user) return;

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
        } else {
          // Initialize user document if it doesn't exist with local data
          const initialUserData = JSON.parse(
            JSON.stringify({
              settings,
              theme,
              customBanks,
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
    if (!user || hasInitialSync) return;

    const monthsQuery = query(
      collection(db, 'months'),
      where('uid', '==', user.uid),
    );
    const unsubscribe = onSnapshot(
      monthsQuery,
      (snapshot) => {
        if (snapshot.empty && allData.length > 0) {
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
            entries: doc.data().entries,
          }));
          setAllData(months);
        }
        setHasInitialSync(true);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'months'),
    );

    return () => unsubscribe();
  }, [user, hasInitialSync, allData.length]);

  // Helper to save data to Firestore
  const saveToFirestore = useCallback(
    async (type: 'settings' | 'month', payload: any) => {
      if (!user) return;
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
  }, [allData, customBanks, customCategories, settings, theme]);

  const handleImportAllData = useCallback(
    async (jsonData: any) => {
      try {
        if (!jsonData.allData || !Array.isArray(jsonData.allData)) {
          throw new Error('Invalid backup format');
        }

        setAllData(jsonData.allData);
        if (jsonData.customBanks) setCustomBanks(jsonData.customBanks);
        if (jsonData.customCategories)
          setCustomCategories(jsonData.customCategories);
        if (jsonData.settings) setSettings(jsonData.settings);
        if (jsonData.theme) setTheme(jsonData.theme);

        // If logged in, sync to Firestore
        if (user) {
          setIsSyncing(true);
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(
            userDocRef,
            {
              settings: jsonData.settings || settings,
              theme: jsonData.theme || theme,
              customBanks: jsonData.customBanks || customBanks,
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
      customCategories,
      setAllData,
      setCustomBanks,
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

  // Reset selectedMonthId if it's not current or next
  useEffect(() => {
    // Removed restriction to allow switching anytime
  }, [currentMonthId, selectedMonthId]);

  // Handle header and nav visibility on scroll
  useEffect(() => {
    const mainElement = document.getElementById('main-scroll-container');
    if (!mainElement) return;

    let lastScrollY = mainElement.scrollTop;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
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

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme and custom styles to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom colors
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--percent-bg', settings.percentBlockBg);
    root.style.setProperty('--percent-text', settings.percentBlockText);
    root.style.setProperty('--app-font-color', settings.fontColor);
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
      const newBanks = customBanks.filter((b) => b.id !== bankId);
      setCustomBanks(newBanks);
      if (user) {
        saveToFirestore('settings', { customBanks: newBanks });
      }
    },
    [customBanks, user, saveToFirestore],
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

  const handleAddTestData = useCallback(() => {
    const testMonths = [
      {
        monthId: '2026-02-test',
        entries: [
          {
            id: 'test-f-1',
            bankId: 'tinkoff',
            categories: [
              { name: 'Супермаркеты', percent: '5' },
              { name: 'Аптеки', percent: '5' },
            ],
          },
          {
            id: 'test-f-2',
            bankId: 'alfa',
            categories: [
              { name: 'Продукты', percent: '5' },
              { name: 'Кафе и рестораны', percent: '5' },
            ],
          },
          {
            id: 'test-f-3',
            bankId: 'sber',
            categories: [
              { name: 'АЗС', percent: '10' },
              { name: 'Дом и ремонт', percent: '5' },
            ],
          },
          {
            id: 'test-f-4',
            bankId: 'vtb',
            categories: [
              { name: 'Транспорт', percent: '5' },
              { name: 'Одежда', percent: '5' },
            ],
          },
          {
            id: 'test-f-5',
            bankId: 'raiffeisen',
            categories: [{ name: 'Все покупки', percent: '1.5' }],
          },
          {
            id: 'test-f-6',
            bankId: 'gazprom',
            categories: [
              { name: 'Спорттовары', percent: '5' },
              { name: 'Развлечения', percent: '5' },
            ],
          },
          {
            id: 'test-f-7',
            bankId: 'ozon',
            categories: [
              { name: 'Маркетплейсы', percent: '5' },
              { name: 'Фастфуд', percent: '5' },
            ],
          },
          {
            id: 'test-f-8',
            bankId: 'yandex',
            categories: [
              { name: 'Такси', percent: '10' },
              { name: 'Доставка', percent: '5' },
            ],
          },
        ],
      },
      {
        monthId: '2026-01-test',
        entries: [
          {
            id: 'test-j-1',
            bankId: 'tinkoff',
            categories: [
              { name: 'Супермаркеты', percent: '5' },
              { name: 'Аптеки', percent: '5' },
            ],
          },
          {
            id: 'test-j-2',
            bankId: 'alfa',
            categories: [
              { name: 'Продукты', percent: '5' },
              { name: 'Кафе и рестораны', percent: '5' },
            ],
          },
          {
            id: 'test-j-3',
            bankId: 'sber',
            categories: [
              { name: 'АЗС', percent: '10' },
              { name: 'Дом и ремонт', percent: '5' },
            ],
          },
          {
            id: 'test-j-4',
            bankId: 'vtb',
            categories: [
              { name: 'Транспорт', percent: '5' },
              { name: 'Одежда', percent: '5' },
            ],
          },
          {
            id: 'test-j-5',
            bankId: 'raiffeisen',
            categories: [{ name: 'Все покупки', percent: '1.5' }],
          },
          {
            id: 'test-j-6',
            bankId: 'gazprom',
            categories: [
              { name: 'Спорттовары', percent: '5' },
              { name: 'Развлечения', percent: '5' },
            ],
          },
          {
            id: 'test-j-7',
            bankId: 'ozon',
            categories: [
              { name: 'Маркетплейсы', percent: '5' },
              { name: 'Фастфуд', percent: '5' },
            ],
          },
          {
            id: 'test-j-8',
            bankId: 'yandex',
            categories: [
              { name: 'Такси', percent: '10' },
              { name: 'Доставка', percent: '5' },
            ],
          },
        ],
      },
    ];

    setAllData((prev) => {
      const newData = [...prev];
      testMonths.forEach((testMonth) => {
        const existingIndex = newData.findIndex(
          (m) => m.monthId === testMonth.monthId,
        );
        if (existingIndex >= 0) {
          newData[existingIndex] = testMonth;
        } else {
          newData.push(testMonth);
        }
      });
      return newData;
    });

    if (user) {
      testMonths.forEach((testMonth) => {
        saveToFirestore('month', testMonth);
      });
    }
  }, [user, saveToFirestore, setAllData]);
  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-[#0B0F19] font-sans transition-colors duration-300 flex flex-col md:flex-row">
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
            borderRadius: '24px',
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
      <aside className="hidden md:flex flex-col w-[280px] h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-r border-slate-200/50 dark:border-white/10 z-40 shrink-0">
        <div className="px-6 py-10 flex flex-col h-full">
          <div className="flex items-center mb-12 px-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-white" />
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
              className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
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
              onClick={() => setActiveTab('current')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'current'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <Wallet className="w-5 h-5" />
              Кэшбек
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'archive'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <History className="w-5 h-5" />
              Архив
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold cursor-pointer active:scale-95',
                activeTab === 'settings'
                  ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[var(--accent-color)]/30 border border-transparent',
              )}
            >
              <SettingsIcon className="w-5 h-5" />
              Настройки
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
          'fixed top-0 left-0 right-0 z-40 transition-transform duration-300 p-3 md:hidden',
          !headerVisible && '-translate-y-full',
        )}
      >
        <div className="max-w-3xl mx-auto bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl px-4 py-2.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
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
              className="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
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
        className="flex-1 overflow-y-auto scrollbar-hide app-content-text pt-[5.25rem] pb-[7rem] md:pt-12 md:pb-12 relative"
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
                  data={currentMonthData}
                  selectedMonthId={selectedMonthId}
                  onMonthChange={setSelectedMonthId}
                  onUpdate={handleUpdateCurrentMonth}
                  onDeleteEntry={(entryId) =>
                    deleteMonthEntry(selectedMonthId, entryId)
                  }
                  customBanks={customBanks}
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
                  onAddTestData={handleAddTestData}
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
          'md:hidden fixed bottom-3 left-0 right-0 z-50 px-3 flex justify-center transition-all duration-300',
          !navVisible && navExpanded && 'translate-y-20',
        )}
      >
        <motion.nav
          initial={false}
          animate={{
            maxWidth: navExpanded ? 320 : 180,
            borderRadius: navExpanded ? 24 : 32,
            height: navExpanded ? 68 : 56,
          }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 shadow-2xl flex items-center px-1 overflow-hidden"
          onClick={() => !navExpanded && setNavExpanded(true)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('current');
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
                <Wallet className="w-6 h-6" />
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
              setActiveTab('archive');
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
              setActiveTab('settings');
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
