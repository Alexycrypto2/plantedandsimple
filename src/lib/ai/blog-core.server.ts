import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { assembleArticleHtml, FRAMING, renderImageSafe } from "./studio.server";
import { scoreArticle, QUALITY_THRESHOLD } from "./quality.server";

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
};

/** How many photos an article of this length actually deserves. */
export function imagePlanFor(words: number) {
  const sections = Math.max(1, Math.min(3, Math.floor(words / 650)));
  return { sections, total: sections + 3 };
}

export function buildArticlePrompt(brief: ArticleBrief, memory: string) {
  const words = brief.wordCount ?? 1600;
  const plan = imagePlanFor(words);
  return `You are a senior food editor at a magazine like Bon Appétit writing for PlantedAndSimple, a premium plant-based cookbook brand. Write a publication-ready editorial article a human editor would sign off without edits.

${memory}

Topic: "${brief.topic}"
${brief.category ? `Category: ${brief.category}` : ""}
${brief.primaryKeyword ? `Primary keyword: ${brief.primaryKeyword} (use it in the H1, the first 100 words, one H2 and the meta — naturally, never stuffed)` : ""}
${brief.secondaryKeywords ? `Secondary keywords: ${brief.secondaryKeywords}` : ""}
${brief.audience ? `Target audience: ${brief.audience}` : ""}
Tone: ${brief.tone ?? "Editorial"}. Reading level: ${brief.readingLevel ?? "Standard"}. Goal: ${brief.goal ?? "SEO Ranking"}.
Target length: ~${words} words across intro + sections + conclusion.
${brief.research ? `Research to build on:\n${JSON.stringify(brief.research).slice(0, 4000)}` : ""}
${brief.rewriteBrief ? `\nTHIS IS A REWRITE. The previous draft failed the editor's quality check. Fix all of this:\n${brief.rewriteBrief}\n` : ""}

STRUCTURE (this is how the page will be laid out, so write to it):
- intro_html: 2-3 short paragraphs. Open with a concrete scene, a number or a real problem. Never open with "In today's world", "Whether you're" or a definition.
- key_takeaways: 3-5 one-line promises of what the reader will be able to do after reading.
- sections: 5-9 items. Each html uses <p>, <h3>, <ul>/<ol>, <strong> only — no <h2> (heading is the H2), no <img>, no inline styles.
- Every paragraph is 2-4 sentences, maximum ~70 words. Break dense advice into <ul> lists. Use <h3> sub-steps inside long sections so the page never becomes a wall of text.
- callout: one short practical tip for roughly a third of the sections, otherwise null.
- pullquote: at most ONE section in the whole article gets a short punchy pullquote; all others null.

IMAGERY (strict — spamming images is a failure):
- visual_value: rate 0-10 how much a photo would genuinely help THAT section. Instructional, ingredient, plating and comparison sections score high; mindset, nutrition science, budgeting and shopping-advice sections score low.
- Give image_prompt to AT MOST ${plan.sections} section${plan.sections === 1 ? "" : "s"} — only the highest visual_value ones. Every other section MUST have image_prompt, image_alt and image_caption set to null.
- Each image_prompt is a full photography direction: the exact dish or ingredients on the page at that point, real colours and textures, the plating, the surface, the props, the camera angle and the light. Two images in one article must never be confusable.
- The photo must show what the surrounding paragraphs are literally describing. Never a generic bowl of food. Never text, labels, packaging, logos, brands or faces.
- image_caption: a short editorial caption (max 12 words) that adds information, not a repeat of the heading.

WRITING STANDARD:
- Specific detail everywhere: grams, temperatures, timings, textures, costs, equipment. Explain the WHY behind each technique.
- At least one honest trade-off or common mistake. Second person, warm and confident, never breathless.
- Banned: "delve", "elevate", "unlock", "game-changer", "in the world of", "look no further", "when it comes to", "nestled", "embark", "tantalising", "burst of flavour", "dive into", "testament to", exclamation marks, and any sentence that would read identically for a different topic.
- Every H2 delivers information no other section covers. No section restates the intro.

${brief.includeRecipe ? "- recipe: full recipe card with exact quantities and realistic per-serving nutrition." : "- recipe: null."}
${brief.includeFaq ? "- faqs: 5-6 real People Also Ask questions with direct 2-4 sentence answers." : "- faqs: []."}
${brief.includeProduct ? "- related_product_html: a short HTML block (one <p> plus a link) recommending the PlantedAndSimple digital cookbook." : "- related_product_html: null."}
${brief.includeCta ? "- cta: one persuasive closing call to action." : "- cta: null."}
${brief.includeInternalLinks ? "- internal_link_slugs: 3-5 related blog slugs." : "- internal_link_slugs: []."}
- seo_title <= 60 chars, seo_description <= 155 chars, excerpt ~180 chars, tags 5-8 lowercase.
- pinterest_pins: exactly 3 pins, each a different visual style. overlay_text <= 8 words, description <= 480 chars with 4-5 hashtags.
- schema_jsonld: one valid JSON-LD string combining Article${brief.includeRecipe ? " + Recipe" : ""}${brief.includeFaq ? " + FAQPage" : ""} via @graph.
- seo_score and quality_score: honest 0-100 self assessment.`;
}

export async function writeArticle(brief: ArticleBrief): Promise<Article> {
  const model = await textModel("blog-core");
  const { getMemoryContext } = await import("@/lib/learning/engine.server");
  const memory = await getMemoryContext("blog");
  try {
    const res = await generateText({
      model,
      output: Output.object({ schema: ArticleSchema }),
      prompt: buildArticlePrompt(brief, memory),
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    return res.output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
    throw err;
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
  const folder = `blog/${output.slug}`;
  const words = brief.wordCount ?? 1600;
  const plan = imagePlanFor(words);

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

  const sections = output.sections.map((s, i) => ({
    heading: s.heading,
    html: s.html,
    callout: s.callout,
    pullquote: s.pullquote,
    imageUrl: images[`section-${i}`]?.url ?? null,
    imageAlt: s.image_alt ?? s.heading,
    imageCaption: s.image_caption,
  }));

  const content = assembleArticleHtml({
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
    productHtml: output.related_product_html,
    conclusion: output.conclusion_html,
    cta: output.cta,
  });

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
        category: brief.category ?? output.category,
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
      status: quality.passed ? "pending" : "needs_review",
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
  };
}
