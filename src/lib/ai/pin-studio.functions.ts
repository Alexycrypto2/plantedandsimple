import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { FRAMING, PIN_STYLES, renderImage, renderImageSafe, requireBossFactory } from "./studio.server";

const requireBoss = requireBossFactory();

export { PIN_STYLES };

const PinSchema = z.object({
  pins: z.array(
    z.object({
      style: z.string(),
      title: z.string(),
      overlay_text: z.string(),
      description: z.string(),
      alt: z.string(),
      hashtags: z.array(z.string()),
      image_prompt: z.string(),
      primary_keyword: z.string(),
      board_suggestion: z.string(),
    }),
  ),
});

/** Shared brief so every pin is search-optimised and on-brand. */
export const PIN_BRIEF = `You are the Pinterest growth lead for PlantedAndSimple, a premium plant-based cookbook brand (forest green, sage, cream, editorial food photography).
Write pins the way top food creators do:
- title: 40-100 chars, front-load the primary keyword, no clickbait, no ALL CAPS, no emoji spam (max 1 emoji).
- overlay_text: max 6 punchy words, the single promise a scroller reads in 0.4s.
- description: 180-480 chars of natural Pinterest SEO — primary keyword in the first sentence, 2-3 related search terms, one clear reason to click through to the recipe, ends with a soft CTA.
- hashtags: 4-5 lowercase, specific (#highproteinvegan not #food).
- primary_keyword: the exact search phrase this pin targets.
- board_suggestion: the board this belongs on (e.g. "Vegan Dinners").
- image_prompt: a photorealistic vertical food photography brief for THIS exact dish — describe the dish, styling, props, surface and light, plus deliberate clean negative space in the top third for a text overlay. Never describe any text, words, logos or graphics inside the frame.
Each pin must use a genuinely different visual style AND a different hook angle (curiosity, benefit, how-to, list, transformation).`;

export const generatePinSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subject: string; styles?: string[]; count?: number; link?: string; withImages?: boolean }) => ({
    subject: String(d.subject || "").slice(0, 400),
    styles: (d.styles ?? []).slice(0, 4).map((s) => String(s).slice(0, 40)),
    count: Math.min(Math.max(Number(d.count ?? 3), 1), 5),
    link: d.link ? String(d.link).slice(0, 300) : undefined,
    withImages: d.withImages ?? true,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const model = await textModel("pin-studio");

    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("pinterest");

    let output: z.infer<typeof PinSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: PinSchema }),
      prompt: `${memory}

${PIN_BRIEF}

Create ${data.count} pins.
Subject: "${data.subject}"
${data.styles.length ? `Use these visual styles, one per pin: ${data.styles.join(", ")}.` : `Use ${data.count} clearly different visual styles from: ${PIN_STYLES.join(", ")}.`}
Return JSON only.`,
      });
      output = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: any[] = [];
    for (const pin of output.pins) {
      const img = data.withImages ? await renderImageSafe(pin.image_prompt, "pinterest", FRAMING.pin) : null;
      const { data: row, error } = await (supabaseAdmin as any)
        .from("ai_generations")
        .insert({
          kind: "pinterest_pin",
          title: pin.title,
          topic: data.subject,
          preview_url: img?.url ?? null,
          payload: { ...pin, link: data.link ?? null, storage_path: img?.path ?? null, image_url: img?.url ?? null },
          model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
          created_by: context.userId,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      results.push({ id: row.id, ...pin, image_url: img?.url ?? null });
    }
    return { ok: true, pins: results };
  });

