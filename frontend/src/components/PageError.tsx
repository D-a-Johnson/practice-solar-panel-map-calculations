import { useI18n } from "../i18n/language";

export function PageError() {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className="grid h-dvh place-items-center bg-slate-50 p-6 text-center text-slate-700"
    >
      <div>
        <p>{t.crash.page}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          {t.crash.reload}
        </button>
      </div>
    </div>
  );
}
