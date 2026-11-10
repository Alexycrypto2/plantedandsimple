/** Keeps the author's title sacred: AI may only add modifiers around it, never rename it. */
const BRAND = " · Planted & Simple";

/** A short, title-like input (not a long brief) is treated as the exact title. */
export function looksLikeTitle(input: string): boolean {
  const t = input.trim();
  return t.length > 0 && t.length <= 110 && t.split(/\s+/).length <= 14 && !/[?]$/.test(t);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** True when the SEO title still contains the full original title. */
export function keepsTitle(title: string, seoTitle: string): boolean {
  return norm(seoTitle).includes(norm(title));
}

/** Returns an SEO title that always contains the original title, padded with the brand when short. */
export function anchorSeoTitle(title: string, candidate?: string | null): string {
  const t = title.trim();
  const c = (candidate ?? "").trim();
  if (c && keepsTitle(t, c) && c.length <= 65) return c;
  if (t.length < 30 && t.length + BRAND.length <= 60) return t + BRAND;
  return t;
}
