export const getCurrentMonthId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatMonthId = (monthId: string) => {
  const [year, month, isTest] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const formatted = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '');
  return isTest === 'test' ? `${formatted} (Тест)` : formatted;
};

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
