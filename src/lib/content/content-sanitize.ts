/** Shared, pure guards that stop the recurring blog/recipe data mistakes. */

const SITE = /^(?:https?:\/\/)?(?:www\.)?plantedandsimple\.(?:com|store)(?=\/|$)/i;

/** Rewrite own-domain links (incl. protocol-less "plantedandsimple.com/free") to clean root-relative paths. */
export function fixSiteLinks(html: string): string {
  return (html ?? "").replace(/href=(["'])(.*?)\1/gi, (all, q: string, url: string) => {
    if (!SITE.test(url)) return all;
    const path = url.replace(SITE, "") || "/";
    return `href=${q}${path}${q}`;
  });
}

/** Remove FAQ accordions whose question has no answer. */
export function dropEmptyDetails(html: string): string {
  return (html ?? "").replace(/<details\b[^>]*>\s*<summary\b[^>]*>[\s\S]*?<\/summary>\s*<\/details>/gi, "");
}

const CATEGORY_FIXES: Record<string, string> = { sessional: "Seasonal", seasonal: "Seasonal", seasonals: "Seasonal" };

/** Trim, fix known typos and title-case a blog category. */
export function normalizeCategory(cat: string | null | undefined): string | null {
  const c = (cat ?? "").replace(/\s+/g, " ").trim();
  if (!c) return null;
  const fixed = CATEGORY_FIXES[c.toLowerCase()];
  return fixed ?? c.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function sanitizeBlogHtml(html: string): string {
  return dropEmptyDetails(fixSiteLinks(html));
}

const HOLIDAYS: Array<[string, RegExp]> = [
  ["thanksgiving", /\bthanksgiving\b/i],
  ["christmas", /\b(christmas|xmas)\b/i],
  ["easter", /\beaster\b/i],
];

/** Add holiday occasions/tags when the recipe's title, subtitle, description or tags name the holiday. */
export function inferHolidayTaxonomy(r: { title?: string | null; subtitle?: string | null; description?: string | null; tags?: string[] | null; occasions?: string[] | null }) {
  const hay = [r.title, r.subtitle, r.description, ...(r.tags ?? [])].join(" ");
  const tags = [...(r.tags ?? [])];
  const occasions = [...(r.occasions ?? [])];
  for (const [name, re] of HOLIDAYS) {
    if (!re.test(hay)) continue;
    if (!tags.some((t) => t.toLowerCase() === name)) tags.push(name);
    if (!occasions.some((o) => o.toLowerCase() === name)) occasions.push(name);
  }
  return { tags, occasions };
}
