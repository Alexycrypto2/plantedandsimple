import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "item";

/** Members: active cookbooks + recipes for the planner. */
export const getPrepLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { loadPrepLibrary } = await import("./prep-library.server");
    return loadPrepLibrary();
  });

export const adminListCookbooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: books }, { data: recipes }] = await Promise.all([
      supabaseAdmin.from("prep_cookbooks").select("*").order("sort").order("created_at"),
      supabaseAdmin.from("prep_recipes").select("id,slug,cookbook_id,active,data,created_at").order("created_at"),
    ]);
    return {
      cookbooks: (books ?? []).map((b) => ({
        id: b.id, slug: b.slug, title: b.title, description: b.description, coverUrl: b.cover_url,
        isBuiltin: b.is_builtin, active: b.active,
        recipeCount: b.is_builtin ? 30 : (recipes ?? []).filter((r) => r.cookbook_id === b.id).length,
      })),
      recipes: (recipes ?? []).map((r) => {
        const d = r.data as any;
        return { id: r.id, slug: r.slug, cookbookId: r.cookbook_id, active: r.active,
          title: String(d?.title ?? r.slug), category: String(d?.category ?? ""), protein: Number(d?.nutrition?.protein ?? 0),
          calories: Number(d?.nutrition?.calories ?? 0) };
      }),
    };
  });

export const adminSaveCookbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(120),
    description: z.string().max(500).optional(),
    coverUrl: z.string().url().max(500).optional().or(z.literal("")),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { title: data.title, description: data.description || null, cover_url: data.coverUrl || null };
    if (data.id) {
      const { error } = await supabaseAdmin.from("prep_cookbooks").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabaseAdmin.from("prep_cookbooks").insert({ ...row, slug, sort: 10 });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["cookbook", "recipe"]), id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "cookbook" ? "prep_cookbooks" : "prep_recipes";
    const { error } = await supabaseAdmin.from(table).update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["cookbook", "recipe"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.kind === "cookbook") {
      const { data: b } = await supabaseAdmin.from("prep_cookbooks").select("is_builtin").eq("id", data.id).maybeSingle();
      if (b?.is_builtin) throw new Error("The original cookbook can be hidden, not deleted.");
      const { error } = await supabaseAdmin.from("prep_cookbooks").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("prep_recipes").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const RecipeZ = z.object({
  title: z.string().trim().min(2).max(140),
  category: z.enum(["breakfast", "lunch", "dinner", "meal-prep", "snack"]),
  description: z.string().max(600).default(""),
  nutrition: z.object({
    calories: z.number().min(0).max(3000), protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500), fat: z.number().min(0).max(300), fiber: z.number().min(0).max(150),
  }),
  prep: z.string().max(30).default(""),
  cook: z.string().max(30).default(""),
  totalMinutes: z.number().int().min(0).max(1440),
  serves: z.string().max(20).default("2"),
  level: z.string().max(20).default("Easy"),
  mealPrep: z.boolean().default(false),
  freezer: z.boolean().default(false),
  proteins: z.array(z.string().max(30)).max(10).default([]),
  ingredients: z.array(z.string().min(1).max(200)).min(1).max(60),
  steps: z.array(z.string().min(1).max(800)).min(1).max(40),
  storage: z.object({ fridge: z.string().max(200).optional(), freezer: z.string().max(200).optional(), reheat: z.string().max(200).optional() }).default({}),
  tips: z.object({ substitutions: z.string().max(400).optional(), serving: z.string().max(400).optional(), variations: z.string().max(400).optional() }).default({}),
  image: z.string().max(500).default(""),
});
export type ExtractedRecipe = z.infer<typeof RecipeZ>;

