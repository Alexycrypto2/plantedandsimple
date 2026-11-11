import { generateText, NoObjectGeneratedError, Output } from "ai";
import { anchorSeoTitle, looksLikeTitle } from "@/lib/content/title-lock";
import { z } from "zod";
import { textModel, describeAiError, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { assembleArticleHtml, FRAMING, renderImageSafe } from "./studio.server";
import { scoreArticle, QUALITY_THRESHOLD } from "./quality.server";
import { normalizeCategory, sanitizeBlogHtml } from "@/lib/content/content-sanitize";
import { offerCardHtml, pickOffer } from "@/lib/content/product-bridge";
import { BLOG_FORMATS, BANNED_PHRASES, detectBlogFormat, sanitizeBanned, titleItemCount, type BlogFormat, type BlogFormatId } from "./blog-formats";

export const ArticleSchema = z.object({
  slug: z.string(),
  h1: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  excerpt: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  key_takeaways: z.array(z.string()),
  hero_image_prompt: z.string(),
  hero_image_alt: z.string(),
  intro_html: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      html: z.string(),
      callout: z.string().nullable(),
      pullquote: z.string().nullable(),
      visual_value: z.number(),
      image_prompt: z.string().nullable(),
      image_alt: z.string().nullable(),
      image_caption: z.string().nullable(),
      recipe_slug: z.string().nullable(),
    }),
  ),
  new_recipes: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      subtitle: z.string(),
      description: z.string(),
      prep_minutes: z.number(),
      cook_minutes: z.number(),
      servings: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.object({ title: z.string(), body: z.string() })),
      tips: z.array(z.string()),
      nutrition: z.object({ calories: z.number(), protein_g: z.number(), carbs_g: z.number(), fat_g: z.number(), fiber_g: z.number(), sugar_g: z.number(), sodium_mg: z.number() }).nullable().optional(),
      photo_prompt: z.string().nullable().optional(),
    }),
  ),
  recipe: z
    .object({
      name: z.string(),
      prep_time: z.string(),
      cook_time: z.string(),
      servings: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
      nutrition: z.array(z.object({ label: z.string(), value: z.string() })),
      tips: z.array(z.string()),
      ingredient_flatlay_prompt: z.string(),
      finished_dish_prompt: z.string(),
    })
    .nullable(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  conclusion_html: z.string(),
  cta: z.string().nullable(),
  internal_link_slugs: z.array(z.string()),
  related_product_html: z.string().nullable(),
  og_title: z.string(),
  og_description: z.string(),
  twitter_description: z.string(),
  pinterest_pins: z.array(
    z.object({
      style: z.string(),
      title: z.string(),
      overlay_text: z.string(),
      description: z.string(),
      alt: z.string(),
      image_prompt: z.string(),
    }),
  ),
  schema_jsonld: z.string(),
  seo_score: z.number(),
  quality_score: z.number(),
});
export type Article = z.infer<typeof ArticleSchema>;

export type ArticleBrief = {
  topic: string;
  category?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string | null;
  audience?: string | null;
  tone?: string;
  wordCount?: number;
  readingLevel?: string;
  goal?: string;
  includeRecipe?: boolean;
  includeFaq?: boolean;
  includeToc?: boolean;
  includeInternalLinks?: boolean;
  includeProduct?: boolean;
  includeCta?: boolean;
  imageCount?: number | null;
  research?: unknown;
  rewriteBrief?: string | null;
  format?: BlogFormatId | null;
  /** Live published recipes the article must feature and link before inventing dishes. */
  catalog?: Array<{ slug: string; title: string }>;
};

export function formatFor(brief: Pick<ArticleBrief, "format" | "topic">): BlogFormat {
  return BLOG_FORMATS[brief.format && BLOG_FORMATS[brief.format] ? brief.format : detectBlogFormat(brief.topic)];
}

/** How many section photos an article deserves: its format's standard, scaled down for short posts. */
export function imagePlanFor(words: number, format?: BlogFormat) {
  const base = format?.sectionPhotos ?? 3;
  const sections = Math.max(1, Math.min(base, Math.round((base * words) / 1600)));
  return { sections, total: sections + 3 };
}

