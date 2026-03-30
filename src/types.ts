export interface CategoryItem {
  name: string;
  percent: string;
}

export interface Bank {
  id: string;
  name: string;
  color: string;
  logoText: string;
  logoUrl?: string;
}

export type LogoShape = 'circle' | 'square' | 'rectangle';

export interface CashbackEntry {
  id: string;
  bankId: string;
  customBankName?: string;
  customLogo?: string;
  categories: CategoryItem[];
}

export interface AppSettings {
  logoShape: LogoShape;
  fontSize: number; // 12-20
  accentColor: string;
  percentBlockBg: string;
  percentBlockText: string;
  fontColor: string;
}

export interface MonthData {
  monthId: string; // Format: "YYYY-MM"
  entries: CashbackEntry[];
}