/** Gemini reads pasted cookbook text and returns structured recipes for review. */
export const adminExtractRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().trim().min(40).max(60000) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { resolveGeminiKey, GEMINI_OPENAI_URL, DEFAULT_GEMINI_TEXT_MODEL } = await import("@/lib/ai/gateway.server");
    const resolved = await resolveGeminiKey();
    if (!resolved) return { error: "Add your Gemini API key in admin settings first.", recipes: [] as ExtractedRecipe[] };
    const recipeSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        category: { type: "string", enum: ["breakfast", "lunch", "dinner", "meal-prep", "snack"] },
        description: { type: "string" },
        nutrition: { type: "object", properties: { calories: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, fiber: { type: "number" } }, required: ["calories", "protein", "carbs", "fat", "fiber"] },
        prep: { type: "string" }, cook: { type: "string" }, totalMinutes: { type: "number" },
        serves: { type: "string" }, level: { type: "string" },
        mealPrep: { type: "boolean" }, freezer: { type: "boolean" },
        proteins: { type: "array", items: { type: "string" } },
        ingredients: { type: "array", items: { type: "string" } },
        steps: { type: "array", items: { type: "string" } },
        storage: { type: "object", properties: { fridge: { type: "string" }, freezer: { type: "string" }, reheat: { type: "string" } } },
        tips: { type: "object", properties: { substitutions: { type: "string" }, serving: { type: "string" }, variations: { type: "string" } } },
      },
      required: ["title", "category", "description", "nutrition", "prep", "cook", "totalMinutes", "serves", "level", "mealPrep", "freezer", "proteins", "ingredients", "steps"],
    };
    let res: Response;
    try {
      res = await fetch(`${GEMINI_OPENAI_URL}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${resolved.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: DEFAULT_GEMINI_TEXT_MODEL,
          messages: [
            { role: "system", content: "You convert cookbook text into structured recipes. Extract every complete recipe in the text. Keep ingredient lines with quantity + unit first (e.g. '1 cup cooked quinoa'). Steps are short imperative sentences. If nutrition is missing, estimate it per serving from the ingredients. proteins lists main protein sources in lowercase single words (tofu, tempeh, lentil, bean, chickpea, seitan, edamame). Never invent recipes that are not in the text." },
            { role: "user", content: data.text },
          ],
          tools: [{ type: "function", function: { name: "save_recipes", description: "Return extracted recipes", parameters: { type: "object", properties: { recipes: { type: "array", items: recipeSchema } }, required: ["recipes"] } } }],
          tool_choice: { type: "function", function: { name: "save_recipes" } },
        }),
      });
    } catch (e) {
      return { error: `Could not reach Gemini: ${(e as Error).message}`, recipes: [] as ExtractedRecipe[] };
    }
    if (!res.ok) {
      const body = await res.text();
      console.error("Gemini extract failed", res.status, body.slice(0, 500));
      const msg = res.status === 429 ? "Gemini quota/rate limit reached — wait a minute and try again." : `Gemini error ${res.status}: ${body.slice(0, 200)}`;
      return { error: msg, recipes: [] as ExtractedRecipe[] };
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { error: "Gemini returned no recipes. Paste the full recipe text (ingredients + steps).", recipes: [] as ExtractedRecipe[] };
    const raw = (JSON.parse(args).recipes ?? []) as unknown[];
    const recipes: ExtractedRecipe[] = [];
    for (const r of raw) { const p = RecipeZ.safeParse(r); if (p.success) recipes.push(p.data); }
    if (!recipes.length) return { error: "Couldn't read a complete recipe from that text.", recipes };
    return { error: null as string | null, recipes };
  });

export const adminSaveRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cookbookId: z.string().uuid(), recipes: z.array(RecipeZ).min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = data.recipes.map((r) => {
      const why = [
        r.nutrition.protein ? `Packs ${r.nutrition.protein} g of plant protein per serving` : null,
        r.totalMinutes ? `Ready in ${r.totalMinutes} min` : null,
        r.mealPrep ? "Meal-prep friendly — make it ahead" : null,
        r.freezer ? "Freezer friendly for busy weeks" : null,
      ].filter(Boolean);
      return {
        cookbook_id: data.cookbookId,
        slug: `${slugify(r.title)}-${Math.random().toString(36).slice(2, 6)}`,
        data: { ...r, why, cookbookPage: 0 },
      };
    });
    const { error } = await supabaseAdmin.from("prep_recipes").insert(rows as any);
    if (error) throw new Error(error.message);
    return { saved: rows.length };
  });
