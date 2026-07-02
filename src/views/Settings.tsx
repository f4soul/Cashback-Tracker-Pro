import React, { useCallback, memo, useState, useRef } from 'react';
import { AppSettings, LogoShape, Bank, MonthData } from '../types';
import { BankLogo } from '../components/BankLogo';
import { Circle, Square, RectangleHorizontal, Type, Palette, Download, Image as ImageIcon, FileSpreadsheet, FileText, Check, RotateCcw, Search, Database, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { exportToPDF, exportToExcel, exportToImage } from '../utils/export';
import { CashbackTable } from '../components/CashbackTable';
import { MccDirectory } from '../components/MccDirectory';
import { VersionHistory } from '../components/VersionHistory';
import { Modal } from '../components/ui/Modal';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  customBanks: Bank[];
  currentMonthData: MonthData;
  onAddTestData?: () => void;
  userEmail?: string | null;
  onExportJSON?: () => void;
  onImportJSON?: (data: any) => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = memo(({ 
  settings, 
  setSettings, 
  customBanks, 
  currentMonthData, 
  onAddTestData, 
  userEmail,
  onExportJSON,
  onImportJSON
}) => {
  const [isMccDirectoryOpen, setIsMccDirectoryOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings]);

  const colors = [
    { name: 'Emerald', value: '#10b981', bg: '#ecfdf5', text: '#047857' },
    { name: 'Blue', value: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    { name: 'Indigo', value: '#6366f1', bg: '#eef2ff', text: '#4338ca' },
    { name: 'Purple', value: '#a855f7', bg: '#faf5ff', text: '#7e22ce' },
    { name: 'Rose', value: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
    { name: 'Orange', value: '#f97316', bg: '#fff7ed', text: '#c2410c' },
    { name: 'Amber', value: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
  ];

  const fontColors = [
    { name: 'Slate', value: '#334155' },
    { name: 'Gray', value: '#4b5563' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Zinc', value: '#52525b' },
    { name: 'Neutral', value: '#525252' },
    { name: 'Stone', value: '#57534e' },
  ];

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (onImportJSON) {
          await onImportJSON(json);
          toast.success('ДАННЫЕ УСПЕШНО ИМПОРТИРОВАНЫ');
        }
      } catch (error) {
        toast.error('ОШИБКА ПРИ ИМПОРТЕ ДАННЫХ');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [onImportJSON]);

  const handleCustomColorChange = useCallback((hex: string) => {
    if (/^#[0-9A-F]{3,6}$/i.test(hex)) {
      setSettings(prev => ({
        ...prev,
        accentColor: hex,
        percentBlockBg: `${hex}15`,
        percentBlockText: hex
      }));
    } else {
      updateSetting('accentColor', hex);
    }
  }, [setSettings, updateSetting]);

  const handleExportImage = useCallback(() => {
    exportToImage('settings-export-table', `Кэшбек_${currentMonthData.monthId}.png`);
  }, [currentMonthData.monthId]);

  const handleExportExcel = useCallback(() => {
    exportToExcel(currentMonthData, customBanks, `Кэшбек_${currentMonthData.monthId}.xlsx`);
  }, [currentMonthData, customBanks]);

  const handleExportPDF = useCallback(() => {
    exportToPDF('settings-export-table', `Кэшбек_${currentMonthData.monthId}.pdf`);
  }, [currentMonthData.monthId]);

  const isAdmin = userEmail === 'filimlive@gmail.com';

  return (
    <div className="flex flex-col gap-4 pb-8">
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}>
        {/* MCC Directory Card - Order 1 */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className="bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] flex flex-col gap-3 order-1">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h2 className="text-sm border-transparent mt-[1px]">Справочник МСС</h2>
          </div>
          
          <div className="flex-1 flex items-center">
            <button
              onClick={() => setIsMccDirectoryOpen(true)}
              className="w-full py-3.5 px-4 bg-[var(--surface-0)] dark:bg-[var(--surface-1)] hover:bg-white dark:hover:bg-[var(--surface-2)] border border-slate-100 dark:border-[var(--border-hairline)] rounded-3xl text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-none hover:shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_2px_8px_rgb(0,0,0,0.1)] active:scale-95"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none mt-[1px]">Открыть справочник</span>
            </button>
          </div>
        </motion.div>

        {/* Accent Color Card - Order 3 on mobile, 2 on desktop */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className="bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] flex flex-col gap-3 order-3 lg:order-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h2 className="text-sm">Акцентный цвет</h2>
          </div>

          <div className="flex-1 flex items-center">
            <div className="grid grid-cols-8 gap-2 w-full">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      accentColor: color.value,
                      percentBlockBg: color.bg,
                      percentBlockText: color.text
                    }));
                  }}
                  className={clsx(
                    "aspect-square rounded-xl transition-all flex items-center justify-center relative cursor-pointer group shrink-0",
                    settings.accentColor === color.value
                      ? "scale-95 shadow-lg z-10 ring-2 ring-inset ring-white/40 dark:ring-white/20"
                      : "hover:scale-105 opacity-90 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {settings.accentColor === color.value && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              ))}

              <div className="relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 flex items-center justify-center bg-gray-50 dark:bg-[var(--surface-0)] cursor-pointer group shrink-0">
                <div className="absolute inset-0 transition-opacity group-hover:opacity-80" style={{ backgroundColor: settings.accentColor }} />
                <Palette className="w-4 h-4 text-gray-400 group-hover:text-white mix-blend-difference z-10" />
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] cursor-pointer opacity-0 z-20"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logo Shape Card - Order 2 on mobile, 3 on desktop */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className="bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] flex flex-col gap-3 order-2 lg:order-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Circle className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h2 className="text-sm border-transparent mt-[1px]">Форма логотипов</h2>
          </div>
          
          <div className="flex-1 flex items-center">
            <div className="flex p-1 bg-white dark:bg-[var(--surface-2)] rounded-2xl border border-slate-100 dark:border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] w-full">
              {(['circle', 'square', 'rectangle'] as LogoShape[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => updateSetting('logoShape', shape)}
                  className={clsx(
                    "flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer active:scale-95",
                    settings.logoShape === shape
                      ? "bg-slate-50 dark:bg-white/[0.05] shadow-sm border border-slate-100 dark:border-transparent text-[var(--accent-color)]"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-[var(--text-primary)] border border-transparent"
                  )}
                >
                  <div className={clsx(
                    "border-2 border-current transition-all",
                    shape === 'circle' && "w-5 h-5 rounded-full",
                    shape === 'square' && "w-5 h-5 rounded-[22%]",
                    shape === 'rectangle' && "w-4 h-6 rounded-[15%]"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Text Color Card - Order 4 */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className="bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] flex flex-col gap-3 order-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Type className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h2 className="text-sm">Цвет текста</h2>
          </div>

          <div className="flex-1 flex items-center">
            <div className="grid grid-cols-8 gap-2 w-full">
              {fontColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => updateSetting('fontColor', color.value)}
                  className={clsx(
                    "aspect-square rounded-full transition-all flex items-center justify-center relative border border-gray-100 dark:border-[var(--border-strong)] cursor-pointer shrink-0",
                    settings.fontColor === color.value
                      ? "scale-95 shadow-md ring-2 ring-inset ring-white/40 dark:ring-white/20"
                      : "hover:scale-105 opacity-90 hover:opacity-100",
                    color.value === '#ffffff' && "border-gray-300 dark:border-[var(--border-hairline)] shadow-sm"
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {settings.fontColor === color.value && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                </button>
              ))}
              
              <div className="relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105 flex items-center justify-center bg-gray-50 dark:bg-[var(--surface-0)] cursor-pointer shrink-0 group">
                <div className="absolute inset-0" style={{ backgroundColor: settings.fontColor }} />
                <Palette className="w-4 h-4 text-white mix-blend-difference z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <input
                  type="color"
                  value={settings.fontColor}
                  onChange={(e) => updateSetting('fontColor', e.target.value)}
                  className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] cursor-pointer opacity-0 z-20"
                />
              </div>
            </div>
          </div>
        </motion.div>


        {/* Export Card - Order 5 */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className={`bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] space-y-3 ${isAdmin ? 'order-6 lg:col-span-1' : 'order-5 lg:col-span-2'}`}>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h2 className="text-sm border-transparent mt-[1px]">Экспорт данных</h2>
          </div>
          
          <div className="flex p-1 gap-1 bg-white dark:bg-[var(--surface-2)] rounded-2xl border border-slate-100 dark:border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)]">
            <button 
              onClick={handleExportImage}
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:shadow-sm dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] border border-transparent dark:hover:border-white/5 transition-all group cursor-pointer active:scale-95"
              title="Изображение (PNG)"
            >
              <ImageIcon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform mb-1 shrink-0" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-none mt-0.5">PNG</span>
            </button>

            <button 
              onClick={handleExportExcel}
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:shadow-sm dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] border border-transparent dark:hover:border-white/5 transition-all group cursor-pointer active:scale-95"
              title="Таблица (Excel)"
            >
              <FileSpreadsheet className="w-5 h-5 text-[var(--accent-color)] group-hover:scale-110 transition-transform mb-1 shrink-0" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-none mt-0.5">Excel</span>
            </button>

            <button 
              onClick={handleExportPDF}
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:shadow-sm dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] border border-transparent dark:hover:border-white/5 transition-all group cursor-pointer active:scale-95"
              title="Документ (PDF)"
            >
              <FileText className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-1 shrink-0" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-none mt-0.5">PDF</span>
            </button>

            <button 
              onClick={onExportJSON}
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:shadow-sm dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] border border-transparent dark:hover:border-white/5 transition-all group cursor-pointer active:scale-95"
              title="Экспорт JSON (Backup)"
            >
              <Database className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform mb-1 shrink-0" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-none mt-0.5">JSON</span>
            </button>

            <button 
              onClick={handleImportClick}
              className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:shadow-sm dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] border border-transparent dark:hover:border-white/5 transition-all group cursor-pointer active:scale-95"
              title="Импорт JSON"
            >
              <Upload className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-1 shrink-0" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-[var(--text-secondary)] uppercase tracking-tight leading-none mt-0.5">Импорт</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </button>
          </div>
        </motion.div>

        {/* Admin Cards - Order 6 */}
        {isAdmin && (
          <motion.div
          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } } }}
          className="bg-white dark:bg-[var(--surface-0)] rounded-3xl border border-slate-100 dark:border-[var(--border-hairline)] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgb(0,0,0,0.2)] flex flex-col justify-between min-h-full space-y-3 order-6">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black uppercase tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <h2 className="text-sm border-transparent mt-[1px]">История версий</h2>
            </div>
            
            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              className="w-full mt-auto py-3.5 px-4 bg-[var(--surface-0)] dark:bg-[var(--surface-1)] hover:bg-white dark:hover:bg-[var(--surface-2)] border border-slate-100 dark:border-[var(--border-hairline)] rounded-3xl text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-none hover:shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:hover:shadow-[0_2px_8px_rgb(0,0,0,0.1)] active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none mt-[1px]">Посмотреть обновления</span>
            </button>
          </motion.div>
        )}
      </motion.div>


      {/* Hidden table for export */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none opacity-0">
        <div id="settings-export-table">
          <CashbackTable 
            monthId={currentMonthData.monthId}
            entries={currentMonthData.entries}
            customBanks={customBanks}
            globalLogoShape={settings.logoShape}
          />
        </div>
      </div>

      <MccDirectory 
        isOpen={isMccDirectoryOpen} 
        onClose={() => setIsMccDirectoryOpen(false)} 
      />
      <Modal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        title="История обновлений"
        isBottomSheet={true}
        isFixedHeight={true}
      >
        <VersionHistory />
      </Modal>
    </div>
  );
});
