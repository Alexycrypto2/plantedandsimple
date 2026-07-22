import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProductStatus = "draft" | "published";

export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  price_cents: number;
  compare_at_cents: number;
  currency: string;
  price_display: string;
  compare_at_display: string;
  paddle_price_external_id: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  seo_title: string | null;
  seo_description: string | null;
};

export type AdminProduct = PublicProduct & {
  status: ProductStatus;
  pdf_asset_url: string | null;
  bonus_files: Array<{ label: string; url: string }>;
  pinterest_description: string | null;
  published_at: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

function toDisplay(cents: number) {
  return (cents / 100).toFixed(2);
}

function serverPublic() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function mapPublic(row: any): PublicProduct {
  const cat = row.category ?? row.product_categories ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description ?? "",
    category_id: row.category_id,
    category_slug: cat?.slug ?? null,
    category_name: cat?.name ?? null,
    cover_image_url: row.cover_image_url,
    gallery_urls: row.gallery_urls ?? [],
    price_cents: row.price_cents,
    compare_at_cents: row.compare_at_cents,
    currency: row.currency,
    price_display: toDisplay(row.price_cents),
    compare_at_display: toDisplay(row.compare_at_cents),
    paddle_price_external_id: row.paddle_price_external_id,
    is_featured: !!row.is_featured,
    is_bestseller: !!row.is_bestseller,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
  };
}

function mapAdmin(row: any): AdminProduct {
  return {
    ...mapPublic(row),
    status: row.status,
    pdf_asset_url: row.pdf_asset_url,
    bonus_files: row.bonus_files ?? [],
    pinterest_description: row.pinterest_description,
    published_at: row.published_at,
    created_at: row.created_at,
  };
}

const productSelect =
  "id, slug, title, subtitle, description, category_id, cover_image_url, gallery_urls, price_cents, compare_at_cents, currency, paddle_price_external_id, is_featured, is_bestseller, seo_title, seo_description, category:product_categories(slug, name)";

const adminSelect = productSelect +
  ", status, pdf_asset_url, bonus_files, pinterest_description, published_at, created_at";

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const sb = serverPublic();
    const { data, error } = await sb
      .from("product_categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  },
);

export const listPublishedProducts = createServerFn({ method: "GET" })
  .inputValidator(
    (
      d: { category?: string; sort?: "new" | "price_asc" | "price_desc"; limit?: number } | undefined,
    ) => d ?? {},
  )
  .handler(async ({ data }): Promise<PublicProduct[]> => {
    const sb = serverPublic();
    let q = sb
      .from("products")
      .select(productSelect)
      .eq("status", "published");
    if (data.category) {
      // filter by category slug via nested
      const { data: cat } = await sb
        .from("product_categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (data.sort === "price_asc") q = q.order("price_cents", { ascending: true });
    else if (data.sort === "price_desc") q = q.order("price_cents", { ascending: false });
    else q = q.order("published_at", { ascending: false, nullsFirst: false });
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapPublic);
  });

export const getPublishedProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<PublicProduct | null> => {
    const sb = serverPublic();
    const { data: row, error } = await sb
      .from("products")
      .select(productSelect)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapPublic(row) : null;
  });

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProduct[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(adminSelect)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAdmin);
  });

export type ProductUpsertInput = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string;
  category_id?: string | null;
  cover_image_url?: string | null;
  gallery_urls?: string[];
  pdf_asset_url?: string | null;
  price_cents: number;
  compare_at_cents: number;
  currency?: string;
  paddle_price_external_id?: string | null;
  is_featured?: boolean;
  is_bestseller?: boolean;
  status?: ProductStatus;
  seo_title?: string | null;
  seo_description?: string | null;
  pinterest_description?: string | null;
};

function validateUpsert(d: ProductUpsertInput): ProductUpsertInput {
  if (!d.slug || !/^[a-z0-9-]+$/.test(d.slug))
    throw new Error("Slug must be lowercase letters, numbers, and hyphens.");
  if (!d.title || d.title.length > 200) throw new Error("Title required (<=200 chars).");
  const price = Math.round(Number(d.price_cents));
  const compare = Math.round(Number(d.compare_at_cents));
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price.");
  if (!Number.isFinite(compare) || compare < price)
    throw new Error("Compare-at price must be >= price.");
  const currency = (d.currency ?? "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid currency.");
  return { ...d, price_cents: price, compare_at_cents: compare, currency };
}

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ProductUpsertInput) => validateUpsert(d))
  .handler(async ({ data, context }): Promise<AdminProduct> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const payload: any = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      description: data.description ?? "",
      category_id: data.category_id ?? null,
      cover_image_url: data.cover_image_url ?? null,
      gallery_urls: data.gallery_urls ?? [],
      pdf_asset_url: data.pdf_asset_url ?? null,
      price_cents: data.price_cents,
      compare_at_cents: data.compare_at_cents,
      currency: data.currency,
      paddle_price_external_id: data.paddle_price_external_id ?? null,
      is_featured: !!data.is_featured,
      is_bestseller: !!data.is_bestseller,
      status: data.status ?? "draft",
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      pinterest_description: data.pinterest_description ?? null,
    };
    if (payload.status === "published") {
      payload.published_at = new Date().toISOString();
    }
    let row;
    if (data.id) {
      const { data: r, error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", data.id)
        .select(adminSelect)
        .single();
      if (error) throw new Error(error.message);
      row = r;
    } else {
      const { data: r, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select(adminSelect)
        .single();
      if (error) throw new Error(error.message);
      row = r;
    }
    return mapAdmin(row);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      slug: string;
      name: string;
      description?: string | null;
      sort_order?: number;
    }) => {
      if (!/^[a-z0-9-]+$/.test(d.slug))
        throw new Error("Slug must be lowercase letters, numbers, and hyphens.");
      if (!d.name) throw new Error("Name required.");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const payload: any = {
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      sort_order: data.sort_order ?? 0,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("product_categories")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });