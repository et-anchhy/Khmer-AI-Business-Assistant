import { describe, expect, it } from "vitest";
import { answerQuestion, trimHistory } from "@/lib/ai/answer";
import { buildBusinessContext, type BusinessProfile } from "@/lib/ai/context";
import { detectLanguage } from "@/lib/ai/language";
import { buildInstructions } from "@/lib/ai/prompt";
import { AiError, type AiProvider, type ChatTurn } from "@/lib/ai/provider";
import { selectRelevant, type KnowledgeCandidate, type ProductCandidate } from "@/lib/ai/retrieval";
import { searchTerms } from "@/lib/ai/search";
import { demoBusiness, demoKnowledge, demoProducts } from "@/scripts/seed-data";

const business: BusinessProfile = { ...demoBusiness };
const products: ProductCandidate[] = demoProducts
  .filter((p) => p.is_active)
  .map((p, i) => ({ ...p, id: `p${i}` }));
const knowledge: KnowledgeCandidate[] = demoKnowledge.map((k, i) => ({ ...k, id: `k${i}` }));

const topProduct = (q: string) => selectRelevant(q, products, knowledge).matchedProducts[0]?.name;
const topKnowledge = (q: string) => selectRelevant(q, products, knowledge).knowledge[0]?.title;

describe("language detection", () => {
  it.each([
    ["អាវនេះតម្លៃប៉ុន្មាន?", "km"],
    ["Do you deliver to Siem Reap?", "en"],
    ["Do you have អាវយឺតពណ៌ខ្មៅ size M?", "mixed"],
    ["👍 ?? 15", "unknown"],
  ] as const)("%s → %s", (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });
});

describe("search terms", () => {
  it("drops common English words and keeps SKUs", () => {
    expect(searchTerms("Do you have the AF-TS-BLK shirts?")).toEqual(["af-ts-blk", "af", "ts", "blk", "shirt"]);
  });

  it("splits Khmer into trigrams and ignores zero-width spaces", () => {
    expect(searchTerms("អាវ​យឺត")).toEqual(searchTerms("អាវយឺត"));
    expect(searchTerms("អាវយឺត")).toEqual(["អាវ", "ាវយ", "វយឺ", "យឺត"]);
  });
});

describe("retrieval", () => {
  it("finds the product from English and Khmer questions", () => {
    expect(topProduct("Do you have the black shirt in stock?")).toBe("Classic Black T-Shirt");
    expect(topProduct("អាវយឺតពណ៌ខ្មៅតម្លៃប៉ុន្មាន?")).toBe("Classic Black T-Shirt");
    expect(topProduct("How much are the jeans?")).toBe("Slim Fit Jeans");
    expect(topProduct("តើមានក្រមាទេ?")).toBe("Silk Krama Scarf");
    expect(topProduct("AF-AC-TOT")).toBe("Canvas Tote Bag");
  });

  it("finds the right knowledge entry in both languages", () => {
    expect(topKnowledge("Do you deliver to Siem Reap?")).toBe("Do you deliver to Siem Reap?");
    expect(topKnowledge("តើមានដឹកជញ្ជូនទៅខេត្តទេ?")).toBe("តើមានដឹកជញ្ជូនទៅខេត្តទេ?");
    expect(topKnowledge("Can I pay cash on delivery?")).toBe("Payment methods");
    expect(topKnowledge("can I exchange for a different size?")).toBe("Return and exchange policy");
  });

  it("answers the spec's combined question with both product and delivery data", () => {
    const result = selectRelevant("Do you have the black shirt in stock and can you deliver to Siem Reap?", products, knowledge);
    expect(result.matchedProducts[0]?.name).toBe("Classic Black T-Shirt");
    expect(result.knowledge.map((k) => k.title)).toContain("Do you deliver to Siem Reap?");
  });

  it("falls back to policy entries when nothing matches", () => {
    const result = selectRelevant("hello!", products, knowledge);
    expect(result.matchedProducts).toEqual([]);
    expect(result.knowledge.length).toBeGreaterThan(0);
    expect(result.knowledge.every((k) => ["delivery_policy", "payment_info", "return_policy", "business_info"].includes(k.category))).toBe(true);
  });

  it("always includes a catalogue for general questions, capped in size", () => {
    expect(selectRelevant("What do you sell?", products, knowledge).catalog).toHaveLength(products.length);
    const many = Array.from({ length: 60 }, (_, i) => ({ ...products[0]!, id: `x${i}`, name: `Item ${i}` }));
    const result = selectRelevant("anything", many, knowledge);
    expect(result.catalog).toHaveLength(40);
    expect(result.catalogTotal).toBe(60);
  });
});

