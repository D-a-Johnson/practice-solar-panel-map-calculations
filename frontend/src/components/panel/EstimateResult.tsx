import { type YieldQuery, useYieldPerKwp } from "../../api/estimates";
import { Hint } from "./Hint";
import { MonthlyChart } from "./MonthlyChart";

type EstimateResultProps = { query: YieldQuery; peakPowerKwp: number };

export function EstimateResult({ query, peakPowerKwp }: EstimateResultProps) {
  const perKwp = useYieldPerKwp(query);

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
  return (
    <section aria-label="Yield estimate" className="mt-4">
      <p className="text-2xl font-semibold">
        {Math.round(annual * peakPowerKwp).toLocaleString("en")} kWh
        <span className="text-base font-normal text-slate-600"> per year</span>
      </p>
      <p className="text-sm text-slate-600">{Math.round(annual)} kWh per kWp</p>
      <MonthlyChart values={monthly.map((month) => month * peakPowerKwp)} />
      <p className="mt-2 text-xs text-slate-500">
        Source: PVGIS © European Union
      </p>
    </section>
  );
}
