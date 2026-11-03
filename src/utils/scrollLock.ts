/**
 * Реентерабельный менеджер стека модальных окон (LIFO Escape handling).
 *
 * ВАЖНО: Мы намеренно НЕ мутируем document.body.style.overflow = "hidden",
 * чтобы избежать синхронного Reflow и разрушения WebKit ScrollingTree на iOS Safari
 * при открытии модалки, когда window.scrollY > 0.
 * Физическая блокировка скролла выполняется через хук useModalScrollLock.
 */

interface ModalStackItem {
  id: string;
  onClose: () => void;
}

let lockCount = 0;
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
 * Захватывает счётчик блокировки скролла (без мутации DOM style.overflow).
 */
export function acquireScrollLock(): () => void {
  if (typeof document === "undefined") return () => {};

  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseScrollLock();
  };
}

/**
 * Освобождает одну единицу счётчика блокировки скролла.
 */
export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
}

/**
 * Регистрирует модальное окно в общем стеке LIFO.
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
