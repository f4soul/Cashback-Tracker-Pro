import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import versions from "../versions.json";

export const showPwaUpdateToast = (onUpdate: () => void) => {
  const latestVersion = versions[versions.length - 1]?.version || "1.30.0";

  toast.custom(
    (t) => (
      <div className="inline-flex items-center gap-3 w-fit max-w-[calc(100vw-24px)] p-2.5 pl-3 pr-2.5 rounded-control bg-white dark:bg-[var(--surface-2)] border border-[var(--border-strong)] shadow-[var(--elevation-highlight),0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[var(--elevation-highlight),0_16px_40px_rgba(0,0,0,0.55)] text-[var(--text-primary)] font-sans select-none">
        <div className="w-9 h-9 rounded-control bg-[var(--percent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col justify-center min-w-0 pr-1">
          <span className="text-[13px] font-bold text-[var(--text-primary)] leading-tight whitespace-nowrap">
            Доступно обновление
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-full bg-[var(--percent-bg)] text-[var(--percent-text)] shrink-0">
              v{latestVersion}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] leading-none whitespace-nowrap">
              уже здесь!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t);
              onUpdate();
            }}
            className="h-8 px-3.5 rounded-full bg-[var(--accent-color)] text-white text-[11.5px] font-bold shadow-sm shadow-[var(--accent-color)]/25 hover:brightness-110 active:scale-95 transition-[filter,transform] cursor-pointer inline-flex items-center justify-center leading-none whitespace-nowrap"
          >
            Обновить
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t)}
            className="w-6 h-6 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-hover)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
            title="Позже"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ),
    {
      id: "pwa-update-available",
      duration: Infinity,
    },
  );
};
