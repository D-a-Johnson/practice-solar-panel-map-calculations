export type YieldCsvLabels = {
  separator: string;
  month: string;
  kwh: string;
  year: string;
  months: string[];
};

/**
 * One row per month plus the year, in whole kWh. The cells are month
 * names and whole numbers, so none of them needs quoting. The separator
 * comes from the language: Excel splits columns at the list separator of
 * the computer's region, which is ";" in German settings because "," is
 * the decimal comma there.
 */
export function yieldCsv(
  monthlyKwh: number[],
  annualKwh: number,
  labels: YieldCsvLabels,
): string {
  const rows = [
    [labels.month, labels.kwh],
    ...monthlyKwh.map((kwh, month) => [labels.months[month], Math.round(kwh)]),
    [labels.year, Math.round(annualKwh)],
  ];
  return rows.map((row) => row.join(labels.separator)).join("\r\n");
}
