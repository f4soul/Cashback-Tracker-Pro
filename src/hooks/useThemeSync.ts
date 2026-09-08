import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { AppSettings } from "../types";

export function useThemeSync() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  const [settings, setSettings] = useLocalStorage<AppSettings>("app_settings", {
    logoShape: "circle",
    accentColor: "#10b981", // emerald-500
    percentBlockBg: "#ecfdf5", // emerald-50
    percentBlockText: "#047857", // emerald-700
    fontColor: "#6b7280", // gray-500
  });

  // Apply theme and custom styles to document with extra robustness for iOS Safari / PWA status bar
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply custom CSS variables
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

    const targetColor = isDark ? "#05080F" : "#FAFAFA";

    const syncColorsAndMetaTags = () => {
      // Style both root document and body elements to prevent unstyled body backgrounds on iOS elastic scrolls
      root.style.backgroundColor = targetColor;
      if (document.body) {
        document.body.style.backgroundColor = targetColor;
      }

      // Remove any meta theme-color tags with 'media' attribute to prevent Safari conflicts
      document
        .querySelectorAll('meta[name="theme-color"][media]')
        .forEach((el) => el.remove());

      // Update or create the main theme-color meta tag
      let metaThemeColor = document.querySelector(
        'meta[name="theme-color"]:not([media])',
      );
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.setAttribute("name", "theme-color");
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute("content", targetColor);

      // Force apple-mobile-web-app-status-bar-style metadata refresh
      let metaAppleStyle = document.querySelector(
        'meta[name="apple-mobile-web-app-status-bar-style"]',
      );
      if (!metaAppleStyle) {
        metaAppleStyle = document.createElement("meta");
        metaAppleStyle.setAttribute(
          "name",
          "apple-mobile-web-app-status-bar-style",
        );
        document.head.appendChild(metaAppleStyle);
      }
      metaAppleStyle.setAttribute("content", "default");

      // Set helper CSS variable
      root.style.setProperty("--theme-color", targetColor);
    };

    // Run immediately on active tab switch or theme change
    syncColorsAndMetaTags();
  }, [theme, settings]);

  return {
    theme,
    setTheme,
    settings,
    setSettings,
  };
}
