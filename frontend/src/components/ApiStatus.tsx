import { useHealth } from "../api/health";
import { useI18n } from "../i18n/language";

const STATUS_DOT = {
  pending: "bg-slate-400",
  error: "bg-red-500",
  success: "bg-emerald-500",
} as const;

export function ApiStatus() {
  const { status, data } = useHealth();
  const { t } = useI18n();

  return (
    <span
      role="status"
      title={data ? `PostGIS ${data.postgis}` : undefined}
      className="flex items-center gap-2 text-sm text-slate-600"
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${STATUS_DOT[status]}`}
      />
      {t.api[status]}
    </span>
  );
}
