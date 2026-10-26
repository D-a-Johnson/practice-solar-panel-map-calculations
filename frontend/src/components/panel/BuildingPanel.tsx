import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";

import { type Building, type LngLat, roofsOf } from "../../api/buildings";
import { statusOf } from "../../api/http";
import { useI18n } from "../../i18n/language";
import { faceName } from "../../lib/setup";
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
  const { t } = useI18n();

  if (!picked) {
    return <Hint>{t.building.start}</Hint>;
  }
  if (query.isPending) {
    return <Hint>{t.building.loading}</Hint>;
  }
  if (query.isError) {
    const status = statusOf(query.error);
    return (
      <Hint>
        {status === 400
          ? t.errors.outsideArea
          : status === 503
            ? t.errors.lgl
            : t.errors.unexpected}
      </Hint>
    );
  }
  if (!query.data) {
    return <Hint>{t.building.none}</Hint>;
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
  const { t } = useI18n();
  const roofs = roofsOf(building);
  const name = title(building) || t.building.withoutAddress;
  const selected = roofs.find((roof) => roof.gml_id === selectedFaceId);
  const [panels, setPanels] = useState(10);
  const [wattsPerPanel, setWattsPerPanel] = useState(440);
  const peakPowerKwp = (panels * wattsPerPanel) / 1000;

  return (
    <div>
      <h2 className="font-semibold">{name}</h2>
      <p className="text-sm text-slate-600">
        {building.locality}
        {building.measured_height !== null &&
          ` · ${t.building.height(building.measured_height)}`}
      </p>

      <h3 className="mt-4 text-sm font-semibold">
        {t.building.roofFaces(roofs.length)}
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
              <span>{faceName(roof, t)}</span>
              <span className="text-slate-600">
                {t.building.face(roof.tilt, roof.area)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <>
          <h3 className="mt-4 text-sm font-semibold">{t.setup.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <NumberInput
              label={t.setup.panels}
              value={panels}
              onChange={setPanels}
              min={1}
            />
            <span>×</span>
            <NumberInput
              label={t.setup.wattsEach}
              value={wattsPerPanel}
              onChange={setWattsPerPanel}
              min={50}
            />
            <span className="text-slate-600">
              {t.setup.peakPower(peakPowerKwp)}
            </span>
          </div>
          <FaceSetup
            key={selected.gml_id}
            building={[name, building.locality].filter(Boolean).join(", ")}
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
  return building.name || address;
}
