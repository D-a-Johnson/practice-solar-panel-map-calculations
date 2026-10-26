import { useQuery } from "@tanstack/react-query";

import type { EconomicsInputs } from "../lib/economics";
import { ApiError } from "./http";

export type AssumptionKey = keyof EconomicsInputs;

export type Assumption = {
  label: string;
  value: number;
  unit: string;
  source: string;
  source_url: string;
  as_of: string;
};

export type Assumptions = Record<AssumptionKey, Assumption>;

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
