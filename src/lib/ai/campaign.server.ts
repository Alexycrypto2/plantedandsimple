import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { FRAMING, PIN_STYLES, renderImageSafe } from "./studio.server";

export type CampaignStep = { key: string; label: string };
export const CAMPAIGN_STEPS: CampaignStep[] = [
  { key: "recipe", label: "Reading the recipe" },
  { key: "blog", label: "Writing the editorial article" },
  { key: "pins", label: "Designing the Pinterest set" },
  { key: "email", label: "Drafting the email" },
  { key: "promo", label: "Writing the product promo" },
  { key: "graph", label: "Linking everything in the library" },
];

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const CopySchema = z.object({
  campaign_name: z.string(),
  angle: z.string(),
  email: z.object({
    subject: z.string(),
    preview_text: z.string(),
    body_html: z.string(),
    cta_label: z.string(),
  }),
  promo: z.object({
    headline: z.string(),
    body_html: z.string(),
    cta_label: z.string(),
  }),
  pins: z.array(
    z.object({
      style: z.string(),
      title: z.string(),
      overlay_text: z.string(),
      description: z.string(),
      alt: z.string(),
      hashtags: z.array(z.string()),
      image_prompt: z.string(),
    }),
  ),
});

/** One recipe in → blog + pins + email + product promo out, all linked. */
export async function runCampaign(opts: {
  recipeId: string;
  userId: string;
  productSlug?: string | null;
}) {
  const supa = await db();
  const { data: recipe, error } = await supa.from("recipes").select("*").eq("id", opts.recipeId).maybeSingle();
  if (error || !recipe) throw new Error("Recipe not found");

  const summary = {
    title: recipe.title,
    subtitle: recipe.subtitle,
    description: recipe.description,
    tags: recipe.tags,
    prep_minutes: recipe.prep_minutes,
    cook_minutes: recipe.cook_minutes,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    tips: recipe.tips,
  };

  /* ---------------------------------- blog --------------------------------- */
  const { writeArticle, buildAndStoreArticle } = await import("./blog-core.server");
  const brief = {
    topic: recipe.title as string,
    category: (recipe.tags?.[0] as string) ?? null,
    primaryKeyword: (recipe.seo_title as string) || (recipe.title as string),
    audience: "Home cooks who want dependable plant-based meals",
    tone: "Editorial",
    wordCount: 1700,
    readingLevel: "Standard",
    goal: "SEO Ranking",
    includeRecipe: true,
    includeFaq: true,
    includeToc: true,
    includeInternalLinks: true,
    includeProduct: true,
    includeCta: true,
    imageCount: null,
    research: summary,
  };
  const article = await writeArticle(brief);
  const blog = await buildAndStoreArticle({
    brief,
    article,
    userId: opts.userId,
    extra: { source_recipe_id: recipe.id, campaign: true },
  });

  /* ------------------------------- campaign copy ---------------------------- */
  const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);
  const { getMemoryContext } = await import("@/lib/learning/engine.server");
  const memory = await getMemoryContext("general");

  let copy: z.infer<typeof CopySchema>;
  try {
    const res = await generateText({
      model,
      output: Output.object({ schema: CopySchema }),
      prompt: `${memory}

You are the campaign lead for PlantedAndSimple, a premium plant-based cookbook brand. Build one connected campaign around this recipe.

Recipe: ${JSON.stringify(summary).slice(0, 3500)}
Companion article: "${article.h1}" — ${article.excerpt}

Produce:
- campaign_name: short internal name.
- angle: the single promise the whole campaign makes.
- email: subject <= 55 chars with no emoji spam, preview_text <= 90 chars, body_html using only <p>, <h2>, <ul>, <li>, <strong> and one <a> for the CTA — warm, specific, 150-220 words, opening with a concrete kitchen moment, linking to the article, cta_label <= 4 words.
- promo: a product promo block for the PlantedAndSimple digital cookbook that grows naturally out of this recipe. body_html is 2 short <p> paragraphs. No hype, no exclamation marks.
- pins: exactly 5 Pinterest pins, each a different style from ${PIN_STYLES.join(", ")} and a different hook. overlay_text <= 8 words, description <= 480 chars with 4-5 hashtags, image_prompt is a vertical photorealistic food photography brief with clean space in the top third and never any text in the frame.
Banned words: delve, elevate, unlock, game-changer, dive into, look no further. Return JSON only.`,
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    copy = res.output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) throw new Error("Campaign copy failed — try again.");
    throw err;
  }

  /* ---------------------------------- pins ---------------------------------- */
  const pinRows: any[] = [];
  for (const pin of copy.pins.slice(0, 5)) {
    const img = await renderImageSafe(pin.image_prompt, `pinterest/${recipe.slug}`, FRAMING.pin);
    const { data: row } = await supa
      .from("ai_generations")
      .insert({
        kind: "pinterest_pin",
        title: pin.title,
        topic: recipe.title,
        preview_url: img?.url ?? null,
        payload: {
          ...pin,
          image_url: img?.url ?? null,
          storage_path: img?.path ?? null,
          blog_slug: article.slug,
          source_recipe_id: recipe.id,
        },
        model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
        created_by: opts.userId,
        status: "pending",
      })
      .select("id")
      .single();
    pinRows.push({ id: row?.id, ...pin, image_url: img?.url ?? null });
  }

  /* ---------------------------------- email --------------------------------- */
  const { data: emailRow } = await supa
    .from("email_campaigns")
    .insert({
      kind: "broadcast",
      name: copy.campaign_name,
      subject: copy.email.subject,
      template: copy.email.body_html,
      segment: "subscribers",
      status: "draft",
      stats: {
        preview_text: copy.email.preview_text,
        cta_label: copy.email.cta_label,
        source_recipe_id: recipe.id,
        blog_slug: article.slug,
      },
    })
    .select("id")
    .single();

  /* --------------------------------- promo ---------------------------------- */
  const { data: promoRow } = await supa
    .from("ai_generations")
    .insert({
      kind: "product_promo",
      title: copy.promo.headline,
      topic: recipe.title,
      preview_url: blog.hero_url,
      payload: { ...copy.promo, source_recipe_id: recipe.id, blog_slug: article.slug, product_slug: opts.productSlug ?? null },
      model: DEFAULT_CHAT_MODEL,
      created_by: opts.userId,
      status: "pending",
    })
    .select("id")
    .single();

  /* ---------------------------------- graph --------------------------------- */
  const relations = [
    { to_type: "generation", to_id: blog.id, relation: "campaign_blog" },
    ...pinRows.filter((p) => p.id).map((p) => ({ to_type: "generation", to_id: p.id, relation: "campaign_pin" })),
    ...(emailRow?.id ? [{ to_type: "email_campaign", to_id: emailRow.id, relation: "campaign_email" }] : []),
    ...(promoRow?.id ? [{ to_type: "generation", to_id: promoRow.id, relation: "campaign_promo" }] : []),
  ].map((r, i) => ({ from_type: "recipe", from_id: recipe.id, sort_order: i, ...r }));

  if (relations.length) {
    await supa
      .from("content_relations")
      .upsert(relations, { onConflict: "from_type,from_id,to_type,to_id,relation", ignoreDuplicates: true });
  }

  const { data: campaignRow } = await supa
    .from("ai_generations")
    .insert({
      kind: "campaign",
      title: copy.campaign_name,
      topic: recipe.title,
      preview_url: blog.hero_url,
      payload: {
        angle: copy.angle,
        recipe: { id: recipe.id, slug: recipe.slug, title: recipe.title },
        blog: { id: blog.id, slug: blog.slug, title: blog.title, quality: blog.quality },
        pins: pinRows.map((p) => ({ id: p.id, title: p.title, style: p.style, image_url: p.image_url })),
        email: emailRow?.id ? { id: emailRow.id, subject: copy.email.subject } : null,
        promo: promoRow?.id ? { id: promoRow.id, headline: copy.promo.headline } : null,
      },
      model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
      quality_score: blog.quality.overall,
      seo_score: blog.quality.seo,
      created_by: opts.userId,
      status: "pending",
    })
    .select("id")
    .single();

  const { syncContentGraph } = await import("@/lib/library/graph.server");
  const graph = await syncContentGraph("recipe", recipe.id);

  await supa.from("learning_signals").insert({
    source: "platform:campaign",
    entity_type: "recipe",
    entity_id: recipe.id,
    entity_ref: recipe.slug,
    metric: "campaign_generated",
    value: 1,
    dimensions: { assets: 3 + pinRows.length, quality: blog.quality.overall },
    occurred_at: new Date().toISOString(),
  });

  return {
    ok: true,
    campaign_id: campaignRow?.id ?? null,
    name: copy.campaign_name,
    angle: copy.angle,
    recipe: { id: recipe.id, title: recipe.title, slug: recipe.slug },
    blog,
    pins: pinRows,
    email: emailRow?.id ? { id: emailRow.id, ...copy.email } : null,
    promo: promoRow?.id ? { id: promoRow.id, ...copy.promo } : null,
    graph,
    assets: 2 + pinRows.length + (emailRow ? 1 : 0) + (promoRow ? 1 : 0),
  };
}
