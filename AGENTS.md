# Cashback Tracker Pro — Agent Guidelines

Этот файл — обязательные правила для любого AI-агента (Google AI Studio и др.), вносящего изменения в кодовую базу. Любой рефакторинг, новая фича или фикс должны соответствовать всем разделам ниже. Если предложенное решение противоречит правилу — сначала предлагается более простая альтернатива, совместимая с правилом, и только при обоснованной необходимости — отступление с явным указанием причины в комментарии кода.

---

## 1. Стек и инварианты

- React 19 + TypeScript (strict) + Vite 6 + Tailwind CSS 4 (`@tailwindcss/vite`, без отдельного `tailwind.config`, токены и `@utility` через `@theme` в `src/index.css`).
- Модальные примитивы и доступность — `@headlessui/react` (`Dialog`, `Dialog.Panel`, `Dialog.Title`) в связке с `motion/react` и React Portal (`createPortal`).
- Анимации — `motion` (импорт `from 'motion/react'`, **не** `framer-motion`) и аппаратные CSS Grid-переходы (`grid-rows-[0fr]` → `grid-rows-[1fr]`).
- Drag & Drop — `@dnd-kit/*` (core/sortable/modifiers/utilities).
- Backend — Firebase (Auth: Google Sign-In через `signInWithPopup` с автоматическим fallback на `signInWithRedirect` + `getRedirectResult` при блокировке всплывающих окон `auth/popup-blocked`; Firestore: `users/{uid}`, `months/{uid}_{monthId}`).
- Экспорт — `html-to-image` (PNG/PDF-рендер), `jspdf` (PDF-контейнер), `xlsx` + `file-saver` (Excel). Модули экспорта подгружаются лениво (`preloadExportModule` по `onPointerDown`). `html2canvas` исключён из зависимостей — не возвращать.
- Тосты — `sonner`. Иконки — `lucide-react`.
- PWA: `vite-plugin-pwa` (`registerType: 'prompt'`), safe-area-aware UI, mobile-first.
- Приложение полностью на русском языке (UI-текст). Код, имена переменных/функций/компонентов — на английском.

---

## 2. Архитектура и границы компонентов

`App.tsx` — **только композиция**: layout shell (sidebar / плавающий header / Status Bar Shield / bottom-nav / баннер обновления PWA), вызов хуков и передача данных из `useCashbackStore()` в `views/`. Любая stateful-логика (auth, глобальный стор и облачная синхронизация, тема, скролл-лок, видимость при скролле) вынесена в `src/store/` и `src/hooks/`.

### Глобальное хранилище (`src/store/`)
| Модуль | Отвечает за |
|---|---|
| `CashbackStoreProvider` (`useCashbackStore`) | Единый `useReducer` + Context стор приложения: CRUD над `allData` / `customBanks` / `deletedCustomBanks` / `customCategories`, обе подписки `onSnapshot` (`users/{uid}` и коллекция `months`), debounced `saveToFirestore` (500ms, раздельные таймеры `'settings'` и `'month'`), батчевый импорт (`writeBatch` чанками по 500) / экспорт JSON-бэкапа и debounced-персист в `localStorage`. |

### Хуки (`src/hooks/`) — единственная зона ответственности каждого:
| Хук | Отвечает за |
|---|---|
| `useAuth` | Firebase Auth listener, обработка `getRedirectResult`, placeholder-user из `localStorage` до резолва авторизации |
| `useThemeSync` | Синхронное применение CSS-переменных темы (`applyThemeToDom`), динамическое обновление `<meta name="theme-color">` и класса `.dark` |
| `useModalScrollLock` | Блокировка прокрутки фона при открытых модалках через перехват `touchmove`/`wheel` без мутации `overflow: hidden` на `body`/`html` (предотвращает 100ms layout reflow фриз в iOS Safari) |
| `useScrollVisibility` | Показ/скрытие плавающего header и мобильного bottom-nav при скролле с гистерезисом |
| `useLogoPreloader` | Фоновая предзагрузка (`requestIdleCallback`) и декодирование SVG-логотипов банков |
| `useLocalStorage` | Generic debounced-персист состояния в `localStorage` |

Новый stateful concern → новый хук в `src/hooks/` (или экшен в `CashbackStoreProvider`, если это бизнес-данные кэшбека), а не расширение `App.tsx`.

