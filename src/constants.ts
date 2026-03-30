import { Bank } from './types';

export const BANKS: Bank[] = [
  {
    id: 'tbank',
    name: 'Т-Банк',
    color: '#FFDD2D',
    logoText: 'Т',
    logoUrl: './logos/tbank.png',
  },
  {
    id: 'sber',
    name: 'Сбербанк',
    color: '#21A038',
    logoText: 'С',
    logoUrl: './logos/sber.png',
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    color: '#EF3124',
    logoText: 'А',
    logoUrl: './logos/alfa.png',
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    color: '#0A2896',
    logoText: 'В',
    logoUrl: './logos/vtb.png',
  },
  {
    id: 'raif',
    name: 'Райффайзен',
    color: '#FEE600',
    logoText: 'Р',
    logoUrl: './logos/raiff.png',
  },
  {
    id: 'gazprom',
    name: 'Газпромбанк',
    color: '#00145A',
    logoText: 'Г',
    logoUrl: './logos/gazprom.png',
  },
  {
    id: 'ozon',
    name: 'Ozon Банк',
    color: '#005BFF',
    logoText: 'O',
    logoUrl: './logos/ozon.png',
  },
  {
    id: 'yandex',
    name: 'Яндекс Пэй',
    color: '#FFCC00',
    logoText: 'Я',
    logoUrl: './logos/yandex.png',
  },
  {
    id: 'uralsib',
    name: 'Уралсиб',
    color: '#004B87',
    logoText: 'У',
    logoUrl: './logos/uralsib.png',
  },
  {
    id: 'psb',
    name: 'ПСБ',
    color: '#E35F14',
    logoText: 'П',
    logoUrl: './logos/psb.png',
  },
  {
    id: 'rshb',
    name: 'РСХБ',
    color: '#006B3D',
    logoText: 'РС',
    logoUrl: './logos/rshb.png',
  },
  {
    id: 'mkb',
    name: 'МКБ',
    color: '#E3000F',
    logoText: 'М',
    logoUrl: './logos/mkb.png',
  },
  {
    id: 'sovcom',
    name: 'Совкомбанк',
    color: '#0033A0',
    logoText: 'СВ',
    logoUrl: './logos/sovcom.png',
  },
  {
    id: 'mts',
    name: 'МТС Банк',
    color: '#E30611',
    logoText: 'МТ',
    logoUrl: './logos/mts.png',
  },
  {
    id: 'rnkb',
    name: 'РНКБ',
    color: '#0055A5',
    logoText: 'РН',
    logoUrl: './logos/rnkb.png',
  },
  {
    id: 'domrf',
    name: 'Банк ДОМ.РФ',
    color: '#00A19C',
    logoText: 'Д',
    logoUrl: './logos/domrf.png',
  },
  {
    id: 'ubrir',
    name: 'УБРиР',
    color: '#E3000F',
    logoText: 'УБ',
    logoUrl: './logos/ubrir.png',
  },
  {
    id: 'rencredit',
    name: 'Ренессанс',
    color: '#FF4B5F',
    logoText: 'РК',
    logoUrl: './logos/renaissance.png',
  },
  {
    id: 'otp',
    name: 'ОТП Банк',
    color: '#007A33',
    logoText: 'ОТ',
    logoUrl: './logos/otp.png',
  },
  {
    id: 'avangard',
    name: 'Авангард',
    color: '#0033A0',
    logoText: 'АВ',
    logoUrl: './logos/avangard.png',
  },
  {
    id: 'bspb',
    name: 'БСПБ',
    color: '#0033A0',
    logoText: 'БС',
    logoUrl: './logos/bsaintpet.png',
  },
];

export const COMMON_CATEGORIES = [
  'Все покупки',
  'Супермаркеты',
  'Аптеки',
  'Транспорт',
  'Такси',
  'Рестораны',
  'Фастфуд',
  'Одежда и обувь',
  'Электроника',
  'Дом и ремонт',
  'Автоуслуги',
  'АЗС',
  'Здоровье',
  'Красота',
  'Развлечения',
  'Образование',
  'Спорттовары',
  'Книги',
  'Животные',
  'Цветы',
  'Кино',
  'Маркетплейсы',
];

export const getBankDetails = (
  bankId: string,
  customName?: string,
): Bank | undefined => {
  if (bankId === 'custom' && customName) {
    return {
      id: 'custom',
      name: customName,
      color: '#64748b', // slate-500
      logoText: customName.charAt(0).toUpperCase(),
      logoUrl: './logos/bank-icon.png',
    };
  }
  return BANKS.find((b) => b.id === bankId);
};
