import { formatsFor } from "./format";

const { number, decimal, euros, date } = formatsFor("en");

/**
 * English texts, which also define the shape every other language must
 * match: a missing or misspelt text in another language is a type error,
 * not a gap in the UI. Texts with numbers are functions, so each language
 * formats numbers its own way.
 */
export const en = {
  title: "Solar estimator",
  language: "Language",
  results: "Results",
  loadingBuilding:
    "Loading building… The first click in a new area downloads LGL data and can take about 20 seconds.",
  api: {
    pending: "Checking API…",
    error: "API offline",
    success: "API ok",
  },
  search: {
    label: "Search for an address",
    placeholder: "Address, e.g. Gauchstraße 3 Freiburg",
    results: "Addresses",
    unavailable: "Address search isn't available right now.",
    searching: "Searching…",
    noMatch: "No match in Baden-Württemberg.",
  },
  map: {
    noWebgl:
      "This browser can't display the map because WebGL 2 is unavailable. Try another browser, or turn on hardware acceleration in the browser settings.",
    styleFailed:
      "The map couldn't load. Check your internet connection and reload the page.",
  },
  building: {
    start: "Click a building on the map to start.",
    loading: "Loading building…",
    none: "No building here. Click directly on a building.",
    withoutAddress: "Building without address",
    height: (metres: number) => `${number(metres, 1)} m high`,
    roofFaces: (count: number) => `Roof faces (${count})`,
    flat: "flat",
    walls: (count: number) => `Walls for balcony panels (${count})`,
    wallWidth: (width: number) => `${number(width)} m wide`,
    face: (tilt: number, area: number) =>
      `${number(tilt)}° · ${number(area)} m²`,
  },
  directions: {
    N: "N",
    NE: "NE",
    E: "E",
    SE: "SE",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  },
  setup: {
    title: "Setup",
    panels: "Panels",
    wattsEach: "Watts each",
    peakPower: (kwp: number) => `= ${number(kwp, 2)} kWp`,
    mounting: "Mounting",
    flush: (tilt: number, direction: string | null) =>
      direction
        ? `Flush on the roof (${number(tilt)}° ${direction})`
        : `Flush on the roof (${number(tilt)}°, flat)`,
    stands: (tilt: number) => `On stands, ${tilt}° facing south`,
    wall: (direction: string) => `On the railing or wall (90° ${direction})`,
    custom: "Custom tilt and direction",
    tilt: (degrees: number) => `Tilt ${degrees}°`,
    direction: "Direction",
  },
  estimate: {
    label: "Yield estimate",
    tooSmall: "Enter at least 0.1 kWp.",
    calculating: "Calculating yield…",
    kwh: (kwh: number) => `${number(kwh)} kWh`,
    perYear: "per year",
    perKwp: (kwh: number) => `${number(kwh)} kWh per kWp`,
    source: "Source: PVGIS © European Union",
    savings: "Savings per year",
    systemCost: "System cost",
    payback: "Payback",
    paybackYears: (years: number | null) =>
      years === null ? "never" : `${number(years, 1)} years`,
    co2: "CO₂ avoided per year",
    mass: (kg: number) =>
      kg >= 1000 ? `${number(kg / 1000, 1)} t` : `${number(kg)} kg`,
    euros,
    note: "Simple payback: no price changes, degradation, maintenance or financing.",
  },
  chart: {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    summary: (min: number, max: number) =>
      `Monthly yield from ${number(min)} to ${number(max)} kWh`,
    month: (name: string, kwh: number) => `${name}: ${number(kwh)} kWh`,
  },
  assumptions: {
    title: "Assumptions and sources",
    reset: "Reset to defaults",
    fields: {
      electricity_price: "Price ct/kWh",
      feed_in_tariff: "Feed-in ct/kWh",
      self_consumption_share: "Used at home %",
      system_cost_per_kwp: "Cost €/kWp",
    },
    names: {
      electricity_price: "Household electricity price",
      feed_in_tariff: "Feed-in tariff",
      self_consumption_share: "Share of solar power used in the household",
      system_cost_per_kwp: "System cost",
      grid_co2_factor: "CO₂ per kWh of German grid electricity",
    },
    values: {
      electricity_price: (value: number) => `${decimal(value * 100)} ct/kWh`,
      feed_in_tariff: (value: number) => `${decimal(value * 100)} ct/kWh`,
      self_consumption_share: (value: number) => `${decimal(value * 100)}%`,
      system_cost_per_kwp: (value: number) => `${euros(value)} per kWp`,
      grid_co2_factor: (value: number) => `${decimal(value)} kg/kWh`,
    },
  },
  download: {
    print: "Print or save as PDF",
    csv: "Download CSV",
    fileName: "solar-yield.csv",
    separator: ",",
    month: "Month",
    kwh: "Yield (kWh)",
    year: "Year",
  },
  report: {
    title: "Solar yield estimate",
    created: (day: Date) => `Created on ${date(day)}`,
    building: "Building",
    roofFace: "Roof face",
    wall: "Wall",
    location: "Location",
    coordinates: (lat: number, lon: number) =>
      `${number(lat, 5)}° N, ${number(lon, 5)}° E`,
    panels: "Panels",
    orientation: (tilt: number, azimuth: number) =>
      `${number(tilt)}° tilt, azimuth ${number(azimuth)}° (180° = south)`,
    systemSize: "System size",
    kwp: (kwp: number) => `${number(kwp, 2)} kWp`,
    annualYield: "Yield per year",
    specificYield: "Yield per kWp",
    monthly: "Yield per month in kWh",
    whole: (value: number) => number(value),
    edited: "edited",
    credits: "Data sources and licences",
    pvgis: "Solar yield: PVGIS © European Union",
    lgl: "Building and roof data: LGL-BW (2026) Datenlizenz Deutschland – Namensnennung – Version 2.0, www.lgl-bw.de",
  },
  errors: {
    outsideArea: "This place is outside Baden-Württemberg.",
    lgl: "The LGL download service is not reachable. Try again later.",
    pvgis: "The PVGIS yield service is not reachable. Try again later.",
    unexpected: "Something went wrong. Try again later.",
  },
};

export type Messages = typeof en;
