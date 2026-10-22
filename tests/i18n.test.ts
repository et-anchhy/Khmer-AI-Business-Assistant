import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { km } from "@/lib/i18n/dictionaries/km";
import { interpolate } from "@/lib/i18n/format";
import { initialsOf } from "@/utils/text";

function leafPaths(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? leafPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

function valueAt(obj: object, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], obj);
}

describe("dictionaries", () => {
  it("Khmer provides a non-empty translation for every English key", () => {
    for (const path of leafPaths(en)) {
      const value = valueAt(km, path);
      expect(typeof value, path).toBe("string");
      expect((value as string).trim(), path).not.toBe("");
    }
  });

  it("keeps the same placeholders in both languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const path of leafPaths(en)) {
      expect(placeholders(valueAt(km, path) as string), path).toEqual(placeholders(valueAt(en, path) as string));
    }
  });

  it("uses the interface translations from the spec", () => {
    expect(km.nav.dashboard).toBe("ផ្ទាំងគ្រប់គ្រង");
    expect(km.nav.products).toBe("ផលិតផល");
    expect(km.nav.orders).toBe("ការបញ្ជាទិញ");
    expect(km.nav.customers).toBe("អតិថិជន");
    expect(km.nav.ai).toBe("ជំនួយការ AI");
    expect(km.nav.knowledge).toBe("មូលដ្ឋានចំណេះដឹង");
    expect(km.nav.settings).toBe("ការកំណត់");
  });
});

describe("i18n helpers", () => {
  it("interpolates placeholders and leaves unknown ones intact", () => {
    expect(interpolate("Welcome, {name}", { name: "ដារា" })).toBe("Welcome, ដារា");
    expect(interpolate("{a} {b}", { a: 1 })).toBe("1 {b}");
  });

  it("detects Khmer from Accept-Language and falls back to English", () => {
    expect(localeFromAcceptLanguage("km-KH,km;q=0.9,en;q=0.8")).toBe("km");
    expect(localeFromAcceptLanguage("fr-FR,en;q=0.5")).toBe("en");
    expect(localeFromAcceptLanguage("en;q=0.4,km;q=0.9")).toBe("km");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });

  it("builds avatar initials without splitting Khmer clusters", () => {
    expect(initialsOf("Sok Dara")).toBe("SD");
    expect(initialsOf("សុខា")).toBe("សុ");
    expect(initialsOf("   ")).toBe("?");
  });
});
