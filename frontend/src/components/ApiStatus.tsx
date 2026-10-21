import { useHealth } from "../api/health";

const STATUS_LOOK = {
  pending: { dot: "bg-slate-400", label: "Checking API…" },
  error: { dot: "bg-red-500", label: "API offline" },
  success: { dot: "bg-emerald-500", label: "API ok" },
} as const;

export function ApiStatus() {
  const { status, data } = useHealth();
  const look = STATUS_LOOK[status];

  return (
    <span
      role="status"
      title={data ? `PostGIS ${data.postgis}` : undefined}
      className="flex items-center gap-2 text-sm text-slate-600"
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${look.dot}`}
      />
      {look.label}
    </span>
  );
}
