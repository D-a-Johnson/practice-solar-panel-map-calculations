import { describe, expect, it } from "vitest";

import type { Roof } from "../api/buildings";
import { defaultMounting, isFlat, orientationFor } from "./setup";

function face(tilt: number, azimuth: number | null): Roof {
  return {
    gml_id: "F1",
    kind: "roof",
    roof_type: "3100",
    area: 40,
    tilt,
    azimuth,
    direction: null,
    geometry: { type: "Polygon", coordinates: [] },
  };
}

describe("isFlat", () => {
  it.each([
    [0, null, true],
    [6.6, 270, true],
    [9.9, 180, true],
    [10, 180, false],
    [39, 280, false],
  ])("tilt %s, azimuth %s → %s", (tilt, azimuth, expected) => {
    expect(isFlat(face(tilt, azimuth))).toBe(expected);
  });
});

describe("defaultMounting", () => {
  it("puts panels on stands on flat faces", () => {
    expect(defaultMounting(face(3, 270))).toBe("stands");
  });

  it("mounts flush on pitched faces", () => {
    expect(defaultMounting(face(39, 280))).toBe("flush");
  });
});

describe("orientationFor", () => {
  const custom = { tilt: 60, azimuth: 225 };

  it("uses the face's own orientation when flush", () => {
    expect(orientationFor(face(39.3, 280.1), "flush", custom)).toEqual({
      tilt: 39.3,
      azimuth: 280.1,
    });
  });

  it("treats a level face mounted flush as facing south", () => {
    expect(orientationFor(face(0, null), "flush", custom).azimuth).toBe(180);
  });

  it("tilts stands 15° towards south, whatever the face", () => {
    expect(orientationFor(face(2, 300), "stands", custom)).toEqual({
      tilt: 15,
      azimuth: 180,
    });
  });

  it("passes custom values through", () => {
    expect(orientationFor(face(39, 280), "custom", custom)).toEqual(custom);
  });
});
