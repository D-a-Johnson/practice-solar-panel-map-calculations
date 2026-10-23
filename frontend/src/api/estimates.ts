import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { errorMessage } from "./http";

export type YieldQuery = {
  lat: number;
  lon: number;
  tilt: number;
  azimuth: number;
};

export type YieldPerKwp = {
  annual_kwh_per_kwp: number;
  monthly_kwh_per_kwp: number[];
};

export async function fetchYieldPerKwp(
  query: YieldQuery,
): Promise<YieldPerKwp> {
  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`/api/estimates?${params}`);
  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
  return (await response.json()) as YieldPerKwp;
}

export function useYieldPerKwp(query: YieldQuery | null) {
  return useQuery({
    queryKey: ["yield-per-kwp", query],
    queryFn: query ? () => fetchYieldPerKwp(query) : skipToken,
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
}
