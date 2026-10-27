import { useQuery } from "@tanstack/react-query";

import type { EconomicsInputs } from "../lib/economics";
import { ApiError } from "./http";
import type { components } from "./schema";

export type AssumptionKey = keyof EconomicsInputs;
export type Assumption = components["schemas"]["Assumption"];
export type Assumptions = components["schemas"]["Assumptions"];

export async function fetchAssumptions(): Promise<Assumptions> {
  const response = await fetch("/api/assumptions");
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return (await response.json()) as Assumptions;
}

export function useAssumptionDefaults() {
  return useQuery({
    queryKey: ["assumptions"],
    queryFn: fetchAssumptions,
    staleTime: Infinity,
  });
}
