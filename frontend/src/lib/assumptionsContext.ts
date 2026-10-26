import { createContext, useContext } from "react";

import type { AssumptionKey, Assumptions } from "../api/assumptions";
import type { EconomicsInputs } from "./economics";

export type AssumptionsState = {
  defaults: Assumptions | undefined;
  values: EconomicsInputs | undefined;
  setValue: (key: AssumptionKey, value: number) => void;
  reset: () => void;
};

export const AssumptionsContext = createContext<AssumptionsState | null>(null);

export function useAssumptions(): AssumptionsState {
  const state = useContext(AssumptionsContext);
  if (!state) {
    throw new Error("useAssumptions must be used inside <AssumptionsProvider>");
  }
  return state;
}
