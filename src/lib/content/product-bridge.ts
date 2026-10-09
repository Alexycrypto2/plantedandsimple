/**
 * Picks the most relevant offer for a piece of content and renders a
 * self-contained HTML card that can be dropped into any article or recipe.
 * Pure + browser-safe so it can run on the server and be unit tested.
 */
export type OfferKey = "prep" | "cookbook" | "free";

export type Offer = {
  key: OfferKey;
  eyebrow: string;
  title: string;
  pitch: string;
  cta: string;
  href: string;
};

export const OFFERS: Record<OfferKey, Offer> = {
  prep: {
    key: "prep",
    eyebrow: "Plan the whole week",
    title: "The Meal Prep System",
    pitch: "Want your entire week planned, macro-balanced and grocery-mapped for you? The interactive planner does it in minutes.",
    cta: "See the Meal Prep System",
    href: "/prep",
  },
  cookbook: {
    key: "cookbook",
    eyebrow: "Liked this one?",
    title: "30 High-Protein Plant-Based Meals",
    pitch: "Thirty tested recipes with exact macros, built for real weeknights. Instant PDF download.",
    cta: "Get the cookbook",
    href: "/shop/high-protein-cookbook",
  },
  free: {
    key: "free",
    eyebrow: "Free download",
    title: "Get the free plant-protein cookbook",
    pitch: "Quick, high-protein plant-based recipes straight to your inbox — free.",
    cta: "Send me the free cookbook",
    href: "/free-cookbook",
  },
};

const PREP_WORDS = ["meal prep", "prep", "weekly", "week of", "batch", "plan", "planner", "grocery", "make ahead", "make-ahead", "lunches", "budget"];
const PROTEIN_WORDS = ["protein", "high-protein", "tofu", "tempeh", "lentil", "chickpea", "seitan", "bean", "dinner", "lunch", "bowl", "recipe", "macro", "muscle", "edamame"];

export function pickOffer(text: string): Offer {
  const t = text.toLowerCase();
  const has = (w: string) => new RegExp(`(^|[^a-z])${w.replace(/[-]/g, "\\-")}s?([^a-z]|$)`).test(t);
  if (PREP_WORDS.some(has)) return OFFERS.prep;
  if (PROTEIN_WORDS.some(has)) return OFFERS.cookbook;
  return OFFERS.free;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function offerCardHtml(offer: Offer, campaign = "blog"): string {
  const href = `${offer.href}?utm_source=${encodeURIComponent(campaign)}&utm_medium=content&utm_campaign=product_bridge`;
  return `<aside class="ps-product-bridge" data-offer="${offer.key}" style="margin:2rem 0;padding:1.5rem;border-radius:1.25rem;background:#2E5E3B;color:#FAF8F3">
<p style="margin:0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.75">${esc(offer.eyebrow)}</p>
<p style="margin:.4rem 0 .5rem;font-size:1.35rem;font-weight:600">${esc(offer.title)}</p>
<p style="margin:0 0 1rem;opacity:.9">${esc(offer.pitch)}</p>
<a href="${href}" style="display:inline-block;padding:.7rem 1.4rem;border-radius:999px;background:#FAF8F3;color:#2E5E3B;font-weight:700;text-decoration:none">${esc(offer.cta)} →</a>
</aside>`;
}

/** Inserts the card roughly mid-article (after the middle </h2>-led section) if not already present. */
export function injectOffer(html: string, offer: Offer, campaign = "blog"): string {
  if (html.includes("ps-product-bridge")) return html;
  const card = offerCardHtml(offer, campaign);
  const h2s = [...html.matchAll(/<h2[\s>]/g)].map((m) => m.index ?? 0);
  if (h2s.length >= 3) {
    const at = h2s[Math.floor(h2s.length / 2)]!;
    return html.slice(0, at) + card + html.slice(at);
  }
  return html + card;
}
