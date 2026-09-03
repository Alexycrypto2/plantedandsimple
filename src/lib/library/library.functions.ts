import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type {
  Category,
  Collection,
  HomepageSection,
  MediaItem,
  Recipe,
  SearchHit,
} from "./types";

function serverPublic() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public database configuration is missing");
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function mediaMap(sb: any, ids: Array<string | null | undefined>) {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (!unique.length) return new Map<string, string>();
  const { data } = await sb.from("media").select("id, public_url").in("id", unique);
  return new Map<string, string>((data ?? []).map((m: any) => [m.id, m.public_url]));
}

function mapRecipe(r: any, media: Map<string, string>): Recipe {
  const rawIngredients = Array.isArray(r.ingredients) ? r.ingredients : [];
  const ingredients = rawIngredients.length > 0 && rawIngredients.every((item: unknown) => typeof item === "string")
    ? [{ group: null, items: rawIngredients.filter((item: unknown): item is string => typeof item === "string") }]
    : rawIngredients.map((group: any) => ({
        group: typeof group?.group === "string" ? group.group : null,
        items: Array.isArray(group?.items) ? group.items.filter((item: unknown): item is string => typeof item === "string") : [],
      })).filter((group: any) => group.items.length > 0);
  const rawInstructions = Array.isArray(r.instructions) ? r.instructions : [];
  const instructions = rawInstructions.map((step: any) =>
    typeof step === "string"
      ? { title: null, body: step }
      : { title: typeof step?.title === "string" ? step.title : null, body: typeof step?.body === "string" ? step.body : "" },
  ).filter((step: any) => step.body);
  const nutrition = (Array.isArray(r.nutrition) ? r.nutrition : []).filter(
    (item: any) => item && typeof item.label === "string" && typeof item.value === "string",
  );
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? null,
    description: r.description ?? "",
    hero_image_id: r.hero_image_id ?? null,
    hero_image_url: r.hero_image_id ? (media.get(r.hero_image_id) ?? null) : null,
    gallery_ids: r.gallery_ids ?? [],
    gallery_urls: (r.gallery_ids ?? []).map((id: string) => media.get(id)).filter(Boolean) as string[],
    ingredients,
    instructions,
    nutrition,
    tips: (Array.isArray(r.tips) ? r.tips : []).filter((item: unknown): item is string => typeof item === "string"),
    prep_minutes: r.prep_minutes ?? null,
    cook_minutes: r.cook_minutes ?? null,
    servings: r.servings ?? null,
    difficulty: r.difficulty ?? "easy",
    tags: r.tags ?? [],
    pinterest_description: r.pinterest_description ?? null,
    seo_title: r.seo_title ?? null,
    seo_description: r.seo_description ?? null,
    status: r.status ?? "draft",
    is_featured: !!r.is_featured,
    published_at: r.published_at ?? null,
    created_at: r.created_at,
  };
}

const RECIPE_COLUMNS =
  "id, slug, title, subtitle, description, hero_image_id, gallery_ids, ingredients, instructions, nutrition, tips, prep_minutes, cook_minutes, servings, difficulty, tags, pinterest_description, seo_title, seo_description, status, is_featured, published_at, created_at";

/* ------------------------------------------------------------------ homepage */

export const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic() as any;
  const [sections, settings] = await Promise.all([
    sb.from("homepage_sections").select("*").eq("enabled", true).order("sort_order"),
    sb.from("site_settings").select("key, value"),
  ]);
  const settingsMap: Record<string, any> = {};
  for (const row of settings.data ?? []) settingsMap[row.key] = row.value;
  return {
    sections: (sections.data ?? []) as HomepageSection[],
    settings: settingsMap,
  };
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic() as any;
  const { data } = await sb.from("site_settings").select("key, value");
  const out: Record<string, any> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
});

/* ------------------------------------------------------------------ taxonomy */

export const listCategories = createServerFn({ method: "GET" }).handler(async (): Promise<Category[]> => {
  const sb = serverPublic() as any;
  const { data } = await sb.from("categories").select("*").order("sort_order");
  const media = await mediaMap(sb, (data ?? []).map((c: any) => c.image_id));
  return (data ?? []).map((c: any) => ({ ...c, image_url: c.image_id ? (media.get(c.image_id) ?? null) : null }));
});

