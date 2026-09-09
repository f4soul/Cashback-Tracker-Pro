import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { AppSettings } from "../types";

let lastAppliedThemeColor: string | null = null;
let inlineBackgroundCleaned = false;

// Форс-обновление статус-бара: вместо мутации существующего узла
// полностью пересоздаём мета-элемент. Новый узел WebKit обрабатывает
// немедленно; мутацию на проскролленной странице — лениво.
export function forceThemeColorMeta(color: string): void {
  if (lastAppliedThemeColor === color) return;
  const head = document.head;
  const metas = head.getElementsByTagName("meta");
  for (let i = metas.length - 1; i >= 0; i--) {
    const m = metas.item(i);
    if (m && m.getAttribute("name") === "theme-color") {
      m.remove();
    }
  }
  const fresh = document.createElement("meta");
  fresh.setAttribute("name", "theme-color");
  fresh.setAttribute("content", color);
  head.appendChild(fresh);
  lastAppliedThemeColor = color;
}

export function useThemeSync() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  const [settings, setSettings] = useLocalStorage<AppSettings>("app_settings", {
    logoShape: "circle",
    accentColor: "#10b981", // emerald-500
    percentBlockBg: "#ecfdf5", // emerald-50
    percentBlockText: "#047857", // emerald-700
    fontColor: "#6b7280", // gray-500
  });

  // 1. Theme sync: DOM class (.dark) + meta theme-color (deps: [theme])
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (!inlineBackgroundCleaned) {
      root.style.removeProperty("background-color");
      if (document.body) {
        document.body.style.removeProperty("background-color");
      }
      inlineBackgroundCleaned = true;
    }

    forceThemeColorMeta(isDark ? "#05080F" : "#FAFAFA");
  }, [theme]);

  // 2. Custom CSS variables (deps: [settings, theme])
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.style.setProperty("--accent-color", settings.accentColor);
    if (isDark) {
      root.style.setProperty(
        "--percent-bg",
        `color-mix(in srgb, ${settings.percentBlockText} 12%, transparent)`,
      );
      root.style.setProperty(
        "--percent-text",
        `color-mix(in srgb, ${settings.percentBlockText} 90%, #ffffff)`,
      );
    } else {
      root.style.setProperty("--percent-bg", settings.percentBlockBg);
      root.style.setProperty("--percent-text", settings.percentBlockText);
    }
    root.style.setProperty("--app-font-color", settings.fontColor);
  }, [settings, theme]);

  return {
    theme,
    setTheme,
    settings,
    setSettings,
  };
}
