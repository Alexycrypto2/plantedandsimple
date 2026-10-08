import type { Recipe } from "@/prep-kit/data/types";

export async function loadPrepLibrary() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: books } = await supabaseAdmin
    .from("prep_cookbooks").select("id,slug,title,is_builtin,active,cover_url").order("sort").order("created_at");
  const active = (books ?? []).filter((b) => b.active);
  const ids = active.filter((b) => !b.is_builtin).map((b) => b.id);
  let recipes: Recipe[] = [];
  if (ids.length) {
    const { data: rows } = await supabaseAdmin
      .from("prep_recipes").select("slug,data,cookbook_id").in("cookbook_id", ids).eq("active", true).order("created_at");
    const slugOf = new Map(active.map((b) => [b.id, b]));
    recipes = (rows ?? []).map((r, i) => {
      const b = slugOf.get(r.cookbook_id)!;
      const d = r.data as unknown as Recipe;
      return { ...d, id: r.slug, num: 100 + i, cookbook: b.slug, image: d.image || b.cover_url || "" };
    });
  }
  const builtin = (books ?? []).find((b) => b.is_builtin);
  return {
    builtinActive: builtin ? builtin.active : true,
    cookbooks: active.map((b) => ({ slug: b.slug, title: b.title, isBuiltin: b.is_builtin })),
    recipes,
  };
}
