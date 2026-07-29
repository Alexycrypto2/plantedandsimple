import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL } from "./gateway.server";

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
    const gateway = createGateway({ structuredOutputs: true });
    const model = gateway(DEFAULT_CHAT_MODEL);
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: TopicsSchema }),
        prompt: `Suggest ${data.count} trending blog/recipe topics for PlantedAndSimple — a plant-based cookbook brand.
Seed themes: ${data.seed}.
Score each on trend_score, conversion_score, pinterest_potential (0-100). Prefer evergreen high-intent searches.
Return JSON only.`,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const rows = output.topics.map((t) => ({ ...t, model: DEFAULT_CHAT_MODEL, created_by: context.userId }));
      const { error } = await (supabaseAdmin as any).from("ai_topics").insert(rows);
      if (error) throw new Error(error.message);
      return { ok: true, count: rows.length };
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
    }
  });

export const listTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("ai_topics")
      .select("*").order("created_at", { ascending: false }).limit(100);
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