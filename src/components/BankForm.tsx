import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { Bank, CashbackEntry, CategoryItem, LogoShape } from '../types';
import { BANKS, COMMON_CATEGORIES, getBankDetails } from '../constants';
import { BankLogo } from './BankLogo';
import { Check, Plus, Search, Upload, X, Crop, Circle, Square, Squircle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { ConfirmModal } from './ui/ConfirmModal';

interface BankFormProps {
  initialEntry?: CashbackEntry;
  customBanks: Bank[];
  customCategories: string[];
  onSave: (entry: Omit<CashbackEntry, 'id'>) => void;
  onCancel: () => void;
  onAddCustomBank: (bank: Bank) => void;
  onDeleteCustomBank: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
  globalLogoShape: LogoShape;
}

import { sortCategoriesAsc, sortCategoriesCustom } from '../utils/sorting';

export const BankForm: React.FC<BankFormProps> = memo(({ 
  initialEntry, 
  customBanks, 
  customCategories, 
  onSave, 
  onCancel,
  onAddCustomBank,
  onDeleteCustomBank,
  onAddCustomCategory,
  globalLogoShape
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(initialEntry?.bankId || '');
  const [customBankName, setCustomBankName] = useState<string>(initialEntry?.customBankName || '');
  const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>(
    sortCategoriesAsc((initialEntry?.categories || []).map(c => typeof c === 'string' ? { name: c, percent: '' } : c)) as CategoryItem[]
  );
  const [customCategory, setCustomCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [customLogo, setCustomLogo] = useState<string | undefined>(initialEntry?.customLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm Modal state
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const allBanks = useMemo(() => [...BANKS, ...customBanks], [customBanks]);
  const filteredBanks = allBanks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const allCategories = useMemo(() => {
    const unique = new Set([...COMMON_CATEGORIES, ...customCategories]);
    return sortCategoriesCustom(Array.from(unique)) as string[];
  }, [customCategories]);
  
  const filteredCategories = allCategories.filter(c => c.toLowerCase().includes(categorySearchQuery.toLowerCase()));

  const isCustomBank = selectedBankId === 'custom';
  
  // Custom logic to get bank details including newly added custom banks
  const currentBank = useMemo(() => {
    if (isCustomBank && customBankName) {
      return {
        id: 'custom',
        name: customBankName,
        color: '#64748b',
        logoText: customBankName.charAt(0).toUpperCase(),
        logoUrl: '/logos/bank-icon.svg'
      };
    }
    return allBanks.find(b => b.id === selectedBankId);
  }, [selectedBankId, customBankName, allBanks, isCustomBank]);

  const toggleCategory = useCallback((catName: string) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.name === catName);
      if (exists) {
        return prev.filter(c => c.name !== catName);
      } else {
        return [...prev, { name: catName, percent: '' }];
      }
    });
  }, []);

  const updateCategoryPercent = useCallback((catName: string, percent: string) => {
    setSelectedCategories(prev => {
      return prev.map(c => c.name === catName ? { ...c, percent } : c);
    });
  }, []);

  const handleAddCustom = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const name = customCategory.trim();
    if (name) {
      if (!selectedCategories.find(c => c.name === name)) {
        setSelectedCategories(prev => [...prev, { name, percent: '' }]);
      }
      onAddCustomCategory(name);
      setCustomCategory('');
      setCategorySearchQuery('');
    }
  }, [customCategory, selectedCategories, onAddCustomCategory]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = useCallback(async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        setCustomLogo(croppedImage);
        setShowCropper(false);
        setImageSrc(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  const handleSave = useCallback(() => {
    if (!selectedBankId) return;
    
    const sortedCategories = sortCategoriesAsc(selectedCategories) as CategoryItem[];

    if (isCustomBank && customBankName) {
      const newBankId = `custom_${Date.now()}`;
      const bankColor = '#64748b';
      const logoTxt = customBankName.charAt(0).toUpperCase();

      onAddCustomBank({
        id: newBankId,
        name: customBankName,
        color: bankColor,
        logoText: logoTxt,
        logoUrl: '/logos/bank-icon.svg'
      });
      onSave({
        bankId: newBankId,
        customBankName,
        customBankColor: bankColor,
        customBankLogoText: logoTxt,
        customLogo,
        categories: sortedCategories,
      });
    } else {
      const activeBank = allBanks.find(b => b.id === selectedBankId);
      onSave({
        bankId: selectedBankId,
        customBankName: activeBank?.name,
        customBankColor: activeBank?.color,
        customBankLogoText: activeBank?.logoText,
        customLogo: customLogo || activeBank?.logoUrl,
        categories: sortedCategories,
      });
    }
  }, [selectedBankId, isCustomBank, customBankName, onAddCustomBank, onSave, customLogo, selectedCategories, allBanks]);

  const shapeClasses = {
    circle: 'w-10 h-10 rounded-full',
    square: 'w-10 h-10 rounded-[22%]',
    rectangle: 'w-10 h-14 rounded-[15%]'
  };

  const shapeClassesLarge = {
    circle: 'w-12 h-12 rounded-full',
    square: 'w-12 h-12 rounded-[22%]',
    rectangle: 'w-10 h-14 rounded-[15%]'
  };

  if (showCropper && imageSrc) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Обрезать логотип</h3>
          <button onClick={() => setShowCropper(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={globalLogoShape === 'rectangle' ? 10/14 : 1}
            cropShape={globalLogoShape === 'circle' ? 'round' : 'rect'}
            showGrid={true}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { backgroundColor: 'transparent' }
            }}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Масштаб</span>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
            />
          </div>
          <button
            onClick={() => setCrop({ x: 0, y: 0 })}
            className="w-full py-2 text-sm font-medium text-[var(--accent-color)] bg-[var(--percent-bg)]/50 hover:bg-[var(--percent-bg)] rounded-xl transition-colors cursor-pointer"
          >
            Центрировать
          </button>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowCropper(false)}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            onClick={handleCropSave}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[var(--accent-color)] hover:opacity-90 transition-colors shadow-sm shadow-[var(--accent-color)]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crop className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bank Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Выберите банк</label>
        {!selectedBankId ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск банка..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={clsx(
                  "w-full pl-9 py-2.5 bg-[#FAFAFA] dark:bg-[#111] border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all shadow-inner",
                  searchQuery ? "pr-10" : "pr-4"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {filteredBanks.map(bank => {
                  const isCustom = bank.id.startsWith('custom_');
                  
                  return (
                    <motion.div 
                      key={bank.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group/bank"
                    >
                      <div
                        onClick={() => setSelectedBankId(bank.id)}
                        className="w-full aspect-square flex flex-col items-center justify-center gap-1 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-white/5 hover:border-[var(--accent-color)]/50 hover:bg-[var(--percent-bg)]/30 transition-all cursor-pointer group shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] hover:shadow-md"
                      >
                        <BankLogo 
                          bank={bank} 
                          logoShape={globalLogoShape} 
                          size="md"
                        />
                        <div className="flex items-center justify-center w-full px-0.5">
                          <span className="text-[9px] sm:text-[10px] font-bold text-center text-gray-600 dark:text-gray-400 uppercase tracking-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors break-words leading-tight line-clamp-2" title={bank.name}>{bank.name}</span>
                        </div>
                      </div>
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBankToDelete(bank.id);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/bank:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {filteredBanks.length === 0 && searchQuery.trim() && (
              <button
                onClick={() => {
                  setSelectedBankId('custom');
                  setCustomBankName(searchQuery.trim());
                }}
                className="w-full p-4 border border-dashed border-[var(--accent-color)]/30 bg-[var(--accent-color)]/5 rounded-2xl text-[var(--accent-color)] font-medium hover:bg-[var(--percent-bg)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Добавить банк "{searchQuery.trim()}"
              </button>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 p-3 rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--percent-bg)]/20 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <BankLogo 
                    bank={currentBank!} 
                    customLogo={customLogo} 
                    logoShape={globalLogoShape} 
                    size="lg"
                  />
                  <div className={clsx("absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", shapeClassesLarge[globalLogoShape])}>
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white block tracking-tight">{currentBank?.name}</span>
                  <span className="text-[9px] font-black tracking-widest uppercase text-[var(--accent-color)] cursor-pointer hover:underline mt-0.5 block" onClick={() => fileInputRef.current?.click()}>
                    Изменить логотип
                  </span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
              </div>
              <button
                onClick={() => { setSelectedBankId(''); setCustomBankName(''); setCustomLogo(undefined); }}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all cursor-pointer"
                title="Сброс"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Selection */}
      <div className={clsx("space-y-3 transition-opacity duration-300", !selectedBankId && "opacity-50 pointer-events-none")}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Категории кэшбека</label>
          <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCategories.length} выбрано</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            className={clsx(
              "w-full pl-9 py-2.5 bg-[#FAFAFA] dark:bg-[#111] border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all shadow-inner",
              categorySearchQuery ? "pr-10" : "pr-4"
            )}
          />
          {categorySearchQuery && (
            <button
              type="button"
              onClick={() => setCategorySearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-64 overflow-y-auto p-1 scrollbar-hide">
          {filteredCategories.map(cat => {
            const isSelected = selectedCategories.some(c => c.name === cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={clsx(
                  "px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center cursor-pointer border",
                  isSelected
                    ? "bg-[var(--accent-color)] text-white border-transparent shadow-md shadow-[var(--accent-color)]/20"
                    : "bg-[#FAFAFA] dark:bg-[#111] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1A1A1A] border-slate-100 dark:border-white/5 shadow-sm"
                )}
              >
                {cat}
              </button>
            );
          })}
          {selectedCategories.filter(c => !allCategories.includes(c.name)).map(cat => (
             <button
             key={cat.name}
             onClick={() => toggleCategory(cat.name)}
             className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center bg-[var(--accent-color)] text-white border border-transparent shadow-md shadow-[var(--accent-color)]/20 cursor-pointer"
           >
             {cat.name}
           </button>
          ))}
        </div>

        <form onSubmit={handleAddCustom} className="flex gap-2 pt-1">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Своя категория..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className={clsx(
                "w-full py-2.5 bg-[#FAFAFA] dark:bg-[#111] border border-slate-200/50 dark:border-white/10 shadow-inner rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white transition-all",
                customCategory ? "pl-4 pr-10" : "px-4"
              )}
            />
            {customCategory && (
              <button
                type="button"
                onClick={() => setCustomCategory('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!customCategory.trim()}
            className="shrink-0 p-2.5 bg-[var(--accent-color)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-[var(--accent-color)]/30 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* Percentages Input */}
        <AnimatePresence initial={false}>
          {selectedCategories.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-1.5 pt-3 border-t border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Процент кэшбека (необязательно)</label>
              <div className="space-y-1.5">
                {selectedCategories.map(cat => (
                  <motion.div 
                    key={cat.name} 
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between p-2 bg-[#FAFAFA] dark:bg-[#111] rounded-[1.25rem] border border-slate-100 dark:border-white/5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={cat.percent}
                        onChange={(e) => updateCategoryPercent(cat.name, e.target.value)}
                        className="w-14 px-2 py-1 text-right bg-white dark:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 shadow-inner rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] dark:text-white"
                      />
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3 border-t border-slate-200/50 dark:border-white/10 mt-1">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-[#FAFAFA] dark:bg-[#111] hover:bg-white dark:hover:bg-[#1A1A1A] border border-slate-100 dark:border-white/5 transition-all text-sm cursor-pointer shadow-sm active:scale-95"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedBankId || selectedCategories.length === 0 || (isCustomBank && !customBankName.trim())}
          className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-[var(--accent-color)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--accent-color)]/30 active:scale-95 text-sm cursor-pointer"
        >
          Сохранить
        </button>
      </div>

      <ConfirmModal
        isOpen={!!bankToDelete}
        onClose={() => setBankToDelete(null)}
        onConfirm={() => {
          if (bankToDelete) {
            onDeleteCustomBank(bankToDelete);
            if (selectedBankId === bankToDelete) {
              setSelectedBankId('');
            }
          }
        }}
        title="Удалить пользовательский банк?"
        message="Этот банк будет удален из списка доступных. Существующие записи с этим банком не изменятся."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
});
