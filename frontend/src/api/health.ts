import { useQuery } from "@tanstack/react-query";

import type { components } from "./schema";

export type Health = components["schemas"]["Health"];

/**
 * `fetch` does not reject on HTTP error statuses, so a 503 (database down)
 * or a proxy error (Django not running) has to be turned into an error here.
 */
export async function fetchHealth(): Promise<Health> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }
  return (await response.json()) as Health;
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    /**
     * Live re-checking helps while developing. In production every open tab
     * would ask the server every 30 s for a developer indicator, so the badge
     * shows the first check only.
     */
    refetchInterval: import.meta.env.DEV ? 30_000 : false,
  });
}
