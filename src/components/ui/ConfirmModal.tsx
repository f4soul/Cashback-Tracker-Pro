import React, { Fragment, useEffect, useRef, useId } from "react";
import { Dialog } from "@headlessui/react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { registerModal } from "../../utils/scrollLock";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  variant = "danger",
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useModalScrollLock(isOpen, panelRef);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const modalId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    return registerModal(modalId, () => {
      onCloseRef.current();
    });
  }, [isOpen, modalId]);

  const Icon =
    variant === "danger"
      ? Trash2
      : variant === "warning"
        ? AlertTriangle
        : Info;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          __demoMode
          as="div"
          className="relative z-[100]"
          open={isOpen}
          onClose={onClose}
        >
          {/* Глубокий матовый бэкдроп без полноэкранного backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.18, ease: "easeInOut" },
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 md:left-[280px] bg-slate-950/60 dark:bg-[#02040A]/90"
            aria-hidden="true"
          />

          <div className="fixed inset-0 md:left-[280px] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
            <Dialog.Panel as={Fragment}>
              <motion.div
                ref={panelRef}
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
                className="relative w-full sm:max-w-[400px] bg-white dark:bg-[var(--surface-2)] rounded-t-modal rounded-b-none sm:rounded-modal shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[var(--elevation-highlight),0_-10px_40px_rgba(0,0,0,0.45)] sm:shadow-[var(--elevation-highlight),0_20px_60px_rgb(0,0,0,0.15)] dark:sm:shadow-[var(--elevation-highlight),0_20px_60px_rgb(0,0,0,0.5)] overflow-hidden flex flex-col border-t sm:border border-[var(--border-hairline)] pointer-events-auto transform translate-z-0 will-change-transform"
              >
                <div className="p-6 pb-5 sm:p-8 flex flex-col items-center text-center">
                  <div
                    className={clsx(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-5 relative",
                      variant === "danger"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                        : variant === "warning"
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500"
                          : "bg-[var(--percent-bg)] text-[var(--accent-color)]",
                    )}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <Dialog.Title
                    as="h3"
                    className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] mb-2 leading-tight"
                  >
                    {title}
                  </Dialog.Title>
                  <Dialog.Description
                    as="p"
                    className="text-sm font-semibold text-[var(--text-secondary)] leading-relaxed"
                  >
                    {message}
                  </Dialog.Description>
                </div>

                <div className="px-4 pt-0 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] sm:p-6 sm:pt-0 flex flex-col sm:flex-row-reverse gap-2.5 sm:gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={clsx(
                      "flex-1 py-3.5 px-4 rounded-control font-bold text-sm transition-[background-color,box-shadow,filter,transform] active:scale-95 cursor-pointer flex items-center justify-center gap-2",
                      variant === "danger"
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.4)]"
                        : variant === "warning"
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.4)]"
                          : "bg-[var(--accent-color)] hover:brightness-110 text-white shadow-md shadow-[var(--accent-color)]/20 hover:shadow-[var(--accent-color)]/40",
                    )}
                  >
                    {confirmText}
                  </button>
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 px-4 rounded-control font-bold text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--fill)] hover:bg-[var(--fill-hover)] transition-[background-color,color,transform] active:scale-95 cursor-pointer shadow-sm border border-[var(--border-hairline)]"
                  >
                    {cancelText}
                  </button>
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
