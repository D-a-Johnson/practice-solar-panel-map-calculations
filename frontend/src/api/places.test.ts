import { describe, expect, it } from "vitest";

import { labelOf, toPlaces } from "./places";

type Results = Parameters<typeof toPlaces>[0];
type Properties = Results["features"][number]["properties"];

function results(
  ...features: [coordinates: [number, number], properties: Properties][]
): Results {
  return {
    type: "FeatureCollection",
    features: features.map(([coordinates, properties]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates },
      properties,
    })),
  };
}

const IN_FREIBURG = {
  postcode: "79098",
  city: "Freiburg im Breisgau",
  state: "Baden-Württemberg",
};

describe("toPlaces", () => {
  it("labels a house by street and number", () => {
    const [place] = toPlaces(
      results([
        [7.8498937, 47.9968907],
        {
          type: "house",
          street: "Gauchstraße",
          housenumber: "3",
          ...IN_FREIBURG,
        },
      ]),
    );

    expect(labelOf(place)).toBe("Gauchstraße 3, 79098 Freiburg im Breisgau");
    expect(place.point).toEqual({ lng: 7.8498937, lat: 47.9968907 });
    expect(place.isBuilding).toBe(true);
  });

  it("puts a named place's address in the detail and turns its extent into a bounding box", () => {
    const [place] = toPlaces(
      results([
        [7.8529213, 47.9955486],
        {
          type: "house",
          name: "Münster Unserer Lieben Frau",
          street: "Münsterplatz",
          housenumber: "1",
          extent: [7.8520522, 47.9957389, 7.8537318, 47.9953541],
          ...IN_FREIBURG,
        },
      ]),
    );

    expect(place.title).toBe("Münster Unserer Lieben Frau");
    expect(place.detail).toBe("Münsterplatz 1, 79098 Freiburg im Breisgau");
    expect(place.bounds).toEqual([
      7.8520522, 47.9953541, 7.8537318, 47.9957389,
    ]);
  });

  it("drops places outside Baden-Württemberg that fall inside its bounding box", () => {
    const places = toPlaces(
      results(
        [
          [7.75, 48.65],
          { type: "city", name: "Reichstett", state: "Grand Est" },
        ],
        [
          [10.0, 48.39],
          { type: "house", name: "Bahnhof Neu-Ulm", state: "Bayern" },
        ],
      ),
    );

    expect(places).toEqual([]);
  });

  it("lists a street that OSM splits into several ways once", () => {
    const places = toPlaces(
      results(
        [
          [7.8435522, 47.9953635],
          { type: "street", name: "Moltkestraße", ...IN_FREIBURG },
        ],
        [
          [7.8433041, 47.9943899],
          { type: "street", name: "Moltkestraße", ...IN_FREIBURG },
        ],
      ),
    );

    expect(places).toHaveLength(1);
    expect(places[0].isBuilding).toBe(false);
  });
});
