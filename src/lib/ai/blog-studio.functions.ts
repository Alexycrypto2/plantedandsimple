import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { assembleArticleHtml, FRAMING, renderImageSafe, requireBossFactory } from "./studio.server";

const requireBoss = requireBossFactory();

export const TONES = [
  "Professional",
  "Friendly",
  "Editorial",
  "Luxury",
  "Minimal",
  "Educational",
  "Persuasive",
] as const;
export const READING_LEVELS = ["Simple", "Standard", "Advanced"] as const;
export const CONTENT_GOALS = [
  "SEO Ranking",
  "Affiliate",
  "Product Promotion",
  "Education",
  "Pinterest Traffic",
  "Google Discover",
] as const;

export type BlogBrief = {
  topic: string;
  category?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  audience?: string;
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
  imageCount?: number;
  research?: unknown;
};

/* --------------------------------- research -------------------------------- */

const ResearchSchema = z.object({
  search_intent: z.string(),
  audience_summary: z.string(),
  ranking_articles: z.array(z.object({ title: z.string(), angle: z.string(), site_type: z.string() })),
  competitor_headings: z.array(z.string()),
  people_also_ask: z.array(z.string()),
  long_tail_keywords: z.array(z.string()),
  semantic_keywords: z.array(z.string()),
  difficulty: z.number(),
  popularity: z.number(),
  seasonality: z.string(),
  content_gap: z.string(),
  recommended_angle: z.string(),
  suggested_word_count: z.number(),
});
export type Research = z.infer<typeof ResearchSchema>;

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topic: string; primaryKeyword?: string; audience?: string }) => ({
    topic: String(d.topic || "").slice(0, 240),
    primaryKeyword: d.primaryKeyword ? String(d.primaryKeyword).slice(0, 120) : undefined,
    audience: d.audience ? String(d.audience).slice(0, 160) : undefined,
  }))
  .handler(async ({ data, context }): Promise<Research> => {
    await requireBoss(context.supabase, context.userId);
    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ResearchSchema }),
        prompt: `You are an expert SEO content strategist for a premium plant-based food brand (PlantedAndSimple).
Research this topic as if you had just reviewed the current Google top 10.
Topic: "${data.topic}"${data.primaryKeyword ? `\nPrimary keyword: ${data.primaryKeyword}` : ""}${data.audience ? `\nAudience: ${data.audience}` : ""}
Give realistic, specific estimates. difficulty and popularity are 0-100. Return JSON only.`,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      return output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("Research failed — try again.");
      throw err;
    }
  });

/* ------------------------------- generation -------------------------------- */

export const suggestTitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topic: string; keywords?: string }) => ({
    topic: String(d.topic || "").slice(0, 240),
    keywords: d.keywords ? String(d.keywords).slice(0, 240) : undefined,
  }))
  .handler(async ({ data, context }): Promise<string[]> => {
    await requireBoss(context.supabase, context.userId);
    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: z.object({ titles: z.array(z.string()) }) }),
        prompt: `Write 6 click-worthy, SEO-strong blog headlines for a premium plant-based food brand.
Topic: "${data.topic}"${data.keywords ? `\nTarget keywords: ${data.keywords}` : ""}
Each headline under 60 characters, specific, no clickbait, no numbering. Return JSON only.`,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      return output.titles.slice(0, 6);
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("Could not generate titles — try again.");
      throw err;
    }
  });

export const getGenerationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id,payload,title")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const p = row.payload ?? {};
    return {
      title: p.title ?? row.title ?? "",
      slug: p.slug ?? "",
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      category: p.category ?? "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      featured_image_url: p.cover_image_url ?? "",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
    };
  });

