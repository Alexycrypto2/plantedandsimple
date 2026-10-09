/** Deterministic pre-publish SEO audit. Pure and browser-safe. */
export type SeoInput = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  html: string;
  keyword?: string | null;
  slug?: string;
  /** Recipes are judged on recipe completeness instead of article length. */
  kind?: "blog" | "recipe";
};
export type SeoCheck = { id: string; label: string; pass: boolean; weight: number; fix: string };
export type SeoReport = { score: number; checks: SeoCheck[]; words: number; keyword: string };

export const SEO_PASS_SCORE = 85;

const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function guessKeyword(input: SeoInput): string {
  if (input.keyword?.trim()) return input.keyword.trim().toLowerCase();
  const base = (input.seoTitle || input.title).toLowerCase().replace(/[^a-z0-9\s-]/g, "");
  return base.split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "for", "with", "how", "your", "best"].includes(w)).slice(0, 3).join(" ");
}

export function auditSeo(input: SeoInput): SeoReport {
  const text = strip(input.html);
  const lower = text.toLowerCase();
  const words = text ? text.split(" ").length : 0;
  const kw = guessKeyword(input);
  const intro = lower.split(" ").slice(0, 120).join(" ");
  const h2s = [...input.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1] ?? "").toLowerCase());
  const imgs = [...input.html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length ? words / sentences.length : 0;
  const kwCount = kw ? lower.split(kw).length - 1 : 0;
  const density = words ? (kwCount * kw.split(" ").length * 100) / words : 0;
  const internal = (input.html.match(/href="\/(?!\/)/g) ?? []).length;

  const checks: SeoCheck[] = [
    { id: "title_len", label: "SEO title 30–60 characters", weight: 12, pass: input.seoTitle.length >= 30 && input.seoTitle.length <= 60, fix: "Rewrite the SEO title to 30–60 characters." },
    { id: "title_kw", label: "Keyword in SEO title", weight: 12, pass: !!kw && input.seoTitle.toLowerCase().includes(kw), fix: `Put "${kw}" near the start of the SEO title.` },
    { id: "meta_len", label: "Meta description 120–155 characters", weight: 10, pass: input.seoDescription.length >= 120 && input.seoDescription.length <= 155, fix: "Write a 120–155 character meta description with a clear benefit." },
    { id: "meta_kw", label: "Keyword in meta description", weight: 8, pass: !!kw && input.seoDescription.toLowerCase().includes(kw), fix: `Mention "${kw}" in the meta description.` },
    { id: "intro_kw", label: "Keyword in first 120 words", weight: 10, pass: !!kw && intro.includes(kw), fix: `Use "${kw}" naturally in the opening paragraph.` },
    { id: "h2_count", label: "At least 4 H2 sections", weight: 10, pass: h2s.length >= 4, fix: "Break the article into 4+ clear H2 sections." },
    { id: "h2_kw", label: "Keyword in at least one H2", weight: 8, pass: !!kw && h2s.some((h) => h.includes(kw)), fix: `Use "${kw}" in one H2 heading.` },
    { id: "length", label: "800+ words", weight: 10, pass: words >= 800, fix: "Expand with practical detail to 800+ words." },
    { id: "density", label: "Keyword density 0.4–2.5%", weight: 6, pass: density >= 0.4 && density <= 2.5, fix: density > 2.5 ? "Keyword is stuffed — use synonyms." : "Use the keyword a few more times naturally." },
    { id: "readability", label: "Average sentence under 22 words", weight: 6, pass: avgSentence > 0 && avgSentence < 22, fix: "Shorten long sentences." },
    { id: "alt", label: "All images have alt text", weight: 4, pass: imgs.every((i) => /alt="[^"]+"/.test(i)), fix: "Add descriptive alt text to every image." },
    { id: "internal", label: "2+ internal links", weight: 4, pass: internal >= 2, fix: "Link to 2+ related recipes, posts or products." },
  ];
  if (input.kind === "recipe") {
    const section = (name: string) => {
      const m = input.html.match(new RegExp(`<h2[^>]*>${name}</h2>([\\s\\S]*?)(?=<h2|$)`, "i"));
      return m?.[1] ?? "";
    };
    const count = (h: string) => (h.match(/<li/g) ?? []).length;
    const replace: Record<string, SeoCheck> = {
      h2_count: { id: "ingredients", label: "6+ ingredients with quantities", weight: 10, pass: count(section("Ingredients")) >= 6, fix: "List every ingredient with an exact quantity." },
      h2_kw: { id: "steps", label: "5+ clear steps", weight: 8, pass: count(section("Instructions")) >= 5, fix: "Break the method into 5+ steps with times and cues." },
      length: { id: "length", label: "250+ words", weight: 10, pass: words >= 250, fix: "Add a richer description and helpful tips." },
      internal: { id: "protein", label: "Protein listed in nutrition", weight: 4, pass: /protein/i.test(section("Nutrition")), fix: "Add protein per serving to the nutrition list." },
    };
    for (let i = 0; i < checks.length; i++) {
      const r = replace[checks[i]!.id];
      if (r) checks[i] = r;
    }
    const tipsCheck: SeoCheck = { id: "tips", label: "3+ cooking tips", weight: 4, pass: count(section("Tips")) >= 3, fix: "Add make-ahead, swap and storage tips." };
    checks.push(tipsCheck);
  }
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks, words, keyword: kw };
}

/** Turns recipe fields into simple HTML so the same audit can score recipes. */
export function recipeToHtml(r: { description: string; ingredients: string[]; instructions: string[]; nutrition: string[]; tips: string[] }) {
  const li = (a: string[]) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return `<p>${r.description}</p><h2>Ingredients</h2>${li(r.ingredients)}<h2>Instructions</h2>${li(r.instructions)}<h2>Nutrition</h2>${li(r.nutrition)}<h2>Tips</h2>${li(r.tips)}`;
}
