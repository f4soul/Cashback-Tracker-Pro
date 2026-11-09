import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { MonthData, CashbackEntry, Bank, LogoShape } from "../types";
import {
  getCurrentMonthId,
  getNextMonthId,
  getPreviousMonthId,
} from "../utils/date";
import { pluralize } from "../utils/format";
import { Modal } from "../components/ui/Modal";
import { BankForm } from "../components/BankForm";
import { CashbackTable } from "../components/CashbackTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { exportToPDF, exportToExcel, exportToImage } from "../utils/export";
import { BankLogo } from "../components/BankLogo";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Table as TableIcon,
  LayoutList,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { getBankDetails } from "../constants";
import { clsx } from "clsx";
import { motion } from "motion/react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DraggableAttributes,
  DraggableSyntheticListeners,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CurrentMonthProps {
  data: MonthData;
  selectedMonthId: string;
  onMonthChange: (monthId: string) => void;
  customBanks: Bank[];
  deletedCustomBanks?: Bank[];
  customCategories: string[];
  onUpdate: (data: MonthData) => void;
  onDeleteEntry: (id: string) => void;
  onAddCustomBank: (bank: Bank) => void;
  onDeleteCustomBank: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
  onDeleteCustomCategory: (category: string) => void;
  globalLogoShape: LogoShape;
  isExiting?: boolean;
}

