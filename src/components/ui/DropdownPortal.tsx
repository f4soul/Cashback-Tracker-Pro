import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

export interface DropdownPortalProps {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  triggerRef,
  onClose,
  children,
  className = "",
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [keepMounted, setKeepMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setKeepMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    const timer = setTimeout(() => setKeepMounted(false), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let rafId: number;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current?.offsetHeight || 260;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Переворачиваем вверх, если снизу мало места, а сверху достаточно
        const shouldFlip =
          spaceBelow < dropdownHeight + 16 && spaceAbove > spaceBelow;
        setIsFlipped(shouldFlip);

        setCoords({
          top: shouldFlip ? rect.top - dropdownHeight - 6 : rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
      rafId = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen && !keepMounted) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 9999,
      }}
      className={clsx(
        "transition-[opacity,transform] duration-150 ease-out",
        isFlipped ? "origin-bottom" : "origin-top",
        isOpen
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : clsx(
              "opacity-0 scale-95 pointer-events-none",
              isFlipped ? "translate-y-1" : "-translate-y-1",
            ),
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
};
