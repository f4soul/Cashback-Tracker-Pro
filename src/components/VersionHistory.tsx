import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import versionsData from '../versions.json';
import { clsx } from 'clsx';

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
      {reversedVersions.map((v, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={v.version} className="border border-[var(--border-hairline)] rounded-3xl overflow-hidden bg-[var(--surface-1)] dark:bg-[var(--surface-1)] transition-all duration-300">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-2)]/30 dark:hover:bg-[var(--surface-2)]/30 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold text-sm text-gray-900 dark:text-white leading-none">Версия {v.version}</span>
                <span className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest leading-none mt-0.5">{v.date}</span>
              </div>
              <ChevronDown className={clsx("w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", isOpen && "rotate-180")} />
            </button>
            <div className={clsx(
              "grid transition-[grid-template-rows] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
              isOpen ? "grid-rows-[1fr] border-t border-[var(--border-hairline)]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden min-h-0">
                <div className={clsx(
                  "transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] gpu-accelerated origin-top p-3",
                  isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
                )}>
                  <div className="p-4 bg-[var(--surface-2)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-2xl">
                    <ul className="space-y-2.5 text-sm text-gray-600 dark:text-[var(--text-secondary)] list-disc list-inside">
                      {v.changes.map((change, i) => (
                        <li key={i} className="leading-snug">{change}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
