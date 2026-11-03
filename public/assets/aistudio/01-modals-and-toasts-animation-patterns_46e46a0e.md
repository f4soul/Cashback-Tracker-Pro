# Архитектурные паттерны: Модальные окна, Шторки (Bottom Sheets) и Тост-уведомления
> **Стек:** React 18/19, TypeScript, Framer Motion (`motion/react`), Tailwind CSS, Headless UI (`@headlessui/react`).
> **Назначение:** Готовый эталонный справочник для переноса архитектуры монолитных диалогов, безрефлоуной блокировки скролла на iOS, защитного экрана статус-бара и пружинных тостов в любые современные веб- и PWA-приложения.

---

## 1. Монолитная кинематика диалогов (Monolithic Spring Pattern)

### 1.1. Проблематика стандартных подходов
При создании модальных окон в React разработчики часто совершают три критические ошибки:
1. **Двойные обёртки и глобальный `layout`**: навешивание `layout` или `layoutId` на контейнер модального окна внутри `<AnimatePresence>` приводит к тому, что Framer Motion в первом кадре открытия пересчитывает координаты от `(0, 0)` экрана до центрированного положения. Это вызывает неприятный горизонтальный или диагональный рывок карточки.
2. **Конфликт системного скроллбара**: если навесить `overflow-y-auto` на внешний контейнер позиционирования (`fixed inset-0 flex items-center justify-center`), то в процессе увеличения карточки (`scale: 0.98 -> 1`) на Windows/Linux появляется системный вертикальный скроллбар, сдвигающий контент на `15–17px` вправо, а затем исчезающий.
3. **Разрушение focus-trap**: использование «сырых» порталов (`createPortal`) без библиотеки доступности ломает навигацию с клавиатуры (`Tab`), закрытие по `Esc` и скринридеры.

### 1.2. Архитектурное решение Sproutly
* Диалог строится строго на базе `@headlessui/react` (`Dialog` с пропом `static` внутри `<AnimatePresence>`).
* Внешний контейнер отвечает **только** за фиксацию и геометрию (`fixed inset-0`, flex-центрирование, `pointer-events-none`).
* Внутренняя карточка рендерится через `Dialog.Panel as={Fragment}` в **один монолитный `motion.div`**.

```tsx
import React, { Fragment } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useModalScrollLock } from './useModalScrollLock';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  const modalBodyRef = React.useRef<HTMLDivElement>(null);
  
  // Безрефлоуный скролл-лок для iOS Safari
  useModalScrollLock(isOpen, modalBodyRef);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-[100] pointer-events-none"
          open={true}
          onClose={onClose}
          static
          __demoMode // Отключает встроенный reflow-scroll-lock и inert Headless UI
        >
          {/* 1. Глубокая матовая подложка (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:left-68 bg-slate-950/60 dark:bg-slate-950/90 pointer-events-auto cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 2. Контейнер позиционирования без overflow! */}
          <div className="fixed inset-0 md:left-68 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <Dialog.Panel as={Fragment}>
              {/* 3. Монолитная карточка с аппаратным ускорением */}
              <motion.div
                initial={{ opacity: 0, y: 48, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: 32,
                  scale: 0.98,
                  transition: { duration: 0.18, ease: 'easeInOut' },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 32,
                  mass: 0.8,
                }}
                className="w-full max-w-xl pointer-events-auto bg-white dark:bg-slate-950 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800/50 flex flex-col h-auto max-h-[90dvh] sm:max-h-[90vh] relative transform-gpu will-change-[transform,opacity]"
              >
                {/* Шапка модального окна */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {title}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors active:scale-90"
                    aria-label="Закрыть"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Тело модального окна со скроллом */}
                <div
                  ref={modalBodyRef}
                  className="shrink min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-8"
                >
                  {children}
                </div>
              </motion.div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
```

### 1.3. Параметры физики пружины
| Фаза | Свойства | Назначение |
| :--- | :--- | :--- |
| **Вход (Entrance)** | `initial={{ opacity: 0, y: 48, scale: 0.98 }}`<br/>`animate={{ opacity: 1, y: 0, scale: 1 }}`<br/>`transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}` | Органичный отклик физической массы без раскачки. Скорость и упругость соответствуют Apple iOS Sheets. |
| **Выход (Exit)** | `exit={{ opacity: 0, y: 32, scale: 0.98 }}`<br/>`transition={{ duration: 0.18, ease: "easeInOut" }}` | Детерминированный уход без инерционного хвоста пружины. Исключает залипание окна при быстром закрытии. |
| **Оптимизация** | `transform-gpu will-change-[transform,opacity]` | Выносит слой на дискретный графический процессор (GPU-композитинг), сохраняя стабильные 120 FPS. |

