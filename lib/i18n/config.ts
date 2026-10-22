export const locales = ["en", "km"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

/** Each language is always shown in its own script, whatever the current UI locale. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  km: "ខ្មែរ",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Picks a supported locale from an Accept-Language header, e.g. "km-KH,km;q=0.9,en;q=0.8". */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag = "", q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return tags.map((t) => t.lang).find(isLocale) ?? defaultLocale;
}
