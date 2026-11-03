# Архитектурные паттерны: Карточки-аккордеоны, Стопки активов и Выпадающие списки
> **Стек:** React 18/19, TypeScript, Tailwind CSS, Framer Motion (`motion/react`), Headless UI (`@headlessui/react`).
> **Назначение:** Готовый эталонный справочник для переноса архитектуры карточек-аккордеонов без пересчета DOM-геометрии, многослойных стопок карточек с защитой от GPU Overdraw и выпадающих списков с умным портальным позиционированием.

---

## 1. Карточки-аккордеоны на чистом CSS Grid (Zero-Layout-Shift)

### 1.1. Проблематика анимации высоты `height: auto`
Анимация раскрытия элементов переменной высоты (аккордеоны, выпадающие секции параметров, списки фильтров) исторически была одной из самых сложных задач в веб-разработке:
1. **`height: 0` -> `height: auto`** в CSS не интерполируется, так как браузер не знает конечного числового значения.
2. **Анимация `max-height` (например, `max-height: 500px`)** приводит к неравномерной скорости: если реальная высота контента 100px, анимация закрытия первые 80% времени «анимирует пустоту» от 500px до 100px, а само схлопывание происходит за последние 20% времени рывком.
3. **JS-анимация через Framer Motion (`<motion.div animate={{ height }}>`)** вынуждена измерять DOM через `getBoundingClientRect()` или `ResizeObserver`, что при раскрытии нескольких блоков на слабых смартфонах вызывает просадку FPS.

### 1.2. Архитектурный эталон: CSS Grid `grid-template-rows: 0fr -> 1fr`
Современный стандарт CSS позволяет плавно интерполировать фракционные единицы `fr` в свойствах CSS Grid. Браузер вычисляет высоту на уровне композитора без тяжелых JS-таймеров:

```tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './utils';

interface AccordionCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionCard({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all duration-200">
      {/* Кнопка-шапка аккордеона */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer select-none active:bg-slate-50 dark:active:bg-white/[0.02] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col gap-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Индикатор раскрытия с плавной ротацией на 180° */}
        <div
          className={cn(
            "w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isOpen ? "rotate-180 text-primary-500 bg-primary-50 dark:bg-primary-500/10" : ""
          )}
        >
          <ChevronDown className="w-4 h-4 stroke-[2.5px]" />
        </div>
      </button>

      {/* Контейнер CSS Grid анимации */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        )}
      >
        {/* Обязательный внутренний контейнер с overflow-hidden */}
        <div className="overflow-hidden">
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-slate-100 dark:border-white/[0.04]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Интерактивные стопки карточек (Asset Stack Pattern)

### 2.1. Проблема GPU Overdraw (избыточной перерисовки слоев)
Для отображения сгруппированных активов (например, 4 счета в одной валюте или несколько накопительных счетов в одном банке) часто используется визуальный эффект «стопки карт» (когда из-под верхней карточки выглядывают нижние).
* **Ошибка разработчиков**: рендерить 3 полноразмерные карточки высотой по `160px` друг под другом с полупрозрачным фоном `bg-white/90`.
* **Последствия на мобильных**: Видеочип iPhone вынужден каждый кадр смешивать 3 полноразмерных полупрозрачных слоя для каждой стопки. Если на экране 2 стопки, это **6 полноразмерных слоев (3x Overdraw)**. В момент открытия шторки видеопамять захлебывается, и частота кадров падает до 40 FPS.

### 2.2. Архитектурный паттерн Sproutly AssetStack
1. **Аппаратный Occlusion Culling**: Верхняя главная карточка имеет **сплошной непрозрачный фон** (`bg-white dark:bg-slate-950`). Графический конвейер WebKit мгновенно отсекает всё, что находится под ней, не тратя ресурсы на отрисовку скрытых пикселей.
2. **Нижние полоски вместо полноразмерных карт**: В качестве «выглядывающих» подложек рендерятся не полноразмерные карточки, а компактные декоративные полосы высотой всего **`h-12` (48px)**, прижатые к нижнему краю (`inset-x-0 bottom-0`). Визуальный эффект объема на 100% идентичен, но нагрузка на GPU падает в 4 раза.
3. **Изоляция hover-анимаций для сенсорных экранов**: Классы сдвига подложек при наведении мыши предваряются префиксом `pointer-fine:`. Это предотвращает баг мобильного Safari, когда после тапа по карточке hover-состояние «залипает» в открытом виде.

```tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog } from '@headlessui/react';
import { X, Layers } from 'lucide-react';
import { useModalScrollLock } from './useModalScrollLock';

interface AssetStackProps<T> {
  items: T[];
  groupTitle: string;
  groupSubtitle: string;
  renderAggregate: () => React.ReactNode;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
}

