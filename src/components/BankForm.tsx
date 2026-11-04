import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Bank, CashbackEntry, CategoryItem, LogoShape } from "../types";
import { BANKS, COMMON_CATEGORIES } from "../constants";
import { BankLogo } from "./BankLogo";
import {
  Plus,
  Search,
  Upload,
  X,
  Crop,
  ChevronDown,
  Check,
  Landmark,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { ConfirmModal } from "./ui/ConfirmModal";
import { sortCategoriesAsc, sortCategoriesCustom } from "../utils/sorting";
import {
  pluralize,
  normalizePercentInput,
  formatPercentValue,
} from "../utils/format";

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

const QUICK_PERCENTS = ["1", "2", "3", "5", "7", "10", "15"] as const;

export const BankForm: React.FC<BankFormProps> = memo(
  ({
    initialEntry,
    customBanks,
    customCategories,
    onSave,
    onAddCustomBank,
    onDeleteCustomBank,
    onAddCustomCategory,
    onDeleteCustomCategory,
    globalLogoShape,
  }) => {
    const initialCategories = useMemo(
      () =>
        sortCategoriesAsc(
          (initialEntry?.categories || []).map((c) =>
            typeof c === "string"
              ? { name: c, percent: "" }
              : { name: c.name, percent: formatPercentValue(c.percent) },
          ),
        ) as CategoryItem[],
      [initialEntry?.categories],
    );

    const [selectedBankId, setSelectedBankId] = useState<string>(
      initialEntry?.bankId || "",
    );
    const [isBankPickerOpen, setIsBankPickerOpen] = useState<boolean>(false);
    const [customBankName, setCustomBankName] = useState<string>(
      initialEntry?.customBankName || "",
    );
    const [selectedCategories, setSelectedCategories] =
      useState<CategoryItem[]>(initialCategories);
    const [activeCategoryName, setActiveCategoryName] = useState<string | null>(
      initialCategories.length > 0
        ? initialCategories[initialCategories.length - 1].name
        : null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [customLogo, setCustomLogo] = useState<string | undefined>(
      initialEntry?.customLogo,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bankDropdownRef = useRef<HTMLDivElement>(null);
    const bankSearchInputRef = useRef<HTMLInputElement>(null);
    const categorySearchInputRef = useRef<HTMLInputElement>(null);

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

    // Закрытие выпадающего списка банков по клику вне области
    useEffect(() => {
      if (!isBankPickerOpen || bankToDelete) return;

      const handlePointerDown = (e: PointerEvent) => {
        if (
          bankDropdownRef.current &&
          !bankDropdownRef.current.contains(e.target as Node)
        ) {
          setIsBankPickerOpen(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      return () =>
        document.removeEventListener("pointerdown", handlePointerDown);
    }, [isBankPickerOpen, bankToDelete]);

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

    const selectedCategoryMap = useMemo(
      () => new Map(selectedCategories.map((c) => [c.name, c])),
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

    const resolvedActiveCategoryName = useMemo(() => {
      if (
        activeCategoryName &&
        selectedCategoryMap.has(activeCategoryName)
      ) {
        return activeCategoryName;
      }
      return selectedCategories.length > 0
        ? selectedCategories[selectedCategories.length - 1].name
        : null;
    }, [activeCategoryName, selectedCategoryMap, selectedCategories]);

    const activeCategoryObj = useMemo(
      () =>
        resolvedActiveCategoryName
          ? selectedCategoryMap.get(resolvedActiveCategoryName)
          : undefined,
      [resolvedActiveCategoryName, selectedCategoryMap],
    );

    const toggleCategory = useCallback((catName: string) => {
      setSelectedCategories((prev) => {
        const exists = prev.some((c) => c.name === catName);
        if (exists) {
          const next = prev.filter((c) => c.name !== catName);
          setActiveCategoryName((currActive) =>
            currActive === catName
              ? next.length > 0
                ? next[next.length - 1].name
                : null
              : currActive,
          );
          return next;
        } else {
          setActiveCategoryName(catName);
          return [...prev, { name: catName, percent: "" }];
        }
      });
    }, []);

    const updateCategoryPercent = useCallback(
      (catName: string, percent: string) => {
        const normalized = normalizePercentInput(percent);
        setSelectedCategories((prev) =>
          prev.map((c) =>
            c.name === catName ? { ...c, percent: normalized } : c,
          ),
        );
      },
      [],
    );

    const handleApplyQuickPercent = useCallback(
      (val: string) => {
        const targetName =
          resolvedActiveCategoryName ||
          (selectedCategories.length > 0
            ? selectedCategories[selectedCategories.length - 1].name
            : null);
        if (!targetName) return;

        setActiveCategoryName(targetName);
        setSelectedCategories((prev) =>
          prev.map((c) => {
            if (c.name !== targetName) return c;
            const nextPercent = c.percent.trim() === val ? "" : val;
            return { ...c, percent: nextPercent };
          }),
        );
      },
      [resolvedActiveCategoryName, selectedCategories],
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
        if (!name) {
          categorySearchInputRef.current?.focus();
          return;
        }

        const existing = allCategories.find(
          (c) => c.toLowerCase() === name.toLowerCase(),
        );
        const resolvedName = existing || name;

        setSelectedCategories((prev) => {
          if (prev.some((c) => c.name === resolvedName)) return prev;
          return [...prev, { name: resolvedName, percent: "" }];
        });
        setActiveCategoryName(resolvedName);

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

      const normalizedCategories = selectedCategories.map((c) => ({
        ...c,
        percent: formatPercentValue(c.percent),
      }));
      const sortedCategories = sortCategoriesAsc(
        normalizedCategories,
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

    const ctaSummaryText = useMemo(() => {
      const count = selectedCategories.length;
      if (count === 0) return "";
      const countLabel = `${count} ${pluralize(count, [
        "категория",
        "категории",
        "категорий",
      ])}`;
      const nums = selectedCategories
        .map((c) => {
          const cleaned = String(c.percent)
            .replace(",", ".")
            .replace(/[^0-9.]/g, "");
          return parseFloat(cleaned);
        })
        .filter((n) => !Number.isNaN(n) && n > 0);
      const maxP = nums.length > 0 ? Math.max(...nums) : null;
      return maxP ? `${countLabel} · до ${maxP}%` : countLabel;
    }, [selectedCategories]);

    const shapeClassesMedium = {
      circle: "w-9 h-9 rounded-full",
      square: "w-9 h-9 rounded-[22%]",
      rectangle: "w-9 h-12 rounded-[15%]",
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
      <div className="flex flex-col gap-3.5 flex-1">
        {/* Блок 1: Компактный выпадающий селектор банка */}
        <div ref={bankDropdownRef} className="relative z-30">
          {selectedBankId && currentBank ? (
            <div
              className={clsx(
                "flex items-center justify-between gap-2.5 p-2.5 rounded-control border transition-[border-color,background-color] bg-[var(--fill)]",
                isBankPickerOpen
                  ? "border-[var(--accent-color)]/50"
                  : "border-[var(--border-hairline)]",
              )}
            >
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
                  <span className="font-bold text-[14px] text-[var(--text-primary)] block truncate tracking-tight leading-tight">
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
                onClick={() => setIsBankPickerOpen((prev) => !prev)}
                className={clsx(
                  "h-8 px-2.5 rounded-control border text-[12px] font-semibold transition-[background-color,border-color,color,transform] active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shrink-0",
                  isBankPickerOpen
                    ? "bg-[var(--percent-bg)] border-[var(--accent-color)]/40 text-[var(--percent-text)]"
                    : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
                title="Выбрать другой банк"
              >
                <span>Сменить</span>
                <ChevronDown
                  className={clsx(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    isBankPickerOpen && "rotate-180",
                  )}
                />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsBankPickerOpen((prev) => !prev)}
              className={clsx(
                "w-full flex items-center justify-between gap-2.5 p-2.5 rounded-control border text-left transition-[background-color,border-color,box-shadow,transform] active:scale-[0.99] cursor-pointer",
                isBankPickerOpen
                  ? "bg-[var(--fill-hover)] border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20"
                  : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] border-[var(--border-hairline)]",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-control bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[14px] text-[var(--text-primary)] block truncate leading-tight">
                    Выберите банк
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] block truncate mt-0.5">
                    Из списка или создайте свой
                  </span>
                </div>
              </div>
              <div className="h-8 px-2.5 rounded-control bg-[var(--fill)] border border-[var(--border-hairline)] text-[var(--text-secondary)] inline-flex items-center gap-1 text-[12px] font-semibold shrink-0">
                <span>Список</span>
                <ChevronDown
                  className={clsx(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    isBankPickerOpen && "rotate-180",
                  )}
                />
              </div>
            </button>
          )}

          {/* Выпадающее меню выбора банка */}
          <AnimatePresence initial={false}>
            {isBankPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-card bg-white dark:bg-[var(--surface-2)] border border-[var(--border-strong)] shadow-[var(--elevation-highlight),0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[var(--elevation-highlight),0_24px_48px_rgba(0,0,0,0.75)] p-2 flex flex-col gap-1.5"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                  <input
                    ref={bankSearchInputRef}
                    type="text"
                    placeholder="Поиск или название нового банка..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={clsx(
                      "w-full h-9 pl-9 bg-[var(--fill)] focus:bg-[var(--fill-hover)] border border-[var(--border-hairline)] focus:border-[var(--accent-color)] rounded-control text-[13px] font-medium focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-[background-color,border-color]",
                      searchQuery ? "pr-8" : "pr-3",
                    )}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--fill-hover)] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-[216px] overflow-y-auto overscroll-contain scrollbar-hide flex flex-col gap-0.5 pr-0.5">
                  {filteredBanks.map((bank) => {
                    const isCustom = bank.id.startsWith("custom_");
                    const isCurrent = bank.id === selectedBankId;

                    return (
                      <div
                        key={bank.id}
                        className={clsx(
                          "flex items-center justify-between gap-2 rounded-control transition-colors",
                          isCurrent
                            ? "bg-[var(--percent-bg)] text-[var(--accent-color)]"
                            : "hover:bg-[var(--fill-hover)] text-[var(--text-primary)]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (bank.id !== selectedBankId) {
                              setCustomLogo(undefined);
                              setCustomBankName("");
                            }
                            setSelectedBankId(bank.id);
                            setIsBankPickerOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex-1 min-w-0 flex items-center justify-between gap-2.5 px-2.5 py-2 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BankLogo
                              bank={bank}
                              logoShape={globalLogoShape}
                              size="sm"
                            />
                            <span
                              className={clsx(
                                "text-[13px] truncate",
                                isCurrent ? "font-bold" : "font-semibold",
                              )}
                            >
                              {bank.name}
                            </span>
                          </div>
                          {isCurrent && (
                            <Check className="w-4 h-4 shrink-0 text-[var(--accent-color)]" />
                          )}
                        </button>

                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankToDelete(bank.id);
                            }}
                            className="w-7 h-7 mr-1.5 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                            title="Удалить свой банк"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {filteredBanks.length === 0 && searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankId("custom");
                        setCustomBankName(searchQuery.trim());
                        setCustomLogo(undefined);
                        setIsBankPickerOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full py-2.5 px-3 border border-dashed border-[var(--accent-color)]/40 bg-[var(--fill)] hover:bg-[var(--fill-hover)] rounded-control text-[var(--accent-color)] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить банк «{searchQuery.trim()}»</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Блок 2: Лоток выбранных категорий + однострочная панель пресетов % */}
        <div
          className={clsx(
            "flex flex-col gap-2 transition-opacity duration-300",
            !selectedBankId && "opacity-50 pointer-events-none select-none",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Выбранные
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] truncate">
                · % необязателен
              </span>
            </div>
            <span
              className={clsx(
                "text-[11px] font-semibold tabular-nums leading-none px-2.5 py-1 rounded-full transition-colors inline-flex items-center justify-center shrink-0",
                selectedCategories.length > 0
                  ? "bg-[var(--percent-bg)] text-[var(--percent-text)]"
                  : "bg-[var(--fill)] text-[var(--text-tertiary)]",
              )}
            >
              {selectedCategories.length > 0
                ? `${selectedCategories.length} ${pluralize(
                    selectedCategories.length,
                    ["категория", "категории", "категорий"],
                  )}`
                : "Не выбрано"}
            </span>
          </div>

          {selectedCategories.length === 0 ? (
            <div className="py-3 px-3 rounded-control bg-[var(--fill)] border border-dashed border-[var(--border-hairline)] text-center text-xs text-[var(--text-tertiary)]">
              Выберите категории из списка ниже
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {selectedCategories.map((cat) => {
                  const isFocused = cat.name === resolvedActiveCategoryName;
                  const hasPercentSign = cat.percent.includes("%");
                  const inputCharWidth = Math.min(
                    5,
                    Math.max(1, cat.percent.length),
                  );

                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, scale: 0.97, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.97,
                        y: -4,
                        transition: { duration: 0.14, ease: "easeInOut" },
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        mass: 0.75,
                      }}
                      onClick={() => setActiveCategoryName(cat.name)}
                      className={clsx(
                        "cursor-pointer flex items-center justify-between gap-2 pl-3 pr-1.5 py-1.5 rounded-control border transition-[background-color,border-color,box-shadow] transform-gpu",
                        isFocused
                          ? "bg-[var(--fill-hover)] border-[var(--accent-color)]/60 ring-1 ring-[var(--accent-color)]/20"
                          : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] border-[var(--border-hairline)]",
                      )}
                    >
                      <span
                        className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight flex-1 min-w-0"
                        title={cat.name}
                      >
                        {cat.name}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className={clsx(
                            "inline-flex items-center justify-center w-[54px] h-7 px-1.5 rounded-control bg-[var(--percent-bg)] border transition-[border-color,box-shadow] cursor-text",
                            isFocused
                              ? "border-[var(--accent-color)]/50"
                              : "border-[var(--accent-color)]/30 focus-within:border-[var(--accent-color)]",
                          )}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="—"
                            value={cat.percent}
                            onFocus={() => setActiveCategoryName(cat.name)}
                            onChange={(e) =>
                              updateCategoryPercent(cat.name, e.target.value)
                            }
                            aria-label={`Процент для категории ${cat.name}`}
                            style={{
                              width: cat.percent
                                ? `${inputCharWidth}ch`
                                : "100%",
                            }}
                            className="min-w-[1ch] max-w-[36px] bg-transparent text-center text-[13px] font-bold tabular-nums leading-none text-[var(--percent-text)] placeholder-[var(--text-tertiary)] focus:outline-none no-spinner"
                          />
                          {cat.percent.trim() !== "" && !hasPercentSign && (
                            <span className="text-[10px] font-bold text-[var(--percent-text)]/80 leading-none ml-[1px] shrink-0 select-none pointer-events-none">
                              %
                            </span>
                          )}
                        </label>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(cat.name);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-[background-color,color,transform] active:scale-90 cursor-pointer shrink-0"
                          title={`Убрать «${cat.name}»`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Однострочная сетка быстрых пресетов % (7 равных колонок без переноса строк) */}
          <div
            className={clsx(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              selectedCategories.length > 0
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none",
            )}
          >
            <div className="overflow-hidden min-h-0">
              <div className="grid grid-cols-7 gap-1 pt-0.5">
                {QUICK_PERCENTS.map((val) => {
                  const isMatch =
                    activeCategoryObj &&
                    activeCategoryObj.percent.trim() === val;

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleApplyQuickPercent(val)}
                      className={clsx(
                        "h-7 rounded-control border text-[11.5px] font-bold tabular-nums leading-none inline-flex items-center justify-center active:scale-95 transition-[background-color,border-color,color,transform] cursor-pointer",
                        isMatch
                          ? "bg-[var(--percent-bg)] border-[var(--accent-color)]/50 text-[var(--percent-text)]"
                          : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {val}%
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Блок 3: Поиск / создание + 2-колоночная сетка всех категорий */}
        <div
          className={clsx(
            "flex flex-col gap-2.5 transition-opacity duration-300",
            !selectedBankId && "opacity-50 pointer-events-none select-none",
          )}
        >
          <form
            onSubmit={handleCreateCategoryFromSearch}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              ref={categorySearchInputRef}
              type="text"
              placeholder="Поиск или новая категория…"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className={clsx(
                "w-full h-10 pl-9 bg-[var(--fill)] focus:bg-[var(--fill-hover)] hover:bg-[var(--fill-hover)] border border-[var(--border-hairline)] focus:border-[var(--accent-color)] rounded-control text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/20 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-[background-color,border-color,box-shadow]",
                trimmedCategoryQuery ? "pr-[122px]" : "pr-3",
              )}
            />
            <AnimatePresence initial={false}>
              {trimmedCategoryQuery && (
                <motion.div
                  key="category-search-actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.14 }}
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
                    className="h-7 px-2.5 rounded-control bg-[var(--accent-color)] text-white text-[11px] font-bold leading-none inline-flex items-center justify-center gap-1 active:scale-95 transition-[filter,transform] hover:brightness-110 shadow-sm shadow-[var(--accent-color)]/20 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[2.8]" />
                    <span>{canCreateFromQuery ? "Создать" : "Выбрать"}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              Все категории
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {filteredCategories.map((cat) => {
                const selectedItem = selectedCategoryMap.get(cat);
                const isSelected = Boolean(selectedItem);
                const isCustomCategory = !baseCategorySet.has(cat);
                const normalizedPercent = formatPercentValue(
                  selectedItem?.percent,
                );
                const formattedPercentBadge = normalizedPercent
                  ? `${normalizedPercent}%`
                  : null;

                if (isCustomCategory && !isSelected) {
                  return (
                    <div
                      key={cat}
                      className="min-h-[38px] flex items-center rounded-control border bg-[var(--fill)] hover:bg-[var(--fill-hover)] text-[var(--text-secondary)] border-[var(--border-hairline)] transition-[background-color,color,border-color] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="pl-2.5 pr-1 py-1.5 flex-1 min-w-0 h-full flex items-center text-left hover:text-[var(--text-primary)] cursor-pointer transition-[color,transform] active:scale-[0.98]"
                        title={cat}
                      >
                        <span className="text-[12.5px] font-medium leading-tight truncate min-w-0 flex-1">
                          {cat}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToDelete(cat);
                        }}
                        className="w-6 h-6 mr-1 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-[background-color,color,transform] active:scale-90 cursor-pointer shrink-0"
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
                      "min-h-[38px] px-2.5 py-1.5 rounded-control text-left transition-[background-color,color,border-color,box-shadow,transform] active:scale-95 flex items-center justify-between gap-1.5 cursor-pointer border",
                      isSelected
                        ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm shadow-[var(--accent-color)]/20"
                        : "bg-[var(--fill)] hover:bg-[var(--fill-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-hairline)]",
                    )}
                  >
                    <span
                      className={clsx(
                        "text-[12.5px] leading-tight truncate min-w-0 flex-1",
                        isSelected ? "font-semibold" : "font-medium",
                      )}
                    >
                      {cat}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold tabular-nums leading-none px-1.5 py-0.5 rounded-[min(6px,var(--radius-sm))] bg-white/20 inline-flex items-center justify-center shrink-0">
                        {formattedPercentBadge || (
                          <Check className="w-3 h-3 stroke-[2.6]" />
                        )}
                      </span>
                    )}
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
        </div>

        {/* Блок 4: Sticky-футер с одной полноширинной CTA и живой сводкой */}
        <div className="pt-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] border-t border-[var(--border-hairline)] mt-auto sticky -bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:-bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] -mb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:-mb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] -mx-3 sm:-mx-4 px-3 sm:px-4 bg-white dark:bg-[var(--surface-2)] z-20">
          <button
            type="button"
            onClick={handleSave}
            disabled={
              !selectedBankId ||
              selectedCategories.length === 0 ||
              (isCustomBank && !customBankName.trim())
            }
            className="w-full h-11 px-4 rounded-control font-bold text-[15px] text-white bg-[var(--accent-color)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-[filter,opacity,transform] shadow-md shadow-[var(--accent-color)]/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="leading-none">
              {initialEntry ? "Сохранить изменения" : "Сохранить банк"}
            </span>
            {ctaSummaryText && (
              <span className="text-[12px] font-bold tabular-nums leading-none px-2 py-1 rounded-[min(6px,var(--radius-sm))] bg-white/20 inline-flex items-center justify-center">
                {ctaSummaryText}
              </span>
            )}
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
