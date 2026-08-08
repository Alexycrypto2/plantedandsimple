import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "@/lib/ai/gateway.server";

async function requireStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

export type InsightRow = {
  id: string;
  dimension: string;
  dimension_value: string;
  metric: string;
  sample_size: number;
  score: number;
  lift_pct: number;
  confidence: number;
  summary: string;
  window_days: number;
  computed_at: string;
};

export type RecommendationRow = {
  id: string;
  for_date: string;
  kind: string;
  title: string;
  reasoning: string;
  action: Record<string, any>;
  priority: number;
  status: string;
  created_at: string;
};

export type ExperimentRow = {
  id: string;
  name: string;
  dimension: string;
  hypothesis: string;
  variants: any[];
  metric: string;
  status: string;
  winner: string | null;
  results: Record<string, any>;
  started_at: string;
  decided_at: string | null;
};

export type BrandRuleRow = {
  id: string;
  category: string;
  rule: string;
  weight: number;
  active: boolean;
};

/* ------------------------------ memory & insights ----------------------------- */

export const learningOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const [signals, insights, experiments, recs, checks] = await Promise.all([
      db.from("learning_signals").select("id", { count: "exact", head: true }),
      db.from("learning_insights").select("id", { count: "exact", head: true }).eq("status", "active"),
      db.from("ai_experiments").select("id", { count: "exact", head: true }).eq("status", "running"),
      db.from("ai_recommendations").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("brand_checks").select("score").order("checked_at", { ascending: false }).limit(20),
    ]);
    const scores = (checks.data ?? []).map((c: any) => Number(c.score) || 0);
    return {
      signals: signals.count ?? 0,
      insights: insights.count ?? 0,
      running_experiments: experiments.count ?? 0,
      new_recommendations: recs.count ?? 0,
      brand_score: scores.length ? Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)) : null,
    };
  });

export const listInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("learning_insights")
      .select("*")
      .eq("status", "active")
      .order("lift_pct", { ascending: false })
      .limit(120);
    return (data ?? []) as InsightRow[];
  });

export const recomputeLearning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { windowDays?: number } | undefined) => ({
    windowDays: Math.min(Math.max(Number(d?.windowDays ?? 90), 7), 365),
  }))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { deriveSignalsFromPlatform, computeInsights, persistInsights } = await import("./engine.server");
    const derived = await deriveSignalsFromPlatform(Math.max(data.windowDays, 180));
    const insights = await computeInsights(data.windowDays);
    const saved = await persistInsights(insights, data.windowDays);
    return { ok: true, derived, insights: saved };
  });

/** Future data sources (Search Console, Pinterest Analytics, GA, email) plug in here. */
export const ingestSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { signals: any[] }) => ({ signals: (d.signals ?? []).slice(0, 1000) }))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { recordSignals } = await import("./engine.server");
    const n = await recordSignals(
      data.signals.map((s: any) => ({
        source: String(s.source ?? "manual"),
        metric: String(s.metric ?? "unknown"),
        value: Number(s.value ?? 0),
        entity_type: s.entity_type,
        entity_ref: s.entity_ref ?? null,
        dimensions: s.dimensions ?? {},
        occurred_at: s.occurred_at,
      })),
    );
    return { ok: true, recorded: n };
  });

/* ------------------------------ daily briefing -------------------------------- */

const BriefingSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  recommendations: z.array(
    z.object({
      kind: z.enum(["content", "pinterest", "seo", "product", "email", "experiment"]),
      title: z.string(),
      reasoning: z.string(),
      action: z.string(),
      priority: z.number(),
    }),
  ),
});

