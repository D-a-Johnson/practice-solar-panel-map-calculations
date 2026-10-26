import { type ReactNode, useMemo, useState } from "react";

import {
  type AssumptionKey,
  type Assumptions,
  useAssumptionDefaults,
} from "../api/assumptions";
import { AssumptionsContext } from "../lib/assumptionsContext";
import type { EconomicsInputs } from "../lib/economics";

/**
 * Holds the user's overrides for the whole app, so an edited electricity
 * price stays in place while clicking from building to building.
 */
export function AssumptionsProvider({ children }: { children: ReactNode }) {
  const defaults = useAssumptionDefaults();
  const [overrides, setOverrides] = useState<Partial<EconomicsInputs>>({});

  const state = useMemo(
    () => ({
      defaults: defaults.data,
      values: defaults.data && { ...valuesOf(defaults.data), ...overrides },
      setValue: (key: AssumptionKey, value: number) =>
        setOverrides((current) => ({ ...current, [key]: value })),
      reset: () => setOverrides({}),
    }),
    [defaults.data, overrides],
  );

  return <AssumptionsContext value={state}>{children}</AssumptionsContext>;
}

function valuesOf(assumptions: Assumptions): EconomicsInputs {
  return {
    electricity_price: assumptions.electricity_price.value,
    feed_in_tariff: assumptions.feed_in_tariff.value,
    self_consumption_share: assumptions.self_consumption_share.value,
    system_cost_per_kwp: assumptions.system_cost_per_kwp.value,
    grid_co2_factor: assumptions.grid_co2_factor.value,
  };
}