/** Generates the 3 pins that were planned alongside a blog article. */
export const generatePinsForBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { generationId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gen, error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id, title, payload")
      .eq("id", data.generationId)
      .single();
    if (error || !gen) throw new Error("Generation not found");
    const pins: any[] = gen.payload?.pinterest_pins ?? [];
    if (!pins.length) throw new Error("This article has no planned pins");

    const out: any[] = [];
    for (const pin of pins) {
      const img = pin.image_url ? null : await renderImageSafe(pin.image_prompt, "pinterest", FRAMING.pin);
      const url = pin.image_url ?? img?.url ?? null;
      const { data: row, error: e2 } = await (supabaseAdmin as any)
        .from("ai_generations")
        .insert({
          kind: "pinterest_pin",
          title: pin.title,
          topic: gen.title,
          preview_url: url,
          payload: { ...pin, image_url: url, storage_path: img?.path ?? null, blog_slug: gen.payload?.slug ?? null },
          model: DEFAULT_IMAGE_MODEL,
          created_by: context.userId,
          status: "pending",
        })
        .select("id")
        .single();
      if (e2) throw new Error(e2.message);
      out.push({ id: row.id, ...pin, image_url: url });
    }
    return { ok: true, pins: out };
  });

export const scheduleGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; scheduledFor: string | null }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .update({ scheduled_for: data.scheduledFor ? new Date(data.scheduledFor).toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateGenerationPayload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("payload")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Not found");
    const merged = { ...(row.payload ?? {}), ...data.patch };
    const { error: e2 } = await (supabaseAdmin as any)
      .from("ai_generations")
      .update({ payload: merged, title: (data.patch as any).title ?? undefined })
      .eq("id", data.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

/* ------------------------- one-click preview pack -------------------------- */

const PreviewSchema = z.object({
  pins: z.array(
    z.object({
      style: z.string(),
      title: z.string(),
      overlay_text: z.string(),
      description: z.string(),
      alt: z.string(),
      hashtags: z.array(z.string()),
      image_prompt: z.string(),
      why_it_works: z.string(),
      primary_keyword: z.string(),
      board_suggestion: z.string(),
    }),
  ),
});

/**
 * Renders 5 pin variants for review WITHOUT writing them to the library.
 * Nothing is stored until the editor calls savePinPreviews.
 */
export const generatePinPreviewPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subject: string; link?: string; generationId?: string }) => ({
    subject: String(d.subject || "").slice(0, 400),
    link: d.link ? String(d.link).slice(0, 300) : undefined,
    generationId: d.generationId ? String(d.generationId) : undefined,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const model = await textModel("pin-studio");
    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("pinterest");

    let output: z.infer<typeof PreviewSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: PreviewSchema }),
      prompt: `${memory}

${PIN_BRIEF}

Create exactly 5 pin variants, each a different visual style from: ${PIN_STYLES.join(", ")}.
Subject: "${data.subject}"
Also add why_it_works: one sentence on the psychology of that hook. Return JSON only.`,
      });
      output = res.output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }

    const pins = [];
    for (const pin of output.pins.slice(0, 5)) {
      const img = await renderImageSafe(pin.image_prompt, "pinterest/previews", FRAMING.pin);
      pins.push({ ...pin, image_url: img?.url ?? null, storage_path: img?.path ?? null });
    }
    return { ok: true, subject: data.subject, link: data.link ?? null, generationId: data.generationId ?? null, pins };
  });

