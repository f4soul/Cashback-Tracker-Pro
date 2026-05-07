import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CurrentMonthProps {
  data: MonthData;
  selectedMonthId: string;
  onMonthChange: (monthId: string) => void;
  customBanks: Bank[];
  customCategories: string[];
  onUpdate: (data: MonthData) => void;
  onDeleteEntry: (id: string) => void;
  onAddCustomBank: (bank: Bank) => void;
  onDeleteCustomBank: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
  globalLogoShape: LogoShape;
  allMonthIds: string[];
}

interface SortableBankCardProps {
  entry: CashbackEntry;
  bank: Bank;
  logoShape: LogoShape;
  onEdit: () => void;
  onDelete: () => void;
}

interface BankCardProps {
  entry: CashbackEntry;
  bank: Bank;
  logoShape: LogoShape;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  attributes?: any;
  listeners?: any;
  style?: any;
}

const BankCard = React.forwardRef<HTMLDivElement, BankCardProps>(
  (
    {
      entry,
      bank,
      logoShape,
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
          'flex items-center justify-between p-3 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm group/card select-none hover:border-[var(--accent-color)]/30 transition-all translate-z-0 [backface-visibility:hidden] will-change-[backdrop-filter,transform]',
          isDragging && !isOverlay && 'opacity-30',
          isOverlay &&
            'border-[var(--accent-color)] shadow-2xl scale-105 z-50 ring-2 ring-[var(--accent-color)]/50 cursor-grabbing bg-white dark:bg-slate-900',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className={clsx(
              'p-3 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 touch-none transition-colors active:scale-95',
              isOverlay
                ? 'cursor-grabbing'
                : 'cursor-grab active:cursor-grabbing',
            )}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <BankLogo
            bank={bank}
            customLogo={entry.customLogo}
            logoShape={logoShape}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight">
              {bank.name}
            </h3>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 truncate leading-none mt-1 uppercase tracking-widest">
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
  ({ entry, bank, logoShape, onEdit, onDelete }) => {
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

    const style = {
      transform: CSS.Transform.toString(transform),
      transition:
        transition ||
        (isDragging
          ? undefined
          : 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)'),
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <BankCard
          ref={setNodeRef}
          style={style}
          entry={entry}
          bank={bank}
          logoShape={logoShape}
          onEdit={onEdit}
          onDelete={onDelete}
          isDragging={isDragging}
          attributes={attributes}
          listeners={listeners}
        />
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
    customCategories,
    onUpdate,
    onDeleteEntry,
    onAddCustomBank,
    onDeleteCustomBank,
    onAddCustomCategory,
    globalLogoShape,
    allMonthIds,
  }) => {
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CashbackEntry | undefined>(
      undefined,
    );
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [entryIdToDelete, setEntryIdToDelete] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'table' | 'list'>('table');
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [isFabHidden, setIsFabHidden] = useState(() => {
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
        if (window.innerWidth >= 1280) return; // Don't hide FAB on Desktop (xl) only. Tablets and Mobile will hide.
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
      window.addEventListener('touchmove', handleInteraction, true);
      window.addEventListener('mousedown', handleInteraction, true);
      window.addEventListener('touchstart', handleInteraction, true);

      return () => {
        window.removeEventListener('scroll', handleInteraction, true);
        window.removeEventListener('touchmove', handleInteraction, true);
        window.removeEventListener('mousedown', handleInteraction, true);
        window.removeEventListener('touchstart', handleInteraction, true);
      };
    }, [isFabHidden]);

    useEffect(() => {
      const updateConstraints = () => {
        const isDesktop = window.innerWidth >= 768;
        const isWide = window.innerWidth >= 1280;
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
          setRightPos(16);
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
      useSensor(PointerSensor, {
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
    }, []);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

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
      exportToExcel(data, customBanks, `Кэшбек_${data.monthId}.xlsx`);
    }, [data, customBanks]);

    const handleExportImage = useCallback(() => {
      exportToImage('current-cashback-table', `Кэшбек_${data.monthId}.png`);
    }, [data.monthId]);

    const sidebarWidth = window.innerWidth >= 768 ? 260 : 0;
    const initialRight = window.innerWidth >= 768 ? 32 : 16;
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
        <AnimatePresence>
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
              className="fixed bottom-[110px] md:bottom-8 z-50 touch-none select-none"
              style={{ right: rightPos }}
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
                className="w-14 h-14 bg-[var(--accent-color)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent-color)]/30 hover:shadow-[var(--accent-color)]/40 transition-all opacity-95 hover:opacity-100 cursor-pointer active:scale-95"
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
              animate={{ opacity: 1, x: 0, y: yOffset }}
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
              className="fixed bottom-[110px] md:bottom-8 w-4 h-14 bg-[var(--accent-color)]/40 hover:bg-[var(--accent-color)] text-white flex items-center justify-center shadow-md z-50 group cursor-grab active:cursor-grabbing rounded-l-2xl transition-all touch-none select-none backdrop-blur-md"
              style={{ right: 0 }}
              title="Показать кнопку (перетащите вертикально)"
            >
              <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <ChevronUp className="w-3 h-3" />
                <Plus className="w-3 h-3" />
                <ChevronDown className="w-3 h-3" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table/Bank List Switcher - Simplified and Compact */}
        <div className="flex p-0.5 gap-1 relative bg-slate-100/50 dark:bg-slate-800/80 backdrop-blur-md rounded-full overflow-hidden shadow-inner w-full border border-slate-200/50 dark:border-white/10 translate-z-0 [backface-visibility:hidden]">
            <div
              className="absolute inset-y-1 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/5 z-0 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                left: activeSubTab === 'table' ? '0.25rem' : '50%',
                right: activeSubTab === 'table' ? '50%' : '0.25rem',
              }}
            />
            <button
              onClick={() => setActiveSubTab('table')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer relative z-10',
                activeSubTab === 'table'
                  ? 'text-[var(--accent-color)]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <TableIcon className="w-4 h-4" />
              Таблица
            </button>
            <button
              onClick={() => setActiveSubTab('list')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer relative z-10',
                activeSubTab === 'list'
                  ? 'text-[var(--accent-color)]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <LayoutList className="w-4 h-4" />
              Список банков
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
                  customBanks={customBanks}
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
                    className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full cursor-pointer"
                  >
                    <Plus className="w-8 h-8 text-gray-300 mb-2 group-hover:text-[var(--accent-color)] transition-colors" />
                    <p className="text-xs text-gray-500">
                      Добавьте первый банк
                    </p>
                  </button>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                  >
                    <SortableContext
                      items={data.entries.map((e) => e.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        <AnimatePresence initial={false}>
                          {data.entries.map((entry) => {
                            const bank =
                              getBankDetails(
                                entry.bankId,
                                entry.customBankName,
                              ) ||
                              (entry.bankId.startsWith('custom_')
                                ? customBanks.find((b) => b.id === entry.bankId)
                                : null);

                            if (!bank) return null;

                            const logoShape = globalLogoShape || 'circle';

                            return (
                              <SortableBankCard
                                key={entry.id}
                                entry={entry}
                                bank={bank}
                                logoShape={logoShape}
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
                    <DragOverlay
                      dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                          styles: { active: { opacity: '0.4' } },
                        }),
                        duration: 250,
                        easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
                      }}
                    >
                      {activeDragId
                        ? (() => {
                            const entry = data.entries.find(
                              (e) => e.id === activeDragId,
                            );
                            if (!entry) return null;
                            const bank =
                              getBankDetails(
                                entry.bankId,
                                entry.customBankName,
                              ) ||
                              (entry.bankId.startsWith('custom_')
                                ? customBanks.find((b) => b.id === entry.bankId)
                                : null);
                            if (!bank) return null;

                            return (
                              <BankCard
                                entry={entry}
                                bank={bank}
                                logoShape={globalLogoShape || 'circle'}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                isOverlay={true}
                              />
                            );
                          })()
                        : null}
                    </DragOverlay>
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
