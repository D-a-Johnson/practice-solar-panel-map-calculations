import { skipToken, useQuery } from "@tanstack/react-query";
import type { LineString, MultiPolygon, Polygon } from "geojson";

import { ApiError } from "./http";

export type LngLat = { lng: number; lat: number };

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type Surface = {
  gml_id: string;
  kind: "roof";
  roof_type: string;
  area: number;
  tilt: number;
  azimuth: number | null;
  direction: Direction | null;
  geometry: Polygon;
};

/** A facade from the building's footprint, for balcony and wall panels. */
export type Wall = {
  id: string;
  kind: "wall";
  tilt: number;
  azimuth: number;
  direction: Direction;
  width: number;
  geometry: LineString;
};

export type Face = Surface | Wall;

export type Building = {
  gml_id: string;
  name: string;
  function: string;
  measured_height: number | null;
  street: string;
  house_number: string;
  locality: string;
  footprint: MultiPolygon;
  /** Roof faces only (walls aren't imported), largest first. */
  surfaces: Surface[];
  /** Widest first. */
  walls: Wall[];
};

export function faceId(face: Face): string {
  return face.kind === "roof" ? face.gml_id : face.id;
}

export async function fetchBuildingAt({
  lng,
  lat,
}: LngLat): Promise<Building | null> {
  const params = new URLSearchParams({ lon: String(lng), lat: String(lat) });
  const response = await fetch(`/api/buildings/at?${params}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return (await response.json()) as Building;
}

export function useBuildingAt(point: LngLat | null) {
  return useQuery({
    queryKey: ["building-at", point],
    queryFn: point ? () => fetchBuildingAt(point) : skipToken,
    /**
     * LoD2 data doesn't change while the app is open. A failed lookup has
     * already waited for LGL's timeout, so retrying would only keep the
     * user waiting longer.
     */
    staleTime: Infinity,
    retry: false,
  });
}