---

## 2. Безрефлоуная блокировка скролла (`useModalScrollLock`)

### 2.1. Почему стандартный `overflow: hidden` ломает плавность на iOS WebKit
В стандартных библиотеках (включая `@headlessui/react` и `react-remove-scroll`) при открытии модального окна срабатывает код:
1. Вызывается `document.documentElement.style.overflow = "hidden"`.
2. Читаются `innerWidth - clientWidth` и `getComputedStyle(document.documentElement).scrollBehavior`.
3. Навешивается `padding-right` для компенсации полосы прокрутки.

**Что происходит в iOS WebKit при `window.scrollY > 0`:**
Если пользователь проскроллил страницу хотя бы на 100px вниз, вызов `overflow: hidden` **принудительно разрушает внутреннее аппаратное дерево прокрутки `ScrollingTreeScrollingNode`**. WebKit останавливает главный поток (Main Thread) на **80–120 мс** для пересчета всего дерева рендеринга. В этот момент пружинная анимация окна уже запущена, но так как поток заблокирован, первые 3-4 кадра анимации пропускаются, и шторка резко телепортируется с 0% сразу на 90% высоты.

### 2.2. Реализация хука `useModalScrollLock.ts`
Хук **не изменяет стили тегов `<html>` и `<body>`**. Он перехватывает события жестов `touchmove` и колесика мыши `wheel` на уровне документа с опцией `{ passive: false }` и запрещает скролл только тогда, когда он пытается прокрутить фон, сохраняя нативную инерционную прокрутку внутри тела самого окна.

```ts
import { useEffect, RefObject } from 'react';

export function useModalScrollLock(
  isOpen: boolean,
  scrollContainerRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    // Рекурсивный поиск скроллируемого родителя внутри модального окна
    const findScrollableInModal = (
      target: EventTarget | null,
      root: HTMLElement | null | undefined
    ): HTMLElement | null => {
      if (!root || !(target instanceof Node) || !root.contains(target)) {
        return null;
      }
      let el: HTMLElement | null =
        target instanceof HTMLElement ? target : target.parentElement;
      while (el && el !== root.parentElement) {
        if (el.scrollHeight > el.clientHeight + 1) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const root = scrollContainerRef?.current;
      const scrollable = findScrollableInModal(e.target, root);

      // Если жест произошел вне скроллируемой области окна — блокируем фон
      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY; // > 0: скролл вниз, < 0: скролл вверх
      const { scrollTop, scrollHeight, clientHeight } = scrollable;

      const isAtTop = scrollTop <= 0 && deltaY < 0;
      const isAtBottom =
        scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0;

      // Если достигнут край контейнера — предотвращаем rubber-band прокрутку фона
      if (isAtTop || isAtBottom) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const onWheel = (e: WheelEvent) => {
      const root = scrollContainerRef?.current;
      const scrollable = findScrollableInModal(e.target, root);

      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0 && e.deltaY < 0;
      const isAtBottom =
        scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;

      if (isAtTop || isAtBottom) {
        if (e.cancelable) e.preventDefault();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('wheel', onWheel);
    };
  }, [isOpen, scrollContainerRef]);
}
```

---

## 3. Семантика адаптивности: Окна ввода vs Окна просмотра данных

В интерфейсах высокого класса модальные окна намеренно разделяются на два типа по принципу адаптивного выравнивания:

### 3.1. Окна ввода (Формы добавления/редактирования)
* **Селектор**: `sm:items-center` (переключение по ширине экрана).
* **Логика**: На экранах `< 640px` (смартфоны) форма прижимается к низу экрана как Bottom Sheet (`items-end`, скруглены только верхние углы `rounded-t-[32px]`), чтобы до полей было легко дотянуться большим пальцем. На экранах `>= 640px` (планшеты и мониторы) форма центрируется карточкой фиксированной ширины `max-w-xl`.

```tsx
<div className="fixed inset-0 md:left-68 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
  <div className="w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] ...">
```

### 3.2. Окна просмотра данных (Детали стопок, карточки архива)
* **Селектор**: `pointer-fine:items-center` (переключение по типу указателя).
* **Логика**: Соответствует Apple HIG. Если пользователь взаимодействует с устройством тачем (iPad, iPhone, сенсорный ноутбук), окно всегда открывается удобной нижней шторкой независимо от ширины экрана. Если же подключена мышь или трекпад (`pointer-fine`), окно автоматически центрируется по экрану.