export function AssetStack<T>({
  items,
  groupTitle,
  groupSubtitle,
  renderAggregate,
  renderItem,
  getItemKey,
}: AssetStackProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const modalBodyRef = React.useRef<HTMLDivElement>(null);

  useModalScrollLock(expanded, modalBodyRef);

  // Предварительная мемоизация карточек списка:
  // Формируются до тапа, чтобы в момент клика процессор не тратил время на вычисления
  const renderedModalItems = useMemo(() => {
    if (items.length <= 1) return null;
    return items.map((item, index) => (
      <div key={getItemKey(item)} className="w-full">
        {renderItem(item, index)}
      </div>
    ));
  }, [items, getItemKey, renderItem]);

  // Если в группе всего 1 элемент — рендерим обычную карточку без стопки
  if (items.length <= 1) {
    return <div className="w-full">{renderItem(items[0], 0)}</div>;
  }

  return (
    <>
      {/* Внешний интерактивный блок стопки */}
      <div className="relative w-full">
        <div
          onClick={() => setExpanded(true)}
          className="relative group cursor-pointer active:scale-[0.99] transition-transform select-none"
          role="button"
          tabIndex={0}
          style={{ marginBottom: `${Math.min(items.length - 1, 2) * 8}px` }}
        >
          {/* 1. Верхняя непрозрачная карточка (Occlusion Culling) */}
          <div className="relative z-20 w-full bg-white dark:bg-slate-950 rounded-[1.8rem]">
            {renderAggregate()}
          </div>

          {/* 2. Первая подложка (высота всего 48px, а не 160px!) */}
          {items.length > 1 && (
            <div
              className="absolute inset-x-0 bottom-0 h-12 pointer-events-none rounded-[1.8rem] bg-white/75 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/[0.08] shadow-sm pointer-fine:transition-transform pointer-fine:duration-300 z-[19] translate-y-2 scale-[0.96] pointer-fine:group-hover:translate-y-2.5"
            />
          )}

          {/* 3. Вторая подложка (высота 48px) */}
          {items.length > 2 && (
            <div
              className="absolute inset-x-0 bottom-0 h-12 pointer-events-none rounded-[1.8rem] bg-white/55 dark:bg-slate-900/60 border border-slate-200/30 dark:border-white/[0.08] shadow-sm pointer-fine:transition-transform pointer-fine:duration-300 z-[18] translate-y-4 scale-[0.92] pointer-fine:group-hover:translate-y-5"
            />
          )}
        </div>
      </div>

      {/* Модальное окно детализации стопки */}
      <AnimatePresence>
        {expanded && (
          <Dialog
            as="div"
            className="fixed inset-0 z-[100] pointer-events-none"
            open={true}
            onClose={() => setExpanded(false)}
            static
            __demoMode
          >
            {/* Адаптивное выравнивание: тач = снизу (items-end), мышь = по центру (pointer-fine:items-center) */}
            <div className="fixed inset-y-0 right-0 left-0 md:left-68 flex items-end pointer-fine:items-center justify-center p-0 pointer-fine:p-4 pointer-events-none">
              {/* Глубокое матовое затемнение без тяжелого GPU-blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 md:left-68 bg-slate-950/60 dark:bg-slate-950/90 cursor-pointer pointer-events-auto"
                onClick={() => setExpanded(false)}
              />

              <Dialog.Panel as={React.Fragment}>
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
                  className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-950 rounded-t-[2rem] rounded-b-none pointer-fine:rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-200/60 dark:border-white/[0.08] flex flex-col max-h-[90vh] pointer-fine:max-h-[85vh] transform-gpu will-change-[transform,opacity]"
                >
                  {/* Шапка шторки */}
                  <div className="px-6 py-5 sm:px-8 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
                        <Layers className="w-5 h-5 text-primary-500" />
                        {groupTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {groupSubtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors active:scale-90"
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Список карточек стопки */}
                  <div
                    ref={modalBodyRef}
                    className="p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-6 overflow-y-auto overscroll-contain flex flex-col gap-3 [&::-webkit-scrollbar]:hidden"
                  >
                    {renderedModalItems}
                  </div>
                </motion.div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## 3. Выпадающие списки и портальное позиционирование (`DropdownPortal`)

### 3.1. Проблема обрезки родительскими контейнерами
В сложных интерфейсах поля выбора часто находятся внутри карточек или модальных окон с `overflow: hidden` или `overflow-y: auto`. В стандартном рендеринге выпадающий список либо оказывается обрезан границей карточки, либо принудительно расширяет скроллбар модалки.
* **Решение**: рендерить меню выпадающего списка во внешний портал `document.body` с абсолютными координатами относительно целевого элемента.

### 3.2. Предотвращение утечек производительности (`rAF Leak`)
Если отслеживать координаты элемента через `requestAnimationFrame` постоянно, это загружает процессор на 60–120 вызовов в секунду даже когда меню закрыто!
* **Паттерн DropdownPortal**: цикл анимации и слушатели событий активны **строго при `isOpen === true`**. При закрытии цикл мгновенно аннулируется через `cancelAnimationFrame`.
* **Grace Period**: сохранение монтирования на 150мс (`keepMounted`), чтобы Headless UI успел проиграть плавный уход (`Transition.leave`).

```tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement | null>;
  align?: 'left' | 'right';
  matchWidth?: boolean;
  minWidth?: number;
  offset?: number;
  isOpen?: boolean;
}

export function DropdownPortal({
  children,
  targetRef,
  align = 'left',
  matchWidth = false,
  minWidth,
  offset = 8,
  isOpen = true,
}: DropdownPortalProps) {
  const [coords, setCoords] = useState<{
    top: number | 'auto';
    bottom: number | 'auto';
    left: number;
    right: number;
    width: number;
  }>({ top: -9999, bottom: 'auto', left: -9999, right: -9999, width: 0 });

  const [isMounted, setIsMounted] = useState(false);
  const [keepMounted, setKeepMounted] = useState(isOpen);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Grace Period для плавных анимаций Transition leave
  useEffect(() => {
    if (isOpen) {
      setKeepMounted(true);
      return;
    }
    const timer = setTimeout(() => setKeepMounted(false), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return; // Не запускать rAF, если меню закрыто!

    let animationFrameId: number;
    let isRunning = true;

    let lastTop: number | 'auto' = -9999;
    let lastBottom: number | 'auto' = 'auto';
    let lastLeft = -9999;
    let lastRight = -9999;
    let lastWidth = 0;

    const updatePosition = () => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();

        const spaceBelow = window.innerHeight - rect.bottom - offset;
        const spaceAbove = rect.top - offset;
        const dropdownHeight = 240; // Стандартная максимальная высота списка

        let finalTop: number | 'auto' = rect.bottom + offset;
        let finalBottom: number | 'auto' = 'auto';

        // Авто-переворот вверх, если снизу мало места, а сверху больше
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          finalTop = 'auto';
          finalBottom = window.innerHeight - rect.top + offset;
        }

        let newLeft = rect.left;
        const newRight = window.innerWidth - rect.right;
        const newWidth = rect.width;

        const effectiveMinWidth = minWidth || 0;
        const expectedWidth = Math.max(newWidth, effectiveMinWidth);
        if (align === 'left' && newLeft + expectedWidth > window.innerWidth - 16) {
          newLeft = Math.max(16, window.innerWidth - expectedWidth - 16);
        }

        if (
          finalTop !== lastTop ||
          finalBottom !== lastBottom ||
          newLeft !== lastLeft ||
          newRight !== lastRight ||
          newWidth !== lastWidth
        ) {
          lastTop = finalTop;
          lastBottom = finalBottom;
          lastLeft = newLeft;
          lastRight = newRight;
          lastWidth = newWidth;

          setCoords({
            top: finalTop,
            bottom: finalBottom,
            left: newLeft,
            right: newRight,
            width: newWidth,
          });
        }
      }
    };

    updatePosition();

    const loop = () => {
      if (!isRunning) return;
      updatePosition();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [isOpen, targetRef, offset, align, minWidth]);

  const active = isOpen || keepMounted;
  if (!isMounted || !active || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        ...(coords.top !== 'auto' ? { top: coords.top } : {}),
        ...(coords.bottom !== 'auto' ? { bottom: coords.bottom } : {}),
        ...(align === 'left' ? { left: coords.left } : {}),
        ...(align === 'right' ? { right: coords.right } : {}),
        ...(matchWidth
          ? {
              minWidth: minWidth ? Math.max(coords.width, minWidth) : coords.width,
              width: minWidth && coords.width < minWidth ? 'max-content' : coords.width,
              maxWidth: 'min(calc(100vw - 32px), 420px)',
            }
          : {
              minWidth: minWidth || 'max-content',
              maxWidth: 'min(calc(100vw - 32px), 420px)',
            }),
        zIndex: 99999,
      }}
      className="pointer-events-auto"
    >
      {children}
    </div>,
    document.body
  );
}
```

### 3.3. Пример связки: Кастомный стеклянный `GlassSelect`
Пример объединения `@headlessui/react` `Listbox` с `DropdownPortal`:

```tsx
import React, { useRef, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal';
import { cn } from './utils';

interface Option {
  id: string;
  label: string;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
}: {
  value?: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((o) => o.id === value);

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative w-full">
          <Listbox.Button
            ref={buttonRef}
            className="w-full h-11 px-4 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-sm font-medium text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.99] cursor-pointer"
          >
            <span className={cn("truncate", !selectedOption && "text-slate-400")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2",
                open && "rotate-180 text-primary-500"
              )}
            />
          </Listbox.Button>

          <DropdownPortal targetRef={buttonRef} matchWidth isOpen={open}>
            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-150"
              enterFrom="transform opacity-0 scale-95 -translate-y-1"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 -translate-y-1"
            >
              <Listbox.Options
                static
                className="max-h-60 overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] p-1.5 shadow-2xl focus:outline-none space-y-0.5"
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    value={option.id}
                    className={({ active, selected }) =>
                      cn(
                        "w-full px-3 py-2.5 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-colors select-none",
                        active ? "bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300",
                        selected && "font-bold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-500/10"
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="truncate">{option.label}</span>
                        {selected && <Check className="w-4 h-4 text-primary-500 shrink-0 ml-2" />}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </DropdownPortal>
        </div>
      )}
    </Listbox>
  );
}
```
