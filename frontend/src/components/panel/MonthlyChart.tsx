const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthlyChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const summary = `Monthly yield from ${Math.round(Math.min(...values))} to ${Math.round(max)} kWh`;

  return (
    <figure className="mt-3">
      <div
        role="img"
        aria-label={summary}
        className="flex h-28 items-end gap-1"
      >
        {values.map((value, month) => (
          <div
            key={MONTHS[month]}
            title={`${MONTHS[month]}: ${Math.round(value)} kWh`}
            className="flex-1 rounded-t bg-amber-400"
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex gap-1 text-center text-[10px] text-slate-500"
      >
        {MONTHS.map((month) => (
          <span key={month} className="flex-1">
            {month[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}
