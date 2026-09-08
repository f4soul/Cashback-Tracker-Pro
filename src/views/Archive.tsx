import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import React, { useState, useMemo, useCallback, memo } from "react";
import { MonthData, Bank, LogoShape } from "../types";
import { formatMonthId, capitalize } from "../utils/date";
import { pluralize } from "../utils/format";
import { CashbackTable } from "../components/CashbackTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { exportToPDF, exportToExcel, exportToImage } from "../utils/export";
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Search,
  Filter,
  ChevronDown,
  Trash2,
  X,
} from "lucide-react";
import { BANKS, COMMON_CATEGORIES, getBankDetails } from "../constants";
import { BankLogo } from "../components/BankLogo";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";


import { Modal } from "../components/ui/Modal";

interface MonthCardProps {
  month: MonthData;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const MonthCard: React.FC<MonthCardProps> = memo(({ month, onClick, onDeleteClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className="bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-[var(--accent-color)]/30 transition-[box-shadow,border-color] duration-300 cursor-pointer p-4 sm:p-5 flex flex-col group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/0 to-[var(--accent-color)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            {month.monthId.split("-")[1]}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate tracking-tight">
              {capitalize(formatMonthId(month.monthId))}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
              {month.entries.length} {pluralize(month.entries.length, ["банк", "банка", "банков"])}
            </p>
          </div>
        </div>
        
        <button
          onClick={onDeleteClick}
          className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-control transition-[color,background-color,transform] cursor-pointer active:scale-90"
          title="Удалить месяц"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
});
MonthCard.displayName = "MonthCard";


interface ArchiveProps {
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

    const allCustomBanks = useMemo(
      () => [...customBanks, ...deletedCustomBanks],
      [customBanks, deletedCustomBanks],
    );

    const allBanks = useMemo(
      () => [...BANKS, ...allCustomBanks],
      [allCustomBanks],
    );
    const allCategories = useMemo(
      () => Array.from(new Set([...COMMON_CATEGORIES, ...customCategories])),
      [customCategories],
    );

    // Filter the data
    const filteredData = useMemo(() => {
      return allData
        .map((month) => {
          // Filter entries within the month
          const filteredEntries = month.entries.filter((entry) => {
            let bank = getBankDetails(entry.bankId, entry.customBankName);
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
                  (entry.customBankName || "Б").substring(0, 2).toUpperCase(),
                logoUrl: entry.customLogo || DEFAULT_BANK_LOGO,
              };
            }

            // Bank filter
            if (selectedBankFilter && entry.bankId !== selectedBankFilter)
              return false;

            // Category filter
            if (
              selectedCategoryFilter &&
              !entry.categories.some((c) => {
                const name = typeof c === "string" ? c : c.name;
                return name === selectedCategoryFilter;
              })
            )
              return false;

            // Search query (checks bank name and categories)
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
        .filter((month) => month.entries.length > 0); // Only keep months that have matching entries
    }, [
      allData,
      searchQuery,
      selectedBankFilter,
      selectedCategoryFilter,
      allCustomBanks,
    ]);

    const selectedMonth = useMemo(() => filteredData.find(m => m.monthId === selectedMonthId), [filteredData, selectedMonthId]);
    
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

    return (
      <div className="flex flex-col gap-3">
        {/* Filters Section */}
        <div className="bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] transition-colors"
                  title="Очистить поиск"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "p-2.5 rounded-control border transition-[background-color,border-color,color,box-shadow,transform] flex items-center justify-center cursor-pointer active:scale-95",
                showFilters || selectedBankFilter || selectedCategoryFilter
                  ? "bg-[var(--accent-color)] border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20 text-white"
                  : "bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--fill-hover)] shadow-sm",
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-strong)] animate-fade-down">
              {/* Bank Filter Dropdown */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">
                  Фильтр по банку
                </label>
                <button
                  onClick={() => {
                    setOpenBankDropdown(!openBankDropdown);
                    setOpenCategoryDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] text-[var(--text-primary)] transition-[background-color,border-color,box-shadow] cursor-pointer shadow-none hover:shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_2px_8px_rgb(0,0,0,0.1)] hover:bg-[var(--fill-hover)]"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedBankFilter ? (
                      <>
                        <BankLogo
                          bank={allBanks.find(
                            (b) => b.id === selectedBankFilter,
                          )!}
                          logoShape={globalLogoShape}
                          size="sm"
                        />
                        <span className="truncate">
                          {
                            allBanks.find((b) => b.id === selectedBankFilter)
                              ?.name
                          }
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">
                        Все банки
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 text-[var(--text-tertiary)] transition-transform",
                      openBankDropdown && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openBankDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenBankDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-card shadow-[var(--elevation-highlight),0_8px_30px_rgba(0,0,0,0.12)] max-h-64 overflow-y-auto scrollbar-hide p-1.5"
                      >
                        <button
                          onClick={() => {
                            setSelectedBankFilter("");
                            setOpenBankDropdown(false);
                          }}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-control text-sm transition-colors cursor-pointer",
                            !selectedBankFilter
                              ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                              : "hover:bg-[var(--fill-hover)] text-[var(--text-secondary)]",
                          )}
                        >
                          <div className="w-5 h-5 rounded-full bg-[var(--fill)] flex items-center justify-center shrink-0">
                            <Filter className="w-3 h-3" />
                          </div>
                          Все банки
                        </button>
                        {allBanks.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              setSelectedBankFilter(b.id);
                              setOpenBankDropdown(false);
                            }}
                            className={clsx(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-control text-sm transition-colors mt-0.5 cursor-pointer",
                              selectedBankFilter === b.id
                                ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                                : "hover:bg-[var(--fill-hover)] text-[var(--text-secondary)]",
                            )}
                          >
                            <BankLogo
                              bank={b}
                              logoShape={globalLogoShape}
                              size="sm"
                            />
                            <span className="truncate">{b.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">
                  Фильтр по категории
                </label>
                <button
                  onClick={() => {
                    setOpenCategoryDropdown(!openCategoryDropdown);
                    setOpenBankDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] text-[var(--text-primary)] transition-[background-color,border-color,box-shadow] cursor-pointer shadow-none hover:shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_2px_8px_rgb(0,0,0,0.1)] hover:bg-[var(--fill-hover)]"
                >
                  <span
                    className={clsx(
                      "truncate",
                      !selectedCategoryFilter && "text-[var(--text-tertiary)]",
                    )}
                  >
                    {selectedCategoryFilter || "Все категории"}
                  </span>
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 text-[var(--text-tertiary)] transition-transform",
                      openCategoryDropdown && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openCategoryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenCategoryDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-card shadow-[var(--elevation-highlight),0_8px_30px_rgba(0,0,0,0.12)] max-h-64 overflow-y-auto scrollbar-hide p-1.5"
                      >
                        <button
                          onClick={() => {
                            setSelectedCategoryFilter("");
                            setOpenCategoryDropdown(false);
                          }}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-control text-sm transition-colors cursor-pointer",
                            !selectedCategoryFilter
                              ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                              : "hover:bg-[var(--fill-hover)] text-[var(--text-secondary)]",
                          )}
                        >
                          Все категории
                        </button>
                        {allCategories.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setSelectedCategoryFilter(c);
                              setOpenCategoryDropdown(false);
                            }}
                            className={clsx(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-control text-sm transition-colors mt-0.5 cursor-pointer",
                              selectedCategoryFilter === c
                                ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                                : "hover:bg-[var(--fill-hover)] text-[var(--text-secondary)]",
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Grid View */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-[80px] md:pb-0">
            {filteredData.map((month) => (
              <MonthCard
                key={month.monthId}
                month={month}
                onClick={() => setSelectedMonthId(month.monthId)}
                onDeleteClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMonthClick(month.monthId);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center pb-[100px] md:pb-12 animate-fade-down bg-white dark:bg-[var(--surface-1)] rounded-card border border-[var(--border-hairline)] shadow-sm">
            <div className="w-16 h-16 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">
              Ничего не найдено
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-[280px]">
              Попробуйте изменить параметры поиска или фильтрации
            </p>
          </div>
        )}
        
        {/* Month Details Modal */}
        <Modal
          isOpen={!!selectedMonthId}
          onClose={() => setSelectedMonthId(null)}
          title={selectedMonth ? capitalize(formatMonthId(selectedMonth.monthId)) : ""}
          isBottomSheet={true}
          size="wide"
        >
          {selectedMonth && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                  Банки в этом месяце
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedMonth.entries.map((entry) => {
                    let bank = getBankDetails(entry.bankId, entry.customBankName);
                    if (!bank && entry.bankId.startsWith('custom_')) {
                      bank = allCustomBanks.find(b => b.id === entry.bankId);
                    }
                    if (!bank) {
                      bank = {
                        id: entry.bankId,
                        name: entry.customBankName || 'Удаленный банк',
                        color: entry.customBankColor || '#64748b',
                        logoText: entry.customBankLogoText || (entry.customBankName || 'Б').substring(0, 2).toUpperCase(),
                        logoUrl: entry.customLogo
                      };
                    }

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-0)] dark:bg-[var(--surface-1)] border border-[var(--border-hairline)] shadow-sm hover:border-[var(--accent-color)]/30 hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] transition-[border-color,box-shadow,background-color] duration-200 group isolate"
                      >
                        <div className="shrink-0">
                          <BankLogo 
                            bank={bank} 
                            customLogo={entry.customLogo} 
                            logoShape={globalLogoShape} 
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-[13px] text-[var(--text-primary)] truncate leading-tight group-hover:text-[var(--accent-color)] transition-colors" title={bank.name}>
                            {bank.name}
                          </h4>
                          <p className="text-[9px] font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
                            {entry.categories.length} {pluralize(entry.categories.length, ["категория", "категории", "категорий"])}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex p-1 gap-1 bg-[var(--fill)] rounded-control border border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] translate-z-0">
                  <button
                    onClick={() => handleExportImage(selectedMonth.monthId)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-95"
                    title="Изображение (PNG)"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      PNG
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportExcel(selectedMonth)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-90"
                    title="Таблица (Excel)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[var(--accent-color)] group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      Excel
                    </span>
                  </button>

                  <button
                    onClick={() => handleExport(selectedMonth.monthId)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-95"
                    title="Документ (PDF)"
                  >
                    <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      PDF
                    </span>
                  </button>
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
