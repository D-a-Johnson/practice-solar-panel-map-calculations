import { expect, type Page, test } from "@playwright/test";

/**
 * Inside Moltkestraße 18, one of the two buildings in the seeded database.
 * The building straddles 47.9945 and 7.8435, where PVGIS cache keys switch
 * to the next 3-decimal value, so this point keeps about 3 m away from both:
 * the search and a map click then share one cached PVGIS answer.
 */
const MOLTKESTRASSE_18 = [7.84345, 47.99447];

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const BLANK_MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#e2e8f0" },
    },
  ],
};

const HOUSE = photonResult({
  type: "house",
  street: "Moltkestraße",
  housenumber: "18",
});
const STREET = photonResult({ type: "street", name: "Moltkestraße" });

test.beforeEach(async ({ page }) => {
  /**
   * Requests to other hosts fail, so the tests never depend on Photon, the
   * map tiles or any other outside service. Later routes take precedence.
   */
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
  await page.route(MAP_STYLE_URL, (route) =>
    route.fulfill({ json: BLANK_MAP_STYLE }),
  );
  await page.goto("/");
});

test("searching an address selects the building and estimates its roof", async ({
  page,
}) => {
  await answerSearchesWith(page, HOUSE);
  const search = searchField(page);

  await search.fill("Moltkestraße 18");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("ArrowDown");
  await search.press("Enter");

  const results = page.getByRole("complementary", { name: "Results" });
  await expect(
    results.getByRole("heading", { name: "Moltkestraße 18" }),
  ).toBeVisible();
  await expect(results.getByText("Roof faces (2)")).toBeVisible();
  /** The seeded 805.58 kWh per kWp times the default 10 × 440 W. */
  await expect(
    page.getByRole("region", { name: "Yield estimate" }),
  ).toContainText("3,545 kWh per year");
});

test("clicking a building on the map selects it", async ({ page }) => {
  await answerSearchesWith(page, STREET);
  const search = searchField(page);

  await search.fill("Moltkestraße");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");
  await expect(
    page.getByText("Click a building on the map to start."),
  ).toBeVisible();

  await page.getByRole("region", { name: "Map" }).click();

  await expect(
    page.getByRole("heading", { name: "Moltkestraße 18" }),
  ).toBeVisible();
});

test("suggestions work with the mouse and close when the field loses focus", async ({
  page,
}) => {
  await answerSearchesWith(page, HOUSE);
  const search = searchField(page);

  await search.fill("Moltkestraße 18");
  await page.getByRole("option", { name: /Moltkestraße 18/ }).click();
  await expect(
    page.getByRole("heading", { name: "Moltkestraße 18" }),
  ).toBeVisible();

  await search.fill("Moltkestr");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("heading", { name: "Solar estimator" }).click();
  await expect(page.getByRole("listbox")).toBeHidden();
});

function searchField(page: Page) {
  return page.getByRole("combobox", { name: "Search for an address" });
}

async function answerSearchesWith(page: Page, ...features: object[]) {
  await page.route("https://photon.komoot.io/api/**", (route) =>
    route.fulfill({ json: { type: "FeatureCollection", features } }),
  );
}

function photonResult(properties: Record<string, string>) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: MOLTKESTRASSE_18 },
    properties: {
      ...properties,
      postcode: "79098",
      city: "Freiburg im Breisgau",
      state: "Baden-Württemberg",
    },
  };
}
