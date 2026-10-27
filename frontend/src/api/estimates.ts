import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";

import { ApiError } from "./http";
import type { components, paths } from "./schema";

export type YieldQuery = paths["/api/estimates"]["get"]["parameters"]["query"];
export type YieldPerKwp = components["schemas"]["YieldPerKwp"];

export async function fetchYieldPerKwp(
  query: YieldQuery,
): Promise<YieldPerKwp> {
  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`/api/estimates?${params}`);
  if (!response.ok) {
    throw new ApiError(response.status);
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
