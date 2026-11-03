import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import versionsData from "../versions.json";
import { clsx } from "clsx";

interface Version {
  version: string;
  date: string;
  changes: string[];
}

const reversedVersions = [...versionsData].reverse() as Version[];

export const VersionHistory: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {reversedVersions.map((v, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={v.version}
            className="border border-[var(--border-hairline)] rounded-card overflow-hidden bg-[var(--fill)] transition-[background-color,border-color] duration-300"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--fill-hover)] transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold text-sm text-[var(--text-primary)] leading-none">
                  Версия {v.version}
                </span>
                <span className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest leading-none mt-0.5">
                  {v.date}
                </span>
              </div>
              <ChevronDown
                className={clsx(
                  "w-5 h-5 text-[var(--text-tertiary)] shrink-0 transition-transform duration-300 ease-out",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={clsx(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100 pointer-events-auto border-t border-[var(--border-hairline)]"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none",
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="p-3">
                  <div className="p-4 bg-[var(--fill)] border border-[var(--border-hairline)] rounded-control">
                    <ul className="space-y-2.5 text-sm text-[var(--text-secondary)] list-disc list-inside">
                      {v.changes.map((change, i) => (
                        <li key={i} className="leading-snug">
                          {change}
                        </li>
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
