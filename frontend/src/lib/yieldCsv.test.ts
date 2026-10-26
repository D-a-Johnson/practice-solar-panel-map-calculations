import { describe, expect, it } from "vitest";

import { yieldCsv } from "./yieldCsv";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTHLY = [95, 153, 290, 389, 450, 495, 509, 438, 328, 213, 108, 76];

describe("yieldCsv", () => {
  it("writes a header, twelve months and the year in whole kWh", () => {
    const lines = yieldCsv(
      MONTHLY.map((kwh) => kwh + 0.4),
      3544.55,
      {
        separator: ",",
        month: "Month",
        kwh: "kWh",
        year: "Year",
        months: MONTHS,
      },
    ).split("\r\n");

    expect(lines).toHaveLength(14);
    expect(lines[0]).toBe("Month,kWh");
    expect(lines[1]).toBe("J,95");
    expect(lines[13]).toBe("Year,3545");
  });

  it("uses the separator it is given", () => {
    const csv = yieldCsv(MONTHLY, 3544, {
      separator: ";",
      month: "Monat",
      kwh: "kWh",
      year: "Jahr",
      months: MONTHS,
    });

    expect(csv.split("\r\n")[13]).toBe("Jahr;3544");
  });
});
