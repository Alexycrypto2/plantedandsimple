// Pure, browser-safe internal-linking logic: tag inference + relatedness scoring.
// Used by public pages (server-rendered) and the admin review panel.

export type PageType = "recipe" | "blog";

export type Taxonomy = {
  category: string | null;
  occasions: string[];
  main_ingredients: string[];
  diet_tags: string[];
};

export type LinkPage = Taxonomy & {
  type: PageType;
  id: string;
  slug: string;
  title: string;
  image: string | null;
  prep_minutes: number | null;
  difficulty: string | null;
  published_at: string | null;
  roundup_tag?: string | null;
};

export type RawPage = {
  type: PageType;
  title: string;
  tags?: string[] | null;
  category?: string | null;
  excerpt?: string | null;
  description?: string | null;
};

const CATEGORY_RULES: Array<[string, RegExp]> = [
  ["Breakfast", /\b(breakfast|overnight oats|oats|scramble|pancakes?|granola|smoothie)\b/],
  ["Dessert", /\b(dessert|cookies?|cake|pie|brownies?|pudding)\b/],
  ["Snack", /\b(snacks?|bites|energy balls?|roasted pumpkin seeds)\b/],
  ["Side dish", /\b(side dish(es)?|sides|casserole|stuffing|mashed|gravy)\b/],
  ["Soup & stew", /\b(soup|stew|chili|dahl|dal)\b/],
  ["Lunch", /\b(lunch|wraps?|sandwich|salad|power bowl|grain bowl)\b/],
  ["Dinner", /\b(dinners?|loaf|pasta|noodles|tacos|curry|centerpiece|entree)\b/],
  ["Meal prep guide", /\b(meal prep|meal plan|batch cooking)\b/],
];

export const OCCASION_RULES: Array<[string, RegExp]> = [
  ["Thanksgiving", /\bthanksgiving\b/],
  ["Christmas", /\b(christmas|xmas)\b/],
  ["Fall", /\b(fall|autumn|pumpkin|squash)\b/],
  ["Winter", /\b(winter)\b/],
  ["Summer", /\b(summer|bbq|barbecue)\b/],
  ["Meal prep", /\b(meal[- ]?prep|mealprep|batch cooking|meal plan)\b/],
  ["Date night", /\b(date night|romantic)\b/],
  ["Weeknight", /\b(weeknight|20[- ]minute|25[- ]minute|quick)\b/],
];

export const INGREDIENT_RULES: Array<[string, RegExp]> = [
  ["Pumpkin", /\bpumpkin\b/],
  ["Sweet potato", /\bsweet potato(es)?\b/],
  ["Lentil", /\blentils?\b/],
  ["Tofu", /\btofu\b/],
  ["Chickpea", /\bchickpeas?\b/],
  ["Tempeh", /\btempeh\b/],
  ["Black bean", /\bblack beans?\b/],
  ["White bean", /\bwhite beans?\b/],
  ["Peanut", /\bpeanuts?\b/],
  ["Oats", /\boats\b/],
  ["Squash", /\bsquash\b/],
  ["Mushroom", /\bmushrooms?\b/],
  ["Quinoa", /\bquinoa\b/],
];

const DIET_RULES: Array<[string, RegExp]> = [
  ["High-protein", /\b(high[- ]?protein|highprotein|protein)\b/],
  ["Gluten-free", /\bgluten[- ]free\b/],
  ["High-fiber", /\bhigh[- ](fiber|fibre)\b/],
  ["Dairy-free", /\bdairy[- ]free\b/],
];

const norm = (s: string) => s.trim().toLowerCase();

/** Suggest tags from a page's title, tags, category and summary. */
export function inferTaxonomy(p: RawPage): Taxonomy {
  const text = [p.title, ...(p.tags ?? []), p.category ?? "", p.excerpt ?? "", p.description ?? ""].join(" | ").toLowerCase();
  const titleAndTags = [p.title, ...(p.tags ?? [])].join(" | ").toLowerCase().replace(/-/g, " ");
  const titleLc = p.title.toLowerCase();
  let category = CATEGORY_RULES.find(([, re]) => re.test(titleLc))?.[0]
    ?? CATEGORY_RULES.find(([, re]) => re.test(titleAndTags))?.[0]
    ?? null;
  if (!category) category = p.type === "recipe" ? "Dinner" : "Guide";
  const occasions = OCCASION_RULES.filter(([, re]) => re.test(titleAndTags)).map(([n]) => n);
  const main_ingredients = INGREDIENT_RULES.filter(([, re]) => re.test(titleAndTags)).map(([n]) => n);
  const diet_tags = ["Vegan", ...DIET_RULES.filter(([, re]) => re.test(text)).map(([n]) => n)];
  return { category, occasions, main_ingredients, diet_tags };
}

/** Stored fields win; any empty field falls back to the inferred suggestion, so new pages link automatically. */
export function effectiveTaxonomy(stored: Partial<Taxonomy>, raw: RawPage): Taxonomy {
  const inf = inferTaxonomy(raw);
  return {
    category: stored.category?.trim() || inf.category,
    occasions: stored.occasions?.length ? stored.occasions : inf.occasions,
    main_ingredients: stored.main_ingredients?.length ? stored.main_ingredients : inf.main_ingredients,
    diet_tags: stored.diet_tags?.length ? stored.diet_tags : inf.diet_tags,
  };
}

const overlap = (a: string[], b: string[]) => {
  const s = new Set(a.map(norm));
  return b.some((x) => s.has(norm(x)));
};

const TITLE_KEYWORDS = INGREDIENT_RULES.map(([, re]) => re);
function titleKeywordShared(a: string, b: string) {
  const al = a.toLowerCase(), bl = b.toLowerCase();
  return TITLE_KEYWORDS.some((re) => re.test(al) && re.test(bl));
}

export const DAY = 86_400_000;

export function scorePage(current: LinkPage, other: LinkPage, now: number): number {
  let s = 0;
  if (current.category && other.category && norm(current.category) === norm(other.category)) s += 3;
  if (overlap(current.occasions, other.occasions)) s += 3;
  if (overlap(current.main_ingredients, other.main_ingredients) || titleKeywordShared(current.title, other.title)) s += 2;
  if (overlap(current.diet_tags, other.diet_tags)) s += 1;
  if (other.published_at && now - new Date(other.published_at).getTime() <= 30 * DAY) s += 1;
  return s;
}

/** Score threshold for a "good" match; weaker spots are filled with the newest pages. */
export const GOOD_MATCH = 3;

const newest = (a: LinkPage, b: LinkPage) =>
  (b.published_at ?? "").localeCompare(a.published_at ?? "") || a.slug.localeCompare(b.slug);

export const pageHref = (p: { type: PageType; slug: string }) => `/${p.type === "recipe" ? "recipes" : "blog"}/${p.slug}`;

function pick(current: LinkPage, pool: LinkPage[], n: number, now: number, exclude: Set<string>) {
  const candidates = pool.filter((p) => !exclude.has(pageHref(p)) && pageHref(p) !== pageHref(current));
  const scored = candidates
    .map((page) => ({ page, score: scorePage(current, page, now) }))
    .sort((a, b) => b.score - a.score || newest(a.page, b.page));
  const good = scored.filter((x) => x.score >= GOOD_MATCH).slice(0, n);
  const used = new Set(good.map((x) => pageHref(x.page)));
  const fill = [...candidates].sort(newest).filter((p) => !used.has(pageHref(p))).slice(0, n - good.length)
    .map((page) => ({ page, score: scorePage(current, page, now) }));
  return [...good, ...fill];
}

export type Related = {
  recipes: Array<{ page: LinkPage; score: number }>;
  blogs: Array<{ page: LinkPage; score: number }>;
};

export function chooseRelated(current: LinkPage, recipes: LinkPage[], blogs: LinkPage[], now: number): Related {
  const cards = pick(current, recipes, 4, now, new Set());
  const taken = new Set(cards.map((c) => pageHref(c.page)));
  const reads = pick(current, blogs, 2, now, taken);
  return { recipes: cards, blogs: reads };
}

export const hubAnchor = (hub: string) => `hub-${hub.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export function hasTag(p: LinkPage, tag: string) {
  const t = norm(tag);
  return [p.category ?? "", ...p.occasions, ...p.main_ingredients, ...p.diet_tags].some((x) => norm(x) === t);
}

/** All published pages tagged with a hub occasion, newest first. */
export function hubItems(hub: string, pages: LinkPage[]) {
  return pages.filter((p) => p.occasions.some((o) => norm(o) === norm(hub))).sort(newest);
}

/** The roundup/menu blog for a hub, when one exists. */
export function hubMenuBlog(hub: string, blogs: LinkPage[], excludeSlug?: string) {
  const h = norm(hub);
  return blogs.filter((b) => b.slug !== excludeSlug).sort(newest).find((b) =>
    (b.roundup_tag && norm(b.roundup_tag) === h) ||
    (b.occasions.some((o) => norm(o) === h) && /\b(menu|roundup|recipes|ideas|side dishes)\b/i.test(b.title)),
  ) ?? null;
}

export function roundupRecipes(tag: string, recipes: LinkPage[]) {
  return recipes.filter((r) => hasTag(r, tag)).sort(newest);
}
