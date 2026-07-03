import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import React, { memo, useState, useEffect, useMemo } from 'react';
import { CashbackEntry, Bank, LogoShape } from '../types';
import { getBankDetails } from '../constants';
import { capitalize, formatMonthId } from '../utils/date';
import { BankLogo } from './BankLogo';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ArrowUpDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { sortCategoriesAsc, sortCategoriesDesc } from '../utils/sorting';

interface CashbackTableProps {
  monthId: string;
  entries: CashbackEntry[];
  id?: string;
  customBanks?: Bank[];
  globalLogoShape: LogoShape;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportImage?: () => void;
  selectedMonthId?: string;
  onMonthChange?: (monthId: string) => void;
  allMonthIds?: string[];
  isAfter25?: boolean;
}

const formatCategoryName = (name: string) => {
  return name.replace(/[-]/g, ' ');
};

const formatBankName = (name: string) => {
  if (name.includes(' ') || name.includes('-')) {
    return name.replace(/-/g, ' ');
  }
  return name;
};

export const CashbackTable: React.FC<CashbackTableProps> = memo(
  ({
    monthId,
    entries,
    id = 'cashback-table',
    customBanks = [],
    globalLogoShape,
    onExportPDF,
    onExportExcel,
    onExportImage,
    selectedMonthId,
    onMonthChange,
    allMonthIds = [],
    isAfter25 = false,
  }) => {
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
      return (
        (localStorage.getItem('table_sort_order') as 'asc' | 'desc') || 'asc'
      );
    });

    useEffect(() => {
      localStorage.setItem('table_sort_order', sortOrder);
    }, [sortOrder]);

    const sortedEntries = useMemo(() => {
      return entries.map((entry) => {
        const sortedCategories =
          sortOrder === 'asc'
            ? sortCategoriesAsc(entry.categories)
            : sortCategoriesDesc(entry.categories);
        return { ...entry, sortedCategories };
      });
    }, [entries, sortOrder]);

    return (
      <div
        id={id}
        className="bg-white dark:bg-[var(--surface-0)] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-[var(--border-hairline)] p-2 sm:p-4 w-full mx-auto overflow-hidden relative isolate"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              {isAfter25 && allMonthIds.length > 1 ? (
                <>
                  <div className="flex bg-[var(--surface-0)] dark:bg-[var(--surface-1)] rounded-3xl p-0.5 shrink-0 [.pdf-export-mode_&]:hidden border border-slate-100 dark:border-[var(--border-hairline)] shadow-sm translate-z-0 [backface-visibility:hidden]">
                    {allMonthIds.map((mId) => (
                      <button
                        key={mId}
                        onClick={() => onMonthChange?.(mId)}
                        className={clsx(
                          'px-3 py-1 rounded-xl text-[10px] font-black tracking-widest transition-all cursor-pointer',
                          (selectedMonthId || monthId) === mId
                            ? 'bg-[var(--accent-color)] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-[var(--text-primary)]',
                        )}
                      >
                        {capitalize(formatMonthId(mId).split(' ')[0])}
                      </button>
                    ))}
                  </div>
                  <h2 className="hidden [.pdf-export-mode_&]:block text-lg font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    <span className="text-[var(--accent-color)]">
                      {capitalize(
                        formatMonthId(selectedMonthId || monthId).split(' ')[0],
                      )}
                    </span>
                  </h2>
                </>
              ) : (
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap flex items-center justify-start gap-1">
                  <span className="text-[var(--accent-color)]">
                    {capitalize(formatMonthId(monthId).split(' ')[0])}
                  </span>
                </h2>
              )}
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 dark:text-[var(--text-secondary)] bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-[var(--border-strong)] px-2.5 py-1 rounded-xl shrink-0 translate-y-[1px] leading-none text-center flex items-center justify-center">
                {formatMonthId(monthId).split(' ')[1]}
              </span>
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 [.pdf-export-mode_&]:hidden cursor-pointer"
                title={`Сортировка: ${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'}`}
              >
                <ArrowUpDown
                  className={clsx(
                    'w-3.5 h-3.5',
                    sortOrder === 'desc'
                      ? 'text-[var(--accent-color)]'
                      : 'text-slate-400',
                  )}
                />
              </button>
            </div>

            <div className="flex items-center gap-0.5 shrink-0 [.pdf-export-mode_&]:hidden">
              {onExportImage && (
                <button
                  onClick={onExportImage}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Изображение (PNG)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}
              {onExportExcel && (
                <button
                  onClick={onExportExcel}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              )}
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-0)] dark:bg-[var(--surface-1)] rounded-3xl border border-dashed border-slate-200 dark:border-[var(--border-strong)]">
              <div className="w-16 h-16 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-[var(--border-strong)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center mb-4">
                <span className="text-3xl drop-shadow-sm opacity-90">🏦</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                Нет данных
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-[var(--text-secondary)]">
                Добавьте банки и категории кэшбека, чтобы увидеть таблицу
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <LayoutGroup>
                {sortedEntries.map((entry) => {
                  const bank =
                    getBankDetails(entry.bankId, entry.customBankName) ||
                    (entry.bankId.startsWith('custom_')
                      ? customBanks.find((b) => b.id === entry.bankId)
                      : null) ||
                    {
                      id: entry.bankId,
                      name: entry.customBankName || 'Удаленный банк',
                      color: entry.customBankColor || '#64748b',
                      logoText: entry.customBankLogoText || (entry.customBankName || 'Б').substring(0, 2).toUpperCase(),
                      logoUrl: entry.customLogo
                    };

                  const logoShape = globalLogoShape || 'circle';

                  return (
                    <motion.div
                      layout="position"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      key={entry.id}
                      className="flex flex-row items-stretch gap-2 p-1.5 rounded-2xl bg-[var(--surface-0)] dark:bg-[var(--surface-1)] border border-slate-100 dark:border-[var(--border-hairline)] hover:bg-white dark:hover:bg-[var(--surface-2)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] hover:border-slate-200/50 dark:hover:border-white/10 transition-[background-color,border-color,box-shadow] duration-200 group isolate"
                      role="row"
                      aria-label={`Банк ${bank.name}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 w-[76px] sm:w-[84px] shrink-0 border-r border-slate-100 dark:border-[var(--border-hairline)] pr-2">
                      <BankLogo
                        bank={bank}
                        customLogo={entry.customLogo}
                        logoShape={logoShape}
                        size="md"
                      />
                      <span className="text-[8px] sm:text-[9px] font-black text-center text-slate-700 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-tight w-full break-words">
                        {formatBankName(bank.name)}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center flex-1 py-0.5 min-w-0">
                      <div className="flex flex-col bg-white dark:bg-[var(--surface-2)] border border-slate-100 dark:border-[var(--border-hairline)] rounded-lg shadow-sm overflow-hidden w-full">
                        {entry.sortedCategories.map((cat, idx, arr) => {
                          const name = typeof cat === 'string' ? cat : cat.name;
                          const percent =
                            typeof cat === 'string' ? '' : cat.percent;

                          return (
                            <div
                              key={idx}
                              className={clsx(
                                'flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 px-2 py-1 translate-z-0',
                                idx !== arr.length - 1 &&
                                  'border-b border-slate-100 dark:border-white/[0.04]',
                              )}
                            >
                              <span className="leading-tight truncate pr-4 flex-1">
                                {formatCategoryName(name)}
                              </span>
                              {percent && (
                                <span className="text-[var(--percent-text)] font-bold bg-[var(--percent-bg)] px-1.5 py-0.5 rounded-[4px] text-[10px] shrink-0 leading-none translate-z-0 [backface-visibility:hidden]">
                                  {percent}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </LayoutGroup>
            </div>
          )}

          <div className="hidden [.pdf-export-mode_&]:flex mt-4 pt-3 border-t border-gray-100 dark:border-[var(--border-hairline)] justify-between items-center text-[9px] text-gray-400 dark:text-[var(--text-tertiary)]">
            <span>Сгенерировано в приложении Cashback Tracker</span>
            <span>{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    );
  },
);
