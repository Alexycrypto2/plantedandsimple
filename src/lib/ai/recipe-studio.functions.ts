import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createGateway, DEFAULT_CHAT_MODEL } from "./gateway.server";
import { FRAMING, renderImageSafe, requireBossFactory } from "./studio.server";

const requireBoss = requireBossFactory();

const RecipeSchema = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  difficulty: z.string(),
  prep_minutes: z.number(),
  cook_minutes: z.number(),
  servings: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  nutrition: z.array(z.object({ label: z.string(), value: z.string() })),
  tips: z.array(z.string()),
  tags: z.array(z.string()),
  seo_title: z.string(),
  seo_description: z.string(),
  pinterest_description: z.string(),
  hero_image_prompt: z.string(),
  hero_image_alt: z.string(),
  ingredients_image_prompt: z.string(),
  step_image_prompts: z.array(z.object({ prompt: z.string(), alt: z.string() })),
});

export type RecipeBrief = {
  idea: string;
  cuisine?: string;
  diet?: string;
  mealType?: string;
  difficulty?: string;
  servings?: string;
  maxMinutes?: number;
  withImages?: boolean;
};

export const generateStudioRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RecipeBrief) => ({
    idea: String(d.idea || "").slice(0, 240),
    cuisine: d.cuisine ? String(d.cuisine).slice(0, 60) : undefined,
    diet: String(d.diet || "plant-based / vegan").slice(0, 80),
    mealType: d.mealType ? String(d.mealType).slice(0, 40) : undefined,
    difficulty: String(d.difficulty || "easy").slice(0, 20),
    servings: String(d.servings || "4").slice(0, 20),
    maxMinutes: Math.min(Math.max(Number(d.maxMinutes ?? 45), 5), 240),
    withImages: d.withImages ?? true,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    if (!data.idea) throw new Error("Tell the AI what to cook.");

    const model = createGateway({ structuredOutputs: true })(DEFAULT_CHAT_MODEL);
    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("recipe");

    const prompt = `You are the head recipe developer for PlantedAndSimple, a premium plant-based cookbook brand. Write ONE fully tested, kitchen-accurate recipe.

${memory}

Recipe idea: "${data.idea}"
Diet: ${data.diet}. ${data.cuisine ? `Cuisine: ${data.cuisine}. ` : ""}${data.mealType ? `Meal: ${data.mealType}. ` : ""}Difficulty: ${data.difficulty}. Servings: ${data.servings}. Total time must be at or under ${data.maxMinutes} minutes.

Non-negotiable rules:
- Ingredients: exact quantities in both metric and cups (e.g. "200 g (1 cup) dried red lentils, rinsed"), listed in order of use, with prep state included. 8-16 items, no vague "some" or "to taste" alone.
- Instructions: 6-12 numbered steps. Each step names the pan, the heat level, the time, and the sensory cue ("until the edges turn deep gold, about 4 minutes"). No step repeats another.
- nutrition: realistic per-serving values — Calories, Protein, Carbs, Fat, Fibre, Sugar, Sodium.
- tips: 3-5 genuinely useful notes (make-ahead, swaps, storage, why a technique works).
- description: 2-3 sentences, warm and specific, written like a food magazine intro. No "delicious and easy" filler, no AI cliches.
- seo_title <= 60 chars, seo_description <= 155 chars, pinterest_description <= 480 chars with 4 hashtags, tags 5-8 lowercase.
- Image prompts must describe THIS exact dish in concrete detail — the real ingredients, colours, textures, props and plating — so no two photos look alike. Never mention text, labels, logos, hands holding phones, or brand names.
- step_image_prompts: 2-3 of the most visually instructive steps only, each alt describing the step.`;

    let out: z.infer<typeof RecipeSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: RecipeSchema }),
        prompt,
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });
      out = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw err;
    }

    const slug =
      (out.slug || out.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /* ------------------------------- imagery ------------------------------- */
    const gallery: string[] = [];
    let heroId: string | null = null;
    let heroUrl: string | null = null;

    if (data.withImages) {
      const jobs = [
        { prompt: out.hero_image_prompt, framing: FRAMING.finished, alt: out.hero_image_alt, hero: true },
        { prompt: out.ingredients_image_prompt, framing: FRAMING.flatlay, alt: `${out.title} ingredients`, hero: false },
        ...out.step_image_prompts.slice(0, 3).map((s) => ({ prompt: s.prompt, framing: FRAMING.step, alt: s.alt, hero: false })),
      ];
      for (const job of jobs) {
        const r = await renderImageSafe(`${out.title}. ${job.prompt}`, `recipes/${slug}`, job.framing);
        if (!r?.url) continue;
        const { data: m } = await (supabaseAdmin as any)
          .from("media")
          .insert({
            public_url: r.url,
            storage_path: r.path,
            alt: job.alt,
            title: `${out.title} — ${job.hero ? "hero" : "supporting"}`,
            tags: ["ai", "recipe", slug],
            mime_type: "image/png",
            created_by: context.userId,
          })
          .select("id")
          .single();
        if (!m?.id) continue;
        if (job.hero) {
          heroId = m.id;
          heroUrl = r.url;
        } else {
          gallery.push(m.id);
        }
      }
    }

    const { data: row, error } = await (supabaseAdmin as any)
      .from("recipes")
      .insert({
        slug,
        title: out.title,
        subtitle: out.subtitle,
        description: out.description,
        ingredients: out.ingredients,
        instructions: out.instructions,
        nutrition: out.nutrition,
        tips: out.tips,
        prep_minutes: Math.max(0, Math.round(out.prep_minutes)),
        cook_minutes: Math.max(0, Math.round(out.cook_minutes)),
        servings: out.servings || data.servings,
        difficulty: ["easy", "medium", "advanced"].includes(out.difficulty) ? out.difficulty : data.difficulty,
        tags: out.tags,
        seo_title: out.seo_title,
        seo_description: out.seo_description,
        pinterest_description: out.pinterest_description,
        hero_image_id: heroId,
        gallery_ids: gallery,
        status: "draft",
        author_id: context.userId,
      })
      .select("id, slug, title")
      .single();
    if (error) throw new Error(error.message);

    return {
      ok: true,
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      hero_url: heroUrl,
      images: gallery.length + (heroId ? 1 : 0),
    };
  });
