import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transform translate-z-0"
          />
          <div className="fixed inset-0 flex items-end md:items-center justify-center p-4 z-[70] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl rounded-[1.25rem] shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] border border-slate-100 dark:border-white/5 overflow-hidden max-h-[85vh] flex flex-col w-full md:w-[500px] pointer-events-auto transform translate-z-0 will-change-transform"
            >
              <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0A0A0A]">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 sm:p-4 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
