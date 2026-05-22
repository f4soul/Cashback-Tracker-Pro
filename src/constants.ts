import { Bank } from './types';

export const BANKS: Bank[] = [
  {
    id: 'tbank',
    name: 'Т-Банк',
    color: '#FFDD2D',
    logoText: 'Т',
    logoUrl: '/logos/tbank.svg',
  },
  {
    id: 'sber',
    name: 'Сбербанк',
    color: '#21A038',
    logoText: 'С',
    logoUrl: '/logos/sber.svg',
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    color: '#EF3124',
    logoText: 'А',
    logoUrl: '/logos/alfa.svg',
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    color: '#0A2896',
    logoText: 'В',
    logoUrl: '/logos/vtb.svg',
  },
  {
    id: 'raif',
    name: 'Райффайзен',
    color: '#FEE600',
    logoText: 'Р',
    logoUrl: '/logos/raiff.svg',
  },
  {
    id: 'gazprom',
    name: 'Газпромбанк',
    color: '#00145A',
    logoText: 'Г',
    logoUrl: '/logos/gazprom.svg',
  },
  {
    id: 'ozon',
    name: 'Ozon Банк',
    color: '#005BFF',
    logoText: 'O',
    logoUrl: '/logos/ozon.svg',
  },
  {
    id: 'yandex',
    name: 'Яндекс Банк',
    color: '#FFCC00',
    logoText: 'Я',
    logoUrl: '/logos/yandex.svg',
  },
  {
    id: 'uralsib',
    name: 'Уралсиб',
    color: '#004B87',
    logoText: 'У',
    logoUrl: '/logos/uralsib.svg',
  },
  {
    id: 'psb',
    name: 'ПСБ',
    color: '#E35F14',
    logoText: 'П',
    logoUrl: '/logos/psb.svg',
  },
  {
    id: 'rshb',
    name: 'РСХБ',
    color: '#006B3D',
    logoText: 'РС',
    logoUrl: '/logos/rshb.svg',
  },
  {
    id: 'mkb',
    name: 'МКБ',
    color: '#E3000F',
    logoText: 'М',
    logoUrl: '/logos/mkb.svg',
  },
  {
    id: 'sovcom',
    name: 'Совкомбанк',
    color: '#0033A0',
    logoText: 'СВ',
    logoUrl: '/logos/sovcom.svg',
  },
  {
    id: 'mts',
    name: 'МТС Банк',
    color: '#E30611',
    logoText: 'МТ',
    logoUrl: '/logos/mts.svg',
  },
  {
    id: 'rnkb',
    name: 'РНКБ',
    color: '#0055A5',
    logoText: 'РН',
    logoUrl: '/logos/rnkb.svg',
  },
  {
    id: 'domrf',
    name: 'Банк ДОМ.РФ',
    color: '#00A19C',
    logoText: 'Д',
    logoUrl: '/logos/domrf.svg',
  },
  {
    id: 'ubrir',
    name: 'УБРиР',
    color: '#E3000F',
    logoText: 'УБ',
    logoUrl: '/logos/ubrir.svg',
  },
  {
    id: 'rencredit',
    name: 'Ренессанс',
    color: '#FF4B5F',
    logoText: 'РК',
    logoUrl: '/logos/renaissance.svg',
  },
  {
    id: 'otp',
    name: 'ОТП Банк',
    color: '#007A33',
    logoText: 'ОТ',
    logoUrl: '/logos/otp.svg',
  },
  {
    id: 'avangard',
    name: 'Авангард',
    color: '#0033A0',
    logoText: 'АВ',
    logoUrl: '/logos/avangard.svg',
  },
  {
    id: 'bspb',
    name: 'БСПБ',
    color: '#0033A0',
    logoText: 'БС',
    logoUrl: '/logos/bsaintpet.svg',
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
  'ЖКХ',
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
      logoUrl: '/logos/bank-icon.svg',
    };
  }
  return BANKS.find((b) => b.id === bankId);
};