export const listCollections = createServerFn({ method: "GET" })
  .inputValidator((d?: { featuredOnly?: boolean }) => ({ featuredOnly: d?.featuredOnly ?? false }))
  .handler(async ({ data }): Promise<Collection[]> => {
    const sb = serverPublic() as any;
    let q = sb.from("collections").select("*").order("sort_order");
    if (data.featuredOnly) q = q.eq("is_featured", true);
    const { data: rows } = await q;
    const media = await mediaMap(sb, (rows ?? []).map((c: any) => c.image_id));
    return (rows ?? []).map((c: any) => ({ ...c, image_url: c.image_id ? (media.get(c.image_id) ?? null) : null }));
  });

/* ------------------------------------------------------------------ recipes */

export const listPublishedRecipes = createServerFn({ method: "GET" })
  .inputValidator((d?: { limit?: number; category?: string | null }) => ({
    limit: Math.min(Math.max(Number(d?.limit ?? 24), 1), 60),
    category: d?.category ?? null,
  }))
  .handler(async ({ data }): Promise<Recipe[]> => {
    const sb = serverPublic() as any;
    let ids: string[] | null = null;
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (!cat) return [];
      const { data: links } = await sb
        .from("content_categories")
        .select("content_id")
        .eq("content_type", "recipe")
        .eq("category_id", cat.id);
      const linked = (links ?? []).map((l: any) => l.content_id as string);
      if (!linked.length) return [];
      ids = linked;
    }
    let q = sb
      .from("recipes")
      .select(RECIPE_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);
    if (ids) q = q.in("id", ids);
    const { data: rows } = await q;
    const media = await mediaMap(sb, [
      ...(rows ?? []).map((r: any) => r.hero_image_id),
      ...(rows ?? []).flatMap((r: any) => r.gallery_ids ?? []),
    ]);
    return (rows ?? []).map((r: any) => mapRecipe(r, media));
  });

export const getRecipeBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = serverPublic() as any;
    const { data: row } = await sb
      .from("recipes")
      .select(RECIPE_COLUMNS)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!row) return null;
    const media = await mediaMap(sb, [row.hero_image_id, ...(row.gallery_ids ?? [])]);
    const recipe = mapRecipe(row, media);

    const { data: catLinks } = await sb
      .from("content_categories")
      .select("category_id")
      .eq("content_type", "recipe")
      .eq("content_id", row.id);
    if (catLinks?.length) {
      const { data: cats } = await sb
        .from("categories")
        .select("id, slug, name")
        .in("id", catLinks.map((c: any) => c.category_id));
      recipe.categories = cats ?? [];
    }

    const related = await resolveRelations(sb, "recipe", row.id);
    return { recipe, related };
  });

/* ------------------------------------------------------------------ relations */

async function resolveRelations(sb: any, fromType: string, fromId: string) {
  const { data: rels } = await sb
    .from("content_relations")
    .select("to_type, to_id")
    .eq("from_type", fromType)
    .eq("from_id", fromId)
    .order("sort_order");
  const out: { recipes: any[]; blogs: any[]; products: any[] } = { recipes: [], blogs: [], products: [] };
  if (!rels?.length) return out;
  const byType: Record<string, string[]> = {};
  for (const r of rels) (byType[r.to_type] ??= []).push(r.to_id);

  if (byType["recipe"]?.length) {
    const { data } = await sb
      .from("recipes")
      .select("id, slug, title, subtitle, hero_image_id")
      .in("id", byType["recipe"])
      .eq("status", "published");
    const media = await mediaMap(sb, (data ?? []).map((r: any) => r.hero_image_id));
    out.recipes = (data ?? []).map((r: any) => ({ ...r, image_url: r.hero_image_id ? media.get(r.hero_image_id) : null }));
  }
  if (byType["blog"]?.length) {
    const { data } = await sb
      .from("blog_posts")
      .select("id, slug, title, excerpt, featured_image_url")
      .in("id", byType["blog"])
      .eq("status", "published");
    out.blogs = data ?? [];
  }
  if (byType["product"]?.length) {
    const { data } = await sb
      .from("products")
      .select("id, slug, title, subtitle, cover_image_url, price_cents, currency")
      .in("id", byType["product"])
      .eq("status", "published");
    out.products = data ?? [];
  }
  return out;
}

export const getRelatedContent = createServerFn({ method: "GET" })
  .inputValidator((d: { fromType: string; fromId: string }) => d)
  .handler(async ({ data }) => resolveRelations(serverPublic() as any, data.fromType, data.fromId));

/* ------------------------------------------------------------------ collections page */

export const getCollectionBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = serverPublic() as any;
    const { data: col } = await sb.from("collections").select("*").eq("slug", data.slug).maybeSingle();
    if (!col) return null;
    const { data: links } = await sb
      .from("content_collections")
      .select("content_type, content_id")
      .eq("collection_id", col.id)
      .order("sort_order");
    const byType: Record<string, string[]> = {};
    for (const l of links ?? []) (byType[l.content_type] ??= []).push(l.content_id);

    const recipes: Recipe[] = [];
    let products: any[] = [];
    let blogs: any[] = [];

    if (byType["recipe"]?.length) {
      const { data: rows } = await sb
        .from("recipes")
        .select(RECIPE_COLUMNS)
        .in("id", byType["recipe"])
        .eq("status", "published");
      const media = await mediaMap(sb, (rows ?? []).map((r: any) => r.hero_image_id));
      recipes.push(...(rows ?? []).map((r: any) => mapRecipe(r, media)));
    }
    if (byType["product"]?.length) {
      const { data } = await sb
        .from("products")
        .select("id, slug, title, subtitle, cover_image_url, price_cents, compare_at_cents, currency")
        .in("id", byType["product"])
        .eq("status", "published");
      products = data ?? [];
    }
    if (byType["blog"]?.length) {
      const { data } = await sb
        .from("blog_posts")
        .select("id, slug, title, excerpt, featured_image_url")
        .in("id", byType["blog"])
        .eq("status", "published");
      blogs = data ?? [];
    }

    const cover = col.image_id ? (await mediaMap(sb, [col.image_id])).get(col.image_id) ?? null : null;
    return { collection: { ...col, image_url: cover } as Collection, recipes, products, blogs };
  });

/* ------------------------------------------------------------------ search */

export const searchLibrary = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => ({ q: String(d.q ?? "").trim().slice(0, 120) }))
  .handler(async ({ data }): Promise<SearchHit[]> => {
    if (data.q.length < 2) return [];
    const sb = serverPublic() as any;
    const like = `%${data.q}%`;
    const [recipes, blogs, products, collections] = await Promise.all([
      sb.from("recipes").select("id, slug, title, description, hero_image_id").eq("status", "published").or(`title.ilike.${like},description.ilike.${like}`).limit(8),
      sb.from("blog_posts").select("id, slug, title, excerpt, featured_image_url").eq("status", "published").or(`title.ilike.${like},excerpt.ilike.${like}`).limit(8),
      sb.from("products").select("id, slug, title, subtitle, cover_image_url").eq("status", "published").or(`title.ilike.${like},subtitle.ilike.${like}`).limit(8),
      sb.from("collections").select("id, slug, name, description").ilike("name", like).limit(6),
    ]);
    const media = await mediaMap(sb, (recipes.data ?? []).map((r: any) => r.hero_image_id));
    const hits: SearchHit[] = [];
    for (const r of recipes.data ?? [])
      hits.push({ type: "recipe", id: r.id, slug: r.slug, title: r.title, excerpt: r.description, image_url: r.hero_image_id ? media.get(r.hero_image_id) ?? null : null });
    for (const b of blogs.data ?? [])
      hits.push({ type: "blog", id: b.id, slug: b.slug, title: b.title, excerpt: b.excerpt, image_url: b.featured_image_url });
    for (const p of products.data ?? [])
      hits.push({ type: "product", id: p.id, slug: p.slug, title: p.title, excerpt: p.subtitle, image_url: p.cover_image_url });
    for (const c of collections.data ?? [])
      hits.push({ type: "collection", id: c.id, slug: c.slug, title: c.name, excerpt: c.description, image_url: null });
    return hits;
  });

export const listPublicMedia = createServerFn({ method: "GET" }).handler(async (): Promise<MediaItem[]> => {
  const sb = serverPublic() as any;
  const { data } = await sb.from("media").select("*").order("created_at", { ascending: false }).limit(200);
  return data ?? [];
});