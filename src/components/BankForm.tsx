import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import { Bank, CashbackEntry, CategoryItem, LogoShape } from "../types";
import { BANKS, COMMON_CATEGORIES } from "../constants";
import { BankLogo } from "./BankLogo";
import {
  Plus,
  Search,
  Upload,
  X,
  Crop,
  ArrowLeftRight,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { ConfirmModal } from "./ui/ConfirmModal";
import { sortCategoriesAsc, sortCategoriesCustom } from "../utils/sorting";
import { pluralize } from "../utils/format";

export interface BankFormProps {
  initialEntry?: CashbackEntry;
  customBanks: Bank[];
  customCategories: string[];
  onSave: (entry: Omit<CashbackEntry, "id">) => void;
  onCancel: () => void;
  onAddCustomBank: (bank: Bank) => void;
  onDeleteCustomBank: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
  onDeleteCustomCategory: (category: string) => void;
  globalLogoShape: LogoShape;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const BankForm: React.FC<BankFormProps> = memo(
  ({
    initialEntry,
    customBanks,
    customCategories,
    onSave,
    onCancel,
    onAddCustomBank,
    onDeleteCustomBank,
    onAddCustomCategory,
    onDeleteCustomCategory,
    globalLogoShape,
  }) => {
    const [selectedBankId, setSelectedBankId] = useState<string>(
      initialEntry?.bankId || "",
    );
    const [customBankName, setCustomBankName] = useState<string>(
      initialEntry?.customBankName || "",
    );
    const [selectedCategories, setSelectedCategories] = useState<
      CategoryItem[]
    >(
      sortCategoriesAsc(
        (initialEntry?.categories || []).map((c) =>
          typeof c === "string" ? { name: c, percent: "" } : c,
        ),
      ) as CategoryItem[],
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [customLogo, setCustomLogo] = useState<string | undefined>(
      initialEntry?.customLogo,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirm Modal state
    const [bankToDelete, setBankToDelete] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(
      null,
    );

    // Cropper states
    const [showCropper, setShowCropper] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
      null,
    );

    const allBanks = useMemo(() => [...BANKS, ...customBanks], [customBanks]);
    const filteredBanks = useMemo(
      () =>
        allBanks.filter((b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      [allBanks, searchQuery],
    );

    const baseCategorySet = useMemo(() => new Set(COMMON_CATEGORIES), []);

    const allCategories = useMemo(() => {
      const unique = new Set([...COMMON_CATEGORIES, ...customCategories]);
      return sortCategoriesCustom(Array.from(unique)) as string[];
    }, [customCategories]);

    const filteredCategories = useMemo(
      () =>
        allCategories.filter((c) =>
          c.toLowerCase().includes(categorySearchQuery.toLowerCase()),
        ),
      [allCategories, categorySearchQuery],
    );

    const selectedCategorySet = useMemo(
      () => new Set(selectedCategories.map((c) => c.name)),
      [selectedCategories],
    );

    const isCustomBank = selectedBankId === "custom";

    const currentBank = useMemo(() => {
      if (isCustomBank && customBankName) {
        return {
          id: "custom",
          name: customBankName,
          color: "#64748b",
          logoText: customBankName.charAt(0).toUpperCase(),
          logoUrl: DEFAULT_BANK_LOGO,
        };
      }
      return allBanks.find((b) => b.id === selectedBankId);
    }, [selectedBankId, customBankName, allBanks, isCustomBank]);

    const toggleCategory = useCallback((catName: string) => {
      setSelectedCategories((prev) => {
        const exists = prev.some((c) => c.name === catName);
        if (exists) {
          return prev.filter((c) => c.name !== catName);
        } else {
          return [...prev, { name: catName, percent: "" }];
        }
      });
    }, []);

    const updateCategoryPercent = useCallback(
      (catName: string, percent: string) => {
        setSelectedCategories((prev) =>
          prev.map((c) => (c.name === catName ? { ...c, percent } : c)),
        );
      },
      [],
    );

    const trimmedCategoryQuery = categorySearchQuery.trim();
    const canCreateFromQuery = useMemo(() => {
      if (!trimmedCategoryQuery) return false;
      const lower = trimmedCategoryQuery.toLowerCase();
      return !allCategories.some((c) => c.toLowerCase() === lower);
    }, [trimmedCategoryQuery, allCategories]);

    const handleCreateCategoryFromSearch = useCallback(
      (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const name = categorySearchQuery.trim();
        if (!name) return;

        // Если категория уже есть в списке (без учёта регистра), просто выбираем её
        const existing = allCategories.find(
          (c) => c.toLowerCase() === name.toLowerCase(),
        );
        const resolvedName = existing || name;

        setSelectedCategories((prev) => {
          if (prev.some((c) => c.name === resolvedName)) return prev;
          return [...prev, { name: resolvedName, percent: "" }];
        });

        if (!existing) {
          onAddCustomCategory(resolvedName);
        }
        setCategorySearchQuery("");
      },
      [categorySearchQuery, allCategories, onAddCustomCategory],
    );

    const handleLogoUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageSrc(reader.result as string);
            setShowCropper(true);
          };
          reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      [],
    );

    const onCropComplete = useCallback(
      (_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
      },
      [],
    );

    const handleCropSave = useCallback(async () => {
      try {
        if (imageSrc && croppedAreaPixels) {
          const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
          setCustomLogo(croppedImage);
          setShowCropper(false);
          setImageSrc(null);
        }
      } catch (e) {
        console.error(e);
      }
    }, [imageSrc, croppedAreaPixels]);

    const handleSave = useCallback(() => {
      if (!selectedBankId) return;

      const sortedCategories = sortCategoriesAsc(
        selectedCategories,
      ) as CategoryItem[];

      if (isCustomBank && customBankName) {
        const newBankId = `custom_${Date.now()}`;
        const bankColor = "#64748b";
        const logoTxt = customBankName.charAt(0).toUpperCase();

        onAddCustomBank({
          id: newBankId,
          name: customBankName,
          color: bankColor,
          logoText: logoTxt,
          logoUrl: DEFAULT_BANK_LOGO,
        });
        onSave({
          bankId: newBankId,
          customBankName,
          customBankColor: bankColor,
          customBankLogoText: logoTxt,
          customLogo,
          categories: sortedCategories,
        });
      } else {
        const activeBank = allBanks.find((b) => b.id === selectedBankId);
        onSave({
          bankId: selectedBankId,
          customBankName: activeBank?.name,
          customBankColor: activeBank?.color,
          customBankLogoText: activeBank?.logoText,
          customLogo: customLogo || activeBank?.logoUrl,
          categories: sortedCategories,
        });
      }
    }, [
      selectedBankId,
      isCustomBank,
      customBankName,
      onAddCustomBank,
      onSave,
      customLogo,
      selectedCategories,
      allBanks,
    ]);

    const shapeClassesMedium = {
      circle: "w-10 h-10 rounded-full",
      square: "w-10 h-10 rounded-[22%]",
      rectangle: "w-8 h-11 rounded-[15%]",
    };

    if (showCropper && imageSrc) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Обрезать логотип
            </h3>
            <button
              type="button"
              onClick={() => setShowCropper(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative w-full h-64 bg-[var(--fill)] rounded-control overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={globalLogoShape === "rectangle" ? 10 / 14 : 1}
              cropShape={globalLogoShape === "circle" ? "round" : "rect"}
              showGrid={true}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { backgroundColor: "transparent" },
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)]">
                Масштаб
              </span>
              <input
                type="range"
                value={zoom}
                min={0.1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1 bg-[var(--fill)] rounded-control appearance-none cursor-pointer accent-[var(--accent-color)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setCrop({ x: 0, y: 0 })}
              className="w-full py-2 text-sm font-medium text-[var(--accent-color)] bg-[var(--percent-bg)]/50 hover:bg-[var(--percent-bg)] rounded-control transition-colors cursor-pointer"
            >
              Центрировать
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCropper(false)}
              className="flex-1 px-4 py-2.5 rounded-control font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--fill)] hover:bg-[var(--fill-hover)] transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCropSave}
              className="flex-1 px-4 py-2.5 rounded-control font-medium text-white bg-[var(--accent-color)] hover:opacity-90 transition-colors shadow-sm shadow-[var(--accent-color)]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crop className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 flex-1">
        {/* 1. Выбор банка ↔ Компактная плашка выбранного банка (синхронный CSS Grid переход) */}
        <div className="flex flex-col">
          {/* Состояние А: Сетка выбора банка */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              !selectedBankId
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="space-y-2 pb-0.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Выберите банк
                  </label>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {filteredBanks.length}{" "}
                    {pluralize(filteredBanks.length, [
                      "банк",
                      "банка",
                      "банков",
                    ])}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Поиск или название нового банка..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={clsx(
                      "w-full h-9 pl-9 bg-[var(--fill)] focus:bg-[var(--fill-hover)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] focus:border-[var(--accent-color)] rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-[background-color,border-color,box-shadow]",
                      searchQuery ? "pr-9" : "pr-3",
                    )}
                  />
                  <AnimatePresence initial={false}>
                    {searchQuery && (
                      <motion.button
                        key="clear-bank-search"
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-52 overflow-y-auto overscroll-contain p-0.5 scrollbar-hide">
                  {filteredBanks.map((bank) => {
                    const isCustom = bank.id.startsWith("custom_");

                    return (
                      <div key={bank.id} className="relative group/bank">
                        <button
                          type="button"
                          onClick={() => setSelectedBankId(bank.id)}
                          className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 p-2 rounded-control hover:bg-[var(--fill)] active:scale-95 transition-[background-color,transform] duration-200 cursor-pointer group isolate transform-gpu"
                        >
                          <BankLogo
                            bank={bank}
                            logoShape={globalLogoShape}
                            size="md"
                            className="group-hover:scale-105 transition-transform duration-300 ease-out origin-center"
                          />
                          <span
                            className="text-[11px] font-semibold text-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors break-words leading-tight line-clamp-2 w-full px-0.5"
                            title={bank.name}
                          >
                            {bank.name}
                          </span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankToDelete(bank.id);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/bank:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10 cursor-pointer"
                            title="Удалить свой банк"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {filteredBanks.length === 0 && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBankId("custom");
                      setCustomBankName(searchQuery.trim());
                    }}
                    className="w-full py-2.5 px-3 border border-dashed border-[var(--accent-color)]/40 bg-[var(--fill)] hover:bg-[var(--fill-hover)] rounded-control text-[var(--accent-color)] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить банк «{searchQuery.trim()}»</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Состояние Б: Компактная плашка выбранного банка */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              selectedBankId
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              {currentBank && (
                <div className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-control border border-[var(--border-hairline)] bg-[var(--fill)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group cursor-pointer shrink-0"
                      title="Изменить логотип"
                    >
                      <BankLogo
                        bank={currentBank}
                        customLogo={customLogo}
                        logoShape={globalLogoShape}
                        size="md"
                      />
                      <div
                        className={clsx(
                          "absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                          shapeClassesMedium[globalLogoShape],
                        )}
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    </button>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[var(--text-primary)] block truncate tracking-tight leading-tight">
                        {currentBank.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-[var(--accent-color)] hover:underline cursor-pointer mt-0.5 inline-flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Изменить логотип</span>
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBankId("");
                      setCustomBankName("");
                      setCustomLogo(undefined);
                    }}
                    className="h-8 px-2.5 rounded-control bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-[background-color,color,transform] active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                    title="Выбрать другой банк"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Сменить</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Секция категорий кэшбека */}
        <div
          className={clsx(
            "flex flex-col transition-opacity duration-300",
            !selectedBankId && "opacity-45 pointer-events-none select-none",
          )}
        >
          {/* Единый заголовок секции категорий (без дублирования заголовков) */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Категории кэшбека
              </label>
              <AnimatePresence initial={false}>
                {selectedCategories.length > 0 && (
                  <motion.span
                    key="optional-hint"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.18 }}
                    className="text-[11px] text-[var(--text-tertiary)] truncate"
                  >
                    · % необязателен
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <motion.span
              key={selectedCategories.length > 0 ? "has-selected" : "none"}
              initial={{ scale: 0.92, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className={clsx(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors shrink-0",
                selectedCategories.length > 0
                  ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                  : "bg-[var(--fill)] text-[var(--text-tertiary)]",
              )}
            >
              {selectedCategories.length > 0
                ? `Выбрано: ${selectedCategories.length}`
                : "Не выбрано"}
            </motion.span>
          </div>

          {/* CSS Grid Аккордеон выбранных категорий (отступ внутри overflow-hidden, чтобы в закрытом виде не было пустого зазора) */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              selectedCategories.length > 0
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="pb-2">
                <div className="p-1.5 rounded-control bg-[var(--fill)] border border-[var(--border-hairline)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto overscroll-contain scrollbar-hide">
                    <AnimatePresence initial={false}>
                      {selectedCategories.map((cat) => (
                        <motion.div
                          key={cat.name}
                          initial={{ opacity: 0, scale: 0.95, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: -4,
                            transition: { duration: 0.15, ease: "easeInOut" },
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                            mass: 0.75,
                          }}
                          className="flex items-center justify-between gap-2 pl-2.5 pr-1 py-1 bg-[var(--fill)] hover:bg-[var(--fill-hover)] rounded-control border border-[var(--accent-color)]/25 transition-colors transform-gpu"
                        >
                          <span
                            className="text-xs font-semibold text-[var(--text-primary)] truncate flex-1 min-w-0"
                            title={cat.name}
                          >
                            {cat.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max="100"
                                step="any"
                                placeholder="—"
                                value={cat.percent}
                                onChange={(e) =>
                                  updateCategoryPercent(
                                    cat.name,
                                    e.target.value,
                                  )
                                }
                                aria-label={`Процент для категории ${cat.name}`}
                                className="w-13 h-6.5 pl-1.5 pr-4 text-center bg-[var(--fill)] hover:bg-[var(--fill-hover)] focus:bg-[var(--fill-hover)] border border-[var(--border-hairline)] focus:border-[var(--accent-color)] rounded-control text-xs font-bold text-[var(--accent-color)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-[background-color,border-color,box-shadow] no-spinner"
                              />
                              <span className="absolute right-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] pointer-events-none select-none">
                                %
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCategory(cat.name)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-[background-color,color,transform] active:scale-90 cursor-pointer shrink-0"
                              title={`Убрать «${cat.name}»`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Единая умная строка поиска + встроенная кнопка создания/выбора без скачка ширины поля */}
          <form
            onSubmit={handleCreateCategoryFromSearch}
            className="relative mb-2"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск или своя категория..."
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className={clsx(
                "w-full h-9 pl-9 bg-[var(--fill)] focus:bg-[var(--fill-hover)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] focus:border-[var(--accent-color)] rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-[background-color,border-color,box-shadow]",
                trimmedCategoryQuery ? "pr-28" : "pr-3",
              )}
            />
            <AnimatePresence initial={false}>
              {trimmedCategoryQuery && (
                <motion.div
                  key="category-search-actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery("")}
                    className="w-6 h-6 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] flex items-center justify-center transition-colors cursor-pointer"
                    title="Очистить поиск"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    className="h-6.5 px-2 bg-[var(--accent-color)] text-white rounded-control hover:brightness-110 transition-[filter,transform] cursor-pointer shadow-sm shadow-[var(--accent-color)]/20 active:scale-95 inline-flex items-center gap-1 text-[11px] font-semibold"
                    title={
                      canCreateFromQuery
                        ? `Добавить свою категорию «${trimmedCategoryQuery}»`
                        : `Выбрать «${trimmedCategoryQuery}»`
                    }
                  >
                    <Plus className="w-3 h-3" />
                    <span>{canCreateFromQuery ? "Создать" : "Выбрать"}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Строгая 2-колоночная сетка доступных категорий (ровная геометрия без пустот и разнобоя) */}
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto overscroll-contain p-0.5 scrollbar-hide">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategorySet.has(cat);
              const isCustomCategory = !baseCategorySet.has(cat);

              if (isCustomCategory) {
                return (
                  <div
                    key={cat}
                    className={clsx(
                      "min-h-[36px] flex items-center rounded-control border transition-[background-color,color,border-color,box-shadow] overflow-hidden",
                      isSelected
                        ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm shadow-[var(--accent-color)]/20"
                        : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] text-[var(--text-secondary)] border-[var(--border-hairline)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={clsx(
                        "pl-2.5 pr-1 py-1.5 flex-1 min-w-0 h-full flex items-center justify-between gap-1 text-left cursor-pointer transition-[color,transform] active:scale-[0.98]",
                        !isSelected && "hover:text-[var(--text-primary)]",
                      )}
                      title={cat}
                    >
                      <span className="text-xs font-medium leading-[1.2] line-clamp-2 break-words min-w-0 flex-1">
                        {cat}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryToDelete(cat);
                      }}
                      className={clsx(
                        "w-6 h-6 mr-1 rounded-full flex items-center justify-center transition-[background-color,color,transform] active:scale-90 cursor-pointer shrink-0",
                        isSelected
                          ? "text-white/75 hover:text-white hover:bg-black/15"
                          : "text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10",
                      )}
                      title={`Удалить свою категорию «${cat}»`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  title={cat}
                  className={clsx(
                    "min-h-[36px] px-2.5 py-1.5 rounded-control text-left transition-[background-color,color,border-color,box-shadow,transform] active:scale-[0.98] flex items-center justify-between gap-1.5 cursor-pointer border",
                    isSelected
                      ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm shadow-[var(--accent-color)]/20"
                      : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-hairline)]",
                  )}
                >
                  <span className="text-xs font-medium leading-[1.2] line-clamp-2 break-words min-w-0 flex-1">
                    {cat}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
            {filteredCategories.length === 0 && trimmedCategoryQuery && (
              <button
                type="button"
                onClick={() => handleCreateCategoryFromSearch()}
                className="col-span-2 w-full py-2.5 px-4 rounded-control border border-dashed border-[var(--accent-color)]/40 bg-[var(--fill)] hover:bg-[var(--fill-hover)] text-xs sm:text-sm font-semibold text-[var(--accent-color)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Создать и выбрать категорию «{trimmedCategoryQuery}»
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Footer действий */}
        <div className="flex gap-2.5 pt-2.5 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] border-t border-[var(--border-hairline)] mt-auto sticky -bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:-bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] -mb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:-mb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] -mx-3 sm:-mx-4 px-3 sm:px-4 bg-white dark:bg-[var(--surface-2)] z-10">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-control font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--fill)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] transition-[background-color,color,transform] text-sm cursor-pointer shadow-sm active:scale-95"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              !selectedBankId ||
              selectedCategories.length === 0 ||
              (isCustomBank && !customBankName.trim())
            }
            className="flex-1 px-4 py-2.5 rounded-control font-bold text-white bg-[var(--accent-color)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-[filter,opacity,transform] shadow-md shadow-[var(--accent-color)]/30 active:scale-95 text-sm cursor-pointer"
          >
            Сохранить
          </button>
        </div>

        <ConfirmModal
          isOpen={!!bankToDelete}
          onClose={() => setBankToDelete(null)}
          onConfirm={() => {
            if (bankToDelete) {
              onDeleteCustomBank(bankToDelete);
              if (selectedBankId === bankToDelete) {
                setSelectedBankId("");
              }
            }
          }}
          title="Удалить пользовательский банк?"
          message="Этот банк будет удален из списка доступных. Существующие записи с этим банком не изменятся."
          confirmText="Удалить"
          cancelText="Отмена"
          variant="danger"
        />

        <ConfirmModal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={() => {
            if (categoryToDelete) {
              onDeleteCustomCategory(categoryToDelete);
              setSelectedCategories((prev) =>
                prev.filter((c) => c.name !== categoryToDelete),
              );
            }
          }}
          title="Удалить свою категорию?"
          message={
            categoryToDelete
              ? `Категория «${categoryToDelete}» будет удалена из списка ваших шаблонов. В уже сохранённых записях банков она останется.`
              : ""
          }
          confirmText="Удалить"
          cancelText="Отмена"
          variant="danger"
        />
      </div>
    );
  },
);
