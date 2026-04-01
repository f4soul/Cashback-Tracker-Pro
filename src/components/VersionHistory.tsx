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
        <div key={v.version} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-gray-900 dark:text-white">Версия {v.version}</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{v.date}</span>
            </div>
            {openIndex === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-900"
              >
                <ul className="p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  {v.changes.map((change, i) => (
                    <li key={i}>{change}</li>
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
