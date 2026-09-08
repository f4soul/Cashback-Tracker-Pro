import React, { useEffect, useState, useId, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { registerModal } from "../../utils/scrollLock";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  isBottomSheet?: boolean; // Force bottom sheet on all devices
  isFixedHeight?: boolean; // Force fixed height to prevent jumping
  size?: "default" | "wide";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerContent,
  children,
  isBottomSheet = false,
  isFixedHeight = false,
  size = "default",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const isActuallyBottomSheet = isMobile || isBottomSheet;

  const bottomSheetVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  const desktopVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.96 },
  };

  const variants = isActuallyBottomSheet ? bottomSheetVariants : desktopVariants;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 md:left-[280px] bg-black/65 dark:bg-black/65 backdrop-blur-sm z-[60] transform translate-z-0"
          />
          <div
            className={`fixed inset-0 md:left-[280px] flex justify-center z-[70] pointer-events-none overflow-hidden ${
              isActuallyBottomSheet
                ? "items-end p-0 md:px-4 md:pt-4 md:pb-0"
                : "items-end md:items-center p-0 md:p-4"
            }`}
          >
            <motion.div
              layout="size"
              initial={variants.hidden}
              animate={variants.visible}
              exit={variants.exit}
              transition={
                isActuallyBottomSheet
                  ? { type: "spring", stiffness: 400, damping: 35, mass: 1 }
                  : { type: "spring", stiffness: 450, damping: 30, mass: 1 }
              }
              className={`bg-white dark:bg-[var(--surface-2)] shadow-[var(--elevation-highlight),0_-20px_60px_rgba(0,0,0,0.1)] dark:shadow-[var(--elevation-highlight),0_-20px_60px_rgba(0,0,0,0.4)] md:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.1)] dark:md:shadow-[var(--elevation-highlight),0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col w-full pointer-events-auto transform translate-z-0 will-change-transform ${
                isActuallyBottomSheet
                  ? "relative rounded-t-modal rounded-b-none border-t md:border-t md:border-x border-[var(--border-hairline)]"
                  : "relative rounded-t-modal md:rounded-modal border-t md:border border-[var(--border-hairline)]"
              } ${size === 'wide' ? 'md:max-w-[640px]' : 'md:max-w-[500px]'} ${isActuallyBottomSheet && isFixedHeight ? "h-[90vh]" : "max-h-[90vh] md:max-h-[80vh]"}`}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)] bg-transparent shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 -mr-1 rounded-full bg-[var(--fill)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] transition-[background-color,transform] cursor-pointer active:scale-95 shrink-0"
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
    </AnimatePresence>,
    document.body
  );
};
