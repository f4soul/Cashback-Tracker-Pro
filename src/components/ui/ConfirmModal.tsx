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
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transform-gpu">
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transform-gpu"
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            className="relative w-full max-w-[400px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform-gpu"
          >
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center mb-5 relative",
                variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 
                variant === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 
                'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
              )}>
                <div>
                  <Icon className="w-8 h-8" />
                </div>
                <div
                  className={clsx(
                    "absolute inset-0 rounded-full border-2",
                    variant === 'danger' ? 'border-red-500/30' : 
                    variant === 'warning' ? 'border-amber-500/30' : 
                    'border-blue-500/30'
                  )}
                />
              </div>
              
              <h3 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {title}
              </h3>
              <p id="modal-description" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
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
                  "flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 transform-gpu",
                  variant === 'danger' 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40' 
                    : variant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
                    : 'bg-[var(--accent-color)] hover:opacity-90 text-white shadow-lg shadow-[var(--accent-color)]/25 hover:shadow-[var(--accent-color)]/40'
                )}
              >
                {confirmText}
              </button>
              <button
                ref={cancelRef}
                onClick={onClose}
                className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all active:scale-95 cursor-pointer transform-gpu"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
