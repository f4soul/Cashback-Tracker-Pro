import { DEFAULT_BANK_LOGO } from "../assets/bankLogos";
import { Bank } from "../types";
import { BANKS, BANKS_MAP } from "../constants";

export interface ResolveBankOptions {
  customName?: string;
  customLogo?: string;
  customColor?: string;
  customLogoText?: string;
  customBanks?: Bank[];
}

export const DEFAULT_BANK_COLOR = "#64748b";
export { DEFAULT_BANK_LOGO };

/**
 * Единая функция разрешения банка: имя/id банка -> иконка + цвет + метаданные.
 * Централизует логику поиска стандартных/кастомных банков и устраняет разрозненные маппинги.
 */
export function resolveBank(
  bankIdOrName?: string | null,
  options?: ResolveBankOptions,
): Bank {
  const customName = options?.customName?.trim();
  const customLogo = options?.customLogo;
  const customColor = options?.customColor;
  const customLogoText = options?.customLogoText;

  // Если идентификатор не передан
  if (!bankIdOrName) {
    const name = customName || "Банк";
    return {
      id: "custom",
      name,
      color: customColor || DEFAULT_BANK_COLOR,
      logoText: customLogoText || name.charAt(0).toUpperCase() || "Б",
      logoUrl: customLogo || DEFAULT_BANK_LOGO,
    };
  }

  // 1. Поиск в стандартных банках по ID (O(1))
  const standardBank = BANKS_MAP.get(bankIdOrName);
  if (standardBank) {
    return {
      ...standardBank,
      color: customColor || standardBank.color,
      logoText: customLogoText || standardBank.logoText,
      logoUrl: customLogo || standardBank.logoUrl || DEFAULT_BANK_LOGO,
    };
  }

  // 2. Поиск в переданном списке кастомных банков по ID
  if (options?.customBanks && options.customBanks.length > 0) {
    const customBank = options.customBanks.find((b) => b.id === bankIdOrName);
    if (customBank) {
      return {
        ...customBank,
        color: customColor || customBank.color || DEFAULT_BANK_COLOR,
        logoText:
          customLogoText ||
          customBank.logoText ||
          customBank.name.charAt(0).toUpperCase() ||
          "Б",
        logoUrl: customLogo || customBank.logoUrl || DEFAULT_BANK_LOGO,
      };
    }
  }

  // 3. Поиск по имени среди стандартных банков (регистронезависимый)
  const normalizedSearch = bankIdOrName.trim().toLowerCase();
  const matchedByName = BANKS.find(
    (b) => b.name.toLowerCase() === normalizedSearch,
  );
  if (matchedByName) {
    return {
      ...matchedByName,
      color: customColor || matchedByName.color,
      logoText: customLogoText || matchedByName.logoText,
      logoUrl: customLogo || matchedByName.logoUrl || DEFAULT_BANK_LOGO,
    };
  }

  // 4. Поиск по имени среди кастомных банков
  if (options?.customBanks && options.customBanks.length > 0) {
    const matchedCustomByName = options.customBanks.find(
      (b) => b.name.toLowerCase() === normalizedSearch,
    );
    if (matchedCustomByName) {
      return {
        ...matchedCustomByName,
        color: customColor || matchedCustomByName.color || DEFAULT_BANK_COLOR,
        logoText:
          customLogoText ||
          matchedCustomByName.logoText ||
          matchedCustomByName.name.charAt(0).toUpperCase() ||
          "Б",
        logoUrl:
          options.customLogo ||
          matchedCustomByName.logoUrl ||
          DEFAULT_BANK_LOGO,
      };
    }
  }

  // 5. Кастомный или неизвестный банк (фолбэк)
  const displayName = customName || bankIdOrName;
  const initial = customLogoText || displayName.charAt(0).toUpperCase() || "Б";

  return {
    id: bankIdOrName,
    name: displayName,
    color: customColor || DEFAULT_BANK_COLOR,
    logoText: initial,
    logoUrl: customLogo || DEFAULT_BANK_LOGO,
  };
}
