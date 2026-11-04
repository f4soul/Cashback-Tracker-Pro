export function pluralize(
  count: number,
  words: [string, string, string],
): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  ];
}

/**
 * Приводит пользовательский ввод процента к единому формату с точкой в качестве десятичного разделителя ("2,5" -> "2.5")
 */
export function normalizePercentInput(value: string): string {
  return value.replace(/,/g, ".");
}

/**
 * Форматирует сохранённое значение процента для отображения в таблицах, бейджах и при экспорте:
 * заменяет запятую на точку и убирает дублирующийся символ %, если он был введён вручную.
 */
export function formatPercentValue(
  value: string | number | undefined | null,
): string {
  if (value === undefined || value === null) return "";
  return String(value).trim().replace(/,/g, ".").replace(/%+$/, "").trim();
}