```tsx
<div className="fixed inset-y-0 right-0 left-0 md:left-68 flex items-end pointer-fine:items-center justify-center p-0 pointer-fine:p-4 pointer-events-none">
  <div className="w-full max-w-xl rounded-t-[2rem] pointer-fine:rounded-[2.5rem] ...">
```

---

## 4. Защита мобильного статус-бара (Status Bar Shield)

### 4.1. Проблема прозрачной зоны челки / Dynamic Island
Когда мобильная шапка приложения скрывается при скролле вниз, чтобы дать больше пространства для чтения, в верхней зоне экрана (`0` до `env(safe-area-inset-top)`) образуется пустота. В результате при прокрутке текст и суммы залезают прямо под часы `23:13`, Dynamic Island и значок батареи, создавая неопрятный вид и иллюзию «прозрачного статус-бара».

### 4.2. Архитектура Status Bar Shield в `Layout.tsx`
Решение — перманентный фиксированный слой в разметке корневого `Layout`:

```tsx
{/* Mobile Status Bar Shield */}
<div
  className={cn(
    "md:hidden fixed top-0 inset-x-0 z-[55] pointer-events-none transition-colors duration-200",
    theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
  )}
  style={{ height: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
  aria-hidden="true"
/>
```

* **Сплошной цвет без размытия**: Использование чистого фонового цвета темы (`bg-slate-950` / `bg-slate-50`) гарантирует **нулевую нагрузку на GPU** (отсутствие `backdrop-filter`).
* **Высота**: `calc(env(safe-area-inset-top) + 12px)` точно закрывает зону системных значков до верхней границы парящей шапки `top: calc(env(safe-area-inset-top) + 16px)`.

---

## 5. Эталонный паттерн тост-уведомлений (Toast Pattern)

### 5.1. Принцип разделения ответственности (Separation of Concerns)
* **Внешний контейнер**: отвечает **исключительно** за фиксацию на экране (`fixed left-4 right-4 ... pointer-events-none`).
  > **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** вешать классы `transition-all duration-*` на внешний контейнер! CSS-интерполяция конфликтует с покадровым расчетом пружины Framer Motion и вызывает микродрожание (джиттер).
* **Внутренняя карточка тоста**: анимируется через `motion.div` внутри `<AnimatePresence mode="popLayout">`.

### 5.2. Реализация `ToastContainer.tsx`

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { cn } from './utils';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      className={cn(
        // На мобильных — сверху под статус-баром, на десктопе — в правом нижнем углу
        "fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+5.5rem)] sm:left-auto sm:top-auto sm:bottom-4 sm:right-4",
        "flex flex-col items-center sm:items-end gap-2 pointer-events-none z-[9999]"
      )}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          const initialAnim = isMobile
            ? { opacity: 0, y: -24, scale: 0.95 }
            : { opacity: 0, y: 24, scale: 0.95 };

          const exitAnim = isMobile
            ? { opacity: 0, y: -16, scale: 0.95 }
            : { opacity: 0, y: 16, scale: 0.95 };

          return (
            <motion.div
              key={toast.id}
              layout="position"
              initial={initialAnim}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                ...exitAnim,
                transition: { duration: 0.18, ease: 'easeInOut' },
              }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              // Жестовый свайп для смахивания пальцем
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, { offset, velocity }) => {
                if (
                  Math.abs(offset.x) > 60 ||
                  offset.y < -40 ||
                  Math.abs(velocity.x) > 500 ||
                  velocity.y < -500
                ) {
                  onDismiss(toast.id);
                }
              }}
              className={cn(
                "rounded-2xl border px-4 py-3 flex items-center gap-3 pointer-events-auto",
                "bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150",
                "border-slate-200/50 dark:border-white/[0.08] text-slate-900 dark:text-white",
                "shadow-[0_16px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]",
                "max-w-[calc(100vw-2rem)] sm:max-w-md transform-gpu will-change-[transform,opacity] cursor-grab active:cursor-grabbing touch-none"
              )}
            >
              {isError ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : isSuccess ? (
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-sky-500 shrink-0" />
              )}
              <span className="font-medium text-sm tracking-tight leading-snug break-words">
                {toast.message}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

### 5.3. Ключевые параметры пружины тостов
* `type: "spring", stiffness: 450, damping: 32, mass: 0.8`: Высокая жесткость (`450`) при небольшом весе (`0.8`) обеспечивает мгновенный тактильный отклик при возникновении события.
* `layout="position"`: Обеспечивает плавное смещение оставшихся тостов при закрытии соседнего без перерисовки DOM-структуры.
* `drag` + `dragElastic`: Позволяет пользователю смахнуть уведомление в любом направлении одной рукой.
