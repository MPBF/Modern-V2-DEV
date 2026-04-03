// @ts-ignore
import ArabicReshaper from "arabic-reshaper";
// @ts-ignore
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function isArabicText(text: string): boolean {
  return ARABIC_REGEX.test(text || "");
}

export function processArabicText(text: string): string {
  if (!text) return "";
  if (!ARABIC_REGEX.test(text)) return text;

  try {
    const reshaped = ArabicReshaper.convertArabic(text);
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped, "rtl");
    return bidi.getReorderedString(reshaped, embeddingLevels);
  } catch (e) {
    console.error("Arabic text processing error:", e);
    return text;
  }
}
