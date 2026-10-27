import { skipToken, useQuery } from "@tanstack/react-query";
import { ApiError } from "./http";
import type { components } from "./schema";

export type LngLat = { lng: number; lat: number };

export type Direction = components["schemas"]["DirectionEnum"];
export type Roof = components["schemas"]["Roof"];
export type Wall = components["schemas"]["Wall"];
/** Roofs come largest first, walls widest first. */
export type Building = components["schemas"]["Building"];

export type Face = Roof | Wall;

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