function catalogRules(catalog?: Array<{ slug: string; title: string }>) {
  const list = (catalog ?? []).slice(0, 150).map((r) => `- ${r.slug} | ${r.title}`).join("\n");
  return `SITE RECIPES (these are the only recipes that exist on PlantedAndSimple):
${list || "(none)"}
RECIPE GROUNDING (strict):
- Whenever a section features a dish, first use a recipe from SITE RECIPES that is the same dish or a close fit. Describe THAT recipe accurately (its real main ingredients from its title) and set the section's recipe_slug to its slug exactly. Never describe a different version of a site recipe.
- Only when no site recipe fits, invent a new dish: set recipe_slug to null AND add a complete recipe for it to new_recipes (lowercase hyphen slug, metric + US amounts for every ingredient, 3-8 steps with exact times and temperatures in both °C and °F, realistic prep/cook minutes including any cooling or chilling, 2-3 tips, per-serving nutrition estimated from the ingredient amounts, and a photo_prompt describing the finished dish exactly as plated). Those are saved as drafts for the editor to review.
- Sections that are not about one dish (planning, timeline, storage) use recipe_slug null and add nothing to new_recipes.
- Never use full-domain links. Internal links are root-relative, e.g. /recipes/slug or /free.`;
}

export function buildArticlePrompt(brief: ArticleBrief, memory: string) {
  const words = brief.wordCount ?? 1600;
  const format = formatFor(brief);
  const plan = imagePlanFor(words, format);
  return `You are a senior food editor at a magazine like Bon Appétit writing for PlantedAndSimple, a premium plant-based cookbook brand. Write a publication-ready editorial article a human editor would sign off without edits.

${memory}

${looksLikeTitle(brief.topic) ? `Article title (author-mandated): "${brief.topic}". Use this EXACT text word-for-word as "h1". Never rename or reword it; seo_title must contain it.` : `Topic: "${brief.topic}"`}
${brief.category ? `Category: ${brief.category}` : ""}
${brief.primaryKeyword ? `Primary keyword: ${brief.primaryKeyword} (use it in the H1, the first 100 words, one H2 and the meta — naturally, never stuffed)` : ""}
${brief.secondaryKeywords ? `Secondary keywords: ${brief.secondaryKeywords}` : ""}
${brief.audience ? `Target audience: ${brief.audience}` : ""}
Tone: ${brief.tone ?? "Editorial"}. Reading level: ${brief.readingLevel ?? "Standard"}. Goal: ${brief.goal ?? "SEO Ranking"}.
Target length: ~${words} words across intro + sections + conclusion.
${brief.research ? `Research to build on:\n${JSON.stringify(brief.research).slice(0, 4000)}` : ""}
${brief.rewriteBrief ? `\nTHIS IS A REWRITE. The previous draft failed the editor's quality check. Fix all of this:\n${brief.rewriteBrief}\n` : ""}

${catalogRules(brief.catalog)}

ARTICLE FORMAT: ${format.label}. Follow this standard section order (map each numbered part to one or more sections):
${format.structure}
Photos for this format should show: ${format.photos}.

STRUCTURE (this is how the page will be laid out, so write to it):
- intro_html: 2-3 short paragraphs. Open with a concrete scene, a number or a real problem. Never open with "In today's world", "Whether you're" or a definition.
- key_takeaways: 3-5 one-line promises of what the reader will be able to do after reading.
- sections: ${titleItemCount(brief.topic) ? `EXACTLY ${titleItemCount(brief.topic)} dish/idea sections — the title promises ${titleItemCount(brief.topic)}, so one section per item, each a distinct dish named in its heading, plus at most 1 short planning section at the end. Never merge two items into one heading.` : "5-9 items."} Each html uses <p>, <h3>, <ul>/<ol>, <strong> only — no <h2> (heading is the H2), no <img>, no inline styles.
- Every paragraph is 2-4 sentences, maximum ~70 words. Break dense advice into <ul> lists. Use <h3> sub-steps inside long sections so the page never becomes a wall of text.
- callout: one short practical tip for roughly a third of the sections, otherwise null.
- pullquote: at most ONE section in the whole article gets a short punchy pullquote; all others null.

IMAGERY (strict — spamming images is a failure):
- visual_value: rate 0-10 how much a photo would genuinely help THAT section. Instructional, ingredient, plating and comparison sections score high; mindset, nutrition science, budgeting and shopping-advice sections score low.
- Give image_prompt to AT MOST ${plan.sections} section${plan.sections === 1 ? "" : "s"} — only the highest visual_value ones. Every other section MUST have image_prompt, image_alt and image_caption set to null.
- Each image_prompt is a full photography direction: the exact dish or ingredients on the page at that point, real colours and textures, the plating, the surface, the props, the camera angle and the light. Two images in one article must never be confusable.
- The photo must show what the surrounding paragraphs are literally describing. Never a generic bowl of food. Never text, labels, packaging, logos, brands or faces.
- image_caption: a short editorial caption (max 12 words) that adds information, not a repeat of the heading.

VOICE — "no-BS home cook" (this is what makes people actually read):
- Write like an experienced home cook talking to a friend in their kitchen: warm, practical, opinionated. Share real kitchen realities ("press the tofu or it turns into a soggy sponge", "the sauce tastes better on day two").
- Sensory, mouthwatering specifics: crisp edges, toasted sesame aroma, creamy garlic drizzle — tied to technique, never decoration.
- Practical extras readers love: pantry swaps, make-ahead and storage notes, how to hit the protein number.
- Recipe posts: make the recipe easy to find quickly (say early that the full recipe card is below).

WRITING STANDARD:
- Specific detail everywhere: grams, temperatures, timings, textures, costs, equipment. Explain the WHY behind each technique.
- At least one honest trade-off or common mistake. Second person, warm and confident, never breathless.
- Banned words and phrases (never use them, in any form): ${BANNED_PHRASES.map((p) => `"${p}"`).join(", ")}. Also banned: exclamation marks, em-dash chains, rhetorical questions as openers, "Let's", lists of three adjectives, and any sentence that would read identically for a different topic.
- Vary sentence length. Mix short punchy lines with longer explanations. Use American English (flavor, fiber, color).
- Never invent personal stories, testers, studies, statistics, awards or reader quotes.
- Every H2 delivers information no other section covers. No section restates the intro.

${brief.includeRecipe ? "- recipe: full recipe card with exact quantities and per-serving nutrition CALCULATED from the ingredient grams (e.g. firm tofu 15 g protein/100 g, cooked lentils 9 g, cooked chickpeas 9 g, tempeh 19 g, olive oil 100 g fat/100 g), totals divided by servings. Never inflate protein; calories must equal protein×4 + carbs×4 + fat×9 within 10%." : "- recipe: null."}
${brief.includeFaq ? "- faqs: 5-6 real People Also Ask questions with direct 2-4 sentence answers." : "- faqs: []."}
${brief.includeProduct ? "- related_product_html: a short HTML block (one <p> plus a link) recommending the PlantedAndSimple digital cookbook." : "- related_product_html: null."}
${brief.includeCta ? "- cta: one persuasive closing call to action." : "- cta: null."}
${brief.includeInternalLinks ? "- internal_link_slugs: 3-5 related blog slugs." : "- internal_link_slugs: []."}
- seo_title <= 60 chars, seo_description <= 155 chars, excerpt ~180 chars, tags 5-8 lowercase.
- pinterest_pins: exactly 3 pins, each a different visual style. overlay_text <= 8 words, description <= 480 chars with 4-5 hashtags.
- schema_jsonld: one valid JSON-LD string combining Article${brief.includeRecipe ? " + Recipe" : ""}${brief.includeFaq ? " + FAQPage" : ""} via @graph.
- seo_score and quality_score: honest 0-100 self assessment.`;
}

export async function loadRecipeCatalog(): Promise<Array<{ slug: string; title: string }>> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any).from("recipes").select("slug, title").eq("status", "published").limit(300);
    return (data ?? []).map((r: any) => ({ slug: r.slug, title: String(r.title ?? "").trim() }));
  } catch {
    return [];
  }
}

/** Per-serving nutrition rows for AI-drafted recipes, always labelled as estimates. */
export function draftNutritionRows(n: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; sugar_g: number; sodium_mg: number }) {
  const r = (x: number) => Math.round(x);
  return [["Calories", `${r(n.calories)} kcal`], ["Protein", `${r(n.protein_g)} g`], ["Carbs", `${r(n.carbs_g)} g`], ["Fat", `${r(n.fat_g)} g`], ["Fiber", `${r(n.fiber_g)} g`], ["Sugar", `${r(n.sugar_g)} g`], ["Sodium", `${r(n.sodium_mg)} mg`]]
    .map(([label, value]) => ({ label, value: `${value} (estimated)` }));
}

/** Save the writer's invented dishes as draft recipes (never published, never overwriting an existing slug). */
async function saveDraftRecipes(list: Article["new_recipes"], userId: string, tags: string[]) {
  const saved: Array<{ slug: string; title: string; id: string }> = [];
  if (!list?.length) return saved;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { inferHolidayTaxonomy } = await import("@/lib/content/content-sanitize");
  for (const r of list.slice(0, 8)) {
    const slug = r.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || !r.ingredients.length || !r.steps.length) continue;
    const { data: exists } = await (supabaseAdmin as any).from("recipes").select("id").eq("slug", slug).maybeSingle();
    if (exists) continue;
    const n = r.nutrition ?? null;
    let heroId: string | null = null;
    const photo = await renderImageSafe(`${r.name}. ${r.photo_prompt || r.description}`, `recipes/${slug}`, FRAMING.finished);
    if (photo?.url) {
      const { data: m } = await (supabaseAdmin as any).from("media").insert({ public_url: photo.url, storage_path: photo.path, alt: r.name, alt_text: r.name, title: `${r.name} — hero`, tags: ["ai", "recipe", slug] }).select("id").single();
      heroId = m?.id ?? null;
    }
    const tax = inferHolidayTaxonomy({ title: r.name, description: r.description, tags: tags.filter((t) => t !== "homepage").slice(0, 6), occasions: [] });
    const { data: row } = await (supabaseAdmin as any).from("recipes").insert({
      slug, title: r.name, subtitle: r.subtitle, description: r.description,
      prep_minutes: Math.round(r.prep_minutes) || null, cook_minutes: Math.round(r.cook_minutes) || null,
      servings: r.servings, difficulty: "Easy", status: "draft",
      ingredients: [{ group: "Ingredients", items: r.ingredients }], instructions: r.steps, tips: r.tips,
      nutrition: n ? draftNutritionRows(n) : [], calories: n ? Math.round(n.calories) : null,
      protein_grams: n?.protein_g ?? null, carbs_grams: n?.carbs_g ?? null, fat_grams: n?.fat_g ?? null, fiber_grams: n?.fiber_g ?? null,
      hero_image_id: heroId, gallery_ids: [], equipment: [], tags: tax.tags, occasions: tax.occasions, author_id: userId,
    }).select("id").single();
    if (row) saved.push({ slug, title: r.name, id: row.id });
  }
  return saved;
}

export async function writeArticle(brief: ArticleBrief): Promise<Article> {
  const model = await textModel("blog-core");
  const { getMemoryContext } = await import("@/lib/learning/engine.server");
  const memory = await getMemoryContext("blog");
  if (!brief.catalog) brief = { ...brief, catalog: await loadRecipeCatalog() };
  try {
    const res = await generateText({
      model,
      output: Output.object({ schema: ArticleSchema }),
      prompt: buildArticlePrompt(brief, memory),
    });
    return res.output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
    throw describeAiError(err);
  }
}

/** Renders the article's photos, assembles HTML, scores it and stores the draft. */
export async function buildAndStoreArticle(opts: {
  brief: ArticleBrief;
  article: Article;
  userId: string;
  extra?: Record<string, unknown>;
}) {
  const { article: output, brief } = opts;
  if (looksLikeTitle(brief.topic)) output.h1 = brief.topic.trim();
  {
    const clean = (o: any): any => typeof o === "string" ? sanitizeBanned(o) : Array.isArray(o) ? o.map(clean) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === "h1" || k === "slug" || k.endsWith("_url") ? v : clean(v)])) : o;
    Object.assign(output, clean(output));
  }
  output.seo_title = anchorSeoTitle(output.h1, output.seo_title);
  const folder = `blog/${output.slug}`;
  const words = brief.wordCount ?? 1600;
  const plan = imagePlanFor(words, formatFor(brief));

  const images: Record<string, { url: string | null; path: string; alt: string }> = {};
  const render = async (key: string, prompt: string, framing: string, alt: string) => {
    const r = await renderImageSafe(prompt, folder, framing);
    if (r) images[key] = { url: r.url, path: r.path, alt };
  };

  await render("hero", output.hero_image_prompt, FRAMING.hero, output.hero_image_alt);

  // Only the highest-value sections get a photo, and never more than the plan allows.
  const allowed = brief.imageCount === null || brief.imageCount === undefined
    ? plan.sections
    : Math.max(0, Math.min(brief.imageCount, plan.sections));
  const candidates = output.sections
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.image_prompt && (s.visual_value ?? 0) >= 6)
    .sort((a, b) => (b.s.visual_value ?? 0) - (a.s.visual_value ?? 0))
    .slice(0, allowed);
  for (const { s, i } of candidates) {
    await render(`section-${i}`, s.image_prompt!, FRAMING.section, s.image_alt ?? s.heading);
  }

  if (output.recipe) {
    await render("finished", output.recipe.finished_dish_prompt, FRAMING.finished, output.recipe.name);
    await render("ingredients", output.recipe.ingredient_flatlay_prompt, FRAMING.flatlay, `${output.recipe.name} ingredients`);
  }
  const firstPin = output.pinterest_pins[0];
  if (firstPin) await render("pinterest", firstPin.image_prompt, FRAMING.pin, firstPin.alt);

  // Every dish section that maps to a live recipe links to it; invented dishes become draft recipes.
  const live = new Map((brief.catalog ?? (await loadRecipeCatalog())).map((r) => [r.slug, r.title]));
  const draftRecipes = await saveDraftRecipes(output.new_recipes ?? [], opts.userId, output.tags);
  const sections = output.sections.map((s, i) => ({
    heading: s.heading,
    html: s.recipe_slug && live.has(s.recipe_slug) && !s.html.includes(`/recipes/${s.recipe_slug}`)
      ? `${s.html}<p><a href="/recipes/${s.recipe_slug}">Get the full ${live.get(s.recipe_slug)} recipe →</a></p>`
      : s.html,
    callout: s.callout,
    pullquote: s.pullquote,
    imageUrl: images[`section-${i}`]?.url ?? null,
    imageAlt: s.image_alt ?? s.heading,
    imageCaption: s.image_caption,
  }));

  const content = sanitizeBlogHtml(assembleArticleHtml({
    intro: output.intro_html,
    takeaways: output.key_takeaways,
    toc: brief.includeToc ?? true,
    sections,
    recipe: output.recipe
      ? {
          ...output.recipe,
          heroImageUrl: images["finished"]?.url ?? null,
          ingredientsImageUrl: images["ingredients"]?.url ?? null,
        }
      : null,
    faqs: output.faqs,
    productHtml: brief.includeProduct === false
      ? output.related_product_html
      : offerCardHtml(pickOffer(`${brief.topic} ${output.h1} ${output.tags.join(" ")}`), "blog"),
    conclusion: output.conclusion_html,
    cta: output.cta,
  }));

  const quality = await scoreArticle({
    title: output.h1,
    html: content,
    seoTitle: output.seo_title,
    seoDescription: output.seo_description,
    primaryKeyword: brief.primaryKeyword ?? null,
  });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const pins = output.pinterest_pins.map((p, i) => ({
    ...p,
    image_url: i === 0 ? (images["pinterest"]?.url ?? null) : null,
  }));

  const { data: row, error } = await (supabaseAdmin as any)
    .from("ai_generations")
    .insert({
      kind: "blog",
      title: output.h1,
      topic: brief.topic,
      preview_url: images["hero"]?.url ?? null,
      payload: {
        slug: output.slug,
        title: output.h1,
        excerpt: output.excerpt,
        content,
        category: normalizeCategory(brief.category ?? output.category),
        tags: output.tags,
        key_takeaways: output.key_takeaways,
        seo_title: output.seo_title,
        seo_description: output.seo_description,
        og_title: output.og_title,
        og_description: output.og_description,
        twitter_description: output.twitter_description,
        cover_image_url: images["hero"]?.url ?? null,
        cover_image_alt: output.hero_image_alt,
        images,
        outline: output.sections.map((s) => s.heading),
        faqs: output.faqs,
        recipe: output.recipe,
        internal_link_slugs: output.internal_link_slugs,
        draft_recipes: draftRecipes,
        schema_jsonld: output.schema_jsonld,
        pinterest_pins: pins,
        quality,
        brief,
        ...(opts.extra ?? {}),
      },
      model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
      seo_score: quality.seo,
      quality_score: quality.overall,
      created_by: opts.userId,
      status: "pending",
      notes: quality.passed ? null : `Quality gate: ${quality.overall}/100 — ${quality.verdict}`.slice(0, 500),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return {
    ok: true,
    id: row.id as string,
    title: output.h1,
    slug: output.slug,
    hero_url: images["hero"]?.url ?? null,
    images_generated: Object.keys(images).length,
    quality,
    blocked: !quality.passed,
    threshold: QUALITY_THRESHOLD,
    pins,
    draft_recipes: draftRecipes,
  };
}
