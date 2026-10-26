import { createContext, useContext } from "react";

import { de } from "./de";
import { en, type Messages } from "./en";

export const MESSAGES = { en, de } satisfies Record<string, Messages>;

export type Language = keyof typeof MESSAGES;

export type LanguageState = {
  language: Language;
  t: Messages;
  setLanguage: (language: Language) => void;
};

export const LanguageContext = createContext<LanguageState | null>(null);

export function useI18n(): LanguageState {
  const state = useContext(LanguageContext);
  if (!state) {
    throw new Error("useI18n must be used inside <LanguageProvider>");
  }
  return state;
}

/**
 * A language the user picked before wins. Otherwise the first browser
 * language the app supports decides, so a browser set to French, then
 * German gets German. Everything else falls back to English.
 */
export function initialLanguage(
  saved: string | null,
  browserLanguages: readonly string[],
): Language {
  if (isLanguage(saved)) {
    return saved;
  }
  const supported = browserLanguages
    .map((tag) => tag.slice(0, 2).toLowerCase())
    .find(isLanguage);
  return supported ?? "en";
}

function isLanguage(value: string | null): value is Language {
  return value !== null && Object.hasOwn(MESSAGES, value);
}
