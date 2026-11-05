import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import React, { useState, useMemo, useCallback, useRef, memo } from "react";
import { MonthData, Bank, LogoShape } from "../types";
import { formatMonthId, capitalize } from "../utils/date";
import { pluralize } from "../utils/format";
import { CashbackTable } from "../components/CashbackTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { DropdownPortal } from "../components/ui/DropdownPortal";
import { Modal } from "../components/ui/Modal";
import { exportToPDF, exportToExcel, exportToImage } from "../utils/export";
import {
  Search,
  Filter,
  ChevronDown,
  Trash2,
  X,
  RotateCcw,
  Check,
  Tag,
  Landmark,
} from "lucide-react";
import { BANKS, COMMON_CATEGORIES, getBankDetails } from "../constants";
import { BankLogo } from "../components/BankLogo";
import { clsx } from "clsx";
import { motion } from "motion/react";

interface MonthCardProps {
  month: MonthData;
  customBanks: Bank[];
  globalLogoShape: LogoShape;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const MonthCard: React.FC<MonthCardProps> = memo(
  ({ month, customBanks, globalLogoShape, onClick, onDeleteClick }) => {
    const totalCategories = useMemo(
      () =>
        month.entries.reduce((sum, entry) => sum + entry.categories.length, 0),
      [month.entries],
    );

    const bankList = useMemo(() => {
      return month.entries
        .map((entry) => {
          let b = getBankDetails(entry.bankId, entry.customBankName);
          if (!b && entry.bankId.startsWith("custom_")) {
            b = customBanks.find((cb) => cb.id === entry.bankId);
          }
          if (!b) {
            b = {
              id: entry.bankId,
              name: entry.customBankName || "Удаленный банк",
              color: entry.customBankColor || "#64748b",
              logoText:
                entry.customBankLogoText ||
                (entry.customBankName || "Б").substring(0, 2).toUpperCase(),
              logoUrl: entry.customLogo,
            };
          }
          return { bank: b, customLogo: entry.customLogo };
        })
        .filter((item) => Boolean(item.bank));
    }, [month.entries, customBanks]);

    const visibleBanks = bankList.slice(0, 10);
    const overflowCount = bankList.length - visibleBanks.length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={onClick}
        className="bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-[var(--accent-color)]/30 transition-[box-shadow,border-color] duration-300 cursor-pointer p-4 flex flex-col gap-3 group relative overflow-hidden isolate"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center font-bold text-base tabular-nums leading-none shrink-0 shadow-sm border border-[var(--accent-color)]/20">
              {month.monthId.split("-")[1]}
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight truncate tracking-tight">
                {capitalize(formatMonthId(month.monthId))}
              </h3>
              <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 font-medium truncate">
                {month.entries.length}{" "}
                {pluralize(month.entries.length, ["банк", "банка", "банков"])}
                {" · "}
                {totalCategories}{" "}
                {pluralize(totalCategories, [
                  "категория",
                  "категории",
                  "категорий",
                ])}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDeleteClick}
            className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-control transition-[color,background-color,transform] cursor-pointer active:scale-90 shrink-0 ml-2"
            title="Удалить месяц"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Полочка с живым стеком мини-логотипов банков (Вариант 1) */}
        <div className="flex items-center gap-2 pl-0.5 pt-2.5 border-t border-[var(--border-hairline)] relative z-10 min-w-0">
          <div className="flex -space-x-1.5 overflow-hidden py-0.5 shrink-0 max-w-[calc(100%-65px)]">
            {visibleBanks.map((item, idx) => (
              <div
                key={`${item.bank.id}-${idx}`}
                className="w-6 h-6 rounded-full bg-white dark:bg-[var(--surface-2)] ring-2 ring-white dark:ring-[var(--surface-1)] border border-[var(--border-hairline)] flex items-center justify-center overflow-hidden shadow-xs shrink-0"
              >
                <BankLogo
                  bank={item.bank}
                  customLogo={item.customLogo}
                  logoShape={globalLogoShape}
                  size="xs"
                />
              </div>
            ))}
            {overflowCount > 0 && (
              <div className="h-6 px-1.5 rounded-full bg-[var(--fill)] ring-2 ring-white dark:ring-[var(--surface-1)] text-[10px] font-bold tabular-nums text-[var(--text-secondary)] flex items-center justify-center shrink-0 border border-[var(--border-hairline)]">
                +{overflowCount}
              </div>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] font-semibold ml-auto group-hover:text-[var(--accent-color)] transition-colors inline-flex items-center gap-1 shrink-0">
            <span>Открыть</span>
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </motion.div>
    );
  },
);
MonthCard.displayName = "MonthCard";