export const generateDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { getMemoryContext } = await import("./engine.server");

    const [memory, { data: insights }, { data: topics }, { data: pending }] = await Promise.all([
      getMemoryContext("general"),
      db.from("learning_insights").select("dimension, dimension_value, metric, lift_pct, sample_size, confidence")
        .eq("status", "active").order("lift_pct", { ascending: false }).limit(25),
      db.from("ai_topics").select("topic, recommendation, ai_score").order("discovered_at", { ascending: false }).limit(12),
      db.from("ai_generations").select("kind").eq("status", "pending"),
    ]);

    const model = await textModel("learning");
    let output: z.infer<typeof BriefingSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: BriefingSchema }),
        prompt: `You are the head of growth for PrimeDownloads / PlantedAndSimple, a premium plant-based digital cookbook publisher.
Write today's morning briefing.

${memory}

MEASURED PATTERNS (JSON):
${JSON.stringify(insights ?? [])}

TOPIC RADAR:
${JSON.stringify(topics ?? [])}

Items already waiting in the approval queue: ${(pending ?? []).length}.

Produce 4-6 recommendations for TODAY. Every recommendation MUST state the reasoning in the style
"X performed N% better over the last 90 days, so today we will ...". If a pattern has too little data,
say so honestly and recommend an experiment instead of inventing numbers. priority is 1 (highest) to 5.
action is a single concrete instruction the studio can execute.`,
      });
      output = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
    }

    const today = new Date().toISOString().slice(0, 10);
    await db.from("ai_recommendations").delete().eq("for_date", today).eq("status", "new");
    const rows = output.recommendations.map((r) => ({
      for_date: today,
      kind: r.kind,
      title: r.title.slice(0, 200),
      reasoning: r.reasoning,
      action: { instruction: r.action },
      evidence: { headline: output.headline, summary: output.summary },
      priority: Math.min(Math.max(Math.round(r.priority), 1), 5),
      status: "new",
    }));
    if (rows.length) {
      const { error } = await db.from("ai_recommendations").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true, headline: output.headline, summary: output.summary, count: rows.length };
  });

export const listRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_recommendations")
      .select("*")
      .order("for_date", { ascending: false })
      .order("priority", { ascending: true })
      .limit(40);
    return (data ?? []) as RecommendationRow[];
  });

export const setRecommendationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "new" | "accepted" | "dismissed" | "done" }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("ai_recommendations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- experiments --------------------------------- */

export const listExperiments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_experiments")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    return (data ?? []) as ExperimentRow[];
  });

export const upsertExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    dimension: string;
    hypothesis?: string;
    variants: string[];
    metric?: string;
    status?: string;
  }) => ({
    id: d.id,
    name: String(d.name).slice(0, 160),
    dimension: String(d.dimension).slice(0, 60),
    hypothesis: String(d.hypothesis ?? "").slice(0, 500),
    variants: (d.variants ?? []).filter(Boolean).slice(0, 6).map((v) => String(v).slice(0, 80)),
    metric: String(d.metric ?? "engagement").slice(0, 60),
    status: d.status ?? "running",
  }))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (data.variants.length < 2) throw new Error("An experiment needs at least two variants.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      name: data.name,
      dimension: data.dimension,
      hypothesis: data.hypothesis,
      variants: data.variants,
      metric: data.metric,
      status: data.status,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await (supabaseAdmin as any)
      .from("ai_experiments")
      .upsert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

/** Reads the measured insights for the experiment's dimension and promotes the winner. */
export const evaluateExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: exp } = await db.from("ai_experiments").select("*").eq("id", data.id).single();
    if (!exp) throw new Error("Experiment not found");

    const { data: insights } = await db
      .from("learning_insights")
      .select("dimension_value, metric, lift_pct, sample_size, confidence")
      .eq("dimension", exp.dimension)
      .eq("status", "active");

    const variants: string[] = (exp.variants ?? []).map((v: any) => (typeof v === "string" ? v : v?.name));
    const scored = variants.map((v) => {
      const rows = (insights ?? []).filter((i: any) => String(i.dimension_value).toLowerCase() === String(v).toLowerCase());
      const samples = rows.reduce((a: number, r: any) => a + Number(r.sample_size || 0), 0);
      const lift = rows.length ? rows.reduce((a: number, r: any) => a + Number(r.lift_pct || 0) * Number(r.confidence || 0), 0) / rows.length : 0;
      return { variant: v, weighted_lift: Number(lift.toFixed(1)), samples };
    });
    scored.sort((a, b) => b.weighted_lift - a.weighted_lift);
    const best = scored[0];
    const enoughData = best && best.samples >= 5 && best.weighted_lift > 0;

    const { error } = await db
      .from("ai_experiments")
      .update({
        results: { scored, evaluated_at: new Date().toISOString() },
        winner: enoughData ? best.variant : null,
        status: enoughData ? "promoted" : "running",
        decided_at: enoughData ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, scored, winner: enoughData ? best.variant : null };
  });

