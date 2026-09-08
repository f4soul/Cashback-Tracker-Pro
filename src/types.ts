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

export type LogoShape = "circle" | "square" | "rectangle";

export interface PlaceholderUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isPlaceholder: true;
}

export interface CashbackEntry {
  id: string;
  bankId: string;
  customBankName?: string;
  customLogo?: string;
  customBankColor?: string;
  customBankLogoText?: string;
  categories: CategoryItem[];
}

export interface AppSettings {
  logoShape: LogoShape;
  accentColor: string;
  percentBlockBg: string;
  percentBlockText: string;
  fontColor: string;
}

export interface MonthData {
  monthId: string; // Format: "YYYY-MM"
  entries: CashbackEntry[];
}

export interface BackupData {
  allData: MonthData[];
  customBanks?: Bank[];
  deletedCustomBanks?: Bank[];
  customCategories?: string[];
  settings?: AppSettings;
  theme?: "light" | "dark";
  version?: string;
  exportDate?: string;
}
