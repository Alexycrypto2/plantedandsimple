import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from "./gateway.server";
import { FRAMING, PIN_STYLES, renderImageSafe, requireBossFactory } from "./studio.server";

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
    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);

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
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      output = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
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
    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);
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
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      output = res.output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
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
