import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { km } from "./km";

const dictionaries: Record<Locale, Dictionary> = { en, km };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
