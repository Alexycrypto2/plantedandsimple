/** Deterministic pre-publish SEO audit. Pure and browser-safe. */
export type SeoCategory = "snippet" | "keywords" | "content" | "links" | "rich";
export type SeoInput = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  html: string;
  keyword?: string | null;
  /** Up to 3 supporting phrases; each should appear somewhere in the copy. */
  secondary?: string[];
  slug?: string;
  /** Recipes are judged on recipe completeness instead of article length. */
  kind?: "blog" | "recipe";
  /** Extra recipe/blog facts for rich-result checks. */
  extra?: { prepMinutes?: number; cookMinutes?: number; servings?: string; hasImage?: boolean; pinterestDescription?: string; calories?: string; protein?: string };
};
export type SeoCheck = { id: string; label: string; pass: boolean; weight: number; fix: string; category: SeoCategory; manual?: boolean };
/** Checks Auto-fix can rewrite. Everything else needs the editor (facts, photos, links, web address). */
export const AUTO_FIXABLE = new Set(["title_len", "title_front", "meta_len", "title_kw", "meta_kw", "intro_kw", "h2_kw", "density"]);
export type SeoReport = { score: number; checks: SeoCheck[]; words: number; keyword: string; readMinutes: number; categoryScores: Record<SeoCategory, number> };

export const SEO_PASS_SCORE = 85;
export const SEO_CATEGORY_LABELS: Record<SeoCategory, string> = { snippet: "Snippet suggestions", keywords: "Keywords", content: "Content", links: "Links & images", rich: "Editorial nutrition" };

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const STOP = ["the", "and", "for", "with", "how", "your", "best"];

const AMOUNT = /\d|½|¼|¾|⅓|⅔|⅛|\b(one|two|three|four|half|a|an)\b\s+(cup|can|clove|bunch|handful|sprig|pinch|dash|block|lemon|lime)|\b(cups?|tbsp|tsp|tablespoons?|teaspoons?|g|kg|ml|l|oz|lb|lbs|grams?|pounds?|ounces?|cloves?|cans?|bunch|handful|sprigs?|pinch|dash|splash|drizzle|slices?|pieces?|blocks?|heads?|stalks?)\b/i;
const NO_AMOUNT_NEEDED = /to taste|optional|for (garnish|serving|brushing|greasing|frying|drizzling|topping|the pan|dusting)|to serve|as needed|garnish/i;
/** True when an ingredient line names a quantity or is one that customarily has none (garnish, to taste). */
export function hasAmount(line: string): boolean {
  return AMOUNT.test(line) || NO_AMOUNT_NEEDED.test(line);
}

/** Lowercases and turns hyphens/punctuation into single spaces so "high-protein, vegan" matches "high protein vegan". */
export const normKw = (s: string) => ` ${s.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9]+/g, " ").trim()} `;
const has = (hay: string, kw: string) => !!kw.trim() && normKw(hay).includes(normKw(kw));
const countKw = (hay: string, kw: string) => (kw.trim() ? normKw(hay).split(normKw(kw)).length - 1 : 0);

export function guessKeyword(input: SeoInput): string {
  if (input.keyword?.trim()) return input.keyword.trim().toLowerCase();
  const base = (input.title || input.seoTitle).toLowerCase().replace(/[^a-z0-9\s-]/g, "");
  return base.split(/\s+/).filter((w) => w.length > 2 && !STOP.includes(w)).slice(0, 3).join(" ");
}

