import { useState } from "react";
import { createPortal } from "react-dom";

import type { AssumptionKey } from "../../api/assumptions";
import type { YieldQuery } from "../../api/estimates";
import { useI18n } from "../../i18n/language";
import { useAssumptions } from "../../lib/assumptionsContext";
import type { Economics } from "../../lib/economics";
import { yieldCsv } from "../../lib/yieldCsv";

export type ReportSubject = {
  building: string;
  faceLabel: string;
  face: string;
};

type EstimateExportProps = {
  subject: ReportSubject;
  query: YieldQuery;
  peakPowerKwp: number;
  annualKwh: number;
  annualPerKwp: number;
  monthlyKwh: number[];
  money: Economics | undefined;
};

/**
 * The PDF comes from the browser's own print dialog ("Save as PDF") and a
 * print-only report, which needs no PDF library. The CSV is a data: URL,
 * so there is no object URL to clean up afterwards.
 */
export function EstimateExport(props: EstimateExportProps) {
  const { t } = useI18n();
  const csv = yieldCsv(props.monthlyKwh, props.annualKwh, {
    ...t.download,
    months: t.chart.months,
  });

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
        >
          {t.download.print}
        </button>
        {/**
         * The byte order mark makes Excel read the file as UTF-8, so month
         * names such as "Mär" keep their umlaut.
         */}
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`}
          download={t.download.fileName}
          className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
        >
          {t.download.csv}
        </a>
      </div>
      {/**
       * Outside the app's layout, so the printed report isn't cut off by
       * the scrolling panel; index.css hides the app while printing.
       */}
      {createPortal(<Report {...props} />, document.body)}
    </>
  );
}

function Report({
  subject,
  query,
  peakPowerKwp,
  annualKwh,
  annualPerKwp,
  monthlyKwh,
  money,
}: EstimateExportProps) {
  const { t } = useI18n();
  const { defaults, values } = useAssumptions();
  const [created] = useState(() => new Date());

  return (
    <article data-print-report className="hidden text-sm print:block">
      <h1 className="text-xl font-semibold">{t.report.title}</h1>
      <p className="text-slate-600">{t.report.created(created)}</p>

      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
        <Row label={t.report.building} value={subject.building} />
        <Row label={subject.faceLabel} value={subject.face} />
        <Row
          label={t.report.location}
          value={t.report.coordinates(query.lat, query.lon)}
        />
        <Row
          label={t.report.panels}
          value={t.report.orientation(query.tilt, query.azimuth)}
        />
        <Row label={t.report.systemSize} value={t.report.kwp(peakPowerKwp)} />
        <Row label={t.report.annualYield} value={t.estimate.kwh(annualKwh)} />
        <Row
          label={t.report.specificYield}
          value={t.estimate.kwh(annualPerKwp)}
        />
        {money && (
          <>
            <Row
              label={t.estimate.savings}
              value={t.estimate.euros(money.savingsPerYear)}
            />
            <Row
              label={t.estimate.systemCost}
              value={t.estimate.euros(money.systemCost)}
            />
            <Row
              label={t.estimate.payback}
              value={t.estimate.paybackYears(money.paybackYears)}
            />
            <Row
              label={t.estimate.co2}
              value={t.estimate.mass(money.co2SavedKgPerYear)}
            />
          </>
        )}
      </dl>
      <p className="mt-2 text-xs">{t.estimate.note}</p>

      <h2 className="mt-6 font-semibold">{t.report.monthly}</h2>
      <table className="mt-2 w-full table-fixed text-right">
        <thead>
          <tr>
            {t.chart.months.map((month) => (
              <th
                key={month}
                scope="col"
                className="font-normal text-slate-600"
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {monthlyKwh.map((kwh, month) => (
              <td key={month}>{t.report.whole(kwh)}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {defaults && values && (
        <>
          <h2 className="mt-6 font-semibold">{t.assumptions.title}</h2>
          <ul className="mt-2 space-y-1">
            {(Object.keys(defaults) as AssumptionKey[]).map((key) => (
              <li key={key}>
                {t.assumptions.names[key]}:{" "}
                {t.assumptions.values[key](values[key])}
                {values[key] !== defaults[key].value && ` (${t.report.edited})`}
                . {defaults[key].source} ({defaults[key].as_of}),{" "}
                <span className="break-all">{defaults[key].source_url}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-6 font-semibold">{t.report.credits}</h2>
      <ul className="mt-2 space-y-1">
        <li>{t.report.pvgis}</li>
        <li>{t.report.lgl}</li>
      </ul>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-600">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
