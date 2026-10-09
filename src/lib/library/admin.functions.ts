import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const SIGNED_TTL = 60 * 60 * 24 * 365;

/* ------------------------------------------------------------------ media */

export const adminListMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const { data } = await sb.from("media").select("*").order("created_at", { ascending: false }).limit(300);
    return data ?? [];
  });

export const adminUploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ fileName: z.string().min(1).max(255), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]), base64: z.string().max(27_962_132), alt: z.string().max(500).optional(), tags: z.array(z.string().max(80)).max(30).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { decodeMediaUpload } = await import("./media-upload.server");
    const { bytes, ext, type } = decodeMediaUpload(data.base64, data.contentType);
    const sb = await admin();
    const path = `library/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, bytes, {
      contentType: type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: row, error: e2 } = await sb
      .from("media")
      .insert({
        storage_path: path,
        public_url: `/api/public/img/media/${path}`,
        alt: data.alt ?? "",
        title: data.fileName,
        mime_type: type,
        tags: data.tags ?? [],
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (e2) throw new Error(e2.message);
    return row;
  });

export const adminAddMediaByUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string; alt?: string; title?: string; tags?: string[] }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (/\/object\/sign\/|[?&]token=/i.test(data.url)) {
      throw new Error("Signed image links expire. Upload the image to Media instead.");
    }
    const sb = await admin();
    const { data: row, error } = await sb
      .from("media")
      .insert({
        public_url: data.url,
        alt: data.alt ?? "",
        title: data.title ?? null,
        tags: data.tags ?? [],
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; alt?: string; title?: string; tags?: string[] }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const patch: any = {};
    if (data.alt !== undefined) patch.alt = data.alt;
    if (data.title !== undefined) patch.title = data.title;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { error } = await sb.from("media").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const { data: row } = await sb.from("media").select("storage_path").eq("id", data.id).maybeSingle();
    if (row?.storage_path) await sb.storage.from("media").remove([row.storage_path]);
    const { error } = await sb.from("media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ generic entity CRUD */

const WRITABLE = {
  categories: ["slug", "name", "description", "image_id", "parent_id", "sort_order", "seo_title", "seo_description"],
  collections: ["slug", "name", "description", "image_id", "is_featured", "sort_order", "seo_title", "seo_description"],
  recipes: [
    "slug", "title", "subtitle", "description", "hero_image_id", "gallery_ids", "ingredients", "instructions",
    "nutrition", "tips", "prep_minutes", "cook_minutes", "servings", "difficulty", "tags",
    "pinterest_description", "seo_title", "seo_description", "status", "is_featured", "published_at",
  ],
  homepage_sections: ["kind", "title", "subtitle", "config", "sort_order", "enabled"],
} as const;

type Entity = keyof typeof WRITABLE;

function pick(entity: Entity, input: Record<string, any>) {
  const allowed = WRITABLE[entity] as readonly string[];
  const out: Record<string, any> = {};
  for (const k of Object.keys(input)) if (allowed.includes(k)) out[k] = input[k];
  return out;
}

export const adminListEntity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity: Entity }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!(data.entity in WRITABLE)) throw new Error("Unknown entity");
    const sb = await admin();
    const orderCol = data.entity === "recipes" ? "created_at" : "sort_order";
    const { data: rows, error } = await sb
      .from(data.entity)
      .select("*")
      .order(orderCol, { ascending: data.entity !== "recipes" });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSaveEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity: Entity; id?: string | null; values: Record<string, any> }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!(data.entity in WRITABLE)) throw new Error("Unknown entity");
    const sb = await admin();
    const values = pick(data.entity, data.values);
    if (data.entity === "recipes" && values.status === "published" && !values.published_at) {
      values.published_at = new Date().toISOString();
    }
    if (data.id) {
      const { data: row, error } = await sb.from(data.entity).update(values).eq("id", data.id).select("*").single();
      if (error) throw new Error(error.message);
      if (data.entity === "recipes") {
        const { syncContentGraph } = await import("./graph.server");
        await syncContentGraph("recipe", row.id);
      }
      return row;
    }
    if (data.entity === "recipes") values.author_id = context.userId;
    const { data: row, error } = await sb.from(data.entity).insert(values).select("*").single();
    if (error) throw new Error(error.message);
    if (data.entity === "recipes") {
      const { syncContentGraph } = await import("./graph.server");
      await syncContentGraph("recipe", row.id);
    }
    return row;
  });

export const adminDeleteEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity: Entity; id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!(data.entity in WRITABLE)) throw new Error("Unknown entity");
    const sb = await admin();
    const { error } = await sb.from(data.entity).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity: Entity; ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!(data.entity in WRITABLE)) throw new Error("Unknown entity");
    const sb = await admin();
    let i = 1;
    for (const id of data.ids) {
      await sb.from(data.entity).update({ sort_order: i++ }).eq("id", id);
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ relationships */

export const adminGetLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contentType: string; contentId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const [cats, cols, rels] = await Promise.all([
      sb.from("content_categories").select("category_id").eq("content_type", data.contentType).eq("content_id", data.contentId),
      sb.from("content_collections").select("collection_id").eq("content_type", data.contentType).eq("content_id", data.contentId),
      sb.from("content_relations").select("to_type, to_id").eq("from_type", data.contentType).eq("from_id", data.contentId),
    ]);
    return {
      categoryIds: (cats.data ?? []).map((r: any) => r.category_id),
      collectionIds: (cols.data ?? []).map((r: any) => r.collection_id),
      relations: (rels.data ?? []).map((r: any) => ({ type: r.to_type, id: r.to_id })),
    };
  });

export const adminSetLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      contentType: string;
      contentId: string;
      categoryIds?: string[];
      collectionIds?: string[];
      relations?: Array<{ type: string; id: string }>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();

    if (data.categoryIds) {
      await sb.from("content_categories").delete().eq("content_type", data.contentType).eq("content_id", data.contentId);
      if (data.categoryIds.length) {
        await sb.from("content_categories").insert(
          data.categoryIds.map((id) => ({ content_type: data.contentType, content_id: data.contentId, category_id: id })),
        );
      }
    }
    if (data.collectionIds) {
      await sb.from("content_collections").delete().eq("content_type", data.contentType).eq("content_id", data.contentId);
      if (data.collectionIds.length) {
        await sb.from("content_collections").insert(
          data.collectionIds.map((id, i) => ({
            content_type: data.contentType,
            content_id: data.contentId,
            collection_id: id,
            sort_order: i,
          })),
        );
      }
    }
    if (data.relations) {
      await sb.from("content_relations").delete().eq("from_type", data.contentType).eq("from_id", data.contentId);
      await sb.from("content_relations").delete().eq("to_type", data.contentType).eq("to_id", data.contentId).eq("relation", "related");
      if (data.relations.length) {
        const rows = data.relations.flatMap((r, i) => [
          { from_type: data.contentType, from_id: data.contentId, to_type: r.type, to_id: r.id, relation: "related", sort_order: i },
          { from_type: r.type, from_id: r.id, to_type: data.contentType, to_id: data.contentId, relation: "related", sort_order: i },
        ]);
        await sb.from("content_relations").upsert(rows, { onConflict: "from_type,from_id,to_type,to_id,relation" });
      }
    }
    const { syncContentGraph } = await import("./graph.server");
    await syncContentGraph(data.contentType, data.contentId);
    return { ok: true };
  });

/** Flat list of every linkable item, for relationship pickers. */
export const adminLinkableItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const [recipes, blogs, products] = await Promise.all([
      sb.from("recipes").select("id, title, status").order("created_at", { ascending: false }).limit(200),
      sb.from("blog_posts").select("id, title, status").order("created_at", { ascending: false }).limit(200),
      sb.from("products").select("id, title, status").order("created_at", { ascending: false }).limit(200),
    ]);
    return {
      recipe: recipes.data ?? [],
      blog: blogs.data ?? [],
      product: products.data ?? [],
    };
  });

/* ------------------------------------------------------------------ site settings */

export const adminListSiteSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const { data } = await sb.from("site_settings").select("key, value").order("key");
    return data ?? [];
  });

export const adminSaveSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: any }) => d)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const sb = await admin();
    const { error } = await sb
      .from("site_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });