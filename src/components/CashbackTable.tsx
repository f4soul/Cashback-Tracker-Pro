import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import { motion, AnimatePresence } from "motion/react";
import React, { memo, useState, useEffect, useMemo } from "react";
import { CashbackEntry, Bank, LogoShape } from "../types";
import { getBankDetails } from "../constants";
import { capitalize, formatMonthId } from "../utils/date";
import { formatPercentValue } from "../utils/format";
import { BankLogo } from "./BankLogo";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ArrowUpDown,
  Landmark,
  Table as TableIcon,
  LayoutList,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import { sortCategoriesAsc, sortCategoriesDesc } from "../utils/sorting";
import { preloadExportModule } from "../utils/export";

interface CashbackTableProps {
  monthId: string;
  entries: CashbackEntry[];
  id?: string;
  customBanks?: Bank[];
  globalLogoShape: LogoShape;
  onExportPDF?: () => void | Promise<void>;
  onExportExcel?: () => void | Promise<void>;
  onExportImage?: () => void | Promise<void>;
  selectedMonthId?: string;
  onMonthChange?: (monthId: string) => void;
  allMonthIds?: string[];
  isAfter25?: boolean;
  activeSubTab?: "table" | "list";
  onSubTabChange?: (tab: "table" | "list") => void;
  onAddBank?: () => void;
  listViewContent?: React.ReactNode;
}

const formatCategoryName = (name: string) => {
  return name.replace(/[-]/g, " ");
};

const formatBankName = (name: string) => {
  if (name.includes(" ") || name.includes("-")) {
    return name.replace(/-/g, " ");
  }
  return name;
};