### Слои приложения:
- `views/*` — экраны (`CurrentMonth`, `Archive`, `Settings`). Знают про бизнес-данные, не обращаются к Firestore напрямую.
- `components/*` — переиспользуемые UI-юниты (`CashbackTable`, `BankForm`, `BankLogo`, `MccDirectory`, `VersionHistory`, `ui/Modal`, `ui/ConfirmModal`, `ui/DropdownPortal`). Без побочных эффектов синхронизации с облаком.
- `utils/*` — чистые функции и инфраструктурные утилиты без React-состояния (`date.ts`, `sorting.ts`, `format.ts`, `export.ts`, `bank.ts`, `cropImage.ts`, `mccData.ts`, `scrollLock.ts`).
- `constants.ts` — статичные справочники (`BANKS`, `BANKS_MAP`, `COMMON_CATEGORIES`, `getBankDetails`).

---

## 3. TypeScript

- `tsconfig.json` держит `"strict": true` — **никогда не ослаблять**.
- Никаких новых `any`. Если тип действительно неизвестен — `unknown` + явное узкое сужение.
- Разнородные состояния — discriminated union, не optional-флаги вперемешку. Пример в проекте: `FirebaseUser | PlaceholderUser | null`, где `PlaceholderUser` несёт `isPlaceholder: true` как discriminant.
- Каждый экспортируемый компонент — явный `interface XProps`, без inline-типов в деструктуризации параметров.
- `npm run lint` и `npm run build` должны проходить без ошибок перед завершением любого шага.

---

## 4. Производительность и данные (data-heavy правила)

- **Debounce на любую запись в Firestore**, инициированную continuous-инпутом (color picker, range slider, text input). Эталон — `saveToFirestore` в `CashbackStoreProvider` (раздельные таймеры на `'settings'` и `'month'`, 500ms). Новые источники записи обязаны идти через этот метод, не создавая параллельный `setDoc`.
- Lookup по `id` в hot-path (рендер списков/таблиц) — через `Map`, не `Array.find`. Эталон — `BANKS_MAP` и мемоизированный `banksMap`.
- `localStorage` — только debounced-запись (`useDebouncedStorage` / `useLocalStorage`), никогда синхронный `JSON.stringify` всего state на каждый рендер.
- Импорт/массовая запись данных — `writeBatch` (с разбивкой по 500 документов), никогда `for...await setDoc(...)` в цикле.
- `onSnapshot`-колбэки обязаны игнорировать обновления с `snapshot.metadata.hasPendingWrites === true` — иначе собственная оптимистичная запись «эхом» возвращается с сервера и может перетереть более свежий локальный state.
- Все импорты `firebase/firestore` — статические в начале файла. Никакого `import('firebase/firestore').then(...)` ради двух функций. Импорт из `firebase/storage` запрещён правилом ESLint.

---

## 5. Анимация (`motion/react` и CSS Grid)

- **Монолитные модальные окна (`Modal`, `ConfirmModal`)**:
  - Анимируется единый композитный узел (`Dialog.Panel` → `motion.div` с `transform translate-z-0 will-change-transform`) через пружинную физику: `type: 'spring', stiffness: 380, damping: 32, mass: 0.8` (`initial={{ opacity: 0, y: 48, scale: 0.98 }}` → `animate={{ opacity: 1, y: 0, scale: 1 }}`).
  - Закрытие (`exit`) — быстрый tween `duration: 0.18, ease: 'easeInOut'`, чтобы окно мгновенно освобождало экран.
  - Запрещено вешать `layout` или `layout="size"` на саму карточку модального окна — это вызывает принудительный пересчёт геометрии на первом кадре открытия и просадку FPS на мобильных устройствах.
- **Аккордеоны и раскрывающиеся панели (`VersionHistory`, фильтры в `Archive`, список банков в `CurrentMonth`)**:
  - Используется аппаратный CSS Grid паттерн: `grid transition-[grid-template-rows,opacity] duration-300 ease-out` с переключением `grid-rows-[0fr] opacity-0 pointer-events-none` ↔ `grid-rows-[1fr] opacity-100 pointer-events-auto` и внутренним контейнером `<div className="overflow-hidden min-h-0">`.
- **Выпадающие меню (`DropdownPortal`)**:
  - Рендерятся через `createPortal` в `document.body` (`z-[9999]`), используют условный цикл `requestAnimationFrame` **только** пока меню открыто (`isOpen === true`), поддерживают авто-переворот (`Auto-Flip`) вверх при нехватке места снизу и плавный CSS-переход `transition-[opacity,transform] duration-150 ease-out`.
