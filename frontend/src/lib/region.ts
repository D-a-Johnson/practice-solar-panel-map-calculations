/**
 * Geographic constants for the app's coverage area, Baden-Württemberg.
 *
 * All coordinates are WGS84 degrees (EPSG:4326) with longitude first,
 * the order MapLibre and GeoJSON use.
 */

export type BBox = [west: number, south: number, east: number, north: number];

/**
 * Bounding box of Baden-Württemberg, from OpenStreetMap (Nominatim,
 * checked 2026-10-04).
 */
export const BW_BBOX: BBox = [7.5117, 47.5324, 10.4956, 49.7913];

/**
 * How far the map may be panned past the state's bounding box, in
 * degrees (roughly 20–30 km), so towns on the border can still be
 * centred on screen.
 */
const PAN_MARGIN_DEG = 0.25;

export const MAP_MAX_BOUNDS: BBox = [
  BW_BBOX[0] - PAN_MARGIN_DEG,
  BW_BBOX[1] - PAN_MARGIN_DEG,
  BW_BBOX[2] + PAN_MARGIN_DEG,
  BW_BBOX[3] + PAN_MARGIN_DEG,
];

/**
 * Freiburg's minster square, where the map starts. It lies in LGL tile
 * 413_5316.
 */
export const FREIBURG_CENTER = { longitude: 7.8529, latitude: 47.9955 };