interface SortableBankCardProps {
  entry: CashbackEntry;
  bank: Bank;
  logoShape: LogoShape;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

interface BankCardProps {
  entry: CashbackEntry;
  bank: Bank;
  logoShape: LogoShape;
  index?: number;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  style?: React.CSSProperties;
}

const BankCard = React.forwardRef<HTMLDivElement, BankCardProps>(
  (
    {
      entry,
      bank,
      logoShape,
      index,
      onEdit,
      onDelete,
      isDragging,
      isOverlay,
      attributes,
      listeners,
      style,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        style={style}
        className={clsx(
          "flex items-center justify-between p-3 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] rounded-control border border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] group/card select-none hover:bg-[var(--fill-hover)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] hover:border-[var(--accent-color)]/30 transition-[background-color,border-color,box-shadow,opacity] duration-200 translate-z-0 [backface-visibility:hidden]",
          isDragging && !isOverlay && "opacity-0",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className={clsx(
              "p-3 -ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0 touch-none transition-colors active:scale-95",
              "cursor-grab active:cursor-grabbing",
            )}
            style={{ touchAction: "none" }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="relative shrink-0">
            {index !== undefined && (
              <div className="absolute -top-1.5 -left-1.5 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full surface-solid border border-[var(--border-strong)] text-[9px] font-bold tabular-nums leading-none text-[var(--text-secondary)] shadow-sm pointer-events-none">
                {index + 1}
              </div>
            )}
            <BankLogo
              bank={bank}
              customLogo={entry.customLogo}
              logoShape={logoShape}
              size="lg"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-[var(--text-primary)] truncate leading-tight">
              {bank.name}
            </h3>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] truncate leading-none mt-1">
              {entry.categories.length}{" "}
              {pluralize(entry.categories.length, [
                "категория",
                "категории",
                "категорий",
              ])}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2 relative z-10">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--percent-bg)] rounded-control transition-[color,background-color,transform] cursor-pointer active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-control transition-[color,background-color,transform] cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
);

const SortableBankCard: React.FC<SortableBankCardProps> = memo(
  ({ entry, bank, logoShape, index, onEdit, onDelete }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: entry.id,
      transition: {
        duration: 250,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    });

    const wrapperStyle: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      position: "relative",
      zIndex: isDragging ? 50 : 1,
    };

    return (
      <div ref={setNodeRef} style={wrapperStyle}>
        <BankCard
          entry={entry}
          bank={bank}
          logoShape={logoShape}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          isDragging={isDragging}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
    );
  },
);

export const CurrentMonth: React.FC<CurrentMonthProps> = memo(
  ({
    data,
    selectedMonthId,
    onMonthChange,
    customBanks,
    deletedCustomBanks = [],
    customCategories,
    onUpdate,
    onDeleteEntry,
    onAddCustomBank,
    onDeleteCustomBank,
    onAddCustomCategory,
    onDeleteCustomCategory,
    globalLogoShape,
    isExiting = false,
  }) => {
    const allCustomBanks = useMemo(
      () => [...customBanks, ...deletedCustomBanks],
      [customBanks, deletedCustomBanks],
    );

    const date = new Date().getDate();
    const isAfter25 = date >= 25;
    const isBefore5th = date <= 5;
    const showSwitcher = isAfter25 || isBefore5th;

    const currentMonthId = getCurrentMonthId();
    const nextMonthId = getNextMonthId();
    const prevMonthId = getPreviousMonthId();

    const switcherMonthIds = isAfter25
      ? [currentMonthId, nextMonthId]
      : isBefore5th
        ? [prevMonthId, currentMonthId]
        : [currentMonthId];
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragWidth, setActiveDragWidth] = useState<number | undefined>(
      undefined,
    );
    const [isGridLayout, setIsGridLayout] = useState(
      () => typeof window !== "undefined" && window.innerWidth >= 1024,
    );
    useEffect(() => {
      const handleResize = () => setIsGridLayout(window.innerWidth >= 1024);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CashbackEntry | undefined>(
      undefined,
    );
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<"table" | "list">("table");
    const [isFabHidden, setIsFabHidden] = useState(false);
    const [dragConstraints, setDragConstraints] = useState({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
    const [restoreConstraints, setRestoreConstraints] = useState({
      top: 0,
      bottom: 0,
    });
    const [yOffset, setYOffset] = useState(() => {
      const saved = localStorage.getItem("fab_y_offset");
      if (!saved) return 0;
      const parsed = parseInt(saved, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });
    const [rightPos, setRightPos] = useState(16);
    const isDraggingFab = useRef(false);
    const isDraggingRestore = useRef(false);
    const fabPointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const restorePointerStartRef = useRef<{ x: number; y: number } | null>(
      null,
    );
    const lastScrollYRef = useRef(
      typeof window !== "undefined" ? window.scrollY : 0,
    );
    const scrollDownStartYRef = useRef(
      typeof window !== "undefined" ? window.scrollY : 0,
    );
    const fabHideLockedUntil = useRef(0);

    useEffect(() => {
      localStorage.removeItem("fab_hidden");
    }, []);

    useEffect(() => {
      if (Number.isFinite(yOffset)) {
        localStorage.setItem("fab_y_offset", yOffset.toString());
      }
    }, [yOffset]);

    useEffect(() => {
      const currentY = Math.max(0, window.scrollY);
      lastScrollYRef.current = currentY;
      scrollDownStartYRef.current = currentY;

      const canAutoHideFab = () =>
        window.innerWidth < 1280 &&
        !isFabHidden &&
        !isModalOpen &&
        !isDeleteModalOpen &&
        !isDraggingFab.current &&
        !isDraggingRestore.current &&
        Date.now() >= fabHideLockedUntil.current;

      const handleScroll = () => {
        const y = Math.max(0, window.scrollY);

        if (!canAutoHideFab()) {
          lastScrollYRef.current = y;
          scrollDownStartYRef.current = y;
          return;
        }

        if (y < lastScrollYRef.current) {
          scrollDownStartYRef.current = y;
        }
        lastScrollYRef.current = y;

        const downDelta = y - scrollDownStartYRef.current;
        const maxScrollY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );

        // 1. Стандартный длинный скролл вниз
        if (downDelta >= 28 && y > 36) {
          setIsFabHidden(true);
          return;
        }

        // 2. Короткий ход скролла (например, планшеты, где до низа страницы всего 10–90px)
        if (
          maxScrollY > 0 &&
          maxScrollY <= 90 &&
          downDelta >= 6 &&
          (y >= maxScrollY - 4 || downDelta >= 14)
        ) {
          setIsFabHidden(true);
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (!canAutoHideFab() || e.deltaY <= 14) return;

        const y = Math.max(0, window.scrollY);
        const maxScrollY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );

        // Если страница почти не скроллится или уже упёрлась в низ — прокрутка колеса вниз прячет кнопку
        if (maxScrollY <= 90 && y >= maxScrollY - 4) {
          setIsFabHidden(true);
        }
      };

      // ВАЖНО: passive:true и БЕЗ capture — слушаем только страничный скролл,
      // внутренние контейнеры (модалки, списки) скрытие не триггерят.
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("wheel", handleWheel);
      };
    }, [isFabHidden, isModalOpen, isDeleteModalOpen]);

    useEffect(() => {
      const updateConstraints = () => {
        const isDesktop = window.innerWidth >= 768;
        const isWide = window.innerWidth >= 1280;

        if (window.innerWidth >= 1280) {
          setIsFabHidden(false);
        }

        const fabSize = 56;
        const restoreHeight = 56;
        const sidebarWidth = isDesktop ? 280 : 0;

        if (isDesktop) {
          const contentAreaWidth = window.innerWidth - sidebarWidth;
          const tableMaxWidth = 896; // max-w-4xl
          const contentMargin = (contentAreaWidth - tableMaxWidth) / 2;

          // On desktop, we want to place the FAB outside the table to avoid overlap
          if (contentMargin > 80) {
            setRightPos(contentMargin - 64);
          } else if (isWide) {
            setRightPos(24);
          } else {
            setRightPos(16);
          }
        } else {
          setRightPos(20);
        }

        const margin = 24;
        const headerHeight = isDesktop ? 60 : 84;
        const bottomNavHeight = isDesktop ? 40 : 100;

        const minTop = headerHeight + margin;
        const maxBottom =
          window.innerHeight - bottomNavHeight - fabSize - margin;

        const initialBottom = isDesktop ? 32 : 110;
        const initialY = window.innerHeight - initialBottom - fabSize;

        setDragConstraints({
          top: minTop - initialY,
          bottom: maxBottom - initialY,
          left: 0,
          right: 80,
        });

        const restoreInitialY =
          window.innerHeight - initialBottom - restoreHeight;
        setRestoreConstraints({
          top: minTop - restoreInitialY,
          bottom:
            window.innerHeight -
            bottomNavHeight -
            restoreHeight -
            margin -
            restoreInitialY,
        });
      };
      updateConstraints();
      window.addEventListener("resize", updateConstraints);
      return () => window.removeEventListener("resize", updateConstraints);
    }, []);

    const snapToPosition = useCallback(
      (currentY: number) => {
        const top = dragConstraints.top;
        const bottom = dragConstraints.bottom;
        const center = (top + bottom) / 2;

        const points = [top, center, bottom];
        return points.reduce((prev, curr) =>
          Math.abs(curr - currentY) < Math.abs(prev - currentY) ? curr : prev,
        );
      },
      [dragConstraints],
    );

    useEffect(() => {
      if (dragConstraints.bottom !== 0) {
        const saved = localStorage.getItem("fab_y_offset");
        if (!saved) {
          setYOffset(snapToPosition(0));
        } else {
          const parsed = parseInt(saved, 10);
          if (!Number.isFinite(parsed)) {
            setYOffset(snapToPosition(0));
          } else if (
            dragConstraints.top < dragConstraints.bottom &&
            (parsed < dragConstraints.top || parsed > dragConstraints.bottom)
          ) {
            setYOffset(snapToPosition(parsed));
          }
        }
      }
    }, [dragConstraints, snapToPosition]);

    const sensors = useSensors(
      useSensor(MouseSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
      useSensor(TouchSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const handleSaveEntry = useCallback(
      (entryData: Omit<CashbackEntry, "id">) => {
        let newEntries = [...data.entries];
        if (editingEntry) {
          newEntries = newEntries.map((e) =>
            e.id === editingEntry.id
              ? { ...entryData, id: editingEntry.id }
              : e,
          );
        } else {
          newEntries.push({ ...entryData, id: crypto.randomUUID() });
        }

        onUpdate({ ...data, entries: newEntries });
        setIsModalOpen(false);
        setEditingEntry(undefined);
      },
      [data, editingEntry, onUpdate],
    );

    const handleDeleteEntry = useCallback((id: string) => {
      setEntryIdToDelete(id);
      setIsDeleteModalOpen(true);
    }, []);

    const confirmDeleteEntry = useCallback(() => {
      if (entryIdToDelete) {
        onDeleteEntry(entryIdToDelete);
        setEntryIdToDelete(null);
      }
    }, [entryIdToDelete, onDeleteEntry]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
      setActiveDragId(event.active.id as string);
      setActiveDragWidth(event.active.rect.current.initial?.width ?? undefined);
    }, []);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        setActiveDragId(null);
        const { active, over } = event;

        if (over && active.id !== over.id) {
          const oldIndex = data.entries.findIndex((e) => e.id === active.id);
          const newIndex = data.entries.findIndex((e) => e.id === over.id);

          const newEntries = arrayMove(data.entries, oldIndex, newIndex);
          onUpdate({ ...data, entries: newEntries });
        }
      },
      [data, onUpdate],
    );

    const handleExport = useCallback(async () => {
      await exportToPDF("current-cashback-table", `Кэшбек_${data.monthId}.pdf`);
    }, [data.monthId]);

    const handleExportExcel = useCallback(async () => {
      await exportToExcel(data, allCustomBanks, `Кэшбек_${data.monthId}.xlsx`);
    }, [data, allCustomBanks]);

    const handleExportImage = useCallback(async () => {
      await exportToImage(
        "current-cashback-table",
        `Кэшбек_${data.monthId}.png`,
      );
    }, [data.monthId]);

    return (
      <div className="flex flex-col relative gap-1">
        {mounted &&
          !isExiting &&
          createPortal(
            <>
              <motion.div
                id="fab-container"
                drag={!isFabHidden ? "y" : false}
                dragConstraints={dragConstraints}
                dragElastic={0.1}
                dragMomentum={false}
                initial={false}
                animate={
                  isFabHidden
                    ? {
                        opacity: 0,
                        scale: 0.65,
                        x: rightPos + 36,
                        y: yOffset,
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: yOffset,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                onPointerDown={(e) => {
                  fabPointerStartRef.current = { x: e.clientX, y: e.clientY };
                  fabHideLockedUntil.current = Date.now() + 900;
                }}
                onPointerMove={(e) => {
                  const start = fabPointerStartRef.current;
                  if (!start || isFabHidden) return;
                  const dx = e.clientX - start.x;
                  const dy = e.clientY - start.y;

                  // Ручное смахивание кнопки вправо за край экрана
                  if (dx >= 18 && dx > Math.abs(dy) * 1.1) {
                    fabPointerStartRef.current = null;
                    isDraggingFab.current = true;
                    setIsFabHidden(true);
                    setTimeout(() => {
                      isDraggingFab.current = false;
                    }, 120);
                  }
                }}
                onPointerUp={() => {
                  fabPointerStartRef.current = null;
                }}
                onPointerCancel={() => {
                  fabPointerStartRef.current = null;
                }}
                onDragStart={() => {
                  isDraggingFab.current = true;
                }}
                onDragEnd={(_e, info) => {
                  fabPointerStartRef.current = null;

                  // Если жест завершился заметным смещением вправо — прячем кнопку
                  if (
                    info.offset.x >= 20 &&
                    info.offset.x > Math.abs(info.offset.y)
                  ) {
                    setIsFabHidden(true);
                    setTimeout(() => {
                      isDraggingFab.current = false;
                    }, 80);
                    return;
                  }

                  if (Math.abs(info.offset.y) < 8) {
                    isDraggingFab.current = false;
                    return;
                  }

                  setTimeout(() => {
                    isDraggingFab.current = false;
                  }, 80);

                  const finalY = yOffset + info.offset.y;
                  const top = dragConstraints.top;
                  const bottom = dragConstraints.bottom;
                  const center = (top + bottom) / 2;
                  const points = [top, center, bottom];

                  const snappedY = points.reduce((prev, curr) =>
                    Math.abs(curr - finalY) < Math.abs(prev - finalY)
                      ? curr
                      : prev,
                  );
                  setYOffset(snappedY);
                }}
                aria-hidden={isFabHidden}
                className="fixed xl:hidden pwa-fab-bottom z-50 touch-none select-none"
                style={{
                  right: rightPos,
                  willChange: "transform, opacity",
                  touchAction: "none",
                  pointerEvents: isFabHidden ? "none" : "auto",
                }}
              >
                <button
                  type="button"
                  tabIndex={isFabHidden ? -1 : 0}
                  onClick={(e) => {
                    if (isDraggingFab.current || isFabHidden) {
                      e.preventDefault();
                      return;
                    }
                    setEditingEntry(undefined);
                    setIsModalOpen(true);
                  }}
                  title="Добавить банк (смахните вправо, чтобы скрыть)"
                  className="w-14 h-14 bg-[var(--accent-color)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--accent-color)]/30 hover:shadow-[var(--accent-color)]/40 hover:brightness-110 transition-[filter,box-shadow,transform] cursor-pointer active:scale-95 border border-white/20"
                >
                  <Plus className="w-7 h-7" />
                </button>
              </motion.div>

              <motion.div
                id="fab-restore"
                drag={isFabHidden ? "y" : false}
                dragConstraints={restoreConstraints}
                dragElastic={0.1}
                dragMomentum={false}
                initial={false}
                animate={
                  isFabHidden
                    ? {
                        opacity: 0.85,
                        x: 0,
                        y: yOffset,
                      }
                    : {
                        opacity: 0,
                        x: 24,
                        y: yOffset,
                      }
                }
                whileHover={
                  isFabHidden
                    ? {
                        opacity: 1,
                      }
                    : undefined
                }
                whileTap={
                  isFabHidden
                    ? {
                        scale: 0.95,
                      }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                onPointerDown={(e) => {
                  restorePointerStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                  };
                  fabHideLockedUntil.current = Date.now() + 1200;
                }}
                onPointerMove={(e) => {
                  const start = restorePointerStartRef.current;
                  if (!start || !isFabHidden) return;
                  const dx = e.clientX - start.x;
                  const dy = e.clientY - start.y;

                  // Ручное вытягивание ярлычка влево
                  if (dx <= -10 && Math.abs(dx) > Math.abs(dy)) {
                    restorePointerStartRef.current = null;
                    fabHideLockedUntil.current = Date.now() + 1200;
                    setIsFabHidden(false);
                  }
                }}
                onPointerUp={() => {
                  restorePointerStartRef.current = null;
                }}
                onPointerCancel={() => {
                  restorePointerStartRef.current = null;
                }}
                onClick={() => {
                  if (isDraggingRestore.current || !isFabHidden) return;
                  fabHideLockedUntil.current = Date.now() + 1200;
                  setIsFabHidden(false);
                }}
                onDragStart={() => {
                  isDraggingRestore.current = true;
                }}
                onDragEnd={(_e, info) => {
                  restorePointerStartRef.current = null;
                  if (Math.abs(info.offset.y) < 8) {
                    isDraggingRestore.current = false;
                    fabHideLockedUntil.current = Date.now() + 1200;
                    setIsFabHidden(false);
                    return;
                  }

                  setTimeout(() => {
                    isDraggingRestore.current = false;
                  }, 80);

                  const finalY = yOffset + info.offset.y;
                  const top = restoreConstraints.top;
                  const bottom = restoreConstraints.bottom;
                  const center = (top + bottom) / 2;
                  const points = [top, center, bottom];

                  const snappedY = points.reduce((prev, curr) =>
                    Math.abs(curr - finalY) < Math.abs(prev - finalY)
                      ? curr
                      : prev,
                  );
                  setYOffset(snappedY);
                }}
                aria-hidden={!isFabHidden}
                className="fixed xl:hidden pwa-fab-bottom w-6 h-14 bg-[var(--accent-color)] text-white flex flex-col items-center justify-center shadow-[-2px_0_8px_rgba(0,0,0,0.18)] dark:shadow-[-2px_0_12px_rgba(0,0,0,0.4)] z-50 group cursor-pointer active:cursor-grabbing rounded-xl rounded-r-none touch-none select-none border-y border-l border-white/20"
                style={{
                  right: 0,
                  transformOrigin: "right center",
                  willChange: "transform, opacity",
                  touchAction: "none",
                  pointerEvents: isFabHidden ? "auto" : "none",
                }}
                title="Показать кнопку (нажмите или потяните влево)"
              >
                <div className="flex flex-col items-center justify-center -space-y-0.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ChevronUp className="w-3.5 h-3.5" />
                  <Plus className="w-4 h-4" />
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            </>,
            document.body,
          )}

        {/* Mobile & Portrait Tablet Switcher (< 1024px) — Slim Low-Profile */}
        <div className="flex lg:hidden p-0.5 gap-0.5 relative bg-white dark:bg-[var(--surface-1)] rounded-control border border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] w-full translate-z-0 [backface-visibility:hidden] z-10">
          <div
            className="absolute inset-y-0.5 rounded-[max(6px,calc(var(--radius-sm)-2px))] bg-[var(--fill-hover)] shadow-sm z-0 transition-[left,right] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              left: activeSubTab === "table" ? "0.125rem" : "50%",
              right: activeSubTab === "table" ? "50%" : "0.125rem",
            }}
          />
          <button
            type="button"
            onClick={() => setActiveSubTab("table")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[max(6px,calc(var(--radius-sm)-2px))] text-[10px] font-semibold transition-colors cursor-pointer relative z-10 whitespace-nowrap",
              activeSubTab === "table"
                ? "text-[var(--accent-color)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <TableIcon className="w-3 h-3 shrink-0" />
            <span className="leading-none uppercase">Таблица</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("list")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-[max(6px,calc(var(--radius-sm)-2px))] text-[10px] font-semibold transition-colors cursor-pointer relative z-10 whitespace-nowrap",
              activeSubTab === "list"
                ? "text-[var(--accent-color)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <LayoutList className="w-3 h-3 shrink-0" />
            <span className="leading-none uppercase">Список банков</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="relative">
          <CashbackTable
            id="current-cashback-table"
            monthId={data.monthId}
            entries={data.entries}
            customBanks={allCustomBanks}
            globalLogoShape={globalLogoShape}
            onExportPDF={handleExport}
            onExportExcel={handleExportExcel}
            onExportImage={handleExportImage}
            selectedMonthId={selectedMonthId}
            onMonthChange={onMonthChange}
            allMonthIds={switcherMonthIds}
            isAfter25={showSwitcher}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
            onAddBank={() => {
              setEditingEntry(undefined);
              setIsModalOpen(true);
            }}
            listViewContent={
              data.entries.length === 0 ? (
                <button
                  onClick={() => {
                    setEditingEntry(undefined);
                    setIsModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-1)] rounded-card border border-dashed border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors group w-full cursor-pointer"
                >
                  <Plus className="w-8 h-8 text-[var(--text-tertiary)] mb-2 group-hover:text-[var(--accent-color)] transition-colors" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Добавьте первый банк
                  </p>
                </button>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={isGridLayout ? [] : [restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={data.entries.map((e) => e.id)}
                    strategy={
                      isGridLayout
                        ? rectSortingStrategy
                        : verticalListSortingStrategy
                    }
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {data.entries.map((entry, index) => {
                        const bank =
                          getBankDetails(
                            entry.bankId,
                            entry.customBankName,
                          ) ||
                          (entry.bankId.startsWith("custom_")
                            ? allCustomBanks.find(
                                (b) => b.id === entry.bankId,
                              )
                            : null);

                        if (!bank) return null;

                        const logoShape = globalLogoShape || "circle";

                        return (
                          <SortableBankCard
                            key={entry.id}
                            entry={entry}
                            bank={bank}
                            logoShape={logoShape}
                            index={index}
                            onEdit={() => {
                              setEditingEntry(entry);
                              setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeleteEntry(entry.id)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>

                  {createPortal(
                    <DragOverlay
                      dropAnimation={{
                        duration: 200,
                        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
                      }}
                    >
                      {activeDragId ? (
                        <div style={{ width: activeDragWidth }}>
                          <BankCard
                            isOverlay
                            index={data.entries.findIndex(
                              (e) => e.id === activeDragId,
                            )}
                            entry={data.entries.find(
                              (e) => e.id === activeDragId,
                            )!}
                            bank={
                              getBankDetails(
                                data.entries.find(
                                  (e) => e.id === activeDragId,
                                )?.bankId || "",
                                data.entries.find(
                                  (e) => e.id === activeDragId,
                                )?.customBankName,
                              ) ||
                              (data.entries
                                .find((e) => e.id === activeDragId)
                                ?.bankId.startsWith("custom_")
                                ? allCustomBanks.find(
                                    (b) =>
                                      b.id ===
                                      data.entries.find(
                                        (e) => e.id === activeDragId,
                                      )?.bankId,
                                  )
                                : null)!
                            }
                            logoShape={globalLogoShape || "circle"}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            style={{
                              scale: 1.02,
                              rotate: "1.5deg",
                              opacity: 0.95,
                              boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                            }}
                          />
                        </div>
                      ) : null}
                    </DragOverlay>,
                    document.body,
                  )}
                </DndContext>
              )
            }
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEntry ? "Редактировать банк" : "Добавить банк"}
        >
          <BankForm
            initialEntry={editingEntry}
            customBanks={customBanks}
            customCategories={customCategories}
            onSave={handleSaveEntry}
            onAddCustomBank={onAddCustomBank}
            onDeleteCustomBank={onDeleteCustomBank}
            onAddCustomCategory={onAddCustomCategory}
            onDeleteCustomCategory={onDeleteCustomCategory}
            globalLogoShape={globalLogoShape}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteEntry}
          title="Удалить банк?"
          message="Вы уверены, что хотите удалить этот банк из списка? Все данные о категориях для него будут удалены."
          confirmText="Удалить"
          variant="danger"
        />
      </div>
    );
  },
);
