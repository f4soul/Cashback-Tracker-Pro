import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MonthData, CashbackEntry, Bank, LogoShape } from '../types';
import {
  getCurrentMonthId,
  getNextMonthId,
  getPreviousMonthId,
  formatMonthId,
  capitalize,
} from '../utils/date';
import { pluralize } from '../utils/format';
import { Modal } from '../components/ui/Modal';
import { BankForm } from '../components/BankForm';
import { CashbackTable } from '../components/CashbackTable';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { exportToPDF, exportToExcel, exportToImage } from '../utils/export';
import { BankLogo } from '../components/BankLogo';
import {
  Plus,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Table as TableIcon,
  LayoutList,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getBankDetails } from '../constants';
import { clsx } from 'clsx';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import {
  DndContext,

  closestCenter,
  pointerWithin,
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
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  globalLogoShape: LogoShape;
  allMonthIds: string[];
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
  style?: any;
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
          'flex items-center justify-between p-3 bg-white dark:bg-[var(--surface-2)] rounded-[var(--radius-sm)] border border-slate-100 dark:border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] group/card select-none hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgb(0,0,0,0.2)] hover:border-slate-200/50 dark:hover:border-white/10 transition-all translate-z-0 [backface-visibility:hidden] will-change-[transform]',
          isDragging && !isOverlay && 'opacity-0',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className={clsx(
              'p-3 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-[var(--text-primary)] shrink-0 touch-none transition-colors active:scale-95',
              'cursor-grab active:cursor-grabbing',
            )}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="relative shrink-0">
            {index !== undefined && (
              <div className="absolute -top-1.5 -left-1.5 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/40 dark:bg-black/30 border border-[var(--border-strong)] backdrop-blur-md text-[9px] font-bold text-[var(--text-secondary)] shadow-sm pointer-events-none">
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
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight">
              {bank.name}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-[var(--text-secondary)] truncate leading-none mt-1">
              {entry.categories.length}{' '}
              {pluralize(entry.categories.length, [
                'категория',
                'категории',
                'категорий',
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
            className="p-2 text-slate-400 hover:text-[var(--accent-color)] hover:bg-[var(--percent-bg)] rounded-xl transition-all cursor-pointer active:scale-95"
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
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer active:scale-95"
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
    });

    const wrapperStyle: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)',
    };

    const motionStyle: React.CSSProperties = {
      position: 'relative',
      zIndex: isDragging ? 50 : 1,
      transition: isDragging ? 'none' : 'z-index 0s 250ms',
    };

    return (
      <motion.div
        style={motionStyle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
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
      </motion.div>
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
    globalLogoShape,
    allMonthIds,
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
    const [currentTab, setCurrentTab] = useState('current');
    useEffect(() => {
      setMounted(true);
      const handleTabChange = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && detail.activeTab) {
          setCurrentTab(detail.activeTab);
        }
      };
      window.addEventListener('app-tab-change', handleTabChange);
      return () => {
        window.removeEventListener('app-tab-change', handleTabChange);
      };
    }, []);

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragWidth, setActiveDragWidth] = useState<number | undefined>(undefined);
    const [isGridLayout, setIsGridLayout] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
      const handleResize = () => setIsGridLayout(window.innerWidth >= 1024);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CashbackEntry | undefined>(
      undefined,
    );
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'table' | 'list'>('table');
    const [isFabHidden, setIsFabHidden] = useState(() => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1150) {
        return false;
      }
      const saved = localStorage.getItem('fab_hidden');
      return saved === 'true';
    });
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
      const saved = localStorage.getItem('fab_y_offset');
      return saved ? parseInt(saved) : 0;
    });
    const [rightPos, setRightPos] = useState(16);
    const isDraggingFab = useRef(false);
    const isDraggingRestore = useRef(false);

    useEffect(() => {
      localStorage.setItem('fab_y_offset', yOffset.toString());
      localStorage.setItem('fab_hidden', isFabHidden.toString());
    }, [yOffset, isFabHidden]);

    useEffect(() => {
      const handleInteraction = (e: Event) => {
        if (window.innerWidth >= 1150) return; // Don't hide FAB on Desktop. Tablets and Mobile will hide.
        if (isDraggingFab.current || isDraggingRestore.current || isFabHidden)
          return;

        const target = e.target as HTMLElement;
        if (target && typeof target.closest === 'function') {
          if (
            target.closest('#fab-container') ||
            target.closest('#fab-restore')
          ) {
            return;
          }
        }

        setIsFabHidden(true);
      };

      // Use capture phase to ensure we catch events even if they are stopped elsewhere
      window.addEventListener('scroll', handleInteraction, true);

      return () => {
        window.removeEventListener('scroll', handleInteraction, true);
      };
    }, [isFabHidden]);

    useEffect(() => {
      const updateConstraints = () => {
        const isDesktop = window.innerWidth >= 768;
        const isWide = window.innerWidth >= 1280;

        if (window.innerWidth >= 1150) {
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
      window.addEventListener('resize', updateConstraints);
      return () => window.removeEventListener('resize', updateConstraints);
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
        const saved = localStorage.getItem('fab_y_offset');
        if (!saved) {
          setYOffset(snapToPosition(0));
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
      (entryData: Omit<CashbackEntry, 'id'>) => {
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
      [data.entries, onUpdate],
    );

    const handleExport = useCallback(() => {
      exportToPDF('current-cashback-table', `Кэшбек_${data.monthId}.pdf`);
    }, [data.monthId]);

    const handleExportExcel = useCallback(() => {
      exportToExcel(data, allCustomBanks, `Кэшбек_${data.monthId}.xlsx`);
    }, [data, allCustomBanks]);

    const handleExportImage = useCallback(() => {
      exportToImage('current-cashback-table', `Кэшбек_${data.monthId}.png`);
    }, [data.monthId]);

    const sidebarWidth = window.innerWidth >= 768 ? 260 : 0;
    const initialRight = window.innerWidth >= 768 ? 32 : 20;
    const fabSize = 56;
    const margin = 16;
    const visibleLeftLimit = -(
      window.innerWidth -
      sidebarWidth -
      fabSize -
      margin -
      initialRight
    );

    return (
      <div className="flex flex-col relative gap-1">
        {mounted && currentTab === 'current' && !isExiting && createPortal(
          <AnimatePresence mode="wait">
            {!isFabHidden ? (
              <motion.div
                key="fab-container"
                id="fab-container"
                drag="y"
                dragConstraints={dragConstraints}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.8, x: 0, y: yOffset }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: yOffset,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.32, 0.72, 0, 1],
                }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  transition: { duration: 0.15 },
                }}
                onDragStart={() => {
                  isDraggingFab.current = true;
                }}
                onDragEnd={(e, info) => {
                  setTimeout(() => {
                    isDraggingFab.current = false;
                  }, 100);

                  const finalY = yOffset + info.offset.y;
                  // Snap to 3 positions: top, center, bottom
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
                className="fixed pwa-fab-bottom z-50 touch-none select-none"
                style={{ right: rightPos, willChange: 'transform, opacity', touchAction: 'none' }}
              >
                <button
                  onClick={(e) => {
                    if (isDraggingFab.current) {
                      e.preventDefault();
                      return;
                    }
                    setEditingEntry(undefined);
                    setIsModalOpen(true);
                  }}
                  title="Добавить банк"
                  className="w-14 h-14 bg-[var(--accent-color)] text-white rounded-[var(--radius-sm)] flex items-center justify-center shadow-lg shadow-[var(--accent-color)]/30 hover:shadow-[var(--accent-color)]/40 transition-all opacity-95 hover:opacity-100 cursor-pointer active:scale-95"
                >
                  <Plus className="w-7 h-7" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="fab-restore"
                id="fab-restore"
                drag="y"
                dragConstraints={restoreConstraints}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ opacity: 0, x: 20, y: yOffset }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0, 
                  y: yOffset 
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.32, 0.72, 0, 1],
                }}
                whileTap={{ scale: 0.95 }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  transition: { duration: 0.15 },
                }}
                onClick={() => {
                  if (isDraggingRestore.current) return;
                  setIsFabHidden(false);
                }}
                onDragStart={() => {
                  isDraggingRestore.current = true;
                }}
                onDragEnd={(e, info) => {
                  setTimeout(() => {
                    isDraggingRestore.current = false;
                  }, 100);

                  const finalY = yOffset + info.offset.y;
                  // Snap to 3 positions: top, center, bottom
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
                className="fixed pwa-fab-bottom w-5 h-14 bg-[var(--accent-color)]/40 hover:bg-[var(--accent-color)] text-white flex items-center justify-center shadow-md z-50 group cursor-grab active:cursor-grabbing rounded-l-2xl transition-colors touch-none select-none backdrop-blur-md"
                style={{ right: 0, willChange: 'transform, opacity', touchAction: 'none' }}
                title="Показать кнопку (перетащите вертикально)"
              >
                <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ChevronUp className="w-3 h-3" />
                  <Plus className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Table/Bank List Switcher - Simplified and Compact */}
        <div className="flex p-0.5 gap-0.5 relative bg-white dark:bg-[var(--surface-2)] rounded-[var(--radius-app)] border border-slate-100 dark:border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] w-full mb-2 translate-z-0 [backface-visibility:hidden] z-10">
            <div
              className="absolute inset-y-0.5 rounded-[0.85rem] bg-slate-50 dark:bg-white/[0.05] shadow-sm z-0 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                left: activeSubTab === 'table' ? '0.125rem' : '50%',
                right: activeSubTab === 'table' ? '50%' : '0.125rem',
              }}
            />
            <button
              onClick={() => setActiveSubTab('table')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[0.85rem] text-[10px] font-semibold transition-colors cursor-pointer relative z-10',
                activeSubTab === 'table'
                  ? 'text-[var(--accent-color)]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-[var(--text-primary)]',
              )}
            >
              <TableIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none uppercase">Таблица</span>
            </button>
            <button
              onClick={() => setActiveSubTab('list')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[0.85rem] text-[10px] font-semibold transition-colors cursor-pointer relative z-10',
                activeSubTab === 'list'
                  ? 'text-[var(--accent-color)]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-[var(--text-primary)]',
              )}
            >
              <LayoutList className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none uppercase">Список банков</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="relative mt-1">
          <AnimatePresence mode="wait">
            {activeSubTab === 'table' ? (
              <motion.div
                key="table-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                />
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {data.entries.length === 0 ? (
                  <button
                    onClick={() => {
                      setEditingEntry(undefined);
                      setIsModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-0)] dark:bg-[var(--surface-1)] rounded-[var(--radius-app)] border border-dashed border-slate-200 dark:border-[var(--border-strong)] hover:bg-white dark:hover:bg-[var(--surface-2)] transition-colors group w-full cursor-pointer"
                  >
                    <Plus className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 group-hover:text-[var(--accent-color)] dark:group-hover:text-[var(--accent-color)] transition-colors" />
                    <p className="text-xs text-slate-500">
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
                      strategy={isGridLayout ? rectSortingStrategy : verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                        <AnimatePresence initial={false}>
                          {data.entries.map((entry, index) => {
                            const bank =
                              getBankDetails(
                                entry.bankId,
                                entry.customBankName,
                              ) ||
                              (entry.bankId.startsWith('custom_')
                                ? allCustomBanks.find((b) => b.id === entry.bankId)
                                : null);

                            if (!bank) return null;

                            const logoShape = globalLogoShape || 'circle';

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
                        </AnimatePresence>
                      </div>
                    </SortableContext>

                    {createPortal(
                      <DragOverlay
                        dropAnimation={{
                          duration: 200,
                          easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                        }}
                      >
                        {activeDragId ? (
                          <div style={{ width: activeDragWidth }}>
                            <BankCard
                              isOverlay
                              index={data.entries.findIndex((e) => e.id === activeDragId)}
                              entry={data.entries.find((e) => e.id === activeDragId)!}
                            bank={
                              getBankDetails(
                                data.entries.find((e) => e.id === activeDragId)?.bankId || '',
                                data.entries.find((e) => e.id === activeDragId)?.customBankName
                              ) || (data.entries.find((e) => e.id === activeDragId)?.bankId.startsWith('custom_')
                                ? allCustomBanks.find((b) => b.id === data.entries.find((e) => e.id === activeDragId)?.bankId)
                                : null)!
                            }
                            logoShape={globalLogoShape || 'circle'}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            style={{
                              scale: 1.02,
                              rotate: '1.5deg',
                              opacity: 0.95,
                              boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                            }}
                          />
                          </div>
                        ) : null}
                      </DragOverlay>,
                      document.body
                    )}
                  </DndContext>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEntry ? 'Редактировать банк' : 'Добавить банк'}
        >
          <BankForm
            initialEntry={editingEntry}
            customBanks={customBanks}
            customCategories={customCategories}
            onSave={handleSaveEntry}
            onCancel={() => setIsModalOpen(false)}
            onAddCustomBank={onAddCustomBank}
            onDeleteCustomBank={onDeleteCustomBank}
            onAddCustomCategory={onAddCustomCategory}
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
