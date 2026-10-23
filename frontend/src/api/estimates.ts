import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { errorMessage } from "./http";

export type EstimateInput = {
  lat: number;
  lon: number;
  tilt: number;
  azimuth: number;
  peak_power_kwp: number;
};

export type Estimate = {
  peak_power_kwp: number;
  annual_kwh: number;
  monthly_kwh: number[];
  specific_yield_kwh_per_kwp: number;
};

export async function fetchEstimate(input: EstimateInput): Promise<Estimate> {
  const params = new URLSearchParams(
    Object.entries(input).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`/api/estimates?${params}`);
  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
  return (await response.json()) as Estimate;
}

export function useEstimate(input: EstimateInput | null) {
  return useQuery({
    queryKey: ["estimate", input],
    queryFn: input ? () => fetchEstimate(input) : skipToken,
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
}
