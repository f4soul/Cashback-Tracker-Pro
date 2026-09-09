import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { AppSettings } from "../types";

let lastAppliedThemeColor: string | null = null;
let inlineBackgroundCleaned = false;

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

    // Clean up inline background set by index.html on first paint so CSS transition takes over
    if (!inlineBackgroundCleaned) {
      root.style.removeProperty("background-color");
      if (document.body) {
        document.body.style.removeProperty("background-color");
      }
      inlineBackgroundCleaned = true;
    }

    const targetColor = isDark ? "#05080F" : "#FAFAFA";

    // Remove any meta theme-color tags with 'media' attribute to prevent Safari conflicts
    document
      .querySelectorAll('meta[name="theme-color"][media]')
      .forEach((el) => el.remove());

    // Update or create single theme-color meta tag only if value actually changed
    if (lastAppliedThemeColor !== targetColor) {
      let metaThemeColor = document.querySelector(
        'meta[name="theme-color"]:not([media])',
      );
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.setAttribute("name", "theme-color");
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute("content", targetColor);
      lastAppliedThemeColor = targetColor;
    }
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