describe("business context", () => {
  const retrieved = selectRelevant("black shirt", products, knowledge);
  const context = buildBusinessContext(business, retrieved);

  it("contains exact prices, stock and both product names", () => {
    expect(context).toContain("Classic Black T-Shirt / អាវយឺតពណ៌ខ្មៅ");
    expect(context).toContain("Price: $15.00");
    expect(context).toContain("in stock (20 available)");
    expect(context).toContain("Linen Button Shirt / អាវក្រណាត់លីនេន — $22.00 — out of stock");
    expect(context).toContain("Canvas Tote Bag / កាបូបក្រណាត់ — $12.00 — low stock (3 left)");
  });

  it("includes delivery, payment and hours from the business profile", () => {
    expect(context).toContain("Opening hours: Every day 8:00–20:00");
    expect(context).toContain("Free delivery on orders over $50");
    expect(context).toContain("ABA bank transfer, KHQR");
  });

  it("marks missing facts as not provided instead of omitting them", () => {
    const bare = buildBusinessContext(
      { ...business, opening_hours: null, delivery_info: "  ", payment_info: null, phone: null },
      { matchedProducts: [], catalog: [], catalogTotal: 0, knowledge: [] },
    );
    expect(bare).toContain("Opening hours: not provided");
    expect(bare).toContain("## Delivery\nnot provided");
    expect(bare).toContain("No products have been added.");
    expect(bare).toContain("No relevant entries.");
  });

  it("formats riel prices without decimals", () => {
    const khr = buildBusinessContext({ ...business, currency: "KHR" }, { ...retrieved, catalog: [{ ...products[0]!, price: 60000 }] });
    expect(khr).toContain("60,000៛");
  });

  it("stays within the size budget", () => {
    const huge = Array.from({ length: 30 }, (_, i) => ({ id: `h${i}`, title: `Entry ${i}`, content: "x".repeat(5000), category: "faq" as const }));
    const big = buildBusinessContext(business, { ...retrieved, knowledge: huge });
    expect(big.length).toBeLessThanOrEqual(12_000);
  });
});

describe("instructions", () => {
  const base = { business, context: "CTX" };

  it("contains the spec's grounding instruction", () => {
    const text = buildInstructions({ ...base, language: "en" });
    expect(text).toContain("Answer questions using only the supplied business information. Never invent business-specific facts.");
    expect(text).toContain("clearly say that you do not have enough information and suggest contacting the business (phone: 012 345 678)");
  });

  it("tells the model which language to reply in", () => {
    expect(buildInstructions({ ...base, language: "km" })).toContain("written in Khmer, so reply in Khmer");
    expect(buildInstructions({ ...base, language: "en" })).toContain("written in English, so reply in English");
    expect(buildInstructions({ ...base, language: "mixed" })).toContain("mixes Khmer and English");
    expect(buildInstructions({ ...base, language: "unknown" })).toContain("unclear, so reply in Khmer");
    expect(buildInstructions({ business: { ...business, preferred_language: "en" }, context: "", language: "unknown" })).toContain(
      "unclear, so reply in English",
    );
  });
});

describe("answer pipeline", () => {
  const retriever = { retrieve: async (q: string) => selectRelevant(q, products, knowledge) };

  function fakeProvider(reply: string) {
    const calls: { instructions: string; messages: ChatTurn[] }[] = [];
    const provider: AiProvider = {
      complete: async (input) => {
        calls.push(input);
        return reply;
      },
    };
    return { provider, calls };
  }

  it("sends grounded instructions plus the conversation, and returns the trimmed answer", async () => {
    const { provider, calls } = fakeProvider("  អាវនេះមានតម្លៃ $15។  ");
    const result = await answerQuestion({
      business,
      question: "អាវយឺតពណ៌ខ្មៅតម្លៃប៉ុន្មាន?",
      history: [],
      retriever,
      provider,
    });
    expect(result.answer).toBe("អាវនេះមានតម្លៃ $15។");
    expect(calls[0]!.instructions).toContain("reply in Khmer");
    expect(calls[0]!.instructions).toContain("Classic Black T-Shirt / អាវយឺតពណ៌ខ្មៅ | SKU AF-TS-BLK");
    expect(calls[0]!.messages).toEqual([{ role: "user", content: "អាវយឺតពណ៌ខ្មៅតម្លៃប៉ុន្មាន?" }]);
  });

  it("uses the previous question to understand follow-ups", async () => {
    const { provider } = fakeProvider("ok");
    const result = await answerQuestion({
      business,
      question: "and is it in stock?",
      history: [
        { role: "user", content: "How much are the jeans?" },
        { role: "assistant", content: "They are $28.00." },
      ],
      retriever,
      provider,
    });
    expect(result.retrieved.matchedProducts[0]?.name).toBe("Slim Fit Jeans");
  });

  it("never puts another business's data in the prompt", async () => {
    const { provider, calls } = fakeProvider("ok");
    const otherShop = { retrieve: async (q: string) => selectRelevant(q, [{ ...products[0]!, name: "Bravo Secret Phone", name_km: null }], []) };
    await answerQuestion({ business, question: "black shirt?", history: [], retriever, provider });
    await answerQuestion({ business: { ...business, name: "Bravo" }, question: "phone?", history: [], retriever: otherShop, provider });
    expect(calls[0]!.instructions).not.toContain("Bravo Secret Phone");
    expect(calls[1]!.instructions).not.toContain("Classic Black T-Shirt");
  });

  it("rejects an empty model reply", async () => {
    const { provider } = fakeProvider("   ");
    await expect(answerQuestion({ business, question: "hi", history: [], retriever, provider })).rejects.toBeInstanceOf(AiError);
  });

  it("keeps only recent, clipped history", () => {
    const long: ChatTurn[] = Array.from({ length: 14 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "y".repeat(2000) }));
    const trimmed = trimHistory(long);
    expect(trimmed).toHaveLength(10);
    expect(trimmed[0]!.content.length).toBe(1501);
  });
});

describe("conversation titles", () => {
  it("shortens long questions without breaking Khmer characters", async () => {
    const { truncateGraphemes } = await import("@/utils/text");
    expect(truncateGraphemes("  Do you   deliver\nto Siem Reap? ", 60)).toBe("Do you deliver to Siem Reap?");
    const khmer = truncateGraphemes("តើអាវយឺតពណ៌ខ្មៅមានទំហំ M ដែរឬទេ?", 8);
    expect([...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(khmer)]).toHaveLength(8);
    expect(khmer.endsWith("…")).toBe(true);
  });
});
