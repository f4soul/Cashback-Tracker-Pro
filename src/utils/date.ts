export const getCurrentMonthId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getNextMonthId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, so this is current month

  const nextDate = new Date(year, month + 1, 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
};

export const getPreviousMonthId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  const prevDate = new Date(year, month - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, "0");
  return `${prevYear}-${prevMonth}`;
};

export const formatMonthId = (monthId: string) => {
  const [year, month, isTest] = monthId.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const formatted = date
    .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    .replace(" г.", "");
  return isTest === "test" ? `${formatted} (Тест)` : formatted;
};

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
