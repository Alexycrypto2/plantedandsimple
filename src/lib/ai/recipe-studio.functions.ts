import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "./gateway.server";
import { FRAMING, renderImageSafe, requireBossFactory } from "./studio.server";
import { cleanStep, cleanStepText, cleanTip, cleanServings, usNutritionLabel } from "@/lib/recipe-clean";
import { fixCalories } from "@/lib/nutrition-check";

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
  instructions: z.array(z.object({ title: z.string(), body: z.string() })),
  cuisine: z.string(),
  category: z.string(),
  macro_ledger: z.array(z.object({ ingredient: z.string(), grams: z.number(), protein: z.number(), carbs: z.number(), fat: z.number(), fiber: z.number() })),
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

    const model = await textModel("recipe-studio");
    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("general");

    const prompt = `You are the head recipe developer for PlantedAndSimple, a premium plant-based cookbook brand. Write ONE fully tested, kitchen-accurate recipe.

${memory}

Recipe idea: "${data.idea}"
Diet: ${data.diet}. ${data.cuisine ? `Cuisine: ${data.cuisine}. ` : ""}${data.mealType ? `Meal: ${data.mealType}. ` : ""}Difficulty: ${data.difficulty}. Servings: ${data.servings}. Total time must be at or under ${data.maxMinutes} minutes.

Non-negotiable rules:
- Ingredients: exact quantities in both metric and cups (e.g. "200 g (1 cup) dried red lentils, rinsed"), listed in order of use, with prep state included. 8-16 items, no vague "some" or "to taste" alone.
- Instructions: 6-12 numbered steps. Each step names the pan, the heat level, the time, and the sensory cue ("until the edges turn deep gold, about 4 minutes"). No step repeats another.
- Each instruction has a short action title (2-5 words, e.g. "Sear the tofu") and a body. Never leave a title empty.
- cuisine: one word or phrase (e.g. Mediterranean, Thai, Mexican). category: one of Breakfast, Lunch, Dinner, Meal Prep, Snack, Dessert, Soup, Salad.
- tags must include the cuisine and category in lowercase plus the main search keyword (Google recipe SEO).
- nutrition: per-serving values — Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium. CALCULATE, never guess: first fill macro_ledger with every ingredient's grams and its protein/carbs/fat/fiber (USDA-style values), sum the totals, then divide by servings. Reference per 100 g: firm tofu 15P/2C/9F, tempeh 19P/9C/11F, cooked lentils 9P/20C/0.4F/8Fi, cooked chickpeas 9P/27C/2.6F/8Fi, cooked black beans 9P/24C/0.5F/9Fi, dry red lentils 24P/60C/1F/11Fi, edamame 11P/9C/5F/5Fi, seitan 25P/4C/2F, cooked quinoa 4.4P/21C/1.9F/2.8Fi, dry oats 13P/68C/6.5F/10Fi, peanut butter 25P/20C/50F, olive oil 0P/0C/100F, hemp seeds 32P/9C/49F. Never inflate protein to fit the brand — if the dish is under 20 g protein per serving, say so honestly or add a real protein source. Calories must equal protein×4 + carbs×4 + fat×9 within 10%.
- tips: 3-5 genuinely useful notes (make-ahead, swaps, storage, why a technique works). Never start a tip with a dash, bullet or number.
- description: 2-3 sentences, warm and specific, written like a food magazine intro. No "delicious and easy" filler, no AI cliches.
- seo_title <= 60 chars and must match the recipe title (never prepend a cuisine word like "American"). seo_description <= 155 chars, natural US English, no "x-style" filler. pinterest_description <= 480 chars with 4 hashtags, tags 5-8 lowercase.
- Use American English throughout (fiber, color, flavor, skillet, cilantro).
- servings: the number only, e.g. "4" (never "4 servings").
- Step titles and bodies must NOT start with a number, "Step", or a dash. Every step body ends with exactly one period — never a comma or ".,".
- Image prompts must describe THIS exact dish in concrete detail — the real ingredients, colours, textures, props and plating — so no two photos look alike. Never mention text, labels, logos, hands holding phones, or brand names.
- step_image_prompts: 2-3 of the most visually instructive steps only, each alt describing the step.`;

    let out: z.infer<typeof RecipeSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: RecipeSchema }),
        prompt,
      });
      out = res.output;
    } catch (err: any) {
      if (NoObjectGeneratedError.isInstance(err)) throw new Error("AI returned invalid JSON — try again.");
      throw describeAiError(err);
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
        instructions: out.instructions.map((s) => ({ title: cleanStepText(s.title), body: cleanStep(s.body) })),
        nutrition: fixCalories(out.nutrition.map((n) => ({ ...n, label: usNutritionLabel(n.label) }))),
        tips: out.tips.map(cleanTip).filter(Boolean),
        prep_minutes: Math.max(0, Math.round(out.prep_minutes)),
        cook_minutes: Math.max(0, Math.round(out.cook_minutes)),
        servings: cleanServings(out.servings) || cleanServings(data.servings),
        difficulty: ["easy", "medium", "advanced"].includes(out.difficulty) ? out.difficulty : data.difficulty,
        tags: Array.from(new Set([...out.tags, out.cuisine, out.category].map((t) => t.toLowerCase().trim()).filter(Boolean))),
        seo_title: out.seo_title?.trim() || out.title,
        seo_description: out.seo_description.replace(/\b([a-z]+)-style\b/gi, (m) => m.charAt(0).toUpperCase() + m.slice(1)),
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
