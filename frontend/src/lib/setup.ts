import type { Surface } from "../api/buildings";
import type { Messages } from "../i18n/en";

export type Mounting = "flush" | "stands" | "custom";

export type Orientation = { tilt: number; azimuth: number };

/**
 * Product choices, not standards: below 10° a roof face is treated as
 * flat, and panels on a flat roof go on stands tilted 15° towards south,
 * the usual range for flat-roof systems being 10–15°.
 */
export const FLAT_MAX_TILT = 10;
export const STAND_TILT = 15;
const SOUTH = 180;

export const COMPASS = [
  { label: "N", azimuth: 0 },
  { label: "NE", azimuth: 45 },
  { label: "E", azimuth: 90 },
  { label: "SE", azimuth: 135 },
  { label: "S", azimuth: 180 },
  { label: "SW", azimuth: 225 },
  { label: "W", azimuth: 270 },
  { label: "NW", azimuth: 315 },
] as const;

export function isFlat(face: Surface): boolean {
  return face.tilt < FLAT_MAX_TILT;
}

/** "flat" or the face's compass direction, in the user's language. */
export function faceName(face: Surface, t: Messages): string {
  return isFlat(face) || !face.direction
    ? t.building.flat
    : t.directions[face.direction];
}

export function defaultMounting(face: Surface): Mounting {
  return isFlat(face) ? "stands" : "flush";
}

export function faceOrientation(face: Surface): Orientation {
  return { tilt: face.tilt, azimuth: face.azimuth ?? SOUTH };
}

export function orientationFor(
  face: Surface,
  mounting: Mounting,
  custom: Orientation,
): Orientation {
  switch (mounting) {
    case "flush":
      return faceOrientation(face);
    case "stands":
      return { tilt: STAND_TILT, azimuth: SOUTH };
    case "custom":
      return custom;
  }
}
