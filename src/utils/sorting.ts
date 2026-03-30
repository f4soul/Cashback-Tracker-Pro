import { CategoryItem } from '../types';

export const getCategoryPercent = (cat: string | CategoryItem): number => {
  if (typeof cat === 'string') return 0;
  if (!cat.percent) return 0;
  const match = String(cat.percent).match(/[\d.,]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(',', '.'));
};

export const sortCategoriesAsc = (categories: (string | CategoryItem)[]): (string | CategoryItem)[] => {
  return [...categories].sort((a, b) => {
    const pA = getCategoryPercent(a);
    const pB = getCategoryPercent(b);
    
    if (pA !== pB) {
      return pA - pB;
    }
    
    // If percentages are equal, sort alphabetically by name
    const nameA = typeof a === 'string' ? a : a.name;
    const nameB = typeof b === 'string' ? b : b.name;
    return nameA.localeCompare(nameB);
  });
};

export const sortCategoriesDesc = (categories: (string | CategoryItem)[]): (string | CategoryItem)[] => {
  return [...categories].sort((a, b) => {
    const pA = getCategoryPercent(a);
    const pB = getCategoryPercent(b);
    
    if (pA !== pB) {
      return pB - pA;
    }
    
    // If percentages are equal, sort alphabetically by name
    const nameA = typeof a === 'string' ? a : a.name;
    const nameB = typeof b === 'string' ? b : b.name;
    return nameA.localeCompare(nameB);
  });
};

export const sortCategoriesCustom = (categories: (string | CategoryItem)[]): (string | CategoryItem)[] => {
  return [...categories].sort((a, b) => {
    const nameA = typeof a === 'string' ? a : a.name;
    const nameB = typeof b === 'string' ? b : b.name;

    if (nameA === 'Все покупки') return -1;
    if (nameB === 'Все покупки') return 1;

    return nameA.localeCompare(nameB);
  });
};
