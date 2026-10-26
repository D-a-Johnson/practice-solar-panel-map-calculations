import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";

import { type Building, type LngLat, roofsOf } from "../../api/buildings";
import { isFlat } from "../../lib/setup";
import { FaceSetup } from "./FaceSetup";
import { Hint } from "./Hint";
import { NumberInput } from "./NumberInput";

type BuildingPanelProps = {
  picked: LngLat | null;
  query: UseQueryResult<Building | null>;
  selectedFaceId: string | null;
  onSelectFace: (faceId: string) => void;
};

export function BuildingPanel({
  picked,
  query,
  selectedFaceId,
  onSelectFace,
}: BuildingPanelProps) {
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
      selectedFaceId={selectedFaceId}
      onSelectFace={onSelectFace}
    />
  );
}

type BuildingDetailsProps = {
  building: Building;
  location: LngLat;
  selectedFaceId: string | null;
  onSelectFace: (faceId: string) => void;
};

function BuildingDetails({
  building,
  location,
  selectedFaceId,
  onSelectFace,
}: BuildingDetailsProps) {
  const roofs = roofsOf(building);
  const selected = roofs.find((roof) => roof.gml_id === selectedFaceId);
  const [panels, setPanels] = useState(10);
  const [wattsPerPanel, setWattsPerPanel] = useState(440);
  const peakPowerKwp = (panels * wattsPerPanel) / 1000;

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
              aria-pressed={roof.gml_id === selectedFaceId}
              onClick={() => onSelectFace(roof.gml_id)}
              className="flex w-full justify-between rounded px-2 py-1.5 text-left hover:bg-slate-100 aria-pressed:bg-amber-100"
            >
              <span>{isFlat(roof) ? "flat" : roof.direction}</span>
              <span className="text-slate-600">
                {roof.tilt.toFixed(0)}° · {roof.area.toFixed(0)} m²
              </span>
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
          <FaceSetup
            key={selected.gml_id}
            face={selected}
            location={location}
            peakPowerKwp={peakPowerKwp}
          />
        </>
      )}
    </div>
  );
}

function title(building: Building): string {
  const address = `${building.street} ${building.house_number}`.trim();
  return building.name || address || "Building without address";
}
