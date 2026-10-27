import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";

import {
  type Building,
  type Face,
  faceId,
  type LngLat,
} from "../../api/buildings";
import { statusOf } from "../../api/http";
import { useI18n } from "../../i18n/language";
import { DEFAULT_PANELS, faceDetail, faceName, isFlat } from "../../lib/setup";
import { FaceSetup } from "./FaceSetup";
import { Hint } from "./Hint";
import { NumberInput } from "./NumberInput";
import { SectionTitle } from "./SectionTitle";

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
    return (
      <div className="mt-10 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto size-12" />
        <p className="mt-3 font-semibold text-balance">
          {t.building.startTitle}
        </p>
        <p className="mt-1 text-sm text-slate-600">{t.building.start}</p>
      </div>
    );
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
  const name = title(building) || t.building.withoutAddress;
  const selected = [...building.roofs, ...building.walls].find(
    (face) => faceId(face) === selectedFaceId,
  );
  const [kind, setKind] = useState<Face["kind"]>(
    building.roofs.length > 0 ? "roof" : "wall",
  );
  const [panels, setPanels] = useState<number>(DEFAULT_PANELS.roof);
  const [wattsPerPanel, setWattsPerPanel] = useState(440);
  const peakPowerKwp = (panels * wattsPerPanel) / 1000;

  /**
   * Switching between a roof and a wall starts from that kind's panel
   * count; switching within a kind keeps what the user typed.
   */
  function choose(face: Face) {
    if (selected && face.kind !== selected.kind) {
      setPanels(DEFAULT_PANELS[face.kind]);
    }
    onSelectFace(faceId(face));
  }

  const tabs = [
    { value: "roof", label: t.building.roofFaces(building.roofs.length) },
    { value: "wall", label: t.building.walls(building.walls.length) },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="text-sm text-slate-600">
          {building.locality}
          {building.measured_height !== null &&
            ` · ${t.building.height(building.measured_height)}`}
        </p>
      </div>

      <div>
        {building.walls.length > 0 && (
          <div
            role="group"
            aria-label={t.building.faces}
            className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm"
          >
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={kind === tab.value}
                onClick={() => setKind(tab.value)}
                className="rounded-md px-2 py-1 text-slate-600 aria-pressed:bg-white aria-pressed:font-medium aria-pressed:text-slate-900 aria-pressed:shadow-sm"
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {kind === "wall" && (
          <p className="mb-1 text-xs text-slate-500">{t.building.wallsHint}</p>
        )}
        <FaceList
          faces={kind === "roof" ? building.roofs : building.walls}
          selectedFaceId={selectedFaceId}
          onChoose={choose}
        />
      </div>

      {selected && (
        <div className="border-t border-slate-200 pt-4">
          <SectionTitle>{t.setup.title}</SectionTitle>
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
            key={faceId(selected)}
            building={[name, building.locality].filter(Boolean).join(", ")}
            face={selected}
            location={location}
            peakPowerKwp={peakPowerKwp}
          />
        </div>
      )}
    </div>
  );
}

type FaceListProps = {
  faces: Face[];
  selectedFaceId: string | null;
  onChoose: (face: Face) => void;
};

function FaceList({ faces, selectedFaceId, onChoose }: FaceListProps) {
  const { t } = useI18n();

  return (
    <ul className="max-h-48 overflow-y-auto text-sm">
      {faces.map((face) => (
        <li key={faceId(face)}>
          <button
            type="button"
            aria-pressed={faceId(face) === selectedFaceId}
            onClick={() => onChoose(face)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-100 aria-pressed:bg-amber-100 aria-pressed:font-medium"
          >
            <DirectionArrow face={face} />
            <span>{faceName(face, t)}</span>
            <span className="ml-auto text-slate-600">
              {faceDetail(face, t)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Points the way the face looks, with north up like the map; flat is a dot. */
function DirectionArrow({ face }: { face: Face }) {
  if (isFlat(face) || face.azimuth === null) {
    return (
      <span aria-hidden="true" className="grid size-4 place-items-center">
        <span className="size-1.5 rounded-full bg-slate-400" />
      </span>
    );
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 text-amber-600"
      style={{ transform: `rotate(${face.azimuth}deg)` }}
    >
      <path d="M8 1 13 14 8 11 3 14Z" fill="currentColor" />
    </svg>
  );
}

function title(building: Building): string {
  const address = `${building.street} ${building.house_number}`.trim();
  return building.name || address;
}
