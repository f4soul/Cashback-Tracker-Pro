import React, { Fragment, useEffect, useId, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { registerModal } from "../../utils/scrollLock";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  /**
   * Режим адаптивного позиционирования:
   * - "form" (по умолчанию): мобильные = Bottom Sheet (items-end), с sm (640px+) = по центру (sm:items-center)
   * - "view": все сенсорные устройства (телефоны и планшеты) = Bottom Sheet (items-end),
   *           устройства с мышью/трекпадом = по центру (pointer-fine:items-center)
   * - "sheet": Bottom Sheet на всех устройствах
   */
  adaptiveMode?: "form" | "view" | "sheet";
  isBottomSheet?: boolean;
  isFixedHeight?: boolean;
  size?: "default" | "wide";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerContent,
  children,
  adaptiveMode,
  isBottomSheet = false,
  isFixedHeight = false,
  size = "default",
}) => {
  const modalId = useId();
  const onCloseRef = useRef(onClose);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useModalScrollLock(isOpen, modalPanelRef);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    return registerModal(modalId, () => {
      onCloseRef.current();
    });
  }, [isOpen, modalId]);

  // По умолчанию просмотр данных (isBottomSheet=true) использует pointer-fine:items-center,
  // а формы ввода — sm:items-center.
  const resolvedMode = adaptiveMode ?? (isBottomSheet ? "view" : "form");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          __demoMode
          as="div"
          className="relative z-[70]"
          open={isOpen}
          onClose={onClose}
        >
          {/* Матовый глубокий бэкдроп без тяжёлого полноэкранного backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.18, ease: "easeInOut" },
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 md:left-[280px] bg-slate-950/60 dark:bg-[#02040A]/90"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Внешний позиционирующий контейнер БЕЗ overflow-y-auto (скролл строго внутри карточки) */}
          <div
            className={clsx(
              "fixed inset-0 md:left-[280px] flex justify-center pointer-events-none",
              resolvedMode === "view" &&
                "items-end sm:pointer-fine:items-center p-0 sm:pointer-fine:p-4",
              resolvedMode === "form" &&
                "items-end sm:items-center p-0 sm:p-4",
              resolvedMode === "sheet" &&
                "items-end p-0 md:px-4 md:pt-4 md:pb-0",
            )}
          >
            {/* Единый монолитный анимируемый блок с пружинной физикой (без layout="size") */}
            <Dialog.Panel as={Fragment}>
              <motion.div
                ref={modalPanelRef}
                initial={{ opacity: 0, y: 48, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: 32,
                  scale: 0.98,
                  transition: { duration: 0.18, ease: "easeInOut" },
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  mass: 0.8,
                }}
                className={clsx(
                  "relative w-full flex flex-col overflow-hidden pointer-events-auto bg-white dark:bg-[var(--surface-2)] transform translate-z-0 will-change-transform border-[var(--border-hairline)]",
                  size === "wide" ? "md:max-w-[640px]" : "md:max-w-[500px]",
                  resolvedMode === "view" &&
                    clsx(
                      "rounded-t-modal rounded-b-none sm:pointer-fine:rounded-modal border-t sm:pointer-fine:border shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.45)] sm:pointer-fine:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.15)] dark:sm:pointer-fine:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.5)]",
                      isFixedHeight
                        ? "h-[88dvh] sm:pointer-fine:h-[82vh]"
                        : "max-h-[90dvh] sm:pointer-fine:max-h-[85vh]",
                    ),
                  resolvedMode === "form" &&
                    clsx(
                      "rounded-t-modal rounded-b-none sm:rounded-modal border-t sm:border shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.45)] sm:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.15)] dark:sm:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.5)]",
                      isFixedHeight
                        ? "h-[90dvh] sm:h-[85vh]"
                        : "max-h-[90dvh] sm:max-h-[85vh]",
                    ),
                  resolvedMode === "sheet" &&
                    clsx(
                      "rounded-t-modal rounded-b-none border-t md:border-x shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.45)]",
                      isFixedHeight ? "h-[90dvh]" : "max-h-[90dvh]",
                    ),
                )}
              >
                <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[var(--border-hairline)] bg-transparent shrink-0">
                  <Dialog.Title
                    as="h3"
                    className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 -mr-1 rounded-full bg-[var(--fill)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] transition-[background-color,color,transform] cursor-pointer active:scale-95 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {headerContent}
                <div className="px-3 pt-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:px-4 sm:pt-4 sm:pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] overflow-y-auto overscroll-contain w-full flex-1 min-h-0 scrollbar-hide flex flex-col">
                  {children}
                </div>
              </motion.div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>,
    document.body,
  );
};
