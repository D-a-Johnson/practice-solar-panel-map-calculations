import { describe, expect, it } from "vitest";

import { contains, pointInside, type XY } from "./pointInside";

const SQUARE: XY[] = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

/** An L whose centroid (about 2.2, 2.2) lies in the empty corner. */
const L_SHAPE: XY[] = [
  [0, 0],
  [10, 0],
  [10, 1],
  [1, 1],
  [1, 10],
  [0, 10],
];

describe("pointInside", () => {
  it("uses the centroid of a convex shape", () => {
    expect(pointInside(SQUARE)).toEqual([2, 2]);
  });

  it("works with a closed ring that repeats its first point", () => {
    expect(pointInside([...SQUARE, SQUARE[0]])).toEqual([2, 2]);
  });

  it("stays inside an L-shape whose centroid lies outside", () => {
    expect(contains(L_SHAPE, [2.2, 2.2])).toBe(false);
    expect(contains(L_SHAPE, pointInside(L_SHAPE))).toBe(true);
  });

  it("works with real lon/lat coordinates", () => {
    const roof: XY[] = [
      [7.84341, 47.99449],
      [7.84351, 47.99449],
      [7.84351, 47.99455],
      [7.84341, 47.99455],
    ];
    expect(contains(roof, pointInside(roof))).toBe(true);
  });
});

describe("contains", () => {
  it.each([
    [[2, 2], true],
    [[5, 2], false],
    [[-1, -1], false],
  ] as [XY, boolean][])("%s → %s", (point, expected) => {
    expect(contains(SQUARE, point)).toBe(expected);
  });
});