- **Плавающая кнопка (FAB) и интерактивные списки**:
  - Для переключения состояний FAB и бокового ярлычка возврата используется синхронная пружинная физика (`type: 'spring', stiffness: 420, damping: 32, mass: 0.8`) без `mode="wait"` задержек, чтобы уход кнопки за край экрана и появление ярлычка происходили в едином физическом жесте.
  - `AnimatePresence mode="wait"` применяется только при переключении взаимоисключающих полноэкранных вью (табы навигации).

---

## 6. Дизайн-система

Направление — **Apple-минимализм**: нейтральные поверхности, единственный цветной акцент (`--accent-color`), минимум декоративного шума. Референс — системные экраны iOS (Settings, sheets), а не fintech-стиль с градиентами и неоном.

### Скругления (Border Radius)
- В `src/index.css` заданы базовые CSS-переменные и семантические утилиты Tailwind v4:
  - `rounded-card` (`--radius-card: var(--radius-app)`) — крупные контейнеры: карточки секций, таблица, панели.
  - `rounded-modal` (`--radius-modal: var(--radius-app)`) — модальные окна и диалоги.
  - `rounded-control` (`--radius-control: var(--radius-sm)`, где `--radius-sm: max(10px, calc(var(--radius-app) * 0.5))`) — элементы управления высотой < 60px: инпуты, кнопки, строки таблицы, переключатели.
- **Никогда** не использовать сырые Tailwind-радиусы `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-3xl` в компонентах (это блокируется ESLint `no-restricted-syntax`).
- Исключения: `rounded-full` для круглых кнопок/аватаров/пилюль и адаптивный радиус `rounded-[min(10px,var(--radius-sm))]` для компактных чипов фильтрации, внутри которых отображается `BankLogo` с меняющейся формой.

### Поверхности, заливки, elevation и Политика прозрачности
- **Поверхности** (`var(--surface-0/1/2)`):
  - `surface-0` — базовый фон страницы (`#fafafa` в светлой / `#05080F` в тёмной).
  - `surface-1` — обычная карточка, сайдбар, несущие панели (`#ffffff` / `#0B1220`).
  - `surface-2` — приподнятый слой: модалки, выпадающие списки, инпуты на карточках первого уровня (`#ffffff` / `#111A2E`).
  - Правило: чем выше слой в визуальном стеке — тем **светлее** значение в тёмной теме. Инверсия (дочерний элемент темнее родителя) — критическая ошибка ревью.
- **Политика прозрачности (Zero Backdrop-Blur)**:
  - Все контейнеры, карточки, шапка, нижняя навигация, модальные окна и sticky-футеры обязаны использовать **сплошной непрозрачный фон** (`surface-solid` или сплошные токены `bg-white dark:bg-[var(--surface-1/2)]`).
  - Использование `backdrop-blur-*` запрещено как на панелях интерфейса, так и на полноэкранных оверлеях модалок — это гарантирует стабильные 60fps без просадок GPU на мобильных устройствах.
  - Оверлей (скрим) модалок: плотный матовый `bg-slate-950/60 dark:bg-[#02040A]/90`.

### Тёмная тема — палитра «Midnight Blue»
```css
.dark {
  --surface-0: #05080F;
  --surface-1: #0B1220;
  --surface-2: #111A2E;
  --border-hairline: rgba(130, 165, 235, 0.10);
  --border-strong: rgba(130, 165, 235, 0.16);
  --text-primary: #E9EEF7;
  --text-secondary: #8B96AD;
  --text-tertiary: #57627A;
  --elevation-highlight: inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
  --fill: rgba(130, 165, 235, 0.06);
  --fill-hover: rgba(130, 165, 235, 0.10);
}
```
- **`var(--fill)` / `var(--fill-hover)`** — полупрозрачная заливка для интерактивных элементов, лежащих *внутри* поверхности верхнего яруса (`Modal`, `ConfirmModal`). Любой вставленный контрол внутри модалки (инпут, чип категории, строка выбранной категории, кнопка закрытия) обязан использовать `--fill`/`--fill-hover`, а не `--surface-0/1/2`.
- **Глубина приподнятых поверхностей**: `shadow-[var(--elevation-highlight),<обычная тень>]` — верхний внутренний блик + мягкая тень.
- **Семантические статусные цвета** — единственное исключение из «один акцент»: `red-*` (удаление/ошибка/`danger`), `amber-*` (предупреждение/`warning`).