const ArticleSchema = z.object({
  slug: z.string(),
  h1: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  excerpt: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  hero_image_prompt: z.string(),
  hero_image_alt: z.string(),
  intro_html: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      html: z.string(),
      callout: z.string().nullable(),
      image_prompt: z.string().nullable(),
      image_alt: z.string().nullable(),
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

export const generateStudioBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: BlogBrief) => ({
    topic: String(d.topic || "").slice(0, 240),
    category: d.category ? String(d.category).slice(0, 80) : undefined,
    primaryKeyword: d.primaryKeyword ? String(d.primaryKeyword).slice(0, 120) : undefined,
    secondaryKeywords: d.secondaryKeywords ? String(d.secondaryKeywords).slice(0, 400) : undefined,
    audience: d.audience ? String(d.audience).slice(0, 200) : undefined,
    tone: String(d.tone || "Editorial").slice(0, 40),
    wordCount: Math.min(Math.max(Number(d.wordCount ?? 1600), 800), 3500),
    readingLevel: String(d.readingLevel || "Standard").slice(0, 30),
    goal: String(d.goal || "SEO Ranking").slice(0, 40),
    includeRecipe: d.includeRecipe ?? true,
    includeFaq: d.includeFaq ?? true,
    includeToc: d.includeToc ?? true,
    includeInternalLinks: d.includeInternalLinks ?? true,
    includeProduct: d.includeProduct ?? true,
    includeCta: d.includeCta ?? true,
    imageCount:
      d.imageCount === undefined || d.imageCount === null
        ? null
        : Math.min(Math.max(Number(d.imageCount), 0), 10),
    research: d.research ?? null,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);

    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("blog");

    const prompt = `Write a production-ready editorial blog article for PlantedAndSimple, a premium plant-based cookbook brand.

${memory}

Topic: "${data.topic}"
${data.category ? `Category: ${data.category}` : ""}
${data.primaryKeyword ? `Primary keyword: ${data.primaryKeyword}` : ""}
${data.secondaryKeywords ? `Secondary keywords: ${data.secondaryKeywords}` : ""}
${data.audience ? `Target audience: ${data.audience}` : ""}
Tone: ${data.tone}. Reading level: ${data.readingLevel}. Goal: ${data.goal}.
Target length: ~${data.wordCount} words across intro + sections + conclusion.
${data.research ? `Research to build on:\n${JSON.stringify(data.research).slice(0, 4000)}` : ""}

Rules:
- Never include an <h1> in HTML; h1 is returned separately as "h1".
- sections: 5-9 items. Each html uses <p>, <h3>, <ul>/<ol>, <strong> only — no <h2> (the heading field is the H2).
- callout: a short highlighted tip, or null.
- image_prompt: decide yourself where a photo genuinely helps the reader (typically the 4-5 most visual/instructional sections); leave the rest null. Each brief must be photorealistic editorial food photography, natural light, cream + forest palette, no text or logos in the image, and must describe the exact dish/step for that section so no two images look alike.
- Write like a senior food editor: specific sensory detail, real technique, numbers and timings, no filler or generic AI phrasing. Every H2 must deliver new information; vary sentence length; use short scannable paragraphs.
- ${data.includeRecipe ? "recipe: full recipe card with realistic nutrition per serving." : "recipe: null."}
- ${data.includeFaq ? "faqs: 5-6 items answering real People Also Ask questions." : "faqs: []."}
- ${data.includeProduct ? "related_product_html: a short HTML block recommending the PlantedAndSimple digital cookbook." : "related_product_html: null."}
- ${data.includeCta ? "cta: one persuasive closing call to action." : "cta: null."}
- ${data.includeInternalLinks ? "internal_link_slugs: 3-5 related blog slugs." : "internal_link_slugs: []."}
- seo_title <= 60 chars, seo_description <= 155 chars, excerpt ~180 chars, tags 5-8 lowercase.
- pinterest_pins: exactly 3 pins, each a DIFFERENT visual style (e.g. Minimal Editorial, Food Magazine, Lifestyle). overlay_text <= 8 words, description <= 480 chars with 4-5 hashtags.
- schema_jsonld: a single valid JSON-LD string combining Article${data.includeRecipe ? " + Recipe" : ""}${data.includeFaq ? " + FAQPage" : ""} via @graph.
- seo_score and quality_score: honest 0-100 self assessment.`;

    let output: z.infer<typeof ArticleSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: ArticleSchema }),
        prompt,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      output = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
    }

    // ---- image plan (hero first, then the most valuable supporting shots) ----
    const folder = `blog/${output.slug}`;
    type Job = { key: string; prompt: string; framing: string; alt: string; sectionIndex?: number };
    const jobs: Job[] = [
      { key: "hero", prompt: output.hero_image_prompt, framing: FRAMING.hero, alt: output.hero_image_alt },
    ];
    output.sections.forEach((s, i) => {
      if (s.image_prompt) {
        jobs.push({
          key: `section-${i}`,
          prompt: s.image_prompt,
          framing: FRAMING.section,
          alt: s.image_alt ?? s.heading,
          sectionIndex: i,
        });
      }
    });
    if (output.recipe) {
      jobs.push({ key: "ingredients", prompt: output.recipe.ingredient_flatlay_prompt, framing: FRAMING.flatlay, alt: `${output.recipe.name} ingredients` });
      jobs.push({ key: "finished", prompt: output.recipe.finished_dish_prompt, framing: FRAMING.finished, alt: output.recipe.name });
    }
    const firstPin = output.pinterest_pins[0];
    if (firstPin) jobs.push({ key: "pinterest", prompt: firstPin.image_prompt, framing: FRAMING.pin, alt: firstPin.alt });

    const images: Record<string, { url: string | null; path: string; alt: string }> = {};
    // When no explicit count is given, the AI's own image plan decides how many photos the article gets.
    const imageBudget = data.imageCount ?? Math.min(jobs.length, 10);
    for (const job of jobs.slice(0, imageBudget)) {
      const r = await renderImageSafe(job.prompt, folder, job.framing);
      if (r) images[job.key] = { url: r.url, path: r.path, alt: job.alt };
    }

    const sections = output.sections.map((s, i) => ({
      heading: s.heading,
      html: s.html,
      callout: s.callout,
      imageUrl: images[`section-${i}`]?.url ?? null,
      imageAlt: s.image_alt ?? s.heading,
    }));

    let recipeHtmlExtra = "";
    if (images["ingredients"]?.url) {
      recipeHtmlExtra += `<figure><img src="${images["ingredients"].url}" alt="${images["ingredients"].alt}" loading="lazy" /><figcaption>Everything you need</figcaption></figure>`;
    }
    if (images["finished"]?.url) {
      recipeHtmlExtra += `<figure><img src="${images["finished"].url}" alt="${images["finished"].alt}" loading="lazy" /><figcaption>The finished dish</figcaption></figure>`;
    }

    const content = assembleArticleHtml({
      intro: output.intro_html + recipeHtmlExtra,
      toc: data.includeToc,
      sections,
      recipe: output.recipe,
      faqs: output.faqs,
      productHtml: output.related_product_html,
      conclusion: output.conclusion_html,
      cta: output.cta,
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
        topic: data.topic,
        preview_url: images["hero"]?.url ?? null,
        payload: {
          slug: output.slug,
          title: output.h1,
          excerpt: output.excerpt,
          content,
          category: data.category ?? output.category,
          tags: output.tags,
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
          brief: data,
        },
        model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
        seo_score: output.seo_score,
        quality_score: output.quality_score,
        created_by: context.userId,
        status: "pending",
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
      seo_score: output.seo_score,
      quality_score: output.quality_score,
      pins,
    };
  });
