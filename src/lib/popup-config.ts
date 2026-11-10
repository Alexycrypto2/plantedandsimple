/** Free-guide popup settings, stored in site_settings under POPUP_SETTING_KEY. Browser-safe. */
export const POPUP_SETTING_KEY = "free_popup";

export type PopupTemplate = "split" | "drawer" | "corner";
export type PopupPages = "all" | "recipes_blog" | "recipes" | "blog";

export type PopupConfig = {
  enabled: boolean;
  template: PopupTemplate;
  pages: PopupPages;
  eyebrow: string;
  headline: string;
  body: string;
  perks: string[];
  button: string;
  note: string;
  delaySeconds: number; // 0 = off
  scrollPercent: number; // 0 = off
  exitIntent: boolean;
  dismissDays: number;
};

export const DEFAULT_POPUP: PopupConfig = {
  enabled: true,
  template: "split",
  pages: "recipes_blog",
  eyebrow: "Free 12-recipe guide",
  headline: "20-minute plant protein, beautifully simple.",
  body: "Fast, high-protein plant-based meals for real weeknights.",
  perks: ["12 recipes, 20g+ protein", "Instant PDF download"],
  button: "Send my free cookbook",
  note: "Instant download · Unsubscribe anytime",
  delaySeconds: 12,
  scrollPercent: 50,
  exitIntent: true,
  dismissDays: 14,
};

const clamp = (n: unknown, lo: number, hi: number, d: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d;
};
const str = (v: unknown, d: string, max = 200) => (typeof v === "string" ? v.slice(0, max) : d);

export function normalizePopup(raw: unknown): PopupConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_POPUP;
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : d.enabled,
    template: (["split", "drawer", "corner"] as const).includes(r.template as PopupTemplate) ? (r.template as PopupTemplate) : d.template,
    pages: (["all", "recipes_blog", "recipes", "blog"] as const).includes(r.pages as PopupPages) ? (r.pages as PopupPages) : d.pages,
    eyebrow: str(r.eyebrow, d.eyebrow, 60),
    headline: str(r.headline, d.headline, 90),
    body: str(r.body, d.body, 220),
    perks: Array.isArray(r.perks) ? r.perks.filter((p): p is string => typeof p === "string" && !!p.trim()).slice(0, 4).map((p) => p.slice(0, 60)) : d.perks,
    button: str(r.button, d.button, 40) || d.button,
    note: str(r.note, d.note, 90),
    delaySeconds: clamp(r.delaySeconds, 0, 120, d.delaySeconds),
    scrollPercent: clamp(r.scrollPercent, 0, 95, d.scrollPercent),
    exitIntent: typeof r.exitIntent === "boolean" ? r.exitIntent : d.exitIntent,
    dismissDays: clamp(r.dismissDays, 1, 90, d.dismissDays),
  };
}

export function popupAllowedOn(pages: PopupPages, path: string) {
  const recipe = path.startsWith("/recipes/");
  const blog = path.startsWith("/blog/");
  if (pages === "recipes") return recipe;
  if (pages === "blog") return blog;
  if (pages === "recipes_blog") return recipe || blog;
  return !path.startsWith("/admin") && !path.startsWith("/prep-app") && !path.startsWith("/free");
}
