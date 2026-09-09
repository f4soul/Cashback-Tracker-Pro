/**
 * Реентерабельный менеджер scroll-lock и стека модальных окон.
 *
 * 1. Блокировка скролла (overflow: hidden) устанавливается при первом вызове acquireScrollLock
 *    и снимается только тогда, когда все блокировки освобождены (lockCount === 0).
 * 2. Стек модальных окон гарантирует, что нажатие клавиши Escape и события закрытия
 *    обрабатываются строго в порядке LIFO — закрывается только верхняя активная модалка.
 */

interface ModalStackItem {
  id: string;
  onClose: () => void;
}

let lockCount = 0;
let originalBodyOverflow = "";
const modalStack: ModalStackItem[] = [];

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && modalStack.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    // Закрываем строго только верхнюю модалку в стеке
    const topModal = modalStack[modalStack.length - 1];
    topModal.onClose();
  }
}

/**
 * Захватывает блокировку скролла. Возвращает функцию освобождения блокировки.
 */
export function acquireScrollLock(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseScrollLock();
  };
}

/**
 * Освобождает одну единицу блокировки скролла.
 */
export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
  }
}

/**
 * Регистрирует модальное окно в общем стеке и захватывает scroll-lock.
 * При нажатии Escape закрывается только последняя (верхняя) модалка.
 *
 * @param id Уникальный идентификатор модалки
 * @param onClose Колбэк закрытия модалки
 * @returns Функция unregister для очистки при unmount или isOpen = false
 */
export function registerModal(id: string, onClose: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const releaseLock = acquireScrollLock();
  modalStack.push({ id, onClose });

  if (modalStack.length === 1) {
    window.addEventListener("keydown", handleGlobalKeyDown, true);
  }

  let unregistered = false;
  return () => {
    if (unregistered) return;
    unregistered = true;

    const index = modalStack.findIndex((item) => item.id === id);
    if (index !== -1) {
      modalStack.splice(index, 1);
    }

    if (modalStack.length === 0) {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    }

    releaseLock();
  };
}

/**
 * Возвращает текущее количество захваченных блокировок скролла.
 */
export function getScrollLockCount(): number {
  return lockCount;
}

/**
 * Возвращает текущий размер стека открытых модалок.
 */
export function getModalStackSize(): number {
  return modalStack.length;
}
