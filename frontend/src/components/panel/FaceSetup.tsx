import { useState } from "react";

import type { LngLat, Surface } from "../../api/buildings";
import {
  COMPASS,
  defaultMounting,
  faceName,
  faceOrientation,
  isFlat,
  type Mounting,
  type Orientation,
  orientationFor,
  STAND_TILT,
} from "../../lib/setup";
import { useI18n } from "../../i18n/language";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { EstimateResult } from "./EstimateResult";

/**
 * Every distinct tilt is a new PVGIS request on the backend. Waiting until
 * the slider has rested this long turns a whole drag into one request.
 */
const SLIDER_SETTLE_MS = 300;

type FaceSetupProps = {
  building: string;
  face: Surface;
  location: LngLat;
  peakPowerKwp: number;
};

export function FaceSetup({
  building,
  face,
  location,
  peakPowerKwp,
}: FaceSetupProps) {
  const { t } = useI18n();
  const [mounting, setMounting] = useState<Mounting>(defaultMounting(face));
  const [custom, setCustom] = useState<Orientation>(faceOrientation(face));
  const settledTilt = useDebouncedValue(custom.tilt, SLIDER_SETTLE_MS);
  const orientation = orientationFor(face, mounting, {
    ...custom,
    tilt: settledTilt,
  });

  const options: { value: Mounting; label: string }[] = [
    {
      value: "flush",
      label: t.setup.flush(
        face.tilt,
        isFlat(face) || !face.direction ? null : t.directions[face.direction],
      ),
    },
    { value: "stands", label: t.setup.stands(STAND_TILT) },
    { value: "custom", label: t.setup.custom },
  ];

  return (
    <>
      <fieldset className="mt-3 text-sm">
        <legend className="text-xs text-slate-600">{t.setup.mounting}</legend>
        {options.map((option) => (
          <label key={option.value} className="mt-1 flex items-center gap-2">
            <input
              type="radio"
              name="mounting"
              value={option.value}
              checked={mounting === option.value}
              onChange={() => setMounting(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {mounting === "custom" && (
        <CustomOrientation value={custom} onChange={setCustom} />
      )}

      <EstimateResult
        subject={{
          building,
          face: `${faceName(face, t)}, ${t.building.face(face.tilt, face.area)}`,
        }}
        query={{ lat: location.lat, lon: location.lng, ...orientation }}
        peakPowerKwp={peakPowerKwp}
      />
    </>
  );
}

function CustomOrientation({
  value,
  onChange,
}: {
  value: Orientation;
  onChange: (value: Orientation) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mt-2 space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-600">
          {t.setup.tilt(Math.round(value.tilt))}
        </span>
        <input
          type="range"
          min={0}
          max={90}
          value={Math.round(value.tilt)}
          onChange={(event) =>
            onChange({ ...value, tilt: event.target.valueAsNumber })
          }
          className="flex-1"
        />
      </label>
      <div
        role="group"
        aria-label={t.setup.direction}
        className="grid grid-cols-8 gap-1"
      >
        {COMPASS.map((direction) => (
          <button
            key={direction.label}
            type="button"
            aria-pressed={value.azimuth === direction.azimuth}
            onClick={() => onChange({ ...value, azimuth: direction.azimuth })}
            className="rounded border border-slate-300 py-1 text-xs aria-pressed:border-amber-500 aria-pressed:bg-amber-100"
          >
            {t.directions[direction.label]}
          </button>
        ))}
      </div>
    </div>
  );
}
