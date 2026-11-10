import { createServerFn } from "@tanstack/react-start";
import { anchorSeoTitle } from "@/lib/content/title-lock";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "./gateway.server";
import { requireBossFactory } from "./studio.server";
import { auditSeo } from "@/lib/content/seo-doctor";

const requireBoss = requireBossFactory();

const FixSchema = z.object({
  seo_title: z.string(),
  seo_description: z.string(),
  excerpt: z.string(),
  intro_paragraph: z.string(),
  h2_index: z.number(),
  h2_text: z.string(),
  changes: z.array(z.string()),
});

/** Rewrites only the weak SEO elements of a post; keeps the author's voice and facts. */
export const autoFixSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; seoTitle: string; seoDescription: string; excerpt: string; html: string; keyword?: string; kind?: "blog" | "recipe" }) => ({
    title: String(d.title ?? "").slice(0, 200),
    seoTitle: String(d.seoTitle ?? "").slice(0, 200),
    seoDescription: String(d.seoDescription ?? "").slice(0, 400),
    excerpt: String(d.excerpt ?? "").slice(0, 600),
    html: String(d.html ?? "").slice(0, 60000),
    keyword: d.keyword ? String(d.keyword).slice(0, 80) : undefined,
    kind: d.kind === "recipe" ? ("recipe" as const) : ("blog" as const),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const report = auditSeo({ title: data.title, seoTitle: data.seoTitle, seoDescription: data.seoDescription, html: data.html, keyword: data.keyword, kind: data.kind });
    const failing = report.checks.filter((c) => !c.pass);
    if (failing.length === 0) return { ...data, changes: ["Already passing every check."], before: report.score, after: report.score };

    const model = await textModel("blog-core");
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: FixSchema }),
        prompt: `You are an SEO editor for PlantedAndSimple (plant-based food brand). Fix ONLY these failing checks for the target keyword "${report.keyword}":
${failing.map((c) => `- ${c.label}: ${c.fix}`).join("\n")}

${data.kind === "recipe" ? "This is a RECIPE. Only rewrite seo_title, seo_description and excerpt (the recipe description, 2-3 warm sentences that include the keyword). Return intro_paragraph empty, h2_index -1, h2_text empty. Mention any ingredient/step/tip gaps in changes as advice for the editor.\n" : "This is a BLOG. Do NOT return the article. Return intro_paragraph = a rewritten version of the first paragraph (plain text, same facts) that uses the keyword naturally; h2_index = the 0-based index of ONE existing H2 to rephrase so it includes the keyword (or -1 if one already does), h2_text = that new heading text.\n"}Rules: keep every fact, quantity, recipe, link, image and product card exactly as is. Keep the warm home-cook voice. Do not add AI cliches (delve, elevate, unlock, game-changer). seo_title 30-60 chars and MUST contain the exact Title word-for-word — only add natural modifiers (time, diet, protein) or " · Planted & Simple"; never rename the dish. seo_description 120-155 chars. Use the keyword in its natural written form (hyphens are fine). Return a short list of changes.

Title: ${data.title}
SEO title: ${data.seoTitle}
Meta: ${data.seoDescription}
Excerpt: ${data.excerpt}
CONTENT HTML:
${data.html.slice(0, 20000)}`,
      });
      output.seo_title = anchorSeoTitle(data.title, output.seo_title);
      const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      let html: string;
      if (data.kind === "recipe") {
        html = data.html.replace(/^<p>[\s\S]*?<\/p>/, `<p>${output.excerpt}</p>`);
      } else {
        html = data.html;
        if (output.intro_paragraph.trim()) html = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/i, `<p>${esc(output.intro_paragraph.trim())}</p>`);
        if (output.h2_index >= 0 && output.h2_text.trim()) {
          let i = -1;
          html = html.replace(/<h2\b([^>]*)>[\s\S]*?<\/h2>/gi, (m, attrs) => (++i === output.h2_index ? `<h2${attrs}>${esc(output.h2_text.trim())}</h2>` : m));
        }
      }
      const after = auditSeo({ title: data.title, seoTitle: output.seo_title, seoDescription: output.seo_description, html, keyword: report.keyword, kind: data.kind });
      // Never accept a "fix" that makes things worse or drops most of the article.
      if (after.score < report.score || html.length < data.html.length * 0.7) {
        throw new Error("The auto-fix didn't improve the score, so nothing was changed. Try again or edit manually.");
      }
      return {
        title: data.title,
        seoTitle: output.seo_title,
        seoDescription: output.seo_description,
        excerpt: output.excerpt || data.excerpt,
        html,
        changes: output.changes,
        before: report.score,
        after: after.score,
      };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid output — try again.");
      if (err instanceof Error && err.message.startsWith("The auto-fix")) throw err;
      throw describeAiError(err);
    }
  });

const OptionsSchema = z.object({ options: z.array(z.string()) });

/** Writes 3 alternatives for one field (SEO title, meta, Pinterest text or keywords) without touching the article. */
export const suggestSeoField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { field: "seo_title" | "seo_description" | "pinterest" | "keywords"; title: string; keyword?: string; summary: string; kind?: "blog" | "recipe" }) => ({
    field: (["seo_title", "seo_description", "pinterest", "keywords"].includes(d.field) ? d.field : "seo_title") as "seo_title" | "seo_description" | "pinterest" | "keywords",
    title: String(d.title ?? "").slice(0, 200),
    keyword: d.keyword ? String(d.keyword).slice(0, 80) : "",
    summary: String(d.summary ?? "").slice(0, 4000),
    kind: d.kind === "recipe" ? "recipe" : "blog",
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const spec = {
      seo_title: "3 SEO titles, 30-60 characters each. Each MUST start with the exact Title word-for-word, then add natural modifiers (cook time, diet, protein) or ' · Planted & Simple'. Never rename the dish, no clickbait.",
      seo_description: "3 meta descriptions, 120-155 characters each, include the keyword and a clear benefit.",
      pinterest: "3 Pinterest descriptions, 150-400 characters each, include the keyword and 2-3 natural search phrases, no hashtags spam.",
      keywords: "3 supporting search phrases (2-5 words each) a home cook would type into Google related to the main keyword.",
    }[data.field];
    const model = await textModel("blog-core");
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: OptionsSchema }),
        prompt: `You write SEO copy for PlantedAndSimple, a plant-based food brand. Write ${spec}
Only use facts present below — never invent numbers, awards or claims. Warm home-cook voice, no AI cliches.
Type: ${data.kind}. Title: ${data.title}. Main keyword: ${data.keyword || "(choose from title)"}.
Content summary:
${data.summary}`,
      });
      const opts = output.options.map((s) => s.trim()).filter(Boolean);
      return { options: (data.field === "seo_title" ? [...new Set(opts.map((o) => anchorSeoTitle(data.title, o)))] : opts).slice(0, 3) };
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid output — try again.");
      throw describeAiError(err);
    }
  });
