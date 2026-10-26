import { useI18n } from "../../i18n/language";

export function MonthlyChart({ values }: { values: number[] }) {
  const { t } = useI18n();
  const { months } = t.chart;
  const max = Math.max(...values);

  return (
    <figure className="mt-3">
      <div
        role="img"
        aria-label={t.chart.summary(Math.min(...values), max)}
        className="flex h-28 items-end gap-1"
      >
        {values.map((value, month) => (
          <div
            key={month}
            title={t.chart.month(months[month], value)}
            className="flex-1 rounded-t bg-amber-400"
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex gap-1 text-center text-[10px] text-slate-500"
      >
        {months.map((month) => (
          <span key={month} className="flex-1">
            {month[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}
