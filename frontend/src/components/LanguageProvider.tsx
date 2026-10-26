import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  initialLanguage,
  type Language,
  LanguageContext,
  MESSAGES,
} from "../i18n/language";

const STORAGE_KEY = "language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrent] = useState(() =>
    initialLanguage(readSaved(), navigator.languages),
  );
  const t = MESSAGES[language];

  /**
   * `lang` makes screen readers pronounce the texts in the right language,
   * and the tab title should match the page.
   */
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.title} · Baden-Württemberg`;
  }, [language, t]);

  const state = useMemo(
    () => ({
      language,
      t,
      setLanguage: (next: Language) => {
        setCurrent(next);
        save(next);
      },
    }),
    [language, t],
  );

  return <LanguageContext value={state}>{children}</LanguageContext>;
}

/**
 * Browsers can refuse access to localStorage (for example when a user
 * blocks site data); the app then just doesn't remember the choice.
 */
function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function save(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    return;
  }
}
