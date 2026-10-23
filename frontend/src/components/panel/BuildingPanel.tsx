import type { UseQueryResult } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import type { Building, LngLat, Surface } from "../../api/buildings";
import { type EstimateInput, useEstimate } from "../../api/estimates";
import { MonthlyChart } from "./MonthlyChart";

type BuildingPanelProps = {
  picked: LngLat | null;
  query: UseQueryResult<Building | null>;
};

export function BuildingPanel({ picked, query }: BuildingPanelProps) {
  if (!picked) {
    return <Hint>Click a building on the map to start.</Hint>;
  }
  if (query.isPending) {
    return <Hint>Loading building…</Hint>;
  }
  if (query.isError) {
    return <Hint>{query.error.message}</Hint>;
  }
  if (!query.data) {
    return <Hint>No building here. Click directly on a building.</Hint>;
  }
  return (
    <BuildingDetails
      key={query.data.gml_id}
      building={query.data}
      location={picked}
    />
  );
}

function BuildingDetails({
  building,
  location,
}: {
  building: Building;
  location: LngLat;
}) {
  const roofs = building.surfaces.filter((surface) => surface.kind === "roof");
  const [selectedId, setSelectedId] = useState(roofs[0]?.gml_id);
  const [panels, setPanels] = useState(10);
  const [wattsPerPanel, setWattsPerPanel] = useState(440);

  const selected = roofs.find((roof) => roof.gml_id === selectedId);
  const peakPowerKwp = (panels * wattsPerPanel) / 1000;
  const input: EstimateInput | null =
    selected && peakPowerKwp >= 0.1
      ? {
          lat: location.lat,
          lon: location.lng,
          tilt: selected.tilt,
          azimuth: selected.azimuth ?? 180,
          peak_power_kwp: peakPowerKwp,
        }
      : null;

  return (
    <div>
      <h2 className="font-semibold">{title(building)}</h2>
      <p className="text-sm text-slate-600">
        {building.locality}
        {building.measured_height !== null &&
          ` · ${building.measured_height.toFixed(1)} m high`}
      </p>

      <h3 className="mt-4 text-sm font-semibold">
        Roof faces ({roofs.length})
      </h3>
      <ul className="mt-2 max-h-48 overflow-y-auto text-sm">
        {roofs.map((roof) => (
          <li key={roof.gml_id}>
            <button
              type="button"
              aria-pressed={roof.gml_id === selectedId}
              onClick={() => setSelectedId(roof.gml_id)}
              className="flex w-full justify-between rounded px-2 py-1.5 text-left hover:bg-slate-100 aria-pressed:bg-amber-100"
            >
              <span>{roof.direction ?? "flat"}</span>
              <span className="text-slate-600">{faceSummary(roof)}</span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <>
          <h3 className="mt-4 text-sm font-semibold">Setup</h3>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <NumberInput
              label="Panels"
              value={panels}
              onChange={setPanels}
              min={1}
            />
            <span>×</span>
            <NumberInput
              label="Watts each"
              value={wattsPerPanel}
              onChange={setWattsPerPanel}
              min={50}
            />
            <span className="text-slate-600">
              = {peakPowerKwp.toFixed(2)} kWp
            </span>
          </div>
          {selected.azimuth === null && (
            <p className="mt-1 text-xs text-slate-500">
              Flat face: calculated facing south.
            </p>
          )}
          <EstimateResult input={input} />
        </>
      )}
    </div>
  );
}

function EstimateResult({ input }: { input: EstimateInput | null }) {
  const estimate = useEstimate(input);

  if (!input) {
    return <Hint>Enter at least 0.1 kWp.</Hint>;
  }
  if (estimate.isPending) {
    return <Hint>Calculating yield…</Hint>;
  }
  if (estimate.isError) {
    return <Hint>{estimate.error.message}</Hint>;
  }

  const result = estimate.data;
  return (
    <section aria-label="Yield estimate" className="mt-4">
      <p className="text-2xl font-semibold">
        {Math.round(result.annual_kwh).toLocaleString("en")} kWh
        <span className="text-base font-normal text-slate-600"> per year</span>
      </p>
      <p className="text-sm text-slate-600">
        {Math.round(result.specific_yield_kwh_per_kwp)} kWh per kWp
      </p>
      <MonthlyChart values={result.monthly_kwh} />
      <p className="mt-2 text-xs text-slate-500">
        Source: PVGIS © European Union
      </p>
    </section>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
}) {
  return (
    <label className="flex flex-col text-xs text-slate-600">
      {label}
      <input
        type="number"
        min={min}
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
      />
    </label>
  );
}

function faceSummary(roof: Surface): string {
  return `${roof.tilt.toFixed(0)}° · ${roof.area.toFixed(0)} m²`;
}

function title(building: Building): string {
  const address = `${building.street} ${building.house_number}`.trim();
  return building.name || address || "Building without address";
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm text-slate-600">{children}</p>;
}
