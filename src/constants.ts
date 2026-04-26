import { bankLogos } from './generatedLogos';
import { Bank } from './types';

export const BANKS: Bank[] = [
  {
    id: 'tbank',
    name: 'Т-Банк',
    color: '#FFDD2D',
    logoText: 'Т',
    logoUrl: bankLogos['tbank'],
  },
  {
    id: 'sber',
    name: 'Сбербанк',
    color: '#21A038',
    logoText: 'С',
    logoUrl: bankLogos['sber'],
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    color: '#EF3124',
    logoText: 'А',
    logoUrl: bankLogos['alfa'],
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    color: '#0A2896',
    logoText: 'В',
    logoUrl: bankLogos['vtb'],
  },
  {
    id: 'raif',
    name: 'Райффайзен',
    color: '#FEE600',
    logoText: 'Р',
    logoUrl: bankLogos['raiff'],
  },
  {
    id: 'gazprom',
    name: 'Газпромбанк',
    color: '#00145A',
    logoText: 'Г',
    logoUrl: bankLogos['gazprom'],
  },
  {
    id: 'ozon',
    name: 'Ozon Банк',
    color: '#005BFF',
    logoText: 'O',
    logoUrl: bankLogos['ozon'],
  },
  {
    id: 'yandex',
    name: 'Яндекс Банк',
    color: '#FFCC00',
    logoText: 'Я',
    logoUrl: bankLogos['yandex'],
  },
  {
    id: 'uralsib',
    name: 'Уралсиб',
    color: '#004B87',
    logoText: 'У',
    logoUrl: bankLogos['uralsib'],
  },
  {
    id: 'psb',
    name: 'ПСБ',
    color: '#E35F14',
    logoText: 'П',
    logoUrl: bankLogos['psb'],
  },
  {
    id: 'rshb',
    name: 'РСХБ',
    color: '#006B3D',
    logoText: 'РС',
    logoUrl: bankLogos['rshb'],
  },
  {
    id: 'mkb',
    name: 'МКБ',
    color: '#E3000F',
    logoText: 'М',
    logoUrl: bankLogos['mkb'],
  },
  {
    id: 'sovcom',
    name: 'Совкомбанк',
    color: '#0033A0',
    logoText: 'СВ',
    logoUrl: bankLogos['sovcom'],
  },
  {
    id: 'mts',
    name: 'МТС Банк',
    color: '#E30611',
    logoText: 'МТ',
    logoUrl: bankLogos['mts'],
  },
  {
    id: 'rnkb',
    name: 'РНКБ',
    color: '#0055A5',
    logoText: 'РН',
    logoUrl: bankLogos['rnkb'],
  },
  {
    id: 'domrf',
    name: 'Банк ДОМ.РФ',
    color: '#00A19C',
    logoText: 'Д',
    logoUrl: bankLogos['domrf'],
  },
  {
    id: 'ubrir',
    name: 'УБРиР',
    color: '#E3000F',
    logoText: 'УБ',
    logoUrl: bankLogos['ubrir'],
  },
  {
    id: 'rencredit',
    name: 'Ренессанс',
    color: '#FF4B5F',
    logoText: 'РК',
    logoUrl: bankLogos['renaissance'],
  },
  {
    id: 'otp',
    name: 'ОТП Банк',
    color: '#007A33',
    logoText: 'ОТ',
    logoUrl: bankLogos['otp'],
  },
  {
    id: 'avangard',
    name: 'Авангард',
    color: '#0033A0',
    logoText: 'АВ',
    logoUrl: bankLogos['avangard'],
  },
  {
    id: 'bspb',
    name: 'БСПБ',
    color: '#0033A0',
    logoText: 'БС',
    logoUrl: bankLogos['bsaintpet'],
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
      logoUrl: bankLogos['bank-icon'],
    };
  }
  return BANKS.find((b) => b.id === bankId);
};