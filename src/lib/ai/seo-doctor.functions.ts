import { createServerFn } from "@tanstack/react-start";
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
  content_html: z.string(),
  changes: z.array(z.string()),
});

/** Rewrites only the weak SEO elements of a post; keeps the author's voice and facts. */
export const autoFixSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; seoTitle: string; seoDescription: string; excerpt: string; html: string; keyword?: string }) => ({
    title: String(d.title ?? "").slice(0, 200),
    seoTitle: String(d.seoTitle ?? "").slice(0, 200),
    seoDescription: String(d.seoDescription ?? "").slice(0, 400),
    excerpt: String(d.excerpt ?? "").slice(0, 600),
    html: String(d.html ?? "").slice(0, 60000),
    keyword: d.keyword ? String(d.keyword).slice(0, 80) : undefined,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const report = auditSeo({ title: data.title, seoTitle: data.seoTitle, seoDescription: data.seoDescription, html: data.html, keyword: data.keyword });
    const failing = report.checks.filter((c) => !c.pass);
    if (failing.length === 0) return { ...data, changes: ["Already passing every check."], before: report.score, after: report.score };

    const model = await textModel("blog-core");
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: FixSchema }),
        prompt: `You are an SEO editor for PlantedAndSimple (plant-based food brand). Fix ONLY these failing checks for the target keyword "${report.keyword}":
${failing.map((c) => `- ${c.label}: ${c.fix}`).join("\n")}

Rules: keep every fact, quantity, recipe, link, image and product card exactly as is. Keep the warm home-cook voice. Do not add AI cliches (delve, elevate, unlock, game-changer). seo_title 30-60 chars, seo_description 120-155 chars. Return the full corrected content_html (edit minimally) and a short list of changes.

Title: ${data.title}
SEO title: ${data.seoTitle}
Meta: ${data.seoDescription}
Excerpt: ${data.excerpt}
CONTENT HTML:
${data.html}`,
      });
      const after = auditSeo({ title: data.title, seoTitle: output.seo_title, seoDescription: output.seo_description, html: output.content_html, keyword: report.keyword });
      // Never accept a "fix" that makes things worse or drops most of the article.
      if (after.score < report.score || output.content_html.length < data.html.length * 0.7) {
        throw new Error("The auto-fix didn't improve the score, so nothing was changed. Try again or edit manually.");
      }
      return {
        title: data.title,
        seoTitle: output.seo_title,
        seoDescription: output.seo_description,
        excerpt: output.excerpt || data.excerpt,
        html: output.content_html,
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
