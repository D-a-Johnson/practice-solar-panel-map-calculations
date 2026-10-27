import { type YieldQuery, useYieldPerKwp } from "../../api/estimates";
import { statusOf } from "../../api/http";
import { useI18n } from "../../i18n/language";
import { useAssumptions } from "../../lib/assumptionsContext";
import { economics } from "../../lib/economics";
import { AssumptionsEditor } from "./AssumptionsEditor";
import { EstimateExport, type ReportSubject } from "./EstimateExport";
import { Hint } from "./Hint";
import { MonthlyChart } from "./MonthlyChart";

type EstimateResultProps = {
  subject: ReportSubject;
  query: YieldQuery;
  peakPowerKwp: number;
};

export function EstimateResult({
  subject,
  query,
  peakPowerKwp,
}: EstimateResultProps) {
  const perKwp = useYieldPerKwp(query);
  const { values } = useAssumptions();
  const { t } = useI18n();

  if (!(peakPowerKwp >= 0.1)) {
    return <Hint>{t.estimate.tooSmall}</Hint>;
  }
  if (perKwp.isPending) {
    return <Hint>{t.estimate.calculating}</Hint>;
  }
  if (perKwp.isError) {
    return (
      <Hint>
        {statusOf(perKwp.error) === 503 ? t.errors.pvgis : t.errors.unexpected}
      </Hint>
    );
  }

  const { annual_kwh_per_kwp: annual, monthly_kwh_per_kwp: monthly } =
    perKwp.data;
  const annualKwh = annual * peakPowerKwp;
  const monthlyKwh = monthly.map((month) => month * peakPowerKwp);
  const complete = values && Object.values(values).every(Number.isFinite);
  const money = complete
    ? economics(annualKwh, peakPowerKwp, values)
    : undefined;

  return (
    <section
      aria-label={t.estimate.label}
      className="mt-5 border-t border-slate-200 pt-4"
    >
      <div className="rounded-lg bg-amber-50 p-3">
        <p className="text-2xl font-semibold">
          {t.estimate.kwh(annualKwh)}
          <span className="text-base font-normal text-slate-600">
            {" "}
            {t.estimate.perYear}
          </span>
        </p>
        <p className="text-sm text-slate-600">{t.estimate.perKwp(annual)}</p>
        <MonthlyChart values={monthlyKwh} />
        <p className="mt-2 text-xs text-slate-500">{t.estimate.source}</p>
      </div>

      {money && (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Figure
            label={t.estimate.savings}
            value={t.estimate.euros(money.savingsPerYear)}
          />
          <Figure
            label={t.estimate.systemCost}
            value={t.estimate.euros(money.systemCost)}
          />
          <Figure
            label={t.estimate.payback}
            value={t.estimate.paybackYears(money.paybackYears)}
          />
          <Figure
            label={t.estimate.co2}
            value={t.estimate.mass(money.co2SavedKgPerYear)}
          />
        </dl>
      )}
      <p className="mt-1 text-xs text-slate-500">{t.estimate.note}</p>
      <EstimateExport
        subject={subject}
        query={query}
        peakPowerKwp={peakPowerKwp}
        annualKwh={annualKwh}
        annualPerKwp={annual}
        monthlyKwh={monthlyKwh}
        money={money}
      />
      <AssumptionsEditor />
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