export const setExperimentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "running" | "paused" | "promoted" | "retired" }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("ai_experiments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Proposes fresh experiments so the studio never produces identical content forever. */
export const suggestExperiments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { getMemoryContext } = await import("./engine.server");
    const [memory, { data: existing }] = await Promise.all([
      getMemoryContext("general"),
      db.from("ai_experiments").select("name, dimension, status").limit(50),
    ]);

    const Schema = z.object({
      experiments: z.array(
        z.object({
          name: z.string(),
          dimension: z.enum(["pin_style", "image_style", "blog_format", "headline_style", "cta_style", "publish_dow", "publish_hour"]),
          hypothesis: z.string(),
          variants: z.array(z.string()).min(2).max(4),
          metric: z.string(),
        }),
      ),
    });

    const model = await textModel("learning");
    const { output } = await generateText({
      model,
      output: Output.object({ schema: Schema }),
      prompt: `${memory}

Existing experiments: ${JSON.stringify(existing ?? [])}

Propose 3 NEW experiments for PlantedAndSimple that test genuinely different creative approaches
(pin layouts, blog structures, CTA styles, headline styles, image treatments or publishing times).
Do not duplicate existing experiment names or dimensions that already have a running test.
Every variant must stay inside the brand rules.`,
    });

    const rows = output.experiments.map((e) => ({
      name: e.name.slice(0, 160),
      dimension: e.dimension,
      hypothesis: e.hypothesis,
      variants: e.variants,
      metric: e.metric,
      status: "running",
    }));
    if (rows.length) {
      const { error } = await db.from("ai_experiments").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true, created: rows.length };
  });

/* ------------------------------ brand consistency ----------------------------- */

export const listBrandRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("brand_rules")
      .select("id, category, rule, weight, active")
      .order("category", { ascending: true })
      .order("weight", { ascending: false });
    return (data ?? []) as BrandRuleRow[];
  });

export const upsertBrandRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; category: string; rule: string; weight?: number; active?: boolean }) => ({
    id: d.id,
    category: String(d.category).slice(0, 40),
    rule: String(d.rule).slice(0, 600),
    weight: Math.min(Math.max(Number(d.weight ?? 3), 1), 5),
    active: d.active ?? true,
  }))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!data.rule.trim()) throw new Error("Write the rule first.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      category: data.category,
      rule: data.rule,
      weight: data.weight,
      active: data.active,
      updated_at: new Date().toISOString(),
    };
    if (data.id) payload.id = data.id;
    const { error } = await (supabaseAdmin as any).from("brand_rules").upsert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrandRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("brand_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const BrandCheckSchema = z.object({
  score: z.number(),
  verdict: z.enum(["on-brand", "minor-issues", "off-brand"]),
  issues: z.array(z.object({ area: z.string(), problem: z.string(), fix: z.string() })),
  notes: z.string(),
});

/** Scores any queued generation against the live brand rules before it is published. */
export const brandCheckGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { generationId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { getBrandRules } = await import("./engine.server");

    const [{ data: gen }, rules] = await Promise.all([
      db.from("ai_generations").select("id, kind, title, payload").eq("id", data.generationId).single(),
      getBrandRules(),
    ]);
    if (!gen) throw new Error("Generation not found");

    const model = await textModel("learning");
    const { output } = await generateText({
      model,
      output: Output.object({ schema: BrandCheckSchema }),
      prompt: `Audit this generated ${gen.kind} asset against the PlantedAndSimple brand rules.

BRAND RULES:
${rules.map((r) => `- [${r.category}] ${r.rule}`).join("\n")}

ASSET TITLE: ${gen.title}
ASSET PAYLOAD (JSON, truncated):
${JSON.stringify(gen.payload).slice(0, 8000)}

Score 0-100 for brand consistency across writing tone, editorial quality, image style direction,
Pinterest branding and CTA style. List only real issues, each with a concrete fix.`,
    });

    const { error } = await db.from("brand_checks").insert({
      generation_id: gen.id,
      score: output.score,
      issues: output.issues,
      notes: `${output.verdict}: ${output.notes}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true, ...output };
  });

export const listBrandChecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("brand_checks")
      .select("id, generation_id, score, issues, notes, checked_at")
      .order("checked_at", { ascending: false })
      .limit(30);
    return (data ?? []) as {
      id: string;
      generation_id: string | null;
      score: number;
      issues: { area: string; problem: string; fix: string }[];
      notes: string | null;
      checked_at: string;
    }[];
  });
