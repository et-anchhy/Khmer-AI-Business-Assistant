export type MessageLanguage = "km" | "en" | "mixed" | "unknown";

const KHMER_CHAR = /[ក-៿᧠-᧿]/g;
const LATIN_LETTER = /[A-Za-z]/g;

/**
 * Rough script detection for the reply-language instruction. Khmer and Latin
 * characters are counted; a clear majority (70%+) decides, otherwise "mixed".
 */
export function detectLanguage(text: string): MessageLanguage {
  const khmer = text.match(KHMER_CHAR)?.length ?? 0;
  const latin = text.match(LATIN_LETTER)?.length ?? 0;
  if (khmer + latin === 0) return "unknown";
  const khmerShare = khmer / (khmer + latin);
  if (khmerShare >= 0.7) return "km";
  if (khmerShare <= 0.3) return "en";
  return "mixed";
}
