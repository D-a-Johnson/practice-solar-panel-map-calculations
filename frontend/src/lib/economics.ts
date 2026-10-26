export type EconomicsInputs = {
  electricity_price: number;
  feed_in_tariff: number;
  self_consumption_share: number;
  system_cost_per_kwp: number;
  grid_co2_factor: number;
};

export type Economics = {
  savingsPerYear: number;
  systemCost: number;
  paybackYears: number | null;
  co2SavedKgPerYear: number;
};

/**
 * Self-used solar power saves the household price; the rest earns the
 * feed-in tariff. Payback is simple payback: no price changes, panel
 * degradation, maintenance or financing.
 */
export function economics(
  annualKwh: number,
  peakPowerKwp: number,
  inputs: EconomicsInputs,
): Economics {
  const share = inputs.self_consumption_share;
  const savingsPerYear =
    annualKwh *
    (share * inputs.electricity_price + (1 - share) * inputs.feed_in_tariff);
  const systemCost = peakPowerKwp * inputs.system_cost_per_kwp;
  return {
    savingsPerYear,
    systemCost,
    paybackYears: savingsPerYear > 0 ? systemCost / savingsPerYear : null,
    co2SavedKgPerYear: annualKwh * inputs.grid_co2_factor,
  };
}
