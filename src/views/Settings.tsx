import React, { useCallback, memo, useState } from 'react';
import { AppSettings, LogoShape, Bank, MonthData } from '../types';
import { BankLogo } from '../components/BankLogo';
import { Circle, Square, RectangleHorizontal, Type, Palette, Download, Image as ImageIcon, FileSpreadsheet, FileText, Check, RotateCcw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { exportToPDF, exportToExcel, exportToImage } from '../utils/export';
import { CashbackTable } from '../components/CashbackTable';
import { MccDirectory } from '../components/MccDirectory';
import { VersionHistory } from '../components/VersionHistory';
import { Modal } from '../components/ui/Modal';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  customBanks: Bank[];
  currentMonthData: MonthData;
  onAddTestData?: () => void;
  userEmail?: string | null;
}

export const Settings: React.FC<SettingsProps> = memo(({ settings, setSettings, customBanks, currentMonthData, onAddTestData, userEmail }) => {
  const [isMccDirectoryOpen, setIsMccDirectoryOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

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

  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* Header Section */}
      <div className="px-2 mb-1">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest truncate whitespace-nowrap">Персонализация интерфейса и экспорт данных</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {/* MCC Directory Card */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              </div>
              <h2 className="text-sm font-bold">Справочник МСС</h2>
            </div>
            
            <button
              onClick={() => setIsMccDirectoryOpen(true)}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-bold text-[var(--accent-color)] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              Открыть справочник
            </button>
          </div>

          {/* Accent Color Card */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              </div>
              <h2 className="text-sm font-bold">Акцентный цвет</h2>
            </div>

            <div className="grid grid-cols-8 gap-2 sm:gap-3">
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

              <div className="relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-105 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 cursor-pointer group shrink-0">
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

          {/* Export Card */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              </div>
              <h2 className="text-sm font-bold">Экспорт данных</h2>
            </div>
            
            <div className="flex p-1 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
              <button 
                onClick={handleExportImage}
                className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer"
                title="Изображение (PNG)"
              >
                <ImageIcon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">PNG</span>
              </button>

              <button 
                onClick={handleExportExcel}
                className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer border-x border-gray-100 dark:border-white/5"
                title="Таблица (Excel)"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Excel</span>
              </button>

              <button 
                onClick={handleExportPDF}
                className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all group cursor-pointer"
                title="Документ (PDF)"
              >
                <FileText className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {/* Logo Shape Card */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                <Circle className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              </div>
              <h2 className="text-sm font-bold">Форма логотипов</h2>
            </div>
            
            <div className="flex p-1 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
              {(['circle', 'square', 'rectangle'] as LogoShape[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => updateSetting('logoShape', shape)}
                  className={clsx(
                    "flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer",
                    settings.logoShape === shape
                      ? "bg-white dark:bg-gray-800 shadow-sm text-[var(--accent-color)] scale-[1.02]"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

          {/* Typography Card */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                  <Type className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                </div>
                <h2 className="text-sm font-bold">Типографика</h2>
              </div>
              {settings.fontSize !== 16 && (
                <button
                  onClick={() => updateSetting('fontSize', 16)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-[var(--accent-color)] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Сброс
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                  <span>A</span>
                  <span className="text-[var(--accent-color)] bg-[var(--percent-bg)] px-2 py-0.5 rounded-full">{settings.fontSize}px</span>
                  <span className="text-lg">A</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="22"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                />
              </div>

              <div className="grid grid-cols-8 gap-2 sm:gap-3 pt-1">
                {fontColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => updateSetting('fontColor', color.value)}
                    className={clsx(
                      "aspect-square rounded-full transition-all flex items-center justify-center relative border border-gray-100 dark:border-white/10 cursor-pointer shrink-0",
                      settings.fontColor === color.value
                        ? "scale-95 shadow-md ring-2 ring-inset ring-white/40 dark:ring-white/20"
                        : "hover:scale-105 opacity-90 hover:opacity-100",
                      color.value === '#ffffff' && "border-gray-300 dark:border-gray-600 shadow-sm"
                    )}
                    style={{ backgroundColor: color.value }}
                  >
                    {settings.fontColor === color.value && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                  </button>
                ))}
                
                <div className="relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 cursor-pointer shrink-0 group">
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
          </div>

          {/* Version History Card */}
          {userEmail === 'filimlive@gmail.com' && (
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                </div>
                <h2 className="text-sm font-bold">История версий</h2>
              </div>
              
              <button
                onClick={() => setIsVersionHistoryOpen(true)}
                className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Посмотреть историю изменений
              </button>
            </div>
          )}

          {/* Test Data Card */}
          {onAddTestData && userEmail === 'filimlive@gmail.com' && (
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 p-3.5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                </div>
                <h2 className="text-sm font-bold">Тестовые данные</h2>
              </div>
              
              <button
                onClick={onAddTestData}
                className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Добавить тестовые данные в архив
              </button>
            </div>
          )}
        </div>
      </div>

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
      >
        <VersionHistory />
      </Modal>
    </div>
  );
});