### Типографика
- Шрифт — Inter. Заголовки — `font-bold`/`font-black` + `tracking-tight`.
- **`uppercase tracking-widest`** разрешён только для: табов нижней навигации; заголовков секций и кнопок-триггеров в `Settings.tsx`; год-бейджа в `CashbackTable.tsx`; заголовков секций внутри модалок и диалогов подтверждения (`ErrorBoundary`, `ConfirmModal`). Во всех остальных местах (названия банков, счётчики категорий, подписи в карточках) — обычный `font-semibold`/`font-bold` без uppercase.
- Месяцы в заголовках — через `capitalize()`, **не** `uppercase`.
- Множественное число числовых лейблов (банки, категории, месяцы) — только через `pluralize()` из `utils/format.ts`.

### Логотипы банков (`BankLogo.tsx`)
- Внутренний масштаб (`shapeSizes`) различается по форме маски: `circle: 60%` (`scale-[0.60]`), `square/rectangle: 75%` (`scale-[0.75]`), `octagon: 58%`. Не унифицировать обратно в одно число.

### Интерактивность и Модальные окна
- Transition на интерактивных контейнерах — строго точечный (`transition-[background-color,border-color,box-shadow,transform]` или `transition-colors`), использование `transition-all` запрещено правилом ESLint.
- Нажатие — `active:scale-95` (или `active:scale-90` для маленьких icon-button).
- **Адаптивные режимы `Modal` (`adaptiveMode`)**:
  - `"form"` (по умолчанию для форм ввода): мобильные `< 640px` = Bottom Sheet (`items-end`), с `sm` (`640px+`) = по центру (`sm:items-center`).
  - `"view"` (просмотр таблиц и справочников): сенсорные устройства и узкие окна = Bottom Sheet (`items-end`), десктоп с мышью/трекпадом на `640px+` = по центру (`sm:pointer-fine:items-center`).
  - `"sheet"`: Bottom Sheet на всех устройствах.
- **Sticky-footer в формах внутри `Modal`**: кнопки основного действия закрепляются через `sticky -bottom-3 sm:-bottom-4 z-20` со сплошным фоном `bg-white dark:bg-[var(--surface-2)]` и safe-area отступом `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.

---

## 7. Мобильный / PWA чек-лист для новых экранов

- Любой элемент, закреплённый у края экрана (header, bottom-nav, FAB) — учитывает `env(safe-area-inset-*)`.
- Верхняя зона статус-бара на мобильных защищена фиксированной шторкой (`Status Bar Shield`: `h-[env(safe-area-inset-top,0px)] bg-[var(--surface-0)] z-40`), чтобы при скрытии плавающей шапки прокручиваемый контент не наезжал на системные часы и Dynamic Island.
- Блокировка прокрутки фона в модалках работает исключительно через `useModalScrollLock` (перехват событий `touchmove`/`wheel`), без изменения `overflow` на `document.body`.
- Числовые поля ввода используют `inputMode="decimal"` и скрывают нативные стрелки (`no-spinner` / `appearance: textfield`).
- Цветовые и диапазонные контролы — только с debounce перед сетевой записью.

---

## 8. Версионирование (`src/versions.json`)

- Единственный источник правды для истории обновлений — файл `src/versions.json` (импортируется напрямую в `VersionHistory.tsx` для гарантированной работы в оффлайн-режиме PWA; дубликат в `public/` не создавать).
- При любых функциональных изменениях, улучшениях или багфиксах агент обязан добавить запись в `src/versions.json`.
- Нумерация — SemVer `MAJOR.MINOR.PATCH`: `MAJOR` — критические изменения архитектуры/структуры данных; `MINOR` — новые фичи, разделы, крупные оптимизации; `PATCH` — точечные доработки, фиксы, чистка.
- Описание изменений — на русском, лаконично, понятно пользователю, с группировкой темы через двоеточие.

---

## 9. Гигиена кода

- Не добавлять зависимость, если её функциональность уже покрыта существующей библиотекой.
- Дублирующийся код — выносить в общий helper (`utils/` или `hooks/`), не копипастить.
- Диагностический и временный код удалять перед коммитом.
- При добавлении вложенного интерактивного элемента внутрь `Modal`/`ConfirmModal` обязательно проверять использование `--fill`/`--fill-hover` вместо `--surface-*`.
- Обязательно запускать `lint_applet` (`npm run lint`) и `compile_applet` (`npm run build`) в конце серии правок. Все кастомные правила ESLint (`no-restricted-syntax` на `rounded-xl/2xl/lg/3xl`, `transition-all` и `firebase/storage`) должны соблюдаться неукоснительно.
