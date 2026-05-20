import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';

interface MccDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MccItemType {
  code: string;
  name: string;
  group: string;
}

const MccItem: React.FC<{ item: MccItemType }> = ({ item }) => {
  return (
    <div
      className="w-full bg-[#FAFAFA] dark:bg-[#111] p-3.5 rounded-[1.25rem] border border-slate-100 dark:border-white/5 flex items-center gap-3 shadow-sm text-left hover:border-[var(--accent-color)]/30 transition-all hover:bg-white dark:hover:bg-[#1A1A1A] hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)]"
    >
      <div className="w-14 h-12 rounded-xl bg-[#F4F4F5] dark:bg-[#0A0A0A] flex items-center justify-center shrink-0">
        <span className="text-sm font-black text-slate-900 dark:text-white">{item.code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {item.name}
        </h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          {item.group}
        </p>
      </div>
    </div>
  );
};

export const MccDirectory: React.FC<MccDirectoryProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mccData, setMccData] = useState<MccItemType[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    fetch('/mcc.json?t=' + Date.now())
      .then(response => response.json())
      .then(data => {
        setMccData(data);
      })
      .catch(error => console.error('Error fetching MCC data:', error));
  }, []);

  const filteredMcc = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return mccData;

    return mccData.filter(
      (item) =>
        item.code.includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.group.toLowerCase().includes(query)
    );
  }, [searchQuery, mccData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%', x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            exit={{ y: '100%', x: '-50%' }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-1/2 z-50 h-[85vh] w-full max-w-4xl lg:max-w-[700px] bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl rounded-t-[1.25rem] shadow-[0_-20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_-20px_60px_rgb(0,0,0,0.4)] flex flex-col overflow-hidden border-t border-slate-100 dark:border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-white/5 shrink-0 bg-transparent">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Справочник МСС-кодов</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 shrink-0 bg-transparent">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по коду или названию..."
                  className="w-full pl-10 pr-10 py-3 bg-[#FAFAFA] dark:bg-[#111] border border-slate-200/50 dark:border-white/10 shadow-inner rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-2">
              {filteredMcc.length > 0 ? (
                filteredMcc.map((item) => <MccItem key={item.code} item={item} />)
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ничего не найдено
                  </p>
                  <button
                    onClick={() => window.open(`https://www.google.com/search?q=MCC+код+${searchQuery}`, '_blank')}
                    className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl text-sm font-bold shadow-md shadow-[var(--accent-color)]/20 hover:brightness-110 transition-all cursor-pointer active:scale-95"
                  >
                    Поиск в Google
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
