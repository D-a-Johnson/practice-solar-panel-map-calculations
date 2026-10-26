import type { AssumptionKey } from "../../api/assumptions";
import { useAssumptions } from "../../lib/assumptionsContext";
import { NumberInput } from "./NumberInput";

/** Inputs shown in friendlier units than the stored ones (€/kWh, share). */
const FIELDS: {
  key: AssumptionKey;
  label: string;
  factor: number;
  step: number;
}[] = [
  { key: "electricity_price", label: "Price ct/kWh", factor: 100, step: 0.1 },
  { key: "feed_in_tariff", label: "Feed-in ct/kWh", factor: 100, step: 0.01 },
  {
    key: "self_consumption_share",
    label: "Used at home %",
    factor: 100,
    step: 1,
  },
  { key: "system_cost_per_kwp", label: "Cost €/kWp", factor: 1, step: 10 },
];

export function AssumptionsEditor() {
  const { defaults, values, setValue, reset } = useAssumptions();
  if (!defaults || !values) {
    return null;
  }

  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-slate-600">
        Assumptions and sources
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <NumberInput
            key={field.key}
            label={field.label}
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
        Reset to defaults
      </button>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {Object.values(defaults).map((assumption) => (
          <li key={assumption.label}>
            {assumption.label}: {assumption.value} {assumption.unit}.{" "}
            <a
              href={assumption.source_url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {assumption.source}
            </a>{" "}
            ({assumption.as_of})
          </li>
        ))}
      </ul>
    </details>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
