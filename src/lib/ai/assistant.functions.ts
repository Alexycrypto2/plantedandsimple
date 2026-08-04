import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL } from "./gateway.server";

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss")) throw new Error("Forbidden");
}

export type AssistantCommand =
  | "blog"
  | "pinterest_pin"
  | "faq"
  | "internal_links"
  | "product_desc";

export const ASSISTANT_COMMANDS: { id: AssistantCommand; label: string; placeholder: string }[] = [
  { id: "blog", label: "/blog — write an SEO blog post", placeholder: "high-protein vegan breakfasts" },
  { id: "pinterest_pin", label: "/pin — Pinterest pin copy", placeholder: "30 plant-based dinners cookbook" },
  { id: "faq", label: "/faq — FAQ block", placeholder: "the 30 High-Protein Meals cookbook" },
  { id: "internal_links", label: "/links — internal link suggestions", placeholder: "vegan meal prep guide" },
  { id: "product_desc", label: "/product — product description", placeholder: "30 High-Protein Plant-Based Meals" },
];

const PinSchema = z.object({
  title: z.string(),
  description: z.string(),
  hashtags: z.array(z.string()),
  alt_text: z.string(),
  image_prompt: z.string(),
  destination_note: z.string(),
});

const FaqSchema = z.object({
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
  schema_jsonld: z.string(),
});

const LinksSchema = z.object({
  links: z.array(
    z.object({ anchor_text: z.string(), target_slug: z.string(), reason: z.string() }),
  ),
});

const ProductSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description_html: z.string(),
  benefits: z.array(z.string()),
  features: z.array(z.string()),
  seo_title: z.string(),
  seo_description: z.string(),
  pinterest_description: z.string(),
  tags: z.array(z.string()),
});

const BRAND_CONTEXT = `Brand: PlantedAndSimple (store: PrimeDownloads) — premium plant-based digital cookbooks and meal plans.
Voice: warm, editorial, expert, no hype, no emojis in body copy.
Audience: busy people who want simple high-protein plant-based meals.`;

function config(command: AssistantCommand) {
  switch (command) {
    case "pinterest_pin":
      return {
        schema: PinSchema,
        kind: "pinterest_pin" as const,
        prompt: (input: string) =>
          `Write Pinterest pin copy for: "${input}".
title <= 100 chars and keyword-rich. description <= 480 chars, benefit-led, ends with a soft CTA. 4-6 hashtags. alt_text describes the image for accessibility. image_prompt is a vertical 2:3 food photography brief (warm natural light, cream + forest green palette).`,
        title: (o: any) => o.title,
      };
    case "faq":
      return {
        schema: FaqSchema,
        kind: "blog" as const,
        prompt: (input: string) =>
          `Write 6-8 buyer-focused FAQs about: "${input}". Answers 2-4 sentences, honest, objection-handling (format, delivery, refunds, dietary needs, skill level). schema_jsonld is a valid FAQPage JSON-LD string.`,
        title: (_: any, input: string) => `FAQs — ${input}`,
      };
    case "internal_links":
      return {
        schema: LinksSchema,
        kind: "blog" as const,
        prompt: (input: string, ctx: string) =>
          `Suggest 5-8 internal links for content about: "${input}".
Existing site slugs you can link to:
${ctx}
Only use slugs from that list. anchor_text must read naturally in a sentence.`,
        title: (_: any, input: string) => `Internal links — ${input}`,
      };
    case "product_desc":
      return {
        schema: ProductSchema,
        kind: "product_desc" as const,
        prompt: (input: string) =>
          `Write a high-converting product page copy set for the digital product: "${input}".
description_html is semantic HTML (p, ul, strong), 200-350 words. benefits 5-7 outcome-led bullets. features 5-7 concrete deliverables. seo_title <= 60 chars, seo_description <= 155 chars. pinterest_description <= 480 chars.`,
        title: (o: any) => o.title,
      };
    default:
      return null;
  }
}

export const runAssistantCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { command: AssistantCommand; input: string }) => ({
    command: d.command,
    input: String(d.input || "").slice(0, 400),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    if (!data.input) throw new Error("Tell the assistant what to work on.");

    if (data.command === "blog") {
      const { generateStudioBlog } = await import("./blog-studio.functions");
      const res: any = await (generateStudioBlog as any)({ data: { topic: data.input } });
      return { ok: true, id: res.id, kind: "blog", message: "Blog draft sent to the Approval Queue." };
    }

    const cfg = config(data.command);
    if (!cfg) throw new Error("Unknown command");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let siteContext = "";
    if (data.command === "internal_links") {
      const [{ data: posts }, { data: products }] = await Promise.all([
        (supabaseAdmin as any).from("blog_posts").select("slug, title").limit(60),
        (supabaseAdmin as any).from("products").select("slug, title").limit(60),
      ]);
      siteContext = [
        ...(posts ?? []).map((p: any) => `/blog/${p.slug} — ${p.title}`),
        ...(products ?? []).map((p: any) => `/shop/${p.slug} — ${p.title}`),
      ].join("\n") || "(no published pages yet)";
    }

    const gateway = createGateway({ structuredOutputs: true });
    try {
      const { getMemoryContext } = await import("@/lib/learning/engine.server");
      const memoryKind =
        data.command === "pinterest_pin" ? "pinterest" : data.command === "product_desc" ? "product" : "general";
      const memory = await getMemoryContext(memoryKind as any);
      const { output } = await generateText({
        model: gateway(DEFAULT_CHAT_MODEL),
        output: Output.object({ schema: cfg.schema as any }),
        prompt: `${BRAND_CONTEXT}\n\n${memory}\n\n${(cfg.prompt as any)(data.input, siteContext)}`,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });

      const title = (cfg.title as any)(output, data.input);
      const { data: row, error } = await (supabaseAdmin as any)
        .from("ai_generations")
        .insert({
          kind: cfg.kind,
          title: String(title).slice(0, 200),
          topic: data.input,
          payload: { command: data.command, ...(output as Record<string, unknown>) },
          model: DEFAULT_CHAT_MODEL,
          created_by: context.userId,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return {
        ok: true,
        id: row.id,
        kind: cfg.kind,
        message: "Result sent to the Approval Queue.",
        preview: output as any,
      };
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
    }
  });