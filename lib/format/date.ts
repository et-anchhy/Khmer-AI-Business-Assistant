import type { Locale } from "@/lib/i18n/config";

/**
 * Cambodia is UTC+7 all year (no daylight saving). Formatting in a fixed zone
 * with our own month names gives identical output on the server and in every
 * browser — Intl locale data and the viewer's timezone vary, which would cause
 * React hydration mismatches and dates that change near midnight.
 */
const PHNOM_PENH_OFFSET_MS = 7 * 60 * 60 * 1000;

const MONTHS: Record<Locale, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  km: ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"],
};

/** Calendar date in Cambodia time, e.g. "22 Oct 2026" / "22 តុលា 2026". */
export function formatDate(value: string | Date, locale: Locale): string {
  const local = new Date(new Date(value).getTime() + PHNOM_PENH_OFFSET_MS);
  return `${local.getUTCDate()} ${MONTHS[locale][local.getUTCMonth()]} ${local.getUTCFullYear()}`;
}
