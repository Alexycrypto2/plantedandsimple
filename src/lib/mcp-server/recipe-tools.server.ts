/** Recipe read/edit/SEO tools for the MCP endpoint. Every edit snapshots into recipe_versions first. Server-only. */
import { z } from "zod";
import { auditSeo, recipeToHtml } from "@/lib/content/seo-doctor";

const admin = async (): Promise<any> => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const FIELDS = "id,slug,title,subtitle,description,ingredients,instructions,nutrition,tips,prep_minutes,cook_minutes,servings,difficulty,tags,pinterest_description,seo_title,seo_description,status,hero_image_id,published_at,updated_at";
const EDITABLE = ["title", "subtitle", "description", "seo_title", "seo_description", "pinterest_description", "slug", "tips", "tags", "ingredients", "instructions", "nutrition", "servings", "prep_minutes", "cook_minutes", "difficulty"] as const;
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (x: any): string => (typeof x === "string" ? x : x && typeof x === "object" ? Object.values(x).filter((v) => typeof v === "string" || typeof v === "number").join(" ") : "");
const arr = (x: any): string[] => (Array.isArray(x) ? x.map(text).filter(Boolean) : []);

async function load(id: string) {
  const { data, error } = await (await admin()).from("recipes").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Recipe not found");
  return data;
}

export function recipeSeo(r: any, keyword?: string) {
  const nutrition = arr(r.nutrition);
  const find = (k: string) => nutrition.find((n) => n.toLowerCase().includes(k)) ?? "";
  const report = auditSeo({
    title: r.title, seoTitle: r.seo_title ?? "", seoDescription: r.seo_description ?? "", keyword: keyword ?? r.title, slug: r.slug, kind: "recipe",
    html: recipeToHtml({ description: r.description ?? "", ingredients: arr(r.ingredients).filter((l) => !l.startsWith("## ")), instructions: arr(r.instructions), nutrition, tips: arr(r.tips) }),
    extra: { prepMinutes: Number(r.prep_minutes ?? 0), cookMinutes: Number(r.cook_minutes ?? 0), servings: String(r.servings ?? ""), calories: find("calor"), protein: find("protein"), hasImage: !!r.hero_image_id, pinterestDescription: r.pinterest_description ?? "" },
  } as any);
  return {
    score: report.score, keyword: report.keyword, words: report.words,
    failing_checks: report.checks.filter((c) => !c.pass).map((c: any) => ({ id: c.id, label: c.label, category: c.category, weight: c.weight, fix: c.fix, manual: !!c.manual })),
    passing_checks: report.checks.filter((c) => c.pass).map((c) => c.label),
    editable_fields_hint: "Fix failures with update_recipe: title, seo_title, seo_description, description (intro prose — counts toward word count and first-120-words keyword), tips, pinterest_description, slug. Ingredients, instructions, nutrition and servings are editable too.",
  };
}

