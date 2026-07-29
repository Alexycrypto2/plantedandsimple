import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL } from "./gateway.server";

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!((data ?? []).some((r: any) => r.role === "boss"))) throw new Error("Forbidden");
}

const BlogSchema = z.object({
  slug: z.string(),
  title: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  excerpt: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  outline: z.array(z.string()),
  content_html: z.string(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  pinterest_title: z.string(),
  pinterest_description: z.string(),
  pinterest_alt: z.string(),
  image_prompt: z.string(),
  cta: z.string(),
  internal_link_slugs: z.array(z.string()),
  external_references: z.array(z.string()),
  schema_jsonld: z.string(),
  seo_score: z.number(),
  quality_score: z.number(),
});

export type BlogInput = { topic: string; wordCount?: number; tone?: string; category?: string };

export const generateBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: BlogInput) => ({
    topic: String(d.topic || "").slice(0, 240),
    wordCount: Math.min(Math.max(Number(d.wordCount ?? 1200), 400), 3500),
    tone: String(d.tone || "warm, editorial, expert").slice(0, 120),
    category: d.category ? String(d.category).slice(0, 80) : undefined,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const gateway = createGateway({ structuredOutputs: true });
    const model = gateway(DEFAULT_CHAT_MODEL);

    const prompt = `Write a premium SEO blog post for PlantedAndSimple (plant-based food brand).

Topic: "${data.topic}"
Target word count: ${data.wordCount} (content_html body).
Tone: ${data.tone}.
${data.category ? `Category: ${data.category}.` : ""}

Return one JSON object matching the schema. Rules:
- slug: lowercase kebab-case, no stop words at edges.
- content_html: valid semantic HTML (h2/h3, p, ul/ol, strong). Include intro, sections following the outline, a recipe section if the topic is a recipe (ingredients list + numbered steps + nutrition tips), and a conclusion. Do NOT include an <h1>.
- seo_title <= 60 chars, seo_description <= 155 chars.
- excerpt: 1-2 sentences, ~180 chars.
- tags: 5-8 lowercase.
- outline: 5-8 H2 titles matching content_html.
- faqs: 4-6 items.
- pinterest_title <= 100 chars, pinterest_description <= 500 chars with 3-5 hashtags.
- image_prompt: photorealistic food photography brief (warm natural light, editorial styling, cream + forest palette, overhead or 45-degree).
- schema_jsonld: valid JSON-LD Article string.
- internal_link_slugs: 2-4 blog slugs already on the site or suggested related posts.
- external_references: 2-4 authoritative URLs.
- seo_score, quality_score: 0-100 self-assessment.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: BlogSchema }),
        prompt,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await (supabaseAdmin as any).from("ai_generations").insert({
        kind: "blog",
        title: output.title,
        topic: data.topic,
        payload: {
          slug: output.slug,
          title: output.title,
          excerpt: output.excerpt,
          content: output.content_html,
          category: output.category,
          tags: output.tags,
          seo_title: output.seo_title,
          seo_description: output.seo_description,
          outline: output.outline,
          faqs: output.faqs,
          pinterest: {
            title: output.pinterest_title,
            description: output.pinterest_description,
            alt: output.pinterest_alt,
          },
          image_prompt: output.image_prompt,
          cta: output.cta,
          internal_link_slugs: output.internal_link_slugs,
          external_references: output.external_references,
          schema_jsonld: output.schema_jsonld,
        },
        model: DEFAULT_CHAT_MODEL,
        seo_score: output.seo_score,
        quality_score: output.quality_score,
        created_by: context.userId,
        status: "pending",
      }).select("id").single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id };
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("AI returned invalid JSON — try again.");
      }
      throw err;
    }
  });