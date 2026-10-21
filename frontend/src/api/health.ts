import { useQuery } from "@tanstack/react-query";

export type Health = {
  status: "ok";
  postgis: string;
};

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
    refetchInterval: 30_000,
  });
}
