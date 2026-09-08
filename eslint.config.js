import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)transition-all(\\s|$)/]",
          message: "Использование 'transition-all' запрещено. Используйте точечные transition, например: transition-[background-color,border-color,box-shadow,transform].",
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)rounded-(xl|lg|2xl|3xl)(\\s|$)/]",
          message: "Сырые радиусы (rounded-xl, и т.д.) запрещены в компонентах. Используйте семантические токены: rounded-control, rounded-card, rounded-modal.",
        },
        {
          selector: "Literal[value='firebase/storage']",
          message: "Импорт из 'firebase/storage' запрещен. Хранение файлов в этом проекте не используется.",
        }
      ]
    },
  }
);
