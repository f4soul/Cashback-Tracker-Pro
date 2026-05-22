import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import versionsData from '../../public/versions.json';

interface Version {
  version: string;
  date: string;
  changes: string[];
}

const reversedVersions = [...versionsData].reverse() as Version[];

export const VersionHistory: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {reversedVersions.map((v, index) => (
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
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-[#1A1A1A] border-t border-slate-100 dark:border-white/5 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.26,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <ul className="p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {v.changes.map((change, i) => (
                      <li key={i} className="leading-snug">{change}</li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
