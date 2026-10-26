import { describe, expect, it } from "vitest";

import { initialLanguage } from "./language";

describe("initialLanguage", () => {
  it("keeps the language the user picked before", () => {
    expect(initialLanguage("en", ["de-DE"])).toBe("en");
  });

  it("uses the first supported browser language", () => {
    expect(initialLanguage(null, ["fr-FR", "de-DE", "en-US"])).toBe("de");
  });

  it("ignores a saved value that isn't a language", () => {
    expect(initialLanguage("toString", ["de-AT"])).toBe("de");
  });

  it("falls back to English", () => {
    expect(initialLanguage(null, ["fr-FR", "it"])).toBe("en");
  });
});
