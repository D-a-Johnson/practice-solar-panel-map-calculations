export type XY = [number, number];

/**
 * A point guaranteed to lie inside a simple polygon (its outer ring). The
 * centroid is used when it is inside; for concave shapes such as an L it can
 * fall outside, so the fallback is the middle of the widest horizontal span
 * through the polygon at the centroid's height.
 */
export function pointInside(ring: XY[]): XY {
  const center = centroid(ring);
  if (contains(ring, center)) {
    return center;
  }
  const y = center[1];
  const crossings = edges(ring)
    .filter(([[, y1], [, y2]]) => y1 > y !== y2 > y)
    .map(([[x1, y1], [x2, y2]]) => x1 + ((y - y1) * (x2 - x1)) / (y2 - y1))
    .sort((a, b) => a - b);
  let best: XY = center;
  let widest = -1;
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const width = crossings[i + 1] - crossings[i];
    if (width > widest) {
      widest = width;
      best = [(crossings[i] + crossings[i + 1]) / 2, y];
    }
  }
  return best;
}

export function contains(ring: XY[], [x, y]: XY): boolean {
  let inside = false;
  for (const [[x1, y1], [x2, y2]] of edges(ring)) {
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Computed relative to the first corner: in lon/lat a building spans about
 * 0.0001°, and products of absolute coordinates (around 7.8 × 48) would
 * drown its tiny area in rounding error.
 */
function centroid(ring: XY[]): XY {
  const [ox, oy] = ring[0];
  const local = ring.map(([x, y]): XY => [x - ox, y - oy]);
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (const [[x1, y1], [x2, y2]] of edges(local)) {
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  return [ox + cx / (3 * area), oy + cy / (3 * area)];
}

function edges(ring: XY[]): [XY, XY][] {
  return ring.map((point, i) => [point, ring[(i + 1) % ring.length]]);
}
