# Промпт для внедрения архитектурных UI/UX паттернов в целевой проект

Скопируйте текст ниже и отправьте его AI-модели в вашем новом проекте:

```markdown
Ты выступаешь в роли ведущего frontend-архитектора и специалиста по оптимизации производительности мобильного веба и PWA. 

Твоя задача — масштабировать и внедрить в текущий проект эталонные архитектурные паттерны анимации и взаимодействия, исключающие лаги на iOS Safari и десктопе. Ознакомься со спецификациями в `docs/01-modals-and-toasts-animation-patterns.md` и `docs/02-accordions-and-dropdowns-animation-patterns.md` и строго следуй следующим правилам:

### 1. Модальные окна и шторки (Monolithic Spring Pattern):
- Все диалоги и шторки реализуй строго на `@headlessui/react` (`Dialog` со свойствами `static` и `__demoMode` внутри `<AnimatePresence>`).
- Запрещены двойные обёртки и глобальный `layout` на корне карточки (во избежание джиттера на первом кадре). Внутренняя карточка рендерится через `Dialog.Panel as={Fragment}` в один `motion.div`.
- Физика входа: `initial={{ opacity: 0, y: 48, scale: 0.98 }}`, `animate={{ opacity: 1, y: 0, scale: 1 }}`, `transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}`.
- Физика выхода: быстрый уход `exit={{ opacity: 0, y: 32, scale: 0.98, transition: { duration: 0.18, ease: "easeInOut" } }}`.
- На внешнем контейнере позиционирования (`fixed inset-0`) запрещен `overflow-y-auto` (скролл делегируется строго внутреннему телу модалки с `overscroll-contain`).
- Адаптивность: формы ввода переключаются через `sm:items-center` (на мобильных — Bottom Sheet); информационные окна стеков — через `pointer-fine:items-center` (тач-экраны получают Bottom Sheet независимо от ширины дисплея).

### 2. Безрефлоуный скролл-лок на iOS (Zero-Reflow Scroll Lock):
- Создай хук `useModalScrollLock(isOpen, scrollContainerRef)`.
- Категорически запрети мутацию `document.documentElement.style.overflow = "hidden"` (на iOS при `window.scrollY > 0` это разрушает ScrollingTree и вызывает фриз 80–120мс).
- Блокируй прокрутку фона через перехват `touchmove` и `wheel` с опцией `{ passive: false }`, пропуская скролл только внутри `scrollContainerRef`.

### 3. Защитный экран статус-бара (Status Bar Shield):
- В корневом `Layout` для мобильных устройств (`md:hidden`) добавь фиксированный слой `fixed top-0 inset-x-0 z-[55] pointer-events-none` высотой `calc(env(safe-area-inset-top, 0px) + 12px)` со сплошным цветом темы (без тяжелого `backdrop-blur`), чтобы прокрученный текст не налезал на системные часы iOS и Dynamic Island.
- Подложки всех модалок делай глубокими и плотными (`bg-slate-950/90` или `bg-slate-900/90`) без полноэкранного размытия.

### 4. Всплывающие уведомления (Toast Pattern):
- Разделение ответственности: внешний контейнер отвечает ТОЛЬКО за фиксацию (`fixed`, `pointer-events-none`). На нем запрещены классы `transition-all duration-*`.
- Карточки рендерятся внутри `<AnimatePresence mode="popLayout">` с физикой `transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.8 }}` и поддержкой свайп-дисмисса (`drag`).

### 5. Карточки-аккордеоны и стопки (CSS Grid & Occlusion Culling):
- Раскрытие блоков переменной высоты делай строго на чистом CSS Grid: `grid transition-[grid-template-rows,opacity] duration-300 ease-out` (`grid-rows-[0fr]` -> `grid-rows-[1fr]`) с внутренним враппером `overflow-hidden` (никаких измерений высоты через JS!).
- В стопках карточек делай верхнюю карту непрозрачной для аппаратного Occlusion Culling, а выступающие слои оформляй нижними полосками `h-12` вместо 3 полноразмерных слоев (защита от GPU Overdraw).

### 6. Выпадающие списки (DropdownPortal):
- Выноси выпадающие меню во внешний портал `document.body` через компонент `DropdownPortal` с авто-переворотом (Auto-Flip).
- Цикл `requestAnimationFrame` активируй строго при `isOpen === true`, при закрытии цикл мгновенно аннулируй (защита от утечек CPU).

Проведи аудит существующих компонентов проекта, создай необходимые утилитарные хуки и планомерно примени указанные паттерны ко всем диалогам, тостам, аккордеонам и селектам проекта, гарантируя 60/120 FPS и полное отсутствие джиттера.
```
