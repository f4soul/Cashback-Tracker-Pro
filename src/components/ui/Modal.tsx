import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  isBottomSheet?: boolean; // Force bottom sheet on all devices
  isFixedHeight?: boolean; // Force fixed height to prevent jumping
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, headerContent, children, isBottomSheet = false, isFixedHeight = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const mobileVariants = {
    hidden: { y: '100%', x: '-50%', left: '50%' },
    visible: { y: 0, x: '-50%', left: '50%' },
    exit: { y: '100%', x: '-50%', left: '50%' }
  };

  const desktopVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.96 }
  };

  const useBottomSheet = isMobile || isBottomSheet;
  const variants = useBottomSheet ? mobileVariants : desktopVariants;

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
            className="fixed inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-sm z-[60] transform translate-z-0"
          />
          <div className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4 z-[70] pointer-events-none">
            <motion.div
              initial={variants.hidden}
              animate={variants.visible}
              exit={variants.exit}
              transition={useBottomSheet ? { type: 'spring', stiffness: 400, damping: 35, mass: 1 } : { type: 'spring', stiffness: 450, damping: 30, mass: 1 }}
              className={`bg-white/95 dark:bg-[var(--surface-2)]/95 backdrop-blur-2xl shadow-[var(--elevation-highlight),0_-20px_60px_rgba(0,0,0,0.1)] dark:shadow-[var(--elevation-highlight),0_-20px_60px_rgba(0,0,0,0.4)] md:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.1)] dark:md:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.4)] border-t md:border border-[var(--border-hairline)] overflow-hidden flex flex-col w-full pointer-events-auto transform translate-z-0 will-change-transform ${
                useBottomSheet 
                  ? 'fixed bottom-0 rounded-t-[var(--radius-app)] rounded-b-none max-w-[700px]' 
                  : 'relative rounded-[var(--radius-app)] max-w-[500px]'
              } ${isFixedHeight ? 'h-[90vh] md:h-[85vh]' : 'max-h-[90vh] md:max-h-[85vh]'}`}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)] bg-transparent shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 -mr-1 rounded-full bg-[var(--fill)] flex items-center justify-center text-slate-500 dark:text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {headerContent}
              <div className="p-3 sm:p-4 overflow-y-auto w-full flex-1 min-h-0 scrollbar-hide flex flex-col">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