/** Commits the previews the editor picked into the approval queue. */
export const savePinPreviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subject: string; link?: string | null; pins: any[] }) => ({
    subject: String(d.subject || "").slice(0, 400),
    link: d.link ? String(d.link).slice(0, 300) : null,
    pins: (d.pins ?? []).slice(0, 5),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const saved: any[] = [];
    for (const pin of data.pins) {
      const { data: row, error } = await (supabaseAdmin as any)
        .from("ai_generations")
        .insert({
          kind: "pinterest_pin",
          title: pin.title,
          topic: data.subject,
          preview_url: pin.image_url ?? null,
          payload: { ...pin, link: data.link },
          model: `${DEFAULT_CHAT_MODEL} + ${DEFAULT_IMAGE_MODEL}`,
          created_by: context.userId,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      saved.push({ id: row.id, ...pin });
    }
    return { ok: true, saved: saved.length, pins: saved };
  });

/* ------------------------- content-source aware pins ----------------------- */

export type PinSourceType = "recipe" | "blog" | "product" | "custom";
export type PinLayout = "top-banner" | "center-card" | "middle-band" | "bottom-card" | "minimal-label" | "split-collage";

export type PinSource = {
  type: PinSourceType;
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  image_url: string | null;
  url: string;
};

const SITE = "https://www.primedownloads.store";

/** Everything the studio can turn into pins, grouped by content type. */
export const listPinSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ recipe: PinSource[]; blog: PinSource[]; product: PinSource[] }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const [recipes, blogs, products] = await Promise.all([
      db.from("recipes").select("id, slug, title, description").order("created_at", { ascending: false }).limit(60),
      db.from("blog_posts").select("id, slug, title, excerpt, featured_image_url").order("created_at", { ascending: false }).limit(60),
      db.from("products").select("id, slug, title, subtitle, cover_image_url").order("created_at", { ascending: false }).limit(60),
    ]);
    const map = (rows: any[], type: PinSourceType, base: string, sum: string, img: string): PinSource[] =>
      (rows ?? []).map((r) => ({
        type,
        id: r.id,
        title: r.title,
        slug: r.slug,
        summary: r[sum] ?? null,
        image_url: r[img] ?? null,
        url: `${SITE}/${base}/${r.slug}`,
      }));
    return {
      recipe: map(recipes.data, "recipe", "recipes", "description", "__none"),
      blog: map(blogs.data, "blog", "blog", "excerpt", "featured_image_url"),
      product: map(products.data, "product", "shop", "subtitle", "cover_image_url"),
    };
  });

/** Per-type direction so the AI picks the layout that actually fits the content. */
const SOURCE_PLAYBOOK: Record<PinSourceType, string> = {
  recipe:
    "This is a RECIPE pin. Lead with the finished dish and the eating benefit (protein, 30 minutes, one pan). Best layouts: Food Magazine, Recipe Card, Organic Food, Minimal Editorial. Overlay text should read like a dish name plus one proof point. Never invent ingredients that are not in the recipe.",
  blog:
    "This is an ARTICLE pin. Lead with the reader problem the article solves and promise the takeaway, not a dish. Best layouts: Minimal Editorial, Clean White, Bold Colors, Luxury. Overlay text should be a curiosity or list hook (e.g. '7 swaps that actually fill you up'). Imagery should be atmospheric and editorial rather than a single plated recipe.",
  product:
    "This is a PRODUCT pin for a paid digital cookbook. Lead with the transformation and what is inside, and keep it aspirational, never spammy or discount-shouty. Best layouts: Luxury, Minimal Editorial, Clean White. Imagery should feel like a premium cookbook shoot — styled table scenes, layered dishes, calm luxury. Never show text, book covers, mockups or devices in the image.",
  custom: "This is a free-form subject. Choose the layouts that suit it best.",
};

/**
 * Premium generator: pulls the real content, picks fitting layouts, and renders
 * a preview pack that is only saved when the editor approves it.
 */
