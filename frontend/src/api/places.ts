import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";

import { type BBox, BW_BBOX } from "../lib/region";
import type { LngLat } from "./buildings";

/**
 * Photon is komoot's OpenStreetMap geocoder. It is built for
 * search-as-you-type and allows requests straight from the browser (CORS),
 * so no backend proxy is needed. Nominatim, the other free OSM geocoder,
 * forbids autocomplete in its usage policy.
 */
const PHOTON_URL = "https://photon.komoot.io/api/";

const RESULT_LIMIT = 8;

/**
 * Photon's `bbox` is a plain rectangle, and Baden-Württemberg's rectangle
 * also covers parts of France, Switzerland and the neighbouring German
 * states (a search for "Paris" returned Reichstett near Strasbourg). The
 * state name removes those; it is German because requests ask for
 * `lang=de`.
 */
const STATE = "Baden-Württemberg";

type PhotonProperties = {
  type: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  state?: string;
  extent?: [west: number, north: number, east: number, south: number];
};

export type PlaceSearch = { text: string; near?: LngLat };

export type Place = {
  title: string;
  detail: string;
  point: LngLat;
  bounds?: BBox;
  isBuilding: boolean;
};

export function labelOf(place: Place): string {
  return [place.title, place.detail].filter(Boolean).join(", ");
}

/**
 * Keeps Baden-Württemberg results and drops repeated labels: OSM often
 * splits one street into several ways, and Photon returns each of them.
 */
export function toPlaces(
  results: FeatureCollection<Point, PhotonProperties>,
): Place[] {
  const places = new Map<string, Place>();
  for (const { geometry, properties: p } of results.features) {
    if (p.state !== STATE) {
      continue;
    }
    const street = [p.street, p.housenumber].filter(Boolean).join(" ");
    const town = [p.postcode, p.city].filter(Boolean).join(" ");
    const [lng, lat] = geometry.coordinates;
    const place: Place = {
      title: p.name ?? street,
      detail: [p.name ? street : "", town].filter(Boolean).join(", "),
      point: { lng, lat },
      bounds: p.extent && [p.extent[0], p.extent[3], p.extent[2], p.extent[1]],
      isBuilding: p.type === "house",
    };
    const label = labelOf(place);
    if (!places.has(label)) {
      places.set(label, place);
    }
  }
  return [...places.values()];
}

export async function fetchPlaces(
  { text, near }: PlaceSearch,
  signal?: AbortSignal,
): Promise<Place[]> {
  const params = new URLSearchParams({
    q: text,
    lang: "de",
    limit: String(RESULT_LIMIT),
    bbox: BW_BBOX.join(","),
  });
  /**
   * Ranks results near the map centre first: without it, "Moltkestr"
   * typed while looking at Freiburg listed Karlsruhe's Moltkestraße.
   */
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Photon answered HTTP ${response.status}`);
  }
  return toPlaces(await response.json());
}

export function usePlaces(search: PlaceSearch | null) {
  return useQuery({
    queryKey: ["places", search],
    queryFn: search ? ({ signal }) => fetchPlaces(search, signal) : skipToken,
    staleTime: Infinity,
    /**
     * The next keystroke sends a new search anyway, so retrying a failed
     * one would only delay the error message.
     */
    retry: false,
    placeholderData: keepPreviousData,
  });
}
