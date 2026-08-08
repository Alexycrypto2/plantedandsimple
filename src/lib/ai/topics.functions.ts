import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "./gateway.server";

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!((data ?? []).some((r: any) => r.role === "boss"))) throw new Error("Forbidden");
}

const TopicsSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    primary_keyword: z.string(),
    secondary_keywords: z.array(z.string()),
    intent: z.enum(["informational", "commercial", "transactional", "navigational"]),
    search_volume_bucket: z.enum(["low", "medium", "high"]),
    competition_bucket: z.enum(["low", "medium", "high"]),
    seasonality: z.string(),
    trend_score: z.number(),
    conversion_score: z.number(),
    recommended_format: z.enum(["blog", "recipe", "listicle", "guide"]),
    pinterest_potential: z.number(),
  })),
});

export const suggestTopics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { seed?: string; count?: number }) => ({
    seed: (d.seed ?? "plant-based recipes, high-protein vegan, meal prep").slice(0, 300),
    count: Math.min(Math.max(Number(d.count ?? 8), 3), 20),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const model = await textModel("topics");
    
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: TopicsSchema }),
        prompt: `Suggest ${data.count} trending blog/recipe topics for PlantedAndSimple — a plant-based cookbook brand.
Seed themes: ${data.seed}.
Score each on trend_score, conversion_score, pinterest_potential (0-100). Prefer evergreen high-intent searches.
Return JSON only.`,
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const bucket = (b: string) => (b === "high" ? 90 : b === "medium" ? 55 : 20);
      const rows = output.topics.map((t) => ({
        topic: t.title,
        category: t.recommended_format,
        search_volume: bucket(t.search_volume_bucket),
        competition: t.competition_bucket,
        trend_score: t.trend_score,
        pinterest_score: t.pinterest_potential,
        seasonal_score: null,
        ai_score: Math.round((t.trend_score + t.conversion_score + t.pinterest_potential) / 3),
        recommendation: t.angle,
        notes: `Keyword: ${t.primary_keyword}. Also: ${t.secondary_keywords.join(", ")}. Intent: ${t.intent}. Seasonality: ${t.seasonality}.`,
      }));
      const { error } = await (supabaseAdmin as any).from("ai_topics").insert(rows);
      if (error) throw new Error(error.message);
      return { ok: true, count: rows.length };
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }
  });

export const listTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("ai_topics")
      .select("*").order("discovered_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("ai_topics").delete().eq("id", data.id);
    return { ok: true };
  });

/* ------------------------------- trend radar ------------------------------ */

const TrendsSchema = z.object({
  trends: z.array(
    z.object({
      topic: z.string(),
      why_trending: z.string(),
      sources: z.array(z.string()),
      momentum: z.enum(["exploding", "rising", "steady", "seasonal"]),
      rating: z.number(),
      google_score: z.number(),
      pinterest_score: z.number(),
      competition: z.enum(["low", "medium", "high"]),
      primary_keyword: z.string(),
      secondary_keywords: z.array(z.string()),
      best_format: z.enum(["blog", "recipe", "listicle", "guide"]),
      angle: z.string(),
      seasonality: z.string(),
    }),
  ),
});

export const scanTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { niche?: string; count?: number }) => ({
    niche: (d?.niche ?? "plant-based recipes, high-protein vegan, meal prep, digital cookbooks").slice(0, 300),
    count: Math.min(Math.max(Number(d?.count ?? 10), 4), 20),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { collectTrendSignals } = await import("./trends.server");
    const signals = await collectTrendSignals(context.userId);
    const signalText = signals
      .map((s) => `${s.source}:\n- ${s.items.join("\n- ")}`)
      .join("\n\n")
      .slice(0, 8000);

    const model = await textModel("topics");
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: TrendsSchema }),
        prompt: `You are the trend analyst for PlantedAndSimple, a premium plant-based cookbook and food-content brand.
Niche: ${data.niche}.

Live signals collected right now (may be partial — ignore anything off-niche):
${signalText || "(no live feeds reachable — rely on your knowledge of current food-search behaviour and seasonality)"}

Today's date: ${new Date().toISOString().slice(0, 10)}.

Return the ${data.count} strongest trending content opportunities for this brand.
Rules:
- Only food/nutrition/meal-planning topics this brand can credibly own.
- why_trending: 1-2 concrete sentences explaining the driver (season, viral format, news, search shift) — no vague filler.
- sources: name the signals you inferred it from, e.g. "Google Trends", "Pinterest", "Reddit r/veganrecipes", "Seasonality".
- rating, google_score, pinterest_score: 0-100 honest estimates. rating reflects overall opportunity for us (demand x fit x conversion).
- Order by rating, highest first. No duplicates.`,
      });

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const rows = output.trends.map((t) => ({
        topic: t.topic,
        category: t.best_format,
        search_volume: Math.round(t.google_score),
        competition: t.competition,
        trend_score: Math.round(t.rating),
        pinterest_score: Math.round(t.pinterest_score),
        seasonal_score: t.momentum === "seasonal" ? 90 : null,
        ai_score: Math.round(t.rating),
        recommendation: t.why_trending,
        notes: JSON.stringify({
          momentum: t.momentum,
          sources: t.sources,
          angle: t.angle,
          seasonality: t.seasonality,
          primary_keyword: t.primary_keyword,
          secondary_keywords: t.secondary_keywords,
          google_score: Math.round(t.google_score),
        }),
      }));
      const { error } = await (supabaseAdmin as any).from("ai_topics").insert(rows);
      if (error) throw new Error(error.message);
      return { ok: true, count: rows.length, sources: signals.map((s) => s.source) };
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }
  });