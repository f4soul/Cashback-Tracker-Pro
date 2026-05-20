import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Version {
  version: string;
  date: string;
  changes: string[];
}

export const VersionHistory: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch('/versions.json')
      .then(res => res.json())
      .then(data => setVersions(data.reverse()))
      .catch(err => console.error('Failed to load versions:', err));
  }, []);

  return (
    <div className="space-y-4">
      {versions.map((v, index) => (
        <div key={v.version} className="border border-slate-100 dark:border-white/5 rounded-[1.25rem] overflow-hidden bg-[#FAFAFA] dark:bg-[#111]">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 hover:bg-white dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="font-bold text-sm text-gray-900 dark:text-white leading-none">Версия {v.version}</span>
              <span className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest leading-none mt-0.5">{v.date}</span>
            </div>
            {openIndex === index ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
          </button>
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-[#1A1A1A] border-t border-slate-100 dark:border-white/5"
              >
                <ul className="p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  {v.changes.map((change, i) => (
                    <li key={i} className="leading-snug">{change}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
