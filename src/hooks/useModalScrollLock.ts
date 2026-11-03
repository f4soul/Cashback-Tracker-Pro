import { useEffect, RefObject } from "react";

/**
 * Блокирует фоновый скролл страницы через перехват событий (touchmove / wheel),
 * НЕ изменяя CSS-свойство overflow у <html> или <body>.
 *
 * Это критически важно для iOS Safari / WebKit: изменение overflow: hidden на корнях
 * документа в момент открытия модалки, когда страница прокручена (window.scrollY > 0),
 * вызывает синхронный пересчёт всего дерева (Reflow) и перестройку композитных слоёв
 * скролла, что приводит к фризу (рывку) на первых кадрах spring-анимации.
 */
export function useModalScrollLock(
  isOpen: boolean,
  scrollContainerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!isOpen) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const findScrollableInModal = (
      target: EventTarget | null,
      container: HTMLElement | null,
    ): HTMLElement | null => {
      if (!container || !(target instanceof Node)) return null;
      if (!container.contains(target)) return null;

      let el: HTMLElement | null =
        target instanceof HTMLElement ? target : target.parentElement;

      while (el && container.contains(el)) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const isScrollable =
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 1;

        if (isScrollable) {
          return el;
        }
        if (el === container) break;
        el = el.parentElement;
      }

      return null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Разрешаем мультитач-жесты (например, пинч-зум)
      if (e.touches.length > 1) return;

      const container = scrollContainerRef.current;
      const scrollable = findScrollableInModal(e.target, container);

      // Если жест вне скроллящейся области модалки — блокируем скролл фона
      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Проверяем границы скролла внутри модалки, чтобы предотвратить rubber-band пробитие на body
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // > 0 — скролл вниз (палец вверх), < 0 — скролл вверх (палец вниз)

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = deltaY < 0 && scrollTop <= 0;
      const isAtBottom =
        deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1;

      if (isAtTop || isAtBottom) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const container = scrollContainerRef.current;
      const scrollable = findScrollableInModal(e.target, container);

      if (!scrollable) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const deltaY = e.deltaY;
      const isAtTop = deltaY < 0 && scrollTop <= 0;
      const isAtBottom =
        deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1;

      if (isAtTop || isAtBottom) {
        if (e.cancelable) e.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen, scrollContainerRef]);
}
