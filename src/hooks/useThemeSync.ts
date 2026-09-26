import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { AppSettings } from "../types";

export const THEME_COLORS = {
  light: "#FAFAFA",
  dark: "#05080F",
} as const;

let lastAppliedThemeColor: string | null = null;

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

/**
 * Синхронное применение темы к DOM:
 * 1. Класс .dark на <html>
 * 2. background-color на <html> и <body> без CSS-анимаций для мгновенного сэмплирования Safari
 * 3. colorScheme ('light' / 'dark') для синхронизации нативных контролов и текста статус-бара
 * 4. meta[name="theme-color"]
 * 5. Микро-триггер для WebKit: гарантирует пересчёт цвета верхней панели при проскролленной странице
 */
export function applyThemeToDom(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  const color = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  root.style.colorScheme = isDark ? "dark" : "light";
  root.style.backgroundColor = color;

  if (document.body) {
    document.body.style.backgroundColor = color;
  }

  forceThemeColorMeta(color);

  // Для WebKit (iOS Safari): когда страница проскроллена (scrollY > 0),
  // браузер сэмплирует фон в обработчике scroll. Синхронный микро-сдвиг на 1px
  // и возврат в следующем rAF-тике форсирует мгновенный опрос цвета без визуального сдвига.
  if (typeof window !== "undefined" && window.scrollY > 0) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > 0) {
        window.scrollTo(0, y + (y > 1 ? -1 : 1));
        window.scrollTo(0, y);
      }
    });
  }
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

  // 1. Theme sync: DOM class (.dark) + inline background + meta theme-color (deps: [theme])
  useEffect(() => {
    applyThemeToDom(theme);
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