export const RECIPE_TOOLS = [
  {
    name: "get_recipe",
    description: "Get one recipe by id or slug with every editable field.",
    inputSchema: z.object({ id: z.string().uuid().optional(), slug: z.string().max(200).optional() }).strict().refine((v) => v.id || v.slug, "Provide id or slug"),
    readOnly: true,
    async run({ id, slug }: any) {
      const q = (await admin()).from("recipes").select(FIELDS);
      const { data, error } = await (id ? q.eq("id", id) : q.eq("slug", slug)).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Recipe not found");
      return { recipe: data };
    },
  },
  {
    name: "get_recipe_seo_score",
    description: "Run SEO Doctor on a recipe and return the score plus every failing check with how to fix it.",
    inputSchema: z.object({ id: z.string().uuid(), keyword: z.string().max(120).optional() }).strict(),
    readOnly: true,
    async run({ id, keyword }: any) { return recipeSeo(await load(id), keyword); },
  },
  {
    name: "update_recipe",
    description: "Edit a recipe: text/SEO fields, ingredients, steps, nutrition, servings and times. Send the FULL list for any array field you change (it replaces the old list). Saves a rollback version first and returns the new SEO score.",
    inputSchema: z.object({
      id: z.string().uuid(),
      title: z.string().min(3).max(200).optional(), subtitle: z.string().max(300).optional(),
      description: z.string().max(5000).optional(),
      seo_title: z.string().max(120).optional(), seo_description: z.string().max(320).optional(),
      pinterest_description: z.string().max(800).optional(),
      slug: z.string().regex(slugRe).max(120).optional(),
      tips: z.array(z.string().min(3).max(600)).max(10).optional(),
      tags: z.array(z.string().min(1).max(60)).max(30).optional(),
      ingredients: z.array(z.union([z.string().min(1).max(300), z.object({ group: z.string().max(120).nullable().optional(), items: z.array(z.string().min(1).max(300)).min(1).max(60) })])).min(1).max(40).optional().describe("Plain lines like '200 g extra-firm tofu' or groups {group, items}"),
      instructions: z.array(z.union([z.string().min(3).max(2000), z.object({ title: z.string().max(200).nullable().optional(), body: z.string().min(3).max(2000), image_url: z.string().max(1000).optional() })])).min(1).max(40).optional().describe("Steps; keep existing image_url values to preserve step photos"),
      nutrition: z.array(z.object({ label: z.string().min(1).max(60), value: z.string().min(1).max(60) })).max(20).optional().describe("Per-serving rows like {label:'Protein', value:'24 g'}"),
      servings: z.string().max(60).optional(),
      prep_minutes: z.number().int().min(0).max(1440).optional(),
      cook_minutes: z.number().int().min(0).max(1440).optional(),
      difficulty: z.string().max(40).optional(),
      keyword: z.string().max(120).optional().describe("Focus keyword used for the returned SEO score"),
    }).strict(),
    readOnly: false,
    async run(i: any) {
      const db = await admin();
      const cur = await load(i.id);
      const patch: Record<string, unknown> = {};
      if (i.ingredients) {
        const all = i.ingredients as any[];
        i.ingredients = all.every((x) => typeof x === "string") ? [{ group: null, items: all }] : all.map((x) => (typeof x === "string" ? { group: null, items: [x] } : { group: x.group ?? null, items: x.items }));
      }
      if (i.instructions) i.instructions = (i.instructions as any[]).map((x) => (typeof x === "string" ? { title: null, body: x } : x));
      for (const k of EDITABLE) {
        if (i[k] !== undefined && JSON.stringify(i[k]) !== JSON.stringify(cur[k])) patch[k] = i[k];
      }
      const changed = Object.keys(patch);
      if (!changed.length) return { updated: false, reason: "Nothing changed", seo: recipeSeo(cur, i.keyword) };
      const { data: ver, error: vErr } = await db.from("recipe_versions").insert({ recipe_id: cur.id, snapshot: cur, changed_fields: changed, source: "mcp" }).select("id").single();
      if (vErr) throw new Error(`Could not save rollback version, nothing was changed: ${vErr.message}`);
      const { error } = await db.from("recipes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", cur.id);
      if (error) throw new Error(error.message);
      return { updated: true, changed_fields: changed, rollback_version_id: ver.id, seo: recipeSeo({ ...cur, ...patch }, i.keyword) };
    },
  },
  {
    name: "list_recipe_versions",
    description: "List saved rollback versions for a recipe.",
    inputSchema: z.object({ id: z.string().uuid() }).strict(),
    readOnly: true,
    async run({ id }: any) {
      const { data, error } = await (await admin()).from("recipe_versions").select("id,changed_fields,source,created_at").eq("recipe_id", id).order("created_at", { ascending: false }).limit(50);
      if (error) throw new Error(error.message);
      return { versions: data };
    },
  },
  {
    name: "rollback_recipe",
    description: "Restore a recipe's text, ingredients, steps and nutrition to a saved version (the current state is saved first).",
    inputSchema: z.object({ version_id: z.string().uuid() }).strict(),
    readOnly: false,
    async run({ version_id }: any) {
      const db = await admin();
      const { data: v } = await db.from("recipe_versions").select("recipe_id,snapshot").eq("id", version_id).maybeSingle();
      if (!v) throw new Error("Version not found");
      const cur = await load(v.recipe_id);
      const { error: sErr } = await db.from("recipe_versions").insert({ recipe_id: cur.id, snapshot: cur, changed_fields: ["rollback"], source: "mcp-rollback" });
      if (sErr) throw new Error(`Could not save current version, nothing was changed: ${sErr.message}`);
      const s = v.snapshot;
      const restore: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of EDITABLE) if (s[k] !== undefined) restore[k] = s[k];
      const { error } = await db.from("recipes").update(restore).eq("id", cur.id);
      if (error) throw new Error(error.message);
      return { restored: true, recipe_id: cur.id };
    },
  },
  {
    name: "set_recipe_status",
    description: "Publish a draft recipe or move it back to draft. Publishing keeps an existing publish date. Returns the live URL and SEO score.",
    inputSchema: z.object({ id: z.string().uuid(), status: z.enum(["published", "draft"]) }).strict(),
    readOnly: false,
    async run({ id, status }: any) {
      const db = await admin();
      const cur = await load(id);
      if (cur.status === status) return { updated: false, status, url: `https://plantedandsimple.com/recipes/${cur.slug}` };
      const { error: sErr } = await db.from("recipe_versions").insert({ recipe_id: cur.id, snapshot: cur, changed_fields: ["status"], source: "mcp-status" });
      if (sErr) throw new Error(`Could not save rollback version, nothing was changed: ${sErr.message}`);
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "published" && !cur.published_at) patch.published_at = now;
      const { error } = await db.from("recipes").update(patch).eq("id", cur.id);
      if (error) throw new Error(error.message);
      return { updated: true, status, url: `https://plantedandsimple.com/recipes/${cur.slug}`, seo: recipeSeo(cur) };
    },
  },
] as const;
