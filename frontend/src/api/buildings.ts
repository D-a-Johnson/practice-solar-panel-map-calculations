import { skipToken, useQuery } from "@tanstack/react-query";
import type { MultiPolygon, Polygon } from "geojson";

import { errorMessage } from "./http";

export type LngLat = { lng: number; lat: number };

export type Surface = {
  gml_id: string;
  kind: "roof" | "wall";
  roof_type: string;
  area: number;
  tilt: number;
  azimuth: number | null;
  direction: string | null;
  geometry: Polygon;
};

export type Building = {
  gml_id: string;
  name: string;
  function: string;
  measured_height: number | null;
  street: string;
  house_number: string;
  locality: string;
  footprint: MultiPolygon;
  surfaces: Surface[];
};

/** Roof faces, largest first (the API sorts surfaces by kind, then area). */
export function roofsOf(building: Building): Surface[] {
  return building.surfaces.filter((surface) => surface.kind === "roof");
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
    throw new Error(await errorMessage(response));
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
