import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

/** Resolves the UI locale: explicit cookie choice first, then the browser's language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
});

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
});
