// Shared recipe text cleanup: used by the recipe page and the AI recipe writer
// so stray numbering, punctuation and UK spellings never reach readers.

export function cleanStepText(s: string): string {
  return String(s ?? "")
    .trim()
    .replace(/^(?:step\s*)?\d+\s*[.):\-–—]?\s+/i, "")
    .replace(/[\s,;:–—-]+$/, "")
    .replace(/\.{2,}$/, ".")
    .trim();
}

export function cleanStep(s: string): string {
  const t = cleanStepText(s);
  if (!t) return t;
  return /[.!?)]$/.test(t) ? t : `${t}.`;
}

export function cleanTip(s: string): string {
  return String(s ?? "").trim().replace(/^[\s•·*–—-]+/, "").trim();
}

export function cleanServings(s: string | number | null | undefined): string {
  return String(s ?? "").replace(/\s*servings?\s*$/i, "").trim();
}

export function usNutritionLabel(label: string): string {
  return label.replace(/fibre/gi, (m) => (m[0] === "F" ? "Fiber" : "fiber"));
}
