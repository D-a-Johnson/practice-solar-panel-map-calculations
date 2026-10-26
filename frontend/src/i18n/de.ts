import type { Messages } from "./en";
import { formatsFor } from "./format";

const { number, decimal, euros, date } = formatsFor("de");

export const de: Messages = {
  title: "Solarrechner",
  language: "Sprache",
  results: "Ergebnisse",
  loadingBuilding:
    "Gebäude wird geladen … Der erste Klick in einem neuen Gebiet lädt LGL-Daten herunter und kann etwa 20 Sekunden dauern.",
  api: {
    pending: "API wird geprüft …",
    error: "API offline",
    success: "API ok",
  },
  search: {
    label: "Adresse suchen",
    placeholder: "Adresse, z. B. Gauchstraße 3 Freiburg",
    results: "Adressen",
    unavailable: "Die Adresssuche ist gerade nicht erreichbar.",
    searching: "Suche läuft …",
    noMatch: "Kein Treffer in Baden-Württemberg.",
  },
  map: {
    noWebgl:
      "Dieser Browser kann die Karte nicht anzeigen, weil WebGL 2 nicht verfügbar ist. Bitte einen anderen Browser verwenden oder die Hardwarebeschleunigung in den Browsereinstellungen einschalten.",
    styleFailed:
      "Die Karte konnte nicht geladen werden. Bitte die Internetverbindung prüfen und die Seite neu laden.",
  },
  building: {
    start: "Zum Starten ein Gebäude in der Karte anklicken.",
    loading: "Gebäude wird geladen …",
    none: "Hier ist kein Gebäude. Bitte direkt auf ein Gebäude klicken.",
    withoutAddress: "Gebäude ohne Adresse",
    height: (metres: number) => `${number(metres, 1)} m hoch`,
    roofFaces: (count: number) => `Dachflächen (${count})`,
    flat: "flach",
    face: (tilt: number, area: number) =>
      `${number(tilt)}° · ${number(area)} m²`,
  },
  directions: {
    N: "N",
    NE: "NO",
    E: "O",
    SE: "SO",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  },
  setup: {
    title: "Anlage",
    panels: "Module",
    wattsEach: "Watt je Modul",
    peakPower: (kwp: number) => `= ${number(kwp, 2)} kWp`,
    mounting: "Montage",
    flush: (tilt: number, direction: string | null) =>
      direction
        ? `Dachparallel (${number(tilt)}° ${direction})`
        : `Dachparallel (${number(tilt)}°, flach)`,
    stands: (tilt: number) => `Aufgeständert, ${tilt}° nach Süden`,
    custom: "Eigene Neigung und Ausrichtung",
    tilt: (degrees: number) => `Neigung ${degrees}°`,
    direction: "Ausrichtung",
  },
  estimate: {
    label: "Ertragsschätzung",
    tooSmall: "Mindestens 0,1 kWp eingeben.",
    calculating: "Ertrag wird berechnet …",
    kwh: (kwh: number) => `${number(kwh)} kWh`,
    perYear: "pro Jahr",
    perKwp: (kwh: number) => `${number(kwh)} kWh pro kWp`,
    source: "Quelle: PVGIS © Europäische Union",
    savings: "Ersparnis pro Jahr",
    systemCost: "Anlagenkosten",
    payback: "Amortisation",
    paybackYears: (years: number | null) =>
      years === null ? "nie" : `${number(years, 1)} Jahre`,
    co2: "Vermiedenes CO₂ pro Jahr",
    mass: (kg: number) =>
      kg >= 1000 ? `${number(kg / 1000, 1)} t` : `${number(kg)} kg`,
    euros,
    note: "Einfache Amortisation: ohne Preisänderungen, Degradation, Wartung und Finanzierung.",
  },
  chart: {
    months: [
      "Jan",
      "Feb",
      "Mär",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ],
    summary: (min: number, max: number) =>
      `Monatlicher Ertrag von ${number(min)} bis ${number(max)} kWh`,
    month: (name: string, kwh: number) => `${name}: ${number(kwh)} kWh`,
  },
  assumptions: {
    title: "Annahmen und Quellen",
    reset: "Auf Standardwerte zurücksetzen",
    fields: {
      electricity_price: "Strompreis ct/kWh",
      feed_in_tariff: "Einspeisung ct/kWh",
      self_consumption_share: "Eigenverbrauch %",
      system_cost_per_kwp: "Kosten €/kWp",
    },
    names: {
      electricity_price: "Haushaltsstrompreis",
      feed_in_tariff: "Einspeisevergütung",
      self_consumption_share: "Selbst genutzter Anteil des Solarstroms",
      system_cost_per_kwp: "Anlagenkosten",
      grid_co2_factor: "CO₂ je kWh Strom aus dem deutschen Netz",
    },
    values: {
      electricity_price: (value: number) => `${decimal(value * 100)} ct/kWh`,
      feed_in_tariff: (value: number) => `${decimal(value * 100)} ct/kWh`,
      self_consumption_share: (value: number) => `${decimal(value * 100)} %`,
      system_cost_per_kwp: (value: number) => `${euros(value)}/kWp`,
      grid_co2_factor: (value: number) => `${decimal(value)} kg/kWh`,
    },
  },
  download: {
    print: "Drucken oder als PDF speichern",
    csv: "CSV herunterladen",
    fileName: "solarertrag.csv",
    separator: ";",
    month: "Monat",
    kwh: "Ertrag (kWh)",
    year: "Jahr",
  },
  report: {
    title: "Schätzung des Solarertrags",
    created: (day: Date) => `Erstellt am ${date(day)}`,
    building: "Gebäude",
    roofFace: "Dachfläche",
    location: "Lage",
    coordinates: (lat: number, lon: number) =>
      `${number(lat, 5)}° N, ${number(lon, 5)}° O`,
    panels: "Module",
    orientation: (tilt: number, azimuth: number) =>
      `${number(tilt)}° Neigung, Azimut ${number(azimuth)}° (180° = Süden)`,
    systemSize: "Anlagengröße",
    kwp: (kwp: number) => `${number(kwp, 2)} kWp`,
    annualYield: "Ertrag pro Jahr",
    specificYield: "Ertrag pro kWp",
    monthly: "Ertrag pro Monat in kWh",
    whole: (value: number) => number(value),
    edited: "geändert",
    credits: "Datenquellen und Lizenzen",
    pvgis: "Solarertrag: PVGIS © Europäische Union",
    lgl: "Gebäude- und Dachdaten: LGL-BW (2026) Datenlizenz Deutschland – Namensnennung – Version 2.0, www.lgl-bw.de",
  },
  errors: {
    outsideArea: "Dieser Ort liegt außerhalb von Baden-Württemberg.",
    lgl: "Der LGL-Downloaddienst ist nicht erreichbar. Bitte später erneut versuchen.",
    pvgis:
      "Der PVGIS-Ertragsdienst ist nicht erreichbar. Bitte später erneut versuchen.",
    unexpected: "Etwas ist schiefgelaufen. Bitte später erneut versuchen.",
  },
};
