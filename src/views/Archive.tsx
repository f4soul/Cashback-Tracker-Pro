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
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по банку или категории..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95",
              showFilters || selectedBankFilter || selectedCategoryFilter
                ? "bg-[var(--accent-color)] border-[var(--accent-color)] shadow-md shadow-[var(--accent-color)]/20 text-white"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-white/10 animate-in fade-in slide-in-from-top-2">
            {/* Bank Filter Dropdown */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Фильтр по банку</label>
              <button
                onClick={() => {
                  setOpenBankDropdown(!openBankDropdown);
                  setOpenCategoryDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all cursor-pointer shadow-inner"
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

              <AnimatePresence>
                {openBankDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenBankDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 z-20 bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-white/10 backdrop-blur-2xl rounded-2xl shadow-xl max-h-64 overflow-y-auto scrollbar-hide p-1.5"
                    >
                      <button
                        onClick={() => { setSelectedBankFilter(''); setOpenBankDropdown(false); }}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                          !selectedBankFilter ? "bg-[var(--percent-bg)] text-[var(--accent-color)]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
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
                            selectedBankFilter === b.id ? "bg-[var(--percent-bg)] text-[var(--accent-color)]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
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
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Фильтр по категории</label>
              <button
                onClick={() => {
                  setOpenCategoryDropdown(!openCategoryDropdown);
                  setOpenBankDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all cursor-pointer shadow-inner"
              >
                <span className={clsx("truncate", !selectedCategoryFilter && "text-gray-400")}>
                  {selectedCategoryFilter || "Все категории"}
                </span>
                <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", openCategoryDropdown && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenCategoryDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 z-20 bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-white/10 backdrop-blur-2xl rounded-2xl shadow-xl max-h-64 overflow-y-auto scrollbar-hide p-1.5"
                    >
                      <button
                        onClick={() => { setSelectedCategoryFilter(''); setOpenCategoryDropdown(false); }}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                          !selectedCategoryFilter ? "bg-[var(--percent-bg)] text-[var(--accent-color)]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
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
                            selectedCategoryFilter === c ? "bg-[var(--percent-bg)] text-[var(--accent-color)]" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
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

      {/* Results */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Ничего не найдено</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Попробуйте изменить параметры поиска или фильтры</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredData.map(month => {
            const isExpanded = expandedMonths.has(month.monthId);
            return (
              <div key={month.monthId} className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm overflow-hidden translate-z-0 [backface-visibility:hidden] isolate">
                <div
                  onClick={() => toggleMonth(month.monthId)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm">
                      {month.monthId.split('-')[1]}
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                        {capitalize(formatMonthId(month.monthId))}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{month.entries.length} {month.entries.length === 1 ? 'банк' : month.entries.length < 5 ? 'банка' : 'банков'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMonthClick(month.monthId);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all cursor-pointer active:scale-90"
                      title="Удалить месяц"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
                
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden translate-z-0 will-change-[height,opacity] isolate"
                        >
                          <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 translate-z-0">
                            {/* Compact banks list in Archive */}
                            <div className="flex flex-col gap-2 mb-4 sm:mb-6 mt-4 sm:mt-6">
                              <div className="px-1">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Банки в этом месяце</h4>
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                {month.entries.map(entry => {
                                  const bank = getBankDetails(entry.bankId, entry.customBankName) || 
                                             (entry.bankId.startsWith('custom_') ? customBanks.find(b => b.id === entry.bankId) : null);
                                  
                                  if (!bank) return null;
                                  
                                  const logoShape = globalLogoShape || 'circle';
                                  
                                  return (
                                    <motion.div 
                                      key={entry.id} 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[var(--accent-color)]/30 transition-all group translate-z-0 [backface-visibility:hidden] isolate"
                                    >
                                      <div className="shrink-0">
                                        <BankLogo 
                                          bank={bank} 
                                          customLogo={entry.customLogo} 
                                          logoShape={logoShape} 
                                          size="sm"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-tight group-hover:text-[var(--accent-color)] transition-colors" title={bank.name}>{bank.name}</h4>
                                        <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                          {entry.categories.length} {pluralize(entry.categories.length, ['категория', 'категории', 'категорий'])}
                                        </p>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex p-0.5 bg-slate-100/50 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-white/10 mb-4 translate-z-0">
                              <button 
                                onClick={() => handleExportImage(month.monthId)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm transition-all group cursor-pointer active:scale-95"
                                title="Изображение (PNG)"
                              >
                                <ImageIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">PNG</span>
                              </button>

                              <button 
                                onClick={() => handleExportExcel(month)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm transition-all group cursor-pointer border-x border-slate-200/50 dark:border-white/10 active:scale-90"
                                title="Таблица (Excel)"
                              >
                                <FileSpreadsheet className="w-4 h-4 text-[var(--accent-color)] group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Excel</span>
                              </button>

                              <button 
                                onClick={() => handleExport(month.monthId)}
                                className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm transition-all group cursor-pointer active:scale-95"
                                title="Документ (PDF)"
                              >
                                <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform mb-0.5" />
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">PDF</span>
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
                        </motion.div>
                      )}
                    </AnimatePresence>
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
