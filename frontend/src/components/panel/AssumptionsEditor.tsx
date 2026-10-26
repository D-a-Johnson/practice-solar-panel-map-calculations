import type { AssumptionKey } from "../../api/assumptions";
import type { Messages } from "../../i18n/en";
import { useI18n } from "../../i18n/language";
import { useAssumptions } from "../../lib/assumptionsContext";
import { NumberInput } from "./NumberInput";

/** Inputs shown in friendlier units than the stored ones (€/kWh, share). */
const FIELDS: {
  key: keyof Messages["assumptions"]["fields"];
  factor: number;
  step: number;
}[] = [
  { key: "electricity_price", factor: 100, step: 0.1 },
  { key: "feed_in_tariff", factor: 100, step: 0.01 },
  { key: "self_consumption_share", factor: 100, step: 1 },
  { key: "system_cost_per_kwp", factor: 1, step: 10 },
];

export function AssumptionsEditor() {
  const { defaults, values, setValue, reset } = useAssumptions();
  const { t } = useI18n();
  if (!defaults || !values) {
    return null;
  }

  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-slate-600">
        {t.assumptions.title}
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <NumberInput
            key={field.key}
            label={t.assumptions.fields[field.key]}
            value={round(values[field.key] * field.factor)}
            onChange={(value) => setValue(field.key, value / field.factor)}
            min={0}
            step={field.step}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-2 text-xs text-amber-700 underline"
      >
        {t.assumptions.reset}
      </button>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {(Object.keys(defaults) as AssumptionKey[]).map((key) => (
          <li key={key}>
            {t.assumptions.names[key]}:{" "}
            {t.assumptions.values[key](defaults[key].value)}.{" "}
            <a
              href={defaults[key].source_url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {defaults[key].source}
            </a>{" "}
            ({defaults[key].as_of})
          </li>
        ))}
      </ul>
    </details>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
