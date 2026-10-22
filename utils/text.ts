/**
 * Up to two initials for an avatar. Splits by grapheme so Khmer names keep
 * their combining vowels/subscripts (e.g. "សុខា" → "សុ", not a lone "ស").
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const firstGrapheme = (word: string) => segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? "";

  const picked = words.length === 1 ? [words[0]!] : [words[0]!, words[words.length - 1]!];
  return picked.map(firstGrapheme).join("").toUpperCase();
}