export const generatePinsFromSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { type: PinSourceType; id?: string; subject?: string; count?: number; angle?: string; layouts?: PinLayout[] }) => ({
    type: (["recipe", "blog", "product", "custom"].includes(d.type) ? d.type : "custom") as PinSourceType,
    id: d.id ? String(d.id) : undefined,
    subject: String(d.subject ?? "").slice(0, 400),
    count: Math.min(Math.max(Number(d.count ?? 5), 1), 5),
    angle: d.angle ? String(d.angle).slice(0, 200) : undefined,
    layouts: (d.layouts ?? []).filter((layout): layout is PinLayout => ["top-banner", "center-card", "middle-band", "bottom-card", "minimal-label", "split-collage"].includes(layout)).slice(0, 5),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    let brief = data.subject;
    let link: string | null = null;
    let sourceTitle = data.subject;

    if (data.type !== "custom" && data.id) {
      if (data.type === "recipe") {
        const { data: r } = await db
          .from("recipes")
          .select("title, slug, subtitle, description, ingredients, instructions, prep_minutes, cook_minutes, servings, tags")
          .eq("id", data.id)
          .maybeSingle();
        if (!r) throw new Error("Recipe not found");
        sourceTitle = r.title;
        link = `${SITE}/recipes/${r.slug}`;
        brief = [
          `Recipe: ${r.title}`,
          r.description ? `About: ${r.description}` : "",
          (r.prep_minutes || r.cook_minutes) ? `Total time: ${(r.prep_minutes ?? 0) + (r.cook_minutes ?? 0)} minutes` : "",
          r.servings ? `Serves: ${r.servings}` : "",
          Array.isArray(r.tags) && r.tags.length ? `Tags: ${r.tags.join(", ")}` : "",
          `Key ingredients: ${JSON.stringify(r.ingredients ?? []).slice(0, 900)}`,
        ]
          .filter(Boolean)
          .join("\n");
      } else if (data.type === "blog") {
        const { data: b } = await db
          .from("blog_posts")
          .select("title, slug, excerpt, seo_description, content, tags")
          .eq("id", data.id)
          .maybeSingle();
        if (!b) throw new Error("Article not found");
        sourceTitle = b.title;
        link = `${SITE}/blog/${b.slug}`;
        brief = [
          `Article: ${b.title}`,
          b.excerpt ? `Excerpt: ${b.excerpt}` : "",
          b.seo_description ? `Meta: ${b.seo_description}` : "",
          Array.isArray(b.tags) && b.tags.length ? `Tags: ${b.tags.join(", ")}` : "",
          `Opening: ${String(b.content ?? "").replace(/<[^>]+>/g, " ").slice(0, 900)}`,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        const { data: p } = await db
          .from("products")
          .select("title, slug, subtitle, description, price_cents, compare_at_cents, benefits, features")
          .eq("id", data.id)
          .maybeSingle();
        if (!p) throw new Error("Product not found");
        sourceTitle = p.title;
        link = `${SITE}/shop/${p.slug}`;
        brief = [
          `Product: ${p.title}`,
          p.subtitle ? `Subtitle: ${p.subtitle}` : "",
          p.description ? `Description: ${String(p.description).replace(/<[^>]+>/g, " ").slice(0, 800)}` : "",
          p.benefits ? `Benefits: ${JSON.stringify(p.benefits).slice(0, 400)}` : "",
          p.features ? `Includes: ${JSON.stringify(p.features).slice(0, 400)}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    if (!brief.trim()) throw new Error("Pick a piece of content or type a subject first.");

    const model = await textModel("pin-studio-source");
    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("pinterest");

    let output: z.infer<typeof PreviewSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: PreviewSchema }),
        prompt: `${memory}

${PIN_BRIEF}

${SOURCE_PLAYBOOK[data.type]}
${data.angle ? `Editor's angle for this batch: ${data.angle}` : ""}

Use ONLY the facts below — never invent claims, numbers, ingredients or timings.
---
${brief}
---

Create exactly ${data.count} pin variants. Use these selected overlay layouts: ${data.layouts.length ? data.layouts.join(", ") : "top-banner, center-card, middle-band, bottom-card, minimal-label"}. Put the exact layout id in style. Make every hook distinct. Add why_it_works: one sentence on why that layout and hook convert for this content. Return JSON only.`,
      });
      output = res.output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }

    const pins = [];
    for (const pin of output.pins.slice(0, data.count)) {
      const img = await renderImageSafe(pin.image_prompt, "pinterest/previews", FRAMING.pin, {
        feature: "pin-studio-source",
        requestedBy: context.userId,
      });
      if (!img) {
        pins.push({ ...pin, image_url: null, storage_path: null });
        continue;
      }
      pins.push({ ...pin, image_url: img.url, storage_path: img.path });
    }

    return {
      ok: true,
      subject: sourceTitle,
      source: { type: data.type, id: data.id ?? null, title: sourceTitle },
      link,
      pins,
    };
  });