export interface ArchiveProps {
  allData: MonthData[];
  customBanks: Bank[];
  deletedCustomBanks?: Bank[];
  customCategories: string[];
  onDeleteEntry: (monthId: string, entryId: string) => void;
  onDeleteMonth: (monthId: string) => void;
  globalLogoShape: LogoShape;
}

export const Archive: React.FC<ArchiveProps> = memo(
  ({
    allData,
    customBanks,
    deletedCustomBanks = [],
    customCategories,
    onDeleteMonth,
    globalLogoShape,
  }) => {
    const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBankFilter, setSelectedBankFilter] = useState<string>("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] =
      useState<string>("");
    const [showFilters, setShowFilters] = useState(false);
    const [openBankDropdown, setOpenBankDropdown] = useState(false);
    const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [monthToDelete, setMonthToDelete] = useState<string | null>(null);

    const bankTriggerRef = useRef<HTMLDivElement>(null);
    const categoryTriggerRef = useRef<HTMLDivElement>(null);

    const allCustomBanks = useMemo(
      () => [...customBanks, ...deletedCustomBanks],
      [customBanks, deletedCustomBanks],
    );

    const allBanks = useMemo(
      () => [...BANKS, ...allCustomBanks],
      [allCustomBanks],
    );

    const banksMap = useMemo(
      () => new Map(allBanks.map((b) => [b.id, b])),
      [allBanks],
    );

    const selectedBankObj = selectedBankFilter
      ? banksMap.get(selectedBankFilter)
      : undefined;

    const allCategories = useMemo(
      () => Array.from(new Set([...COMMON_CATEGORIES, ...customCategories])),
      [customCategories],
    );

    const hasDropdownFilters = Boolean(
      selectedBankFilter || selectedCategoryFilter,
    );
    const hasAnyActiveFilter = Boolean(
      searchQuery || selectedBankFilter || selectedCategoryFilter,
    );
    const activeFilterCount =
      (selectedBankFilter ? 1 : 0) + (selectedCategoryFilter ? 1 : 0);
    const totalActiveFilters =
      activeFilterCount + (searchQuery.trim() ? 1 : 0);

    const handleResetFilters = useCallback(() => {
      setSearchQuery("");
      setSelectedBankFilter("");
      setSelectedCategoryFilter("");
      setOpenBankDropdown(false);
      setOpenCategoryDropdown(false);
    }, []);

    // Filter the data
    const filteredData = useMemo(() => {
      return allData
        .map((month) => {
          const filteredEntries = month.entries.filter((entry) => {
            let bank = getBankDetails(entry.bankId, entry.customBankName);
            if (!bank && entry.bankId.startsWith("custom_")) {
              bank = banksMap.get(entry.bankId);
            }
            if (!bank) {
              bank = {
                id: entry.bankId,
                name: entry.customBankName || "Удаленный банк",
                color: entry.customBankColor || "#64748b",
                logoText:
                  entry.customBankLogoText ||
                  (entry.customBankName || "Б").substring(0, 2).toUpperCase(),
                logoUrl: entry.customLogo || DEFAULT_BANK_LOGO,
              };
            }

            if (selectedBankFilter && entry.bankId !== selectedBankFilter)
              return false;

            if (
              selectedCategoryFilter &&
              !entry.categories.some((c) => {
                const name = typeof c === "string" ? c : c.name;
                return name === selectedCategoryFilter;
              })
            )
              return false;

            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const matchesBank = bank?.name.toLowerCase().includes(q);
              const matchesCategory = entry.categories.some((c) => {
                const name = typeof c === "string" ? c : c.name;
                return name.toLowerCase().includes(q);
              });
              if (!matchesBank && !matchesCategory) return false;
            }

            return true;
          });

          return { ...month, entries: filteredEntries };
        })
        .filter((month) => month.entries.length > 0);
    }, [
      allData,
      searchQuery,
      selectedBankFilter,
      selectedCategoryFilter,
      banksMap,
    ]);

    const selectedMonth = useMemo(
      () => filteredData.find((m) => m.monthId === selectedMonthId),
      [filteredData, selectedMonthId],
    );

    const handleExport = useCallback(async (monthId: string) => {
      await exportToPDF(`archive-table-${monthId}`, `Кэшбек_${monthId}.pdf`);
    }, []);

    const handleExportImage = useCallback(async (monthId: string) => {
      await exportToImage(`archive-table-${monthId}`, `Кэшбек_${monthId}.png`);
    }, []);

    const handleExportExcel = useCallback(
      async (month: MonthData) => {
        await exportToExcel(
          month,
          allCustomBanks,
          `Кэшбек_${month.monthId}.xlsx`,
        );
      },
      [allCustomBanks],
    );

    const handleDeleteMonthClick = useCallback((monthId: string) => {
      setMonthToDelete(monthId);
      setIsDeleteModalOpen(true);
    }, []);

    const confirmDeleteMonth = useCallback(() => {
      if (monthToDelete) {
        onDeleteMonth(monthToDelete);
        setMonthToDelete(null);
        setIsDeleteModalOpen(false);
      }
    }, [monthToDelete, onDeleteMonth]);

    const showBottomFilterSummary =
      (!showFilters && hasDropdownFilters) ||
      (showFilters && totalActiveFilters >= 2 && filteredData.length > 0);

    return (
      <div className="flex flex-col gap-3">
        {/* Filters Section */}
        <div className="relative z-20 bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] p-3 sm:p-4 flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Поиск по банку или категории..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] text-[var(--text-primary)] transition-[border-color,box-shadow] shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] transition-colors cursor-pointer"
                  title="Очистить поиск"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !showFilters;
                setShowFilters(next);
                if (!next) {
                  setOpenBankDropdown(false);
                  setOpenCategoryDropdown(false);
                }
              }}
              title={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
              className={clsx(
                "relative p-2.5 rounded-control border transition-[background-color,border-color,color,box-shadow,transform] flex items-center justify-center cursor-pointer active:scale-95 shrink-0",
                showFilters || hasDropdownFilters
                  ? "bg-[var(--accent-color)] border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20 text-white"
                  : "bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] shadow-sm",
              )}
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="-top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[var(--accent-color)] border border-[var(--accent-color)]/30 text-[10px] font-bold tabular-nums flex items-center justify-center shadow-sm leading-none absolute">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* CSS Grid Accordion (0fr -> 1fr) для раскрытия панели фильтров без рывков */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              showFilters
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3.5 mt-3 border-t border-[var(--border-hairline)]">
                {/* Bank Filter Dropdown */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] px-0.5">
                    Фильтр по банку
                  </label>
                  <div ref={bankTriggerRef} className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenBankDropdown((prev) => !prev);
                        setOpenCategoryDropdown(false);
                      }}
                      className={clsx(
                        "w-full h-11 flex items-center justify-between pl-3 pr-10 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] text-[var(--text-primary)] transition-[background-color,border-color,box-shadow] cursor-pointer hover:bg-[var(--fill-hover)]",
                        selectedBankFilter
                          ? "border-[var(--accent-color)]/40 font-medium"
                          : "border-[var(--border-hairline)]",
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        {selectedBankObj ? (
                          <>
                            <BankLogo
                              bank={selectedBankObj}
                              logoShape={globalLogoShape}
                              size="sm"
                            />
                            <span className="truncate">
                              {selectedBankObj.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-control bg-[var(--fill)] flex items-center justify-center shrink-0 text-[var(--text-tertiary)]">
                              <Landmark className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[var(--text-tertiary)]">
                              Все банки
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
                      {selectedBankFilter && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBankFilter("");
                            setOpenBankDropdown(false);
                          }}
                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] rounded-full transition-[color,background-color,transform] active:scale-90 cursor-pointer pointer-events-auto"
                          title="Очистить фильтр по банку"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronDown
                        className={clsx(
                          "w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-300 ease-out mr-1",
                          openBankDropdown && "rotate-180",
                        )}
                      />
                    </div>
                  </div>

                  <DropdownPortal
                    isOpen={openBankDropdown}
                    triggerRef={bankTriggerRef}
                    onClose={() => setOpenBankDropdown(false)}
                    className="bg-white dark:bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-card shadow-[var(--elevation-highlight),0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[var(--elevation-highlight),0_24px_48px_rgba(0,0,0,0.75)] max-h-64 overflow-y-auto overscroll-contain scrollbar-hide p-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankFilter("");
                        setOpenBankDropdown(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-control text-sm transition-colors cursor-pointer",
                        !selectedBankFilter
                          ? "bg-[var(--percent-bg)] text-[var(--accent-color)] font-semibold"
                          : "hover:bg-[var(--fill-hover)] text-[var(--text-primary)] font-medium",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-control bg-[var(--fill)] flex items-center justify-center shrink-0">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Все банки</span>
                      </div>
                      {!selectedBankFilter && (
                        <Check className="w-4 h-4 shrink-0 text-[var(--accent-color)]" />
                      )}
                    </button>
                    {allBanks.map((b) => {
                      const isSelected = selectedBankFilter === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => {
                            setSelectedBankFilter(b.id);
                            setOpenBankDropdown(false);
                          }}
                          className={clsx(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-control text-sm transition-colors mt-0.5 cursor-pointer",
                            isSelected
                              ? "bg-[var(--percent-bg)] text-[var(--accent-color)] font-semibold"
                              : "hover:bg-[var(--fill-hover)] text-[var(--text-primary)] font-medium",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BankLogo
                              bank={b}
                              logoShape={globalLogoShape}
                              size="sm"
                            />
                            <span className="truncate">{b.name}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 shrink-0 text-[var(--accent-color)]" />
                          )}
                        </button>
                      );
                    })}
                  </DropdownPortal>
                </div>

                {/* Category Filter Dropdown */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] px-0.5">
                    Фильтр по категории
                  </label>
                  <div
                    ref={categoryTriggerRef}
                    className="relative flex items-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCategoryDropdown((prev) => !prev);
                        setOpenBankDropdown(false);
                      }}
                      className={clsx(
                        "w-full h-11 flex items-center justify-between pl-3 pr-10 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] text-[var(--text-primary)] transition-[background-color,border-color,box-shadow] cursor-pointer hover:bg-[var(--fill-hover)]",
                        selectedCategoryFilter
                          ? "border-[var(--accent-color)]/40 font-medium"
                          : "border-[var(--border-hairline)]",
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        {selectedCategoryFilter ? (
                          <>
                            <div className="w-6 h-6 rounded-control bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">
                              {selectedCategoryFilter}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-control bg-[var(--fill)] flex items-center justify-center shrink-0 text-[var(--text-tertiary)]">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[var(--text-tertiary)]">
                              Все категории
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
                      {selectedCategoryFilter && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryFilter("");
                            setOpenCategoryDropdown(false);
                          }}
                          className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] rounded-full transition-[color,background-color,transform] active:scale-90 cursor-pointer pointer-events-auto"
                          title="Очистить фильтр по категории"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronDown
                        className={clsx(
                          "w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-300 ease-out mr-1",
                          openCategoryDropdown && "rotate-180",
                        )}
                      />
                    </div>
                  </div>

                  <DropdownPortal
                    isOpen={openCategoryDropdown}
                    triggerRef={categoryTriggerRef}
                    onClose={() => setOpenCategoryDropdown(false)}
                    className="bg-white dark:bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-card shadow-[var(--elevation-highlight),0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[var(--elevation-highlight),0_24px_48px_rgba(0,0,0,0.75)] max-h-64 overflow-y-auto overscroll-contain scrollbar-hide p-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter("");
                        setOpenCategoryDropdown(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-control text-sm transition-colors cursor-pointer",
                        !selectedCategoryFilter
                          ? "bg-[var(--percent-bg)] text-[var(--accent-color)] font-semibold"
                          : "hover:bg-[var(--fill-hover)] text-[var(--text-primary)] font-medium",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-control bg-[var(--fill)] flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Все категории</span>
                      </div>
                      {!selectedCategoryFilter && (
                        <Check className="w-4 h-4 shrink-0 text-[var(--accent-color)]" />
                      )}
                    </button>
                    {allCategories.map((c) => {
                      const isSelected = selectedCategoryFilter === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => {
                            setSelectedCategoryFilter(c);
                            setOpenCategoryDropdown(false);
                          }}
                          className={clsx(
                            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-control text-sm transition-colors mt-0.5 cursor-pointer",
                            isSelected
                              ? "bg-[var(--percent-bg)] text-[var(--accent-color)] font-semibold"
                              : "hover:bg-[var(--fill-hover)] text-[var(--text-primary)] font-medium",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={clsx(
                                "w-6 h-6 rounded-control flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
                                  : "bg-[var(--fill)] text-[var(--text-secondary)]",
                              )}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate text-left">{c}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 shrink-0 text-[var(--accent-color)]" />
                          )}
                        </button>
                      );
                    })}
                  </DropdownPortal>
                </div>
              </div>
            </div>
          </div>

          {/* Compact chips when filter panel is collapsed OR single bulk-reset when 2+ filters are active with results */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              showBottomFilterSummary
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-3 border-t border-[var(--border-hairline)]">
                {!showFilters && hasDropdownFilters ? (
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {selectedBankObj && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBankFilter("");
                          setOpenBankDropdown(false);
                        }}
                        className="h-9 inline-flex items-center gap-2 pl-2 pr-2.5 rounded-[min(10px,var(--radius-sm))] bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-primary)] transition-[background-color,transform] active:scale-95 cursor-pointer max-w-full"
                        title="Убрать фильтр по банку"
                      >
                        <BankLogo
                          bank={selectedBankObj}
                          logoShape={globalLogoShape}
                          size="xs"
                        />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">
                          {selectedBankObj.name}
                        </span>
                        <X className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 ml-0.5" />
                      </button>
                    )}
                    {selectedCategoryFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter("");
                          setOpenCategoryDropdown(false);
                        }}
                        className="h-9 inline-flex items-center gap-2 pl-2 pr-2.5 rounded-[min(10px,var(--radius-sm))] bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-primary)] transition-[background-color,transform] active:scale-95 cursor-pointer max-w-full"
                        title="Убрать фильтр по категории"
                      >
                        <div className="w-5 h-5 rounded-[min(6px,var(--radius-sm))] bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                          <Tag className="w-3 h-3" />
                        </div>
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">
                          {selectedCategoryFilter}
                        </span>
                        <X className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 ml-0.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-secondary)] font-medium pl-0.5">
                    Найдено: {filteredData.length}{" "}
                    {pluralize(filteredData.length, [
                      "месяц",
                      "месяца",
                      "месяцев",
                    ])}
                  </span>
                )}

                {totalActiveFilters >= 2 && filteredData.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-control text-xs font-semibold text-[var(--accent-color)] hover:bg-[var(--fill-hover)] transition-[background-color,transform] active:scale-95 cursor-pointer shrink-0 ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Сбросить все</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {filteredData.length > 0 ? (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-[80px] md:pb-0">
            {filteredData.map((month) => (
              <MonthCard
                key={month.monthId}
                month={month}
                customBanks={allCustomBanks}
                globalLogoShape={globalLogoShape}
                onClick={() => setSelectedMonthId(month.monthId)}
                onDeleteClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMonthClick(month.monthId);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center py-12 px-4 text-center mb-[90px] md:mb-0 bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-sm">
            <div className="w-16 h-16 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">
              Ничего не найдено
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-[280px]">
              Попробуйте изменить параметры поиска или фильтрации
            </p>
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-control bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] text-[var(--accent-color)] font-semibold text-sm transition-[background-color,transform] active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Сбросить фильтры</span>
              </button>
            )}
          </div>
        )}

        {/* Month Details Modal (режим просмотра данных — pointer-fine:items-center) */}
        <Modal
          isOpen={!!selectedMonthId}
          onClose={() => setSelectedMonthId(null)}
          title={
            selectedMonth ? capitalize(formatMonthId(selectedMonth.monthId)) : ""
          }
          adaptiveMode="view"
          size="wide"
        >
          {selectedMonth && (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    Банки в этом месяце
                  </h4>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                    {selectedMonth.entries.length}{" "}
                    {pluralize(selectedMonth.entries.length, [
                      "банк",
                      "банка",
                      "банков",
                    ])}
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                  {selectedMonth.entries.map((entry) => {
                    let bank = getBankDetails(
                      entry.bankId,
                      entry.customBankName,
                    );
                    if (!bank && entry.bankId.startsWith("custom_")) {
                      bank = allCustomBanks.find((b) => b.id === entry.bankId);
                    }
                    if (!bank) {
                      bank = {
                        id: entry.bankId,
                        name: entry.customBankName || "Удаленный банк",
                        color: entry.customBankColor || "#64748b",
                        logoText:
                          entry.customBankLogoText ||
                          (entry.customBankName || "Б")
                            .substring(0, 2)
                            .toUpperCase(),
                        logoUrl: entry.customLogo,
                      };
                    }

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-control bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] transition-colors select-none min-w-0"
                      >
                        <BankLogo
                          bank={bank}
                          customLogo={entry.customLogo}
                          logoShape={globalLogoShape}
                          size="sm"
                        />
                        <div className="flex flex-col min-w-0 overflow-hidden text-left">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">
                            {bank.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate mt-0.5 leading-tight">
                            {entry.categories.length}{" "}
                            {pluralize(entry.categories.length, [
                              "категория",
                              "категории",
                              "категорий",
                            ])}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <CashbackTable
                id={`archive-table-${selectedMonth.monthId}`}
                monthId={selectedMonth.monthId}
                entries={selectedMonth.entries}
                customBanks={allCustomBanks}
                globalLogoShape={globalLogoShape}
                onExportPDF={() => handleExport(selectedMonth.monthId)}
                onExportExcel={() => handleExportExcel(selectedMonth)}
                onExportImage={() => handleExportImage(selectedMonth.monthId)}
              />
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteMonth}
          title="Удалить месяц из архива?"
          message={`Вы уверены, что хотите удалить ${monthToDelete ? formatMonthId(monthToDelete) : "этот месяц"} из истории? Это действие нельзя отменить.`}
          confirmText="Удалить"
          variant="danger"
        />
      </div>
    );
  },
);
