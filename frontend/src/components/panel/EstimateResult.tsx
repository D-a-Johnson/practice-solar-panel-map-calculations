import { type YieldQuery, useYieldPerKwp } from "../../api/estimates";
import { useAssumptions } from "../../lib/assumptionsContext";
import { economics } from "../../lib/economics";
import { AssumptionsEditor } from "./AssumptionsEditor";
import { Hint } from "./Hint";
import { MonthlyChart } from "./MonthlyChart";

type EstimateResultProps = { query: YieldQuery; peakPowerKwp: number };

const euros = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function EstimateResult({ query, peakPowerKwp }: EstimateResultProps) {
  const perKwp = useYieldPerKwp(query);
  const { values } = useAssumptions();

  if (!(peakPowerKwp >= 0.1)) {
    return <Hint>Enter at least 0.1 kWp.</Hint>;
  }
  if (perKwp.isPending) {
    return <Hint>Calculating yield…</Hint>;
  }
  if (perKwp.isError) {
    return <Hint>{perKwp.error.message}</Hint>;
  }

  const { annual_kwh_per_kwp: annual, monthly_kwh_per_kwp: monthly } =
    perKwp.data;
  const annualKwh = annual * peakPowerKwp;
  const complete = values && Object.values(values).every(Number.isFinite);
  const money = complete
    ? economics(annualKwh, peakPowerKwp, values)
    : undefined;

  return (
    <section aria-label="Yield estimate" className="mt-4">
      <p className="text-2xl font-semibold">
        {Math.round(annualKwh).toLocaleString("en")} kWh
        <span className="text-base font-normal text-slate-600"> per year</span>
      </p>
      <p className="text-sm text-slate-600">{Math.round(annual)} kWh per kWp</p>
      <MonthlyChart values={monthly.map((month) => month * peakPowerKwp)} />
      <p className="mt-2 text-xs text-slate-500">
        Source: PVGIS © European Union
      </p>

      {money && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Figure
            label="Savings per year"
            value={euros.format(money.savingsPerYear)}
          />
          <Figure label="System cost" value={euros.format(money.systemCost)} />
          <Figure
            label="Payback"
            value={
              money.paybackYears === null
                ? "never"
                : `${money.paybackYears.toFixed(1)} years`
            }
          />
          <Figure
            label="CO₂ avoided per year"
            value={formatMass(money.co2SavedKgPerYear)}
          />
        </dl>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Simple payback: no price changes, degradation, maintenance or financing.
      </p>
      <AssumptionsEditor />
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function formatMass(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`;
}
