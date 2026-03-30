import React, { memo, useState, useEffect } from 'react';
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
}

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
  }) => {
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
      return (
        (localStorage.getItem('table_sort_order') as 'asc' | 'desc') || 'asc'
      );
    });

    useEffect(() => {
      localStorage.setItem('table_sort_order', sortOrder);
    }, [sortOrder]);

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <span className="text-xl">🏦</span>
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            Нет данных
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Добавьте банки, чтобы увидеть таблицу кэшбека
          </p>
        </div>
      );
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

    return (
      <div
        id={id}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 sm:p-4 w-full mx-auto overflow-hidden relative transition-all duration-500"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex-1 text-left">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap flex items-center justify-start gap-1">
                <span className="text-[var(--accent-color)]">
                  {capitalize(formatMonthId(monthId).split(' ')[0])}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-0.5">
                  {formatMonthId(monthId).split(' ')[1]}
                </span>
                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  className="ml-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={`Сортировка: ${sortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'}`}
                >
                  <ArrowUpDown
                    className={clsx(
                      'w-3.5 h-3.5',
                      sortOrder === 'desc'
                        ? 'text-[var(--accent-color)]'
                        : 'text-gray-400',
                    )}
                  />
                </button>
              </h2>
            </div>

            <div className="flex items-center gap-0.5 shrink-0 [.pdf-export-mode_&]:hidden">
              {onExportImage && (
                <button
                  onClick={onExportImage}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  title="Изображение (PNG)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}
              {onExportExcel && (
                <button
                  onClick={onExportExcel}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  title="Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              )}
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  title="PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {entries.map((entry) => {
              const bank =
                getBankDetails(entry.bankId, entry.customBankName) ||
                (entry.bankId.startsWith('custom_')
                  ? customBanks.find((b) => b.id === entry.bankId)
                  : null);

              if (!bank) return null;

              const logoShape = globalLogoShape || 'circle';

              const sortedCategories =
                sortOrder === 'asc'
                  ? sortCategoriesAsc(entry.categories)
                  : sortCategoriesDesc(entry.categories);

              return (
                <div
                  key={entry.id}
                  className="flex flex-row items-stretch gap-2 p-1.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:border-[var(--accent-color)] transition-all duration-300 group"
                  role="row"
                  aria-label={`Банк ${bank.name}`}
                >
                  <div className="flex flex-col items-center justify-center gap-1 w-[76px] sm:w-[84px] shrink-0 border-r border-gray-200/60 dark:border-gray-700/60 pr-2">
                    <BankLogo
                      bank={bank}
                      customLogo={entry.customLogo}
                      logoShape={logoShape}
                      size="md"
                    />
                    <span className="text-[8px] sm:text-[9px] font-bold text-center text-gray-700 dark:text-gray-300 uppercase tracking-tight leading-tight w-full break-words">
                      {formatBankName(bank.name)}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center flex-1 py-0.5 min-w-0">
                    <div className="flex flex-col bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded shadow-sm overflow-hidden w-full">
                      {sortedCategories.map((cat, idx, arr) => {
                        const name = typeof cat === 'string' ? cat : cat.name;
                        const percent =
                          typeof cat === 'string' ? '' : cat.percent;

                        return (
                          <div
                            key={idx}
                            className={clsx(
                              'flex items-center justify-between text-[11px] font-semibold text-gray-800 dark:text-gray-200 px-2 py-1',
                              idx !== arr.length - 1 &&
                                'border-b border-gray-100 dark:border-gray-700/60',
                            )}
                          >
                            <span className="leading-tight truncate pr-4 flex-1">
                              {formatCategoryName(name)}
                            </span>
                            {percent && (
                              <span className="text-[var(--percent-text)] font-extrabold bg-[var(--percent-bg)] px-1.5 py-0.5 rounded-[4px] text-[10px] shrink-0 leading-none">
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
          </div>

          <div className="hidden [.pdf-export-mode_&]:flex mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 justify-between items-center text-[9px] text-gray-400 dark:text-gray-500">
            <span>Сгенерировано в приложении Cashback Tracker</span>
            <span>{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    );
  },
);
