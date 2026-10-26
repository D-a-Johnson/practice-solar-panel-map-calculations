/** Formats for one locale: "4,840" and "€798" in English, "4.840" and "798 €" in German. */
export function formatsFor(locale: string) {
  return {
    number: (value: number, fractionDigits = 0) =>
      value.toLocaleString(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    decimal: (value: number) =>
      value.toLocaleString(locale, { maximumFractionDigits: 3 }),
    euros: (value: number) =>
      value.toLocaleString(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    date: (value: Date) =>
      value.toLocaleDateString(locale, { dateStyle: "long" }),
  };
}
