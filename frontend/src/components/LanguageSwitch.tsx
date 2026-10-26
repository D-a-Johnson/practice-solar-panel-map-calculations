import { type Language, useI18n } from "../i18n/language";

/** Each language is named in itself, so users find their own language. */
const OPTIONS: { value: Language; short: string; name: string }[] = [
  { value: "de", short: "DE", name: "Deutsch" },
  { value: "en", short: "EN", name: "English" },
];

export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div role="group" aria-label={t.language} className="flex text-sm">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.value}
          aria-label={option.name}
          aria-pressed={option.value === language}
          onClick={() => setLanguage(option.value)}
          className="rounded px-2 py-1 font-medium text-slate-500 hover:bg-slate-100 aria-pressed:bg-amber-100 aria-pressed:text-slate-900"
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
