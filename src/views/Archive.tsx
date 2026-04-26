import React, { useState, useMemo, useCallback, memo } from 'react';
import { MonthData, Bank, LogoShape } from '../types';
import { formatMonthId, capitalize } from '../utils/date';
import { pluralize } from '../utils/format';
import { CashbackTable } from '../components/CashbackTable';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { exportToPDF, exportToExcel, exportToImage } from '../utils/export';
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Search, Filter, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { BANKS, COMMON_CATEGORIES, getBankDetails } from '../constants';
import { BankLogo } from '../components/BankLogo';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface ArchiveProps {
  allData: MonthData[];
  customBanks: Bank[];
  customCategories: string[];
  onDeleteEntry: (monthId: string, entryId: string) => void;
  onDeleteMonth: (monthId: string) => void;
  globalLogoShape: LogoShape;
}

export const Archive: React.FC<ArchiveProps> = memo(({ allData, customBanks, customCategories, onDeleteEntry, onDeleteMonth, globalLogoShape }) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set<string>());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [openBankDropdown, setOpenBankDropdown] = useState(false);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);

  const allBanks = useMemo(() => [...BANKS, ...customBanks], [customBanks]);
  const allCategories = useMemo(() => Array.from(new Set([...COMMON_CATEGORIES, ...customCategories])), [customCategories]);

  // Filter the data
  const filteredData = useMemo(() => {
    return allData.map(month => {
      // Filter entries within the month
      const filteredEntries = month.entries.filter(entry => {
        let bank = getBankDetails(entry.bankId, entry.customBankName);
        if (!bank && entry.bankId.startsWith('custom_')) {
          bank = customBanks.find(b => b.id === entry.bankId);
        }
        
        // Bank filter
        if (selectedBankFilter && entry.bankId !== selectedBankFilter) return false;
        
        // Category filter
        if (selectedCategoryFilter && !entry.categories.some(c => {
          const name = typeof c === 'string' ? c : c.name;
          return name === selectedCategoryFilter;
        })) return false;
        
        // Search query (checks bank name and categories)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesBank = bank?.name.toLowerCase().includes(q);
          const matchesCategory = entry.categories.some(c => {
            const name = typeof c === 'string' ? c : c.name;
            return name.toLowerCase().includes(q);
          });
          if (!matchesBank && !matchesCategory) return false;
        }
        
        return true;
      });

      return { ...month, entries: filteredEntries };
    }).filter(month => month.entries.length > 0); // Only keep months that have matching entries
  }, [allData, searchQuery, selectedBankFilter, selectedCategoryFilter, customBanks]);

  const toggleMonth = useCallback((monthId: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthId)) {
        next.delete(monthId);
      } else {
        next.add(monthId);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback((monthId: string) => {
    exportToPDF(`archive-table-${monthId}`, `Кэшбек_${monthId}.pdf`);
  }, []);

  const handleExportImage = useCallback((monthId: string) => {
    exportToImage(`archive-table-${monthId}`, `Кэшбек_${monthId}.png`);
  }, []);

  const handleExportExcel = useCallback((month: MonthData) => {
    exportToExcel(month, customBanks, `Кэшбек_${month.monthId}.xlsx`);
  }, [customBanks]);

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

  const shapeClasses = {
    circle: 'w-10 h-10 rounded-full',
    square: 'w-10 h-10 rounded-[22%]',
    rectangle: 'w-10 h-14 rounded-[15%]'
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по банку или категории..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "p-2 rounded-xl border transition-colors flex items-center justify-center cursor-pointer",
              showFilters || selectedBankFilter || selectedCategoryFilter
                ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2">
            {/* Bank Filter Dropdown */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Фильтр по банку</label>
              <button
                onClick={() => {
                  setOpenBankDropdown(!openBankDropdown);
                  setOpenCategoryDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {selectedBankFilter ? (
                    <>
                      <BankLogo 
                        bank={allBanks.find(b => b.id === selectedBankFilter)!} 
                        logoShape={globalLogoShape} 
                        size="sm"
                      />
                      <span className="truncate">{allBanks.find(b => b.id === selectedBankFilter)?.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Все банки</span>
                  )}
                </div>
                <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", openBankDropdown && "rotate-180")} />
              </button>

              <>
                {openBankDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenBankDropdown(false)} />
                    <div
                      className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto scrollbar-hide p-1.5 transform-gpu"
                    >
                      <button
                        onClick={() => { setSelectedBankFilter(''); setOpenBankDropdown(false); }}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                          !selectedBankFilter ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                          <Filter className="w-3 h-3" />
                        </div>
                        Все банки
                      </button>
                      {allBanks.map(b => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBankFilter(b.id); setOpenBankDropdown(false); }}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors mt-0.5 cursor-pointer",
                            selectedBankFilter === b.id ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
                    </div>
                  </>
                )}
              </>
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Фильтр по категории</label>
              <button
                onClick={() => {
                  setOpenCategoryDropdown(!openCategoryDropdown);
                  setOpenBankDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all cursor-pointer"
              >
                <span className={clsx("truncate", !selectedCategoryFilter && "text-gray-400")}>
                  {selectedCategoryFilter || "Все категории"}
                </span>
                <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", openCategoryDropdown && "rotate-180")} />
              </button>

              <>
                {openCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenCategoryDropdown(false)} />
                    <div
                      className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto scrollbar-hide p-1.5 transform-gpu"
                    >
                      <button
                        onClick={() => { setSelectedCategoryFilter(''); setOpenCategoryDropdown(false); }}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                          !selectedCategoryFilter ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        Все категории
                      </button>
                      {allCategories.map(c => (
                        <button
                          key={c}
                          onClick={() => { setSelectedCategoryFilter(c); setOpenCategoryDropdown(false); }}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors mt-0.5 cursor-pointer",
                            selectedCategoryFilter === c ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Ничего не найдено</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска или фильтры</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredData.map(month => {
            const isExpanded = expandedMonths.has(month.monthId);
            return (
              <div key={month.monthId} className="bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div
                  onClick={() => toggleMonth(month.monthId)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                      {month.monthId.split('-')[1]}
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize leading-tight truncate">{formatMonthId(month.monthId)}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{month.entries.length} {month.entries.length === 1 ? 'банк' : month.entries.length < 5 ? 'банка' : 'банков'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMonthClick(month.monthId);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all cursor-pointer"
                      title="Удалить месяц"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="p-1 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
                
                    <>
                      {isExpanded && (
                        <div 
                          className="overflow-hidden transform-gpu"
                        >
                          <div className="p-4 sm:p-5 pt-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                            {/* Compact banks list in Archive */}
                            <div className="flex flex-col gap-2 mb-4 sm:mb-6 mt-4 sm:mt-6">
                              <div className="px-1">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Банки в этом месяце</h4>
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                {month.entries.map(entry => {
                                  const bank = getBankDetails(entry.bankId, entry.customBankName) || 
                                             (entry.bankId.startsWith('custom_') ? customBanks.find(b => b.id === entry.bankId) : null);
                                  
                                  if (!bank) return null;
                                  
                                  const logoShape = globalLogoShape || 'circle';
                                  
                                  return (
                                    <div 
                                      key={entry.id} 
                                      className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 bg-white dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all group"
                                    >
                                      <div className="shrink-0 bg-transparent flex items-center justify-center">
                                        <BankLogo 
                                          bank={bank} 
                                          customLogo={entry.customLogo} 
                                          logoShape={logoShape} 
                                          size="sm"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 bg-transparent">
                                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate leading-tight group-hover:text-[var(--accent-color)] transition-colors" title={bank.name}>{bank.name}</h4>
                                        <p className="text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                                          {entry.categories.length} {pluralize(entry.categories.length, ['категория', 'категории', 'категорий'])}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex p-0.5 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 mb-4">
                              <button 
                                onClick={() => handleExportImage(month.monthId)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer"
                                title="Изображение (PNG)"
                              >
                                <ImageIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">PNG</span>
                              </button>

                              <button 
                                onClick={() => handleExportExcel(month)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer border-x border-gray-100 dark:border-gray-800"
                                title="Таблица (Excel)"
                              >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Excel</span>
                              </button>

                              <button 
                                onClick={() => handleExport(month.monthId)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer"
                                title="Документ (PDF)"
                              >
                                <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">PDF</span>
                              </button>
                            </div>
                            <CashbackTable 
                              id={`archive-table-${month.monthId}`} 
                              monthId={month.monthId} 
                              entries={month.entries} 
                              customBanks={customBanks}
                              globalLogoShape={globalLogoShape}
                              onExportPDF={() => handleExport(month.monthId)}
                              onExportExcel={() => handleExportExcel(month)}
                              onExportImage={() => handleExportImage(month.monthId)}
                            />
                          </div>
                        </div>
                      )}
                    </>
              </div>
            );
          })}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMonth}
        title="Удалить месяц из архива?"
        message={`Вы уверены, что хотите удалить ${monthToDelete ? formatMonthId(monthToDelete) : 'этот месяц'} из истории? Это действие нельзя отменить.`}
        confirmText="Удалить"
        variant="danger"
      />
    </div>
  );
});
