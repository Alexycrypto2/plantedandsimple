const NO_TEXT = "Pure photograph only: absolutely no text, words, letters, numbers, captions, labels, signs, banners, cards, paper notes, packaging print, logos or watermarks anywhere in the frame.";

/** Strips quoted phrases, step numbering and colon labels that image models paint as text, then adds a hard no-text rule. */
export function cleanPhotoPrompt(prompt: string): string {
  const cleaned = prompt
    .replace(/[“”"][^“”"]{0,120}[“”"]/g, "")
    .replace(/\b(cooking )?step \d+\s*:?/gi, "")
    .replace(/\b[A-Z][\w ]{0,30}:\s/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
  return `${cleaned} ${NO_TEXT}`;
}
