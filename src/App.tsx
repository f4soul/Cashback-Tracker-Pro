import { useState, useEffect, useCallback, useRef } from "react";
import { PlaceholderUser } from "./types";
import { CurrentMonth } from "./views/CurrentMonth";
import { Archive } from "./views/Archive";
import { Settings } from "./views/Settings";
import {
  History,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { loginWithGoogle, logout } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";

import { Toaster } from "sonner";
import { ConfirmModal } from "./components/ui/ConfirmModal";
import { BANKS } from "./constants";

import { useAuth } from "./hooks/useAuth";
import { useScrollVisibility } from "./hooks/useScrollVisibility";
import { useCashbackStore } from "./store/CashbackStoreProvider";
import { useLogoPreloader } from "./hooks/useLogoPreloader";

const WalletIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
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
}: {
  user: FirebaseUser | PlaceholderUser | null;
  isMobile?: boolean;
  isSyncing: boolean;
  onLogoutClick: () => void;
}) => {
  if (user) {
    return (
      <div className={clsx("flex items-center", isMobile ? "gap-1" : "w-full")}>
        <div
          onClick={() => isMobile && onLogoutClick()}
          className={clsx(
            "flex items-center group transition-[background-color,transform]",
            isMobile
              ? "relative w-9 h-9 justify-center bg-[var(--surface-0)] dark:bg-[var(--surface-1)] border border-[var(--border-hairline)] rounded-full cursor-pointer shadow-sm hover:bg-[var(--fill-hover)] active:scale-95"
              : "px-4 py-3 bg-[var(--fill)] border border-[var(--border-hairline)] w-full gap-3 rounded-control",
          )}
        >
          {isSyncing && isMobile && (
            <div
              className="absolute bg-[var(--accent-color)] rounded-full border-2 border-[var(--surface-0)] dark:border-[var(--surface-1)] animate-pulse z-10 shrink-0 pointer-events-none -top-1 -right-1 w-3 h-3"
              title="Синхронизация..."
            />
          )}
          <div
            className={clsx(
              "relative shrink-0",
              isMobile ? "w-full h-full" : "w-8 h-8",
            )}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || ""}
                className="w-full h-full rounded-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center">
                <User
                  className={clsx(
                    "text-[var(--accent-color)]",
                    isMobile ? "w-5 h-5" : "w-4 h-4",
                  )}
                />
              </div>
            )}
            {isSyncing && !isMobile && (
              <div
                className="absolute bg-[var(--accent-color)] rounded-full border-2 border-[var(--surface-0)] dark:border-[var(--surface-1)] animate-pulse z-10 shrink-0 pointer-events-none -top-0.5 -right-0.5 w-2.5 h-2.5"
                title="Синхронизация..."
              />
            )}
          </div>
          {!isMobile && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {user.displayName || "Пользователь"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                {user.email}
              </p>
            </div>
          )}
          {!isMobile && (
            <div className="relative shrink-0 flex items-center justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogoutClick();
                }}
                className="p-2 transition-colors rounded-control cursor-pointer flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10"
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
        "flex items-center gap-2 rounded-[var(--radius-sm)] transition-[filter,transform] font-bold text-sm cursor-pointer shadow-lg shadow-[var(--accent-color)]/20 hover:bg-[var(--accent-color)] hover:brightness-110 active:scale-95 shrink-0",
        isMobile
          ? "h-8 px-4 bg-[var(--accent-color)] text-white"
          : "px-4 py-3 w-full bg-[var(--accent-color)] text-white justify-center",
      )}
      title="Войти в облако"
    >
      <LogIn className="w-4 h-4" />
      <span
        className={
          isMobile ? "text-[10px] uppercase tracking-wider font-black" : ""
        }
      >
        Войти
      </span>
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "current" | "archive" | "settings"
  >("current");

  // Scroll to top instantly when active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  // Handle tab clicks with scroll to top on double click
  const handleTabClick = useCallback(
    (tab: "current" | "archive" | "settings") => {
      if (activeTab === tab) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setActiveTab(tab);
      }
    },
    [activeTab],
  );
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Responsive desktop state for toast positioning
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // User auth state
  const { user } = useAuth();

  // Central Cashback Store
  const {
    selectedMonthId,
    setSelectedMonthId,
    allData,
    setAllData,
    customBanks,
    deletedCustomBanks,
    customCategories,
    settings,
    currentMonthData,
    archiveData,
    handleUpdateCurrentMonth,
    deleteMonthEntry,
    handleDeleteMonth,
    handleDeleteCustomBank,
    handleAddCustomBank,
    handleAddCustomCategory,
    saveToFirestore,
    isSyncing,
    hasInitialSync,
    handleImportAllData,
    handleExportAllData,
    theme,
    toggleTheme,
    handleUpdateSettings,
  } = useCashbackStore();

  useLogoPreloader(customBanks);

  // Cleanup all months from legacy/deleted custom banks exactly once after hasInitialSync
  const hasCleanedUpRef = useRef(false);
  useEffect(() => {
    const canClean = !user || hasInitialSync;
    if (!canClean) return;
    if (hasCleanedUpRef.current) return;
    if (allData.length === 0) return;

    hasCleanedUpRef.current = true;

    let hasChanges = false;
    const cleaned = allData.map((month) => {
      const filteredEntries = month.entries.filter((entry) => {
        const isStandard = BANKS.some((b) => b.id === entry.bankId);
        const isActiveCustom = customBanks.some((b) => b.id === entry.bankId);
        if (entry.bankId === "custom") return true;
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
            saveToFirestore?.("month", m);
          }
        });
      }
    }
  }, [user, hasInitialSync, allData, customBanks, setAllData, saveToFirestore]);

  const { headerVisible, navVisible, navExpanded, setNavExpanded } =
    useScrollVisibility();

  return (
    <div
      className="min-h-[100dvh] bg-[var(--surface-0)] dark:bg-[var(--surface-0)] font-sans transition-colors duration-300 flex flex-col md:flex-row relative"
      style={theme === 'dark' ? {
        backgroundImage: 'radial-gradient(640px 420px at 50% -12%, rgba(56, 120, 255, 0.10), transparent 70%)',
      } : undefined}
    >
      <Toaster
        theme={theme}
        position={isDesktop ? "bottom-right" : "top-center"}
        expand={false}
        toastOptions={{
          style: {
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            width: "fit-content",
            minWidth: "auto",
            maxWidth: "360px",
          },
          className:
            "!bg-white dark:!bg-[var(--surface-2)] !border !border-[var(--border-hairline)] !text-[var(--text-primary)] shadow-[var(--elevation-highlight),0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)] text-[13px] font-medium tracking-normal !w-fit !min-w-0 inline-flex items-center gap-2",
          descriptionClassName: "!text-[var(--text-secondary)] !text-[12px]",
        }}
      />

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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] h-[100dvh] sticky top-0 self-start bg-white dark:bg-[var(--surface-1)] transition-colors duration-300 border-r border-[var(--border-hairline)] z-30 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="px-6 py-10 flex flex-col h-full">
          <div className="flex items-center mb-12 px-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-sm">
                <WalletIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight leading-none">
                  Cashback
                </h1>
                <p className="text-[10px] font-bold text-[var(--accent-color)] uppercase tracking-widest mt-1">
                  Tracker Pro
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-control bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] transition-[background-color,transform] active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              title={
                theme === "light"
                  ? "Включить темную тему"
                  : "Включить светлую тему"
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "light" ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          <nav className="flex flex-col gap-2.5 flex-1">
            <button
              onClick={() => handleTabClick("current")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 rounded-control transition-[background-color,border-color,color,box-shadow,transform] duration-300 text-sm font-bold cursor-pointer active:scale-95",
                activeTab === "current"
                  ? "bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent"
                  : "text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/30 border border-transparent",
              )}
            >
              <WalletIcon className="w-5 h-5 shrink-0" />
              <span className="leading-none mt-[1px]">Кэшбек</span>
            </button>
            <button
              onClick={() => handleTabClick("archive")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 rounded-control transition-[background-color,border-color,color,box-shadow,transform] duration-300 text-sm font-bold cursor-pointer active:scale-95",
                activeTab === "archive"
                  ? "bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent"
                  : "text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/30 border border-transparent",
              )}
            >
              <History className="w-5 h-5 shrink-0" />
              <span className="leading-none mt-[1px]">Архив</span>
            </button>
            <button
              onClick={() => handleTabClick("settings")}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 rounded-control transition-[background-color,border-color,color,box-shadow,transform] duration-300 text-sm font-bold cursor-pointer active:scale-95",
                activeTab === "settings"
                  ? "bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-color)]/20 border border-transparent"
                  : "text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/30 border border-transparent",
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
            />
          </div>
        </div>
      </aside>

      {/* Floating Header */}
      <header
        className={clsx(
          "fixed top-0 left-0 right-0 z-40 transition-transform duration-300 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden",
          !headerVisible && "-translate-y-full",
        )}
      >
        <div className="relative z-10 max-w-3xl mx-auto rounded-card px-4 py-2.5 flex items-center justify-between">
          {/* iOS Safari Backdrop-Filter Composite Layer Fix */}
          <div className="absolute inset-0 bg-white dark:bg-[var(--surface-1)] transition-colors duration-300 border border-[var(--border-hairline)] rounded-card shadow-[var(--elevation-highlight),0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[var(--elevation-highlight),0_20px_40px_rgb(0,0,0,0.2)] pointer-events-none -z-10" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-color)] opacity-90 rounded-[22%] flex items-center justify-center shadow-sm">
              <WalletIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight leading-none">
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
            />
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--surface-0)] dark:bg-[var(--surface-1)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] transition-[background-color,transform] active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              title={
                theme === "light"
                  ? "Включить темную тему"
                  : "Включить светлую тему"
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "light" ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
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
            {activeTab === "current" ? (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <CurrentMonth
                  isExiting={activeTab !== "current"}
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
                />
              </motion.div>
            ) : activeTab === "archive" ? (
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
          "md:hidden fixed left-0 right-0 z-50 px-3 flex justify-center transition-transform duration-300",
          !navVisible && navExpanded && "translate-y-[200%]",
        )}
        style={{
          bottom: "max(0.75rem, calc(env(safe-area-inset-bottom) - 0.25rem))",
        }}
      >
        <motion.nav
          initial={false}
          animate={{
            maxWidth: navExpanded ? 320 : 180,
            borderRadius: 20,
            height: navExpanded ? 68 : 56,
          }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full bg-white dark:bg-[var(--surface-1)] border border-[var(--border-hairline)] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.4)] flex items-center px-1 overflow-hidden"
          onClick={() => !navExpanded && setNavExpanded(true)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTabClick("current");
            }}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0",
              activeTab === "current"
                ? "text-[var(--accent-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <motion.div
              className={clsx(
                "p-1.5 rounded-control flex items-center justify-center",
                activeTab === "current"
                  ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
                  : "bg-transparent text-[var(--text-secondary)]",
              )}
              animate={{ scale: activeTab === "current" ? 1.1 : 1 }}
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
                width: navExpanded ? "auto" : 0,
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
              handleTabClick("archive");
            }}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0",
              activeTab === "archive"
                ? "text-[var(--accent-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <motion.div
              className={clsx(
                "p-1.5 rounded-control flex items-center justify-center",
                activeTab === "archive"
                  ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
                  : "bg-transparent text-[var(--text-secondary)]",
              )}
              animate={{ scale: activeTab === "archive" ? 1.1 : 1 }}
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
                width: navExpanded ? "auto" : 0,
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
              handleTabClick("settings");
            }}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer min-w-0",
              activeTab === "settings"
                ? "text-[var(--accent-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <motion.div
              className={clsx(
                "p-1.5 rounded-control flex items-center justify-center",
                activeTab === "settings"
                  ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
                  : "bg-transparent text-[var(--text-secondary)]",
              )}
              animate={{ scale: activeTab === "settings" ? 1.1 : 1 }}
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
                width: navExpanded ? "auto" : 0,
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
