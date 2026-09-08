import { BANK_LOGOS, DEFAULT_BANK_LOGO } from './assets/bankLogos';
import { Bank } from "./types";

export const BANKS: Bank[] = [
  {
    id: "tbank",
    name: "Т-Банк",
    color: "#FFDD2D",
    logoText: "Т",
    logoUrl: BANK_LOGOS['tbank'],
  },
  {
    id: "sber",
    name: "Сбербанк",
    color: "#21A038",
    logoText: "С",
    logoUrl: BANK_LOGOS['sber'],
  },
  {
    id: "alfa",
    name: "Альфа-Банк",
    color: "#EF3124",
    logoText: "А",
    logoUrl: BANK_LOGOS['alfa'],
  },
  {
    id: "vtb",
    name: "ВТБ",
    color: "#0A2896",
    logoText: "В",
    logoUrl: BANK_LOGOS['vtb'],
  },
  {
    id: "raif",
    name: "Райффайзен",
    color: "#FEE600",
    logoText: "Р",
    logoUrl: BANK_LOGOS['raiff'],
  },
  {
    id: "gazprom",
    name: "Газпромбанк",
    color: "#00145A",
    logoText: "Г",
    logoUrl: BANK_LOGOS['gazprom'],
  },
  {
    id: "ozon",
    name: "Ozon Банк",
    color: "#005BFF",
    logoText: "O",
    logoUrl: BANK_LOGOS['ozon'],
  },
  {
    id: "yandex",
    name: "Яндекс Банк",
    color: "#FFCC00",
    logoText: "Я",
    logoUrl: BANK_LOGOS['yandex'],
  },
  {
    id: "uralsib",
    name: "Уралсиб",
    color: "#004B87",
    logoText: "У",
    logoUrl: BANK_LOGOS['uralsib'],
  },
  {
    id: "psb",
    name: "ПСБ",
    color: "#E35F14",
    logoText: "П",
    logoUrl: BANK_LOGOS['psb'],
  },
  {
    id: "rshb",
    name: "РСХБ",
    color: "#006B3D",
    logoText: "РС",
    logoUrl: BANK_LOGOS['rshb'],
  },
  {
    id: "mkb",
    name: "МКБ",
    color: "#E3000F",
    logoText: "М",
    logoUrl: BANK_LOGOS['mkb'],
  },
  {
    id: "sovcom",
    name: "Совкомбанк",
    color: "#0033A0",
    logoText: "СВ",
    logoUrl: BANK_LOGOS['sovcom'],
  },
  {
    id: "mts",
    name: "МТС Банк",
    color: "#E30611",
    logoText: "МТ",
    logoUrl: BANK_LOGOS['mts'],
  },
  {
    id: "rnkb",
    name: "РНКБ",
    color: "#0055A5",
    logoText: "РН",
    logoUrl: BANK_LOGOS['rnkb'],
  },
  {
    id: "domrf",
    name: "Банк ДОМ.РФ",
    color: "#00A19C",
    logoText: "Д",
    logoUrl: BANK_LOGOS['domrf'],
  },
  {
    id: "ubrir",
    name: "УБРиР",
    color: "#E3000F",
    logoText: "УБ",
    logoUrl: BANK_LOGOS['ubrir'],
  },
  {
    id: "rencredit",
    name: "Ренессанс",
    color: "#FF4B5F",
    logoText: "РК",
    logoUrl: BANK_LOGOS['renaissance'],
  },
  {
    id: "otp",
    name: "ОТП Банк",
    color: "#007A33",
    logoText: "ОТ",
    logoUrl: BANK_LOGOS['otp'],
  },
  {
    id: "avangard",
    name: "Авангард",
    color: "#0033A0",
    logoText: "АВ",
    logoUrl: BANK_LOGOS['avangard'],
  },
  {
    id: "bspb",
    name: "БСПБ",
    color: "#0033A0",
    logoText: "БС",
    logoUrl: BANK_LOGOS['bsaintpet'],
  },
];

export const COMMON_CATEGORIES = [
  "Все покупки",
  "Супермаркеты",
  "Аптеки",
  "Транспорт",
  "Такси",
  "Рестораны",
  "Фастфуд",
  "Одежда и обувь",
  "Электроника",
  "Дом и ремонт",
  "ЖКХ",
  "Автоуслуги",
  "АЗС",
  "Здоровье",
  "Красота",
  "Развлечения",
  "Образование",
  "Спорттовары",
  "Книги",
  "Животные",
  "Цветы",
  "Кино",
  "Маркетплейсы",
];

export const BANKS_MAP = new Map<string, Bank>(BANKS.map((b) => [b.id, b]));

export const getBankDetails = (
  bankId: string,
  customName?: string,
): Bank | undefined => {
  if (bankId === "custom" && customName) {
    return {
      id: "custom",
      name: customName,
      color: "#64748b",
      logoText: customName.charAt(0).toUpperCase(),
      logoUrl: DEFAULT_BANK_LOGO,
    };
  }
  return BANKS_MAP.get(bankId);
};
