import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardStats = {
  products_total: number;
  products_published: number;
  products_draft: number;
  orders_total: number;
  revenue_total: number;
  customers_total: number;
  subscribers_total: number;
  blog_posts_total: number;
  blog_posts_published: number;
  recent_sales: Array<{
    id: string;
    email: string | null;
    amount: number | null;
    currency: string | null;
    product_slug: string | null;
    created_at: string;
  }>;
  recent_downloads: Array<{
    id: string;
    email: string | null;
    downloaded_at: string;
    download_count: number | null;
  }>;
};

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardStats> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [prod, subs, dl, blog] = await Promise.all([
      supabaseAdmin.from("products").select("id, status"),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("cookbook_downloads").select("*").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("blog_posts" as any).select("id, status"),
    ]);

    const products = (prod.data ?? []) as Array<{ status: string }>;
    const downloads = (dl.data ?? []) as Array<any>;
    const blogs = ((blog.data ?? []) as Array<{ status: string }>) ?? [];

    const uniqEmails = new Set<string>();
    downloads.forEach((d) => { if (d.email) uniqEmails.add(d.email.toLowerCase()); });

    const revenue = downloads.reduce((sum, d) => sum + (Number(d.amount ?? 0) || 0), 0);

    return {
      products_total: products.length,
      products_published: products.filter((p) => p.status === "published").length,
      products_draft: products.filter((p) => p.status !== "published").length,
      orders_total: downloads.length,
      revenue_total: revenue,
      customers_total: uniqEmails.size,
      subscribers_total: subs.count ?? 0,
      blog_posts_total: blogs.length,
      blog_posts_published: blogs.filter((b) => b.status === "published").length,
      recent_sales: downloads.slice(0, 10).map((d) => ({
        id: d.id,
        email: d.email ?? null,
        amount: d.amount ?? null,
        currency: d.currency ?? null,
        product_slug: d.product_slug ?? null,
        created_at: d.created_at,
      })),
      recent_downloads: downloads
        .filter((d) => (d.download_count ?? 0) > 0)
        .slice(0, 10)
        .map((d) => ({
          id: d.id,
          email: d.email ?? null,
          downloaded_at: d.last_downloaded_at ?? d.created_at,
          download_count: d.download_count ?? 0,
        })),
    };
  });