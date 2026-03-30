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
      className="w-full bg-white dark:bg-[#2c2c2e] p-3.5 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center gap-3 shadow-sm text-left"
    >
      <div className="w-14 h-12 rounded-xl bg-gray-100 dark:bg-[#1c1c1e] flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {item.name}
        </h3>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
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
            className="fixed bottom-0 left-1/2 z-50 h-[85vh] w-full max-w-4xl lg:max-w-[700px] bg-gray-50 dark:bg-[#1c1c1e] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-[#2c2c2e] border-b border-gray-200 dark:border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Справочник МСС-кодов</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 bg-white dark:bg-[#2c2c2e] border-b border-gray-200 dark:border-white/10 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по коду или названию..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-[#1c1c1e] border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-color)] transition-shadow"
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
                    className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
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
