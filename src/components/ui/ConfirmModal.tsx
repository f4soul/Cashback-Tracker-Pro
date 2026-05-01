import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger'
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const Icon = variant === 'danger' ? Trash2 : variant === 'warning' ? AlertTriangle : Info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            className="relative w-full max-w-[400px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-white/10"
          >
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center mb-5 relative",
                variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 
                variant === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 
                'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
              )}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <Icon className="w-8 h-8" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className={clsx(
                    "absolute inset-0 rounded-full border-2",
                    variant === 'danger' ? 'border-red-500/30' : 
                    variant === 'warning' ? 'border-amber-500/30' : 
                    'border-blue-500/30'
                  )}
                />
              </div>
              
              <h3 id="modal-title" className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2 leading-tight">
                {title}
              </h3>
              <p id="modal-description" className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
            
            <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row-reverse gap-3 w-full">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={clsx(
                  "flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2",
                  variant === 'danger' 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.4)]' 
                    : variant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.4)]'
                    : 'bg-[var(--accent-color)] hover:brightness-110 text-white shadow-md shadow-[var(--accent-color)]/20 hover:shadow-[var(--accent-color)]/40'
                )}
              >
                {confirmText}
              </button>
              <button
                ref={cancelRef}
                onClick={onClose}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm border border-slate-200/50 dark:border-white/10"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
