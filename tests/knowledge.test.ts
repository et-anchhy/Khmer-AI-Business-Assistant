import { describe, expect, it } from "vitest";
import { KNOWLEDGE_CATEGORIES, STARTER_CATEGORIES } from "@/features/knowledge/constants";
import { createKnowledgeSchema, knowledgeFiltersSchema } from "@/features/knowledge/schemas";
import { en } from "@/lib/i18n/dictionaries/en";
import { km } from "@/lib/i18n/dictionaries/km";
import { listHref } from "@/lib/url";

const schema = createKnowledgeSchema(en.validation);

describe("knowledge entry validation", () => {
  it("accepts the spec's Khmer FAQ example", () => {
    const result = schema.parse({
      title: "  តើមានដឹកជញ្ជូនទៅខេត្តទេ?  ",
      content: "មាន។ យើងដឹកជញ្ជូនទៅគ្រប់ខេត្តក្នុងប្រទេសកម្ពុជា។",
      category: "faq",
    });
    expect(result.title).toBe("តើមានដឹកជញ្ជូនទៅខេត្តទេ?");
  });

  it("keeps line breaks inside content", () => {
    expect(schema.parse({ title: "Hours", content: "Mon–Sat 8–20\nSunday closed", category: "business_info" }).content).toBe(
      "Mon–Sat 8–20\nSunday closed",
    );
  });

  it("requires a title, content and a known category", () => {
    const result = schema.safeParse({ title: " ", content: "\n ", category: "gossip" });
    const messages = Object.fromEntries(result.error!.issues.map((i) => [i.path[0], i.message]));
    expect(messages).toEqual({
      title: en.validation.titleRequired,
      content: en.validation.contentRequired,
      category: en.validation.chooseOption,
    });
  });

  it("enforces the database length limits", () => {
    const tooLong = schema.safeParse({ title: "x".repeat(301), content: "y".repeat(8001), category: "other" });
    expect(tooLong.error!.issues.map((i) => i.message)).toEqual([
      "Must be 300 characters or fewer.",
      "Must be 8000 characters or fewer.",
    ]);
  });

  it("speaks Khmer with the Khmer dictionary", () => {
    const result = createKnowledgeSchema(km.validation).safeParse({ title: "", content: "x", category: "faq" });
    expect(result.error!.issues[0]!.message).toBe(km.validation.titleRequired);
  });
});

describe("knowledge categories", () => {
  it("has a label and example in both languages for every category", () => {
    for (const category of KNOWLEDGE_CATEGORIES) {
      for (const dict of [en, km]) {
        expect(dict.knowledge.categories[category]).toBeTruthy();
        expect(dict.knowledge.examples[category].title).toBeTruthy();
        expect(dict.knowledge.examples[category].content).toBeTruthy();
      }
    }
    expect(STARTER_CATEGORIES.every((c) => KNOWLEDGE_CATEGORIES.includes(c))).toBe(true);
  });

  it("uses the spec's Khmer FAQ as the Khmer example", () => {
    expect(km.knowledge.examples.faq).toEqual({
      title: "តើមានដឹកជញ្ជូនទៅខេត្តទេ?",
      content: "មាន។ យើងដឹកជញ្ជូនទៅគ្រប់ខេត្តក្នុងប្រទេសកម្ពុជា។",
    });
  });
});

describe("knowledge list filters", () => {
  it("drops unknown categories and bad pages", () => {
    expect(knowledgeFiltersSchema.parse({ category: "secret", page: "abc", q: " delivery " })).toEqual({
      q: "delivery",
      category: undefined,
      page: 1,
    });
  });

  it("builds pagination links that keep filters", () => {
    expect(listHref("/dashboard/knowledge", { q: "ដឹក", category: "faq" }, 2)).toBe(
      "/dashboard/knowledge?q=%E1%9E%8A%E1%9E%B9%E1%9E%80&category=faq&page=2",
    );
    expect(listHref("/dashboard/knowledge", { q: undefined }, 1)).toBe("/dashboard/knowledge");
  });
});

describe("date formatting", () => {
  it("is deterministic and uses Cambodia time", async () => {
    const { formatDate } = await import("@/lib/format/date");
    expect(formatDate("2026-10-22T03:00:00Z", "en")).toBe("22 Oct 2026");
    expect(formatDate("2026-10-22T03:00:00Z", "km")).toBe("22 តុលា 2026");
    // 18:30 UTC on the 22nd is already the 23rd in Phnom Penh.
    expect(formatDate("2026-10-22T18:30:00Z", "en")).toBe("23 Oct 2026");
  });
});