export function auditSeo(input: SeoInput): SeoReport {
  const text = strip(input.html);
  const lower = text.toLowerCase();
  const words = text ? text.split(" ").length : 0;
  const kw = guessKeyword(input);
  const intro = lower.split(" ").slice(0, 120).join(" ");
  // Recipes: ingredient and step lists aren't stuffed with SEO phrases, so density reads the prose only.
  const densityText = input.kind === "recipe"
    ? strip(input.html.replace(/<h2[^>]*>(Ingredients|Instructions)<\/h2>[\s\S]*?(?=<h2|$)/gi, " "))
    : text;
  const densityWords = densityText ? densityText.split(" ").length : 0;
  const h2s = [...input.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1] ?? "").toLowerCase());
  const imgs = [...input.html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  // List items, headings and paragraphs end a sentence, so bullet lists aren't read as one run-on sentence.
  const sentenceText = strip(input.html.replace(/<\/(li|h[1-6]|p|td|th|div)>/gi, ". "));
  const sentences = sentenceText.split(/[.!?]+\s/).map((s) => s.trim()).filter((s) => s.split(" ").length > 1);
  const sentenceWords = sentences.reduce((n, s) => n + s.split(" ").length, 0);
  const avgSentence = sentences.length ? sentenceWords / sentences.length : 0;
  const kwCount = countKw(densityText, kw);
  const density = densityWords ? (kwCount * kw.split(" ").length * 100) / densityWords : 0;
  const internal = (input.html.match(/href="\/(?!\/)/g) ?? []).length;
  const paragraphs = [...input.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1] ?? "").split(" ").length);
  const longParas = paragraphs.filter((n) => n > 120).length;
  const seoTitle = input.seoTitle.toLowerCase();
  const secondary = (input.secondary ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 3);
  const slug = input.slug ?? "";
  const kwWords = kw.split(" ").filter((w) => w.length > 2);

  const checks: SeoCheck[] = [
    { id: "title_len", category: "snippet", label: "SEO title 30–60 characters", weight: 12, pass: input.seoTitle.length >= 30 && input.seoTitle.length <= 60, fix: "Rewrite the SEO title to 30–60 characters." },
    { id: "title_front", category: "snippet", label: "Keyword in first half of SEO title", weight: 4, pass: (() => { const nt = normKw(seoTitle), i = nt.indexOf(normKw(kw)); return !!kw && i >= 0 && (i <= nt.length / 2 || (nt.startsWith(normKw(input.title)) && has(input.title, kw))); })(), fix: `Move "${kw}" toward the start of the SEO title.` },
    { id: "meta_len", category: "snippet", label: "Meta description 120–155 characters", weight: 10, pass: input.seoDescription.length >= 120 && input.seoDescription.length <= 155, fix: "Write a 120–155 character meta description with a clear benefit." },
    { id: "title_kw", category: "keywords", label: "Keyword in SEO title", weight: 12, pass: has(seoTitle, kw), fix: `Put "${kw}" near the start of the SEO title.` },
    { id: "meta_kw", category: "keywords", label: "Keyword in meta description", weight: 8, pass: has(input.seoDescription, kw), fix: `Mention "${kw}" in the meta description.` },
    { id: "intro_kw", category: "keywords", label: "Keyword in first 120 words", weight: 10, pass: has(intro, kw), fix: `Use "${kw}" naturally in the opening paragraph.` },
    { id: "density", category: "keywords", label: "Keyword density 0.4–2.5%", weight: 6, pass: density >= 0.4 && density <= 2.5, fix: density > 2.5 ? "Keyword is stuffed — use synonyms." : "Use the keyword a few more times naturally." },
    { id: "h2_count", category: "content", label: "At least 4 H2 sections", weight: 10, pass: h2s.length >= 4, fix: "Break the article into 4+ clear H2 sections." },
    { id: "h2_kw", category: "keywords", label: "Keyword in at least one H2", weight: 8, pass: h2s.some((h) => has(h, kw)), fix: `Use "${kw}" in one H2 heading.` },
    { id: "length", category: "content", label: "800+ words", weight: 10, pass: words >= 800, fix: `Thin content: ${Math.max(0, 800 - words)} more words needed. Add real sections like storage, swaps or an FAQ — written by you, not padding.` },
    { id: "readability", category: "content", label: "Average sentence under 22 words", weight: 6, pass: avgSentence > 0 && avgSentence < 22, fix: "Shorten long sentences." },
    { id: "paragraphs", category: "content", label: "No paragraph over 120 words", weight: 3, pass: longParas === 0, fix: `Split ${longParas} long paragraph(s) so they read well on phones.` },
    { id: "alt", category: "links", label: "All images have alt text", weight: 4, pass: imgs.every((i) => /alt="[^"]*\S[^"]*"/.test(i)), fix: (() => { const miss = imgs.map((i, n) => (/alt="[^"]*\S[^"]*"/.test(i) ? 0 : n + 1)).filter(Boolean); return miss.length ? `Photo ${miss.join(", ")} of ${imgs.length} has no description. Describe what is in the photo in Article photos.` : "Add descriptive alt text to every image."; })() },
    { id: "internal", category: "links", label: "2+ internal links", weight: 4, pass: internal >= 2, fix: "Link to 2+ related recipes, posts or products." },
  ];
  if (slug) {
    checks.push({ id: "slug", category: "snippet", label: "Short web address with keyword", weight: 4, pass: slug.length <= 60 && kwWords.every((w) => normKw(slug).includes(` ${w} `) || slug.includes(w)), fix: `Keep the web address under 60 characters and include "${kw}".` });
  }
  for (const s of secondary) {
    checks.push({ id: `sec_${s}`, category: "keywords", label: `Supporting phrase "${s}" used`, weight: 3, pass: has(text, s) || has(input.seoDescription, s), fix: `Mention "${s}" once in the copy or meta description.` });
  }
  if (input.kind === "recipe") {
    const section = (name: string) => {
      const m = input.html.match(new RegExp(`<h2[^>]*>${name}</h2>([\\s\\S]*?)(?=<h2|$)`, "i"));
      return m?.[1] ?? "";
    };
    const count = (h: string) => (h.match(/<li/g) ?? []).length;
    const replace: Record<string, SeoCheck> = {
      h2_count: { id: "ingredients", category: "content", label: "Ingredients listed", weight: 10, pass: count(section("Ingredients")) > 0, fix: "List the actual ingredients; no minimum count is needed." },
      h2_kw: { id: "steps", category: "content", label: "Instructions listed", weight: 8, pass: count(section("Instructions")) > 0, fix: "Describe the real method clearly; no minimum step count is needed." },
      length: { id: "length", category: "content", label: "250+ words", weight: 10, pass: words >= 250, fix: `Thin content: ${Math.max(0, 250 - words)} more words needed. Add a richer description and real tips.` },
      internal: { id: "protein", category: "rich", label: "Protein listed (editorial suggestion)", weight: 4, pass: /protein/i.test(section("Nutrition")), fix: "Add protein per serving only if verified; Google does not require it." },
      paragraphs: { id: "tips", category: "content", label: "3+ cooking tips", weight: 4, pass: count(section("Tips")) >= 3, fix: "Add make-ahead, swap and storage tips." },
    };
    for (let i = 0; i < checks.length; i++) {
      const current = checks[i];
      if (!current) continue;
      const r = replace[current.id];
      if (r) checks[i] = r;
    }
    const ing = [...section("Ingredients").matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1] ?? ""));
    const missing = ing.filter((x) => !hasAmount(x));
    checks.push(
      { id: "qty", category: "content", label: "Every ingredient has an amount", weight: 4, pass: ing.length > 0 && missing.length === 0, fix: missing.length ? `Add an amount to: ${missing.slice(0, 3).join("; ")}${missing.length > 3 ? ` (+${missing.length - 3} more)` : ""}.` : "Give each ingredient an amount (e.g. 1 cup, 200g)." },
    );
  }
  for (const c of checks) c.manual = !AUTO_FIXABLE.has(c.id);
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  const categoryScores = {} as Record<SeoCategory, number>;
  for (const cat of Object.keys(SEO_CATEGORY_LABELS) as SeoCategory[]) {
    const cs = checks.filter((c) => c.category === cat);
    const t = cs.reduce((s, c) => s + c.weight, 0);
    categoryScores[cat] = t ? Math.round((cs.reduce((s, c) => s + (c.pass ? c.weight : 0), 0) / t) * 100) : -1;
  }
  return { score: Math.round((got / total) * 100), checks, words, keyword: kw, readMinutes: Math.max(1, Math.round(words / 220)), categoryScores };
}

/** Turns recipe fields into simple HTML so the same audit can score recipes. */
export function recipeToHtml(r: { description: string; ingredients: string[]; instructions: string[]; nutrition: string[]; tips: string[] }) {
  const li = (a: string[]) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return `<p>${r.description}</p><h2>Ingredients</h2>${li(r.ingredients)}<h2>Instructions</h2>${li(r.instructions)}<h2>Nutrition</h2>${li(r.nutrition)}<h2>Tips</h2>${li(r.tips)}`;
}
