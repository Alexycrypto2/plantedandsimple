import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "./gateway.server";
import { requireBossFactory } from "./studio.server";
import type { ArticleBrief } from "./blog-core.server";

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

export type BlogBrief = ArticleBrief;

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
    const model = await textModel("blog-studio");
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
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("Research failed — try again.");
      throw describeAiError(err);
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
    const model = await textModel("blog-studio");
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
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("Could not generate titles — try again.");
      throw describeAiError(err);
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
      .select("id,payload,title,status,quality_score")
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
      quality: p.quality ?? null,
      status: row.status as string,
    };
  });

const briefValidator = (d: BlogBrief) => ({
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
  imageCount: d.imageCount === undefined || d.imageCount === null ? null : Math.min(Math.max(Number(d.imageCount), 0), 6),
  research: d.research ?? null,
  rewriteBrief: d.rewriteBrief ? String(d.rewriteBrief).slice(0, 4000) : null,
});

export const generateStudioBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(briefValidator)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { writeArticle, buildAndStoreArticle } = await import("./blog-core.server");
    const article = await writeArticle(data);
    return await buildAndStoreArticle({ brief: data, article, userId: context.userId });
  });

/* ----------------------------- quality control ----------------------------- */

/** Re-scores a stored draft (after manual edits, or on demand). */
export const checkGenerationQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { scoreArticle } = await import("./quality.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id,payload,title")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Draft not found");
    const p = row.payload ?? {};
    const quality = await scoreArticle({
      title: p.title ?? row.title,
      html: p.content ?? "",
      seoTitle: p.seo_title ?? "",
      seoDescription: p.seo_description ?? "",
      primaryKeyword: p.brief?.primaryKeyword ?? null,
    });
    await (supabaseAdmin as any)
      .from("ai_generations")
      .update({
        payload: { ...p, quality },
        quality_score: quality.overall,
        seo_score: quality.seo,
        status: quality.passed ? "pending" : "needs_review",
        notes: quality.passed ? null : `Quality gate: ${quality.overall}/100 — ${quality.verdict}`.slice(0, 500),
      })
      .eq("id", data.id);
    return quality;
  });

/** Rewrites a blocked draft using the editor's own rewrite brief. */
export const rewriteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; instructions?: string }) => ({
    id: String(d.id),
    instructions: d.instructions ? String(d.instructions).slice(0, 2000) : "",
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id,payload,topic")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Draft not found");
    const p = row.payload ?? {};
    const oldBrief: BlogBrief = p.brief ?? { topic: row.topic ?? p.title };
    const problems: string[] = (p.quality?.problems ?? []).map((x: any) => `${x.area}: ${x.issue} → ${x.fix}`);
    const brief: BlogBrief = {
      ...oldBrief,
      rewriteBrief: [p.quality?.rewrite_brief, ...problems, data.instructions].filter(Boolean).join("\n").slice(0, 4000),
    };
    const { writeArticle, buildAndStoreArticle } = await import("./blog-core.server");
    const article = await writeArticle(brief);
    const res = await buildAndStoreArticle({
      brief,
      article,
      userId: context.userId,
      extra: { rewrite_of: data.id },
    });
    await (supabaseAdmin as any).from("ai_generations").update({ status: "rejected", notes: "Replaced by rewrite" }).eq("id", data.id);
    return res;
  });

/** Boss override: publish-approve a draft the quality gate blocked. */
export const overrideQualityGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("ai_generations")
      .update({ status: "pending", notes: "Quality gate overridden by boss" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
