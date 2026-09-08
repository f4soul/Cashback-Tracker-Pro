import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Modal } from "./ui/Modal";
import { MCC_DATA, MccItemType } from "../utils/mccData";

const MccItem: React.FC<{ item: MccItemType }> = ({ item }) => {
  return (
    <div className="w-full bg-[var(--fill)] p-3.5 rounded-control border border-[var(--border-hairline)] flex items-center gap-3 shadow-[var(--elevation-highlight),0_2px_4px_rgb(0,0,0,0.02)] text-left hover:border-[var(--accent-color)]/30 transition-[border-color,background-color,box-shadow] hover:bg-[var(--fill-hover)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)]">
      <div className="w-14 h-12 rounded-control bg-[var(--fill-hover)] flex items-center justify-center shrink-0">
        <span className="text-sm font-black text-[var(--text-primary)]">
          {item.code}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {item.name}
        </h3>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
          {item.group}
        </p>
      </div>
    </div>
  );
};

interface MccDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MccDirectory: React.FC<MccDirectoryProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(30);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchQuery("");
      setDisplayLimit(30);
    }, 300);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDisplayLimit(30);
  };

  const filteredMcc = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return MCC_DATA;

    return MCC_DATA.filter(
      (item) =>
        item.code.includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.group.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const displayedMcc = useMemo(() => {
    return filteredMcc.slice(0, displayLimit);
  }, [filteredMcc, displayLimit]);

  // Setup infinite scroll observer
  useEffect(() => {
    if (!isOpen || displayLimit >= filteredMcc.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => Math.min(prev + 30, filteredMcc.length));
        }
      },
      { rootMargin: "150px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [isOpen, displayLimit, filteredMcc.length]);

  const searchHeader = (
    <div className="px-4 py-3 border-b border-[var(--border-hairline)] shrink-0 bg-transparent">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Поиск по коду или названию..."
          className="w-full pl-10 pr-10 py-3 bg-[var(--fill)] border-none rounded-full text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-shadow"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setDisplayLimit(30);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Справочник МСС-кодов"
      headerContent={searchHeader}
      isBottomSheet={true}
      isFixedHeight={true}
      size="wide"
    >
      <div className="space-y-2 pb-8 sm:pb-0">
        {displayedMcc.length > 0 ? (
          <>
            {displayedMcc.map((item) => (
              <MccItem key={item.code} item={item} />
            ))}
            {displayLimit < filteredMcc.length && (
              <div
                ref={sentinelRef}
                className="h-10 w-full flex items-center justify-center text-xs text-[var(--text-tertiary)] font-semibold py-2"
              >
                Загрузка...
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Ничего не найдено
            </p>
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/search?q=MCC+код+${searchQuery}`,
                  "_blank",
                )
              }
              className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-control text-sm font-bold shadow-md shadow-[var(--accent-color)]/20 hover:brightness-110 transition-[filter,transform] cursor-pointer active:scale-95"
            >
              Поиск в Google
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
