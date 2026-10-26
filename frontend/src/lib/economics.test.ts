import { describe, expect, it } from "vitest";

import { economics, type EconomicsInputs } from "./economics";

const DEFAULTS: EconomicsInputs = {
  electricity_price: 0.37,
  feed_in_tariff: 0.077,
  self_consumption_share: 0.3,
  system_cost_per_kwp: 1250,
  grid_co2_factor: 0.344,
};

describe("economics", () => {
  const result = economics(4840, 4.4, DEFAULTS);

  it("values self-used power at the household price and the rest at the feed-in tariff", () => {
    expect(result.savingsPerYear).toBeCloseTo(
      4840 * (0.3 * 0.37 + 0.7 * 0.077),
      6,
    );
  });

  it("prices the system per kWp", () => {
    expect(result.systemCost).toBeCloseTo(5500, 6);
  });

  it("divides cost by yearly savings for the payback time", () => {
    expect(result.paybackYears).toBeCloseTo(5500 / 798.116, 6);
  });

  it("counts every solar kWh as displaced grid electricity", () => {
    expect(result.co2SavedKgPerYear).toBeCloseTo(4840 * 0.344, 6);
  });

  it("saves more when more power is used at home", () => {
    const more = economics(4840, 4.4, {
      ...DEFAULTS,
      self_consumption_share: 0.6,
    });
    expect(more.savingsPerYear).toBeGreaterThan(result.savingsPerYear);
  });

  it("never pays back without savings", () => {
    expect(economics(0, 4.4, DEFAULTS).paybackYears).toBeNull();
  });
});