export const CashbackTable: React.FC<CashbackTableProps> = memo(
  ({
    monthId,
    entries,
    id = "cashback-table",
    customBanks = [],
    globalLogoShape,
    onExportPDF,
    onExportExcel,
    onExportImage,
    selectedMonthId,
    onMonthChange,
    allMonthIds = [],
    isAfter25 = false,
    activeSubTab,
    onSubTabChange,
    onAddBank,
    listViewContent,
  }) => {
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
      return (
        (localStorage.getItem("table_sort_order") as "asc" | "desc") || "asc"
      );
    });

    useEffect(() => {
      localStorage.setItem("table_sort_order", sortOrder);
    }, [sortOrder]);

    const sortedEntries = useMemo(() => {
      return entries.map((entry) => {
        const sortedCategories =
          sortOrder === "asc"
            ? sortCategoriesAsc(entry.categories)
            : sortCategoriesDesc(entry.categories);
        return { ...entry, sortedCategories };
      });
    }, [entries, sortOrder]);

    const isListMode = activeSubTab === "list";

    return (
      <div
        id={id}
        className="bg-white dark:bg-[var(--surface-1)] rounded-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] border border-[var(--border-hairline)] p-2 sm:p-4 w-full mx-auto overflow-hidden relative isolate"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between px-0.5 mb-3 sm:mb-4 gap-2 flex-nowrap">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
              {isAfter25 && allMonthIds.length > 1 ? (
                <>
                  <div className="flex items-center lg:h-8 bg-[var(--fill)] rounded-control p-0.5 shrink-0 [.pdf-export-mode_&]:hidden border border-[var(--border-hairline)] shadow-sm translate-z-0 [backface-visibility:hidden]">
                    {allMonthIds.map((mId) => (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => onMonthChange?.(mId)}
                        className={clsx(
                          "px-2.5 py-1 lg:h-full lg:px-3 lg:py-0 rounded-[max(6px,calc(var(--radius-sm)-2px))] text-[10px] lg:text-xs font-semibold leading-none inline-flex items-center justify-center transition-[background-color,color,box-shadow] cursor-pointer whitespace-nowrap",
                          (selectedMonthId || monthId) === mId
                            ? "bg-[var(--accent-color)] text-white shadow-sm"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        {capitalize(formatMonthId(mId).split(" ")[0])}
                      </button>
                    ))}
                  </div>
                  <h2 className="hidden [.pdf-export-mode_&]:inline-flex text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none whitespace-nowrap items-center lg:h-8">
                    <span className="text-[var(--accent-color)]">
                      {capitalize(
                        formatMonthId(selectedMonthId || monthId).split(" ")[0],
                      )}
                    </span>
                  </h2>
                </>
              ) : (
                <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none inline-flex items-center whitespace-nowrap lg:h-8">
                  <span className="text-[var(--accent-color)]">
                    {capitalize(
                      formatMonthId(selectedMonthId || monthId).split(" ")[0],
                    )}
                  </span>
                </h2>
              )}
              <span className="text-[8px] font-black uppercase tracking-widest tabular-nums text-[var(--text-secondary)] bg-white/85 dark:bg-white/5 shadow-sm border border-[var(--border-strong)] px-1 py-0.5 rounded-control shrink-0 leading-none text-center inline-flex items-center justify-center">
                {formatMonthId(selectedMonthId || monthId).split(" ")[1]}
              </span>
              <button
                type="button"
                tabIndex={isListMode ? -1 : 0}
                aria-hidden={isListMode}
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className={clsx(
                  "p-1.5 lg:w-8 lg:h-8 lg:p-0 rounded-control hover:bg-[var(--fill-hover)] transition-[background-color,color,opacity,transform] duration-200 shrink-0 [.pdf-export-mode_&]:hidden cursor-pointer inline-flex items-center justify-center active:scale-95",
                  isListMode
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100",
                )}
                title={`Сортировка: ${sortOrder === "asc" ? "по возрастанию" : "по убыванию"}`}
              >
                <ArrowUpDown
                  className={clsx(
                    "w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0",
                    sortOrder === "desc"
                      ? "text-[var(--accent-color)]"
                      : "text-[var(--text-tertiary)]",
                  )}
                />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 [.pdf-export-mode_&]:hidden ml-auto">
              <div
                aria-hidden={isListMode}
                className={clsx(
                  "flex items-center gap-0.5 lg:gap-1 transition-opacity duration-200",
                  isListMode
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100",
                )}
              >
                {onExportImage && (
                  <button
                    type="button"
                    tabIndex={isListMode ? -1 : 0}
                    onClick={onExportImage}
                    onPointerDown={() => preloadExportModule("image")}
                    className="p-1.5 lg:w-8 lg:h-8 lg:p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] rounded-control transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 active:scale-95"
                    title="Изображение (PNG)"
                  >
                    <ImageIcon className="w-4 h-4 shrink-0" />
                  </button>
                )}
                {onExportExcel && (
                  <button
                    type="button"
                    tabIndex={isListMode ? -1 : 0}
                    onClick={onExportExcel}
                    onPointerDown={() => preloadExportModule("excel")}
                    className="p-1.5 lg:w-8 lg:h-8 lg:p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] rounded-control transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 active:scale-95"
                    title="Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  </button>
                )}
                {onExportPDF && (
                  <button
                    type="button"
                    tabIndex={isListMode ? -1 : 0}
                    onClick={onExportPDF}
                    onPointerDown={() => preloadExportModule("pdf")}
                    className="p-1.5 lg:w-8 lg:h-8 lg:p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] rounded-control transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 active:scale-95"
                    title="PDF"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>

              {activeSubTab && onSubTabChange && (
                <div className="hidden lg:flex items-center lg:h-8 bg-[var(--fill)] rounded-control p-0.5 shrink-0 border border-[var(--border-hairline)] shadow-sm translate-z-0 [backface-visibility:hidden]">
                  <button
                    type="button"
                    onClick={() => onSubTabChange("table")}
                    className={clsx(
                      "px-2.5 py-1 lg:h-full lg:px-3 lg:py-0 rounded-[max(6px,calc(var(--radius-sm)-2px))] text-[10px] lg:text-xs font-semibold leading-none inline-flex items-center justify-center gap-1.5 transition-[background-color,color,box-shadow] duration-200 cursor-pointer whitespace-nowrap",
                      activeSubTab === "table"
                        ? "bg-[var(--accent-color)] text-white shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                    )}
                    title="Таблица"
                  >
                    <TableIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                    <span className="leading-none">Таблица</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubTabChange("list")}
                    className={clsx(
                      "px-2.5 py-1 lg:h-full lg:px-3 lg:py-0 rounded-[max(6px,calc(var(--radius-sm)-2px))] text-[10px] lg:text-xs font-semibold leading-none inline-flex items-center justify-center gap-1.5 transition-[background-color,color,box-shadow] duration-200 cursor-pointer whitespace-nowrap",
                      activeSubTab === "list"
                        ? "bg-[var(--accent-color)] text-white shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                    )}
                    title="Список банков"
                  >
                    <LayoutList className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                    <span className="leading-none">Список банков</span>
                  </button>
                </div>
              )}

              {onAddBank && (
                <button
                  type="button"
                  onClick={onAddBank}
                  className="hidden xl:inline-flex w-8 h-8 rounded-control bg-[var(--accent-color)] text-white shadow-sm shadow-[var(--accent-color)]/25 hover:brightness-110 active:scale-95 transition-[filter,transform] cursor-pointer items-center justify-center shrink-0"
                  title="Добавить банк"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isListMode && listViewContent ? (
              <motion.div
                key={`list-${monthId}`}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {listViewContent}
              </motion.div>
            ) : entries.length === 0 ? (
              <motion.div
                key={`empty-${monthId}`}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-1)] rounded-card border border-dashed border-[var(--border-strong)]"
              >
                <div className="w-16 h-16 bg-[var(--surface-2)] rounded-control border border-[var(--border-strong)] flex items-center justify-center mb-4">
                  <Landmark className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  Нет данных
                </h3>
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Добавьте банки и категории кэшбека, чтобы увидеть таблицу
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`table-${monthId}`}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-1"
              >
                {sortedEntries.map((entry) => {
                  const bank = getBankDetails(
                    entry.bankId,
                    entry.customBankName,
                  ) ||
                    (entry.bankId.startsWith("custom_")
                      ? customBanks.find((b) => b.id === entry.bankId)
                      : null) || {
                      id: entry.bankId,
                      name: entry.customBankName || "Удаленный банк",
                      color: entry.customBankColor || "#64748b",
                      logoText:
                        entry.customBankLogoText ||
                        (entry.customBankName || "Б")
                          .substring(0, 2)
                          .toUpperCase(),
                      logoUrl: entry.customLogo || DEFAULT_BANK_LOGO,
                    };

                  const logoShape = globalLogoShape || "circle";
                  const totalCategories = entry.sortedCategories.length;

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-row items-stretch gap-2 p-1.5 rounded-control bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] hover:bg-[var(--fill-hover)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] transition-[background-color,border-color,box-shadow] duration-200 group isolate"
                      role="row"
                      aria-label={`Банк ${bank.name}`}
                    >
                    <div className="flex flex-col items-center justify-center gap-1 w-[76px] sm:w-[84px] shrink-0 border-r border-[var(--border-hairline)] pr-2">
                      <BankLogo
                        bank={bank}
                        customLogo={entry.customLogo}
                        logoShape={logoShape}
                        size="md"
                      />
                      <span className="text-[8px] sm:text-[9px] font-semibold text-center text-[var(--text-secondary)] leading-tight w-full break-words">
                        {formatBankName(bank.name)}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center flex-1 py-0.5 min-w-0">
                      <div
                        className={clsx(
                          "grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6 w-full relative",
                          totalCategories > 1 &&
                            "lg:before:content-[''] lg:before:absolute lg:before:inset-y-1 lg:before:left-1/2 lg:before:-translate-x-1/2 lg:before:w-px lg:before:bg-[var(--border-hairline)]",
                        )}
                      >
                        {entry.sortedCategories.map((cat, idx) => {
                          const name = typeof cat === "string" ? cat : cat.name;
                          const percent =
                            typeof cat === "string"
                              ? ""
                              : formatPercentValue(cat.percent);

                          const isLastMobile = idx === totalCategories - 1;
                          // В 2-колоночной сетке (lg:) элемент находится в последнем ряду своей колонки, если под ним нет элемента (idx + 2 >= totalCategories)
                          const isLastInDesktopColumn =
                            idx + 2 >= totalCategories;

                          return (
                            <div
                              key={idx}
                              className={clsx(
                                "flex items-center justify-between text-[11px] lg:text-xs font-semibold text-[var(--text-primary)] px-2.5 py-1.5 translate-z-0",
                                !isLastMobile &&
                                  "border-b border-[var(--border-hairline)]",
                                isLastInDesktopColumn && "lg:border-b-0",
                              )}
                            >
                              <span className="leading-tight truncate pr-4 flex-1">
                                {formatCategoryName(name)}
                              </span>
                              {percent && (
                                <span className="text-[var(--percent-text)] font-semibold tabular-nums bg-[var(--percent-bg)] px-1.5 py-0.5 rounded-[min(6px,var(--radius-sm))] text-[10px] shrink-0 leading-none inline-flex items-center justify-center translate-z-0 [backface-visibility:hidden]">
                                  {percent}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden [.pdf-export-mode_&]:flex mt-4 pt-3 border-t border-[var(--border-hairline)] justify-between items-center text-[9px] text-[var(--text-tertiary)]">
            <span>Сгенерировано в приложении Cashback Tracker</span>
            <span>{new Date().toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </div>
    );
  },
);

