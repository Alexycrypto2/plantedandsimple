import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BlogStatus = "draft" | "published";

export type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

export type AdminPost = PublicPost & {
  status: BlogStatus;
  created_at: string;
};

function serverPublic() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function mapPublic(r: any): PublicPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content ?? "",
    featured_image_url: r.featured_image_url,
    category: r.category,
    tags: r.tags ?? [],
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    published_at: r.published_at,
  };
}

const publicSelect =
  "id, slug, title, excerpt, content, featured_image_url, category, tags, seo_title, seo_description, published_at";

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPost[]> => {
    const sb = serverPublic();
    const { data, error } = await sb
      .from("blog_posts")
      .select(publicSelect)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPublic);
  },
);

export const getPublishedPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<PublicPost | null> => {
    const sb = serverPublic();
    const { data: row, error } = await sb
      .from("blog_posts")
      .select(publicSelect)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapPublic(row) : null;
  });

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPost[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select(publicSelect + ", status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({ ...mapPublic(r), status: r.status, created_at: r.created_at }));
  });

export type PostUpsertInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string;
  featured_image_url?: string | null;
  category?: string | null;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  status?: BlogStatus;
};

export const adminUpsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PostUpsertInput) => {
    if (!d.slug || !/^[a-z0-9-]+$/.test(d.slug))
      throw new Error("Slug must be lowercase letters, numbers, and hyphens.");
    if (!d.title || d.title.length > 250) throw new Error("Title required (<=250 chars).");
    return d;
  })
  .handler(async ({ data, context }): Promise<AdminPost> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      content: data.content ?? "",
      featured_image_url: data.featured_image_url ?? null,
      category: data.category ?? null,
      tags: data.tags ?? [],
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      status: data.status ?? "draft",
    };
    if (payload.status === "published") {
      payload.published_at = new Date().toISOString();
    }
    let row;
    if (data.id) {
      const { data: r, error } = await supabaseAdmin
        .from("blog_posts").update(payload).eq("id", data.id)
        .select(publicSelect + ", status, created_at").single();
      if (error) throw new Error(error.message);
      row = r;
    } else {
      payload.author_id = context.userId;
      const { data: r, error } = await supabaseAdmin
        .from("blog_posts").insert(payload)
        .select(publicSelect + ", status, created_at").single();
      if (error) throw new Error(error.message);
      row = r;
    }
    return { ...mapPublic(row), status: row.status, created_at: row.created_at };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });