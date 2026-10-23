/**
 * Keyword relevance for Khmer + English without a search engine.
 *
 * Khmer is written without spaces between words, so word splitting does not
 * work; Khmer runs are broken into overlapping 3-character n-grams instead.
 * Latin text is split into words (lower-cased, light plural stemming, common
 * words dropped). Matches are weighted by how rare a term is across the
 * candidate documents (IDF), so generic question words like "តើ…ទេ" or
 * "do you" barely count, while distinctive ones like "ដឹក" or "siem" do.
 */

const ZERO_WIDTH = /[​-‍﻿]/g;
const KHMER_RUN = /[ក-៿᧠-᧿]+/g;
const LATIN_TOKEN = /[a-z0-9]+(?:-[a-z0-9]+)*/g;

const STOPWORDS = new Set(
  (
    "a an the is are was were be do does did you your yours i me my we our us it its this that these those " +
    "have has had can could will would should to of for in on at by with and or not no yes any some there " +
    "what which who whom how much many when where why please hi hello thanks thank want need get about from " +
    "there's what's is it ok okay sir madam bong"
  ).split(" "),
);

export function normalizeText(text: string): string {
  return text.normalize("NFC").replace(ZERO_WIDTH, "").toLowerCase();
}

function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Search terms for a query: Latin words plus Khmer character trigrams. */
export function searchTerms(text: string): string[] {
  const normalized = normalizeText(text);
  const terms = new Set<string>();

  for (const token of normalized.match(LATIN_TOKEN) ?? []) {
    if (token.includes("-")) terms.add(token); // SKUs like "af-ts-blk"
    for (const word of token.split("-")) {
      if (word.length >= 2 && !STOPWORDS.has(word)) terms.add(stem(word));
    }
  }

  for (const run of normalized.match(KHMER_RUN) ?? []) {
    if (run.length <= 3) {
      if (run.length >= 2) terms.add(run);
      continue;
    }
    for (let i = 0; i + 3 <= run.length; i++) terms.add(run.slice(i, i + 3));
  }

  return [...terms];
}

export type SearchField = { text: string | null | undefined; weight: number };

/**
 * Ranks documents for a query. Each matched term contributes the weight of
 * the best field it appears in, times the term's IDF. Returns indices of
 * documents with a positive score, best first.
 */
export function rankDocuments(query: string, documents: SearchField[][]): { index: number; score: number }[] {
  const terms = searchTerms(query);
  if (terms.length === 0 || documents.length === 0) return [];

  const normalizedDocs = documents.map((fields) =>
    fields.map((field) => ({ text: normalizeText(field.text ?? ""), weight: field.weight })),
  );

  const n = normalizedDocs.length;
  const idf = new Map<string, number>();
  for (const term of terms) {
    const df = normalizedDocs.filter((fields) => fields.some((f) => f.text.includes(term))).length;
    if (df > 0) idf.set(term, Math.log(1 + (n - df + 0.5) / (df + 0.5)));
  }

  const results: { index: number; score: number }[] = [];
  normalizedDocs.forEach((fields, index) => {
    let score = 0;
    for (const [term, weight] of idf) {
      let best = 0;
      for (const field of fields) {
        if (field.weight > best && field.text.includes(term)) best = field.weight;
      }
      score += best * weight;
    }
    if (score > 0) results.push({ index, score });
  });

  return results.sort((a, b) => b.score - a.score || a.index - b.index);
}
