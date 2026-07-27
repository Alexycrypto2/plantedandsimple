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
  subscribers_last_7d: number;
  subscribers_last_30d: number;
  free_guide_signups_total: number;
  free_to_checkout_pct: number;
  download_completion_pct: number;
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

    const now = Date.now();
    const iso7 = new Date(now - 7 * 86400_000).toISOString();
    const iso30 = new Date(now - 30 * 86400_000).toISOString();

    const [prod, subs, subsAll, dl, blog, freeGuide] = await Promise.all([
      supabaseAdmin.from("products").select("id, status"),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscribers").select("email, source, subscribed_at"),
      supabaseAdmin.from("cookbook_downloads").select("*").order("created_at", { ascending: false }).limit(50),
      (supabaseAdmin as any).from("blog_posts").select("id, status"),
      (supabaseAdmin as any).from("free_guide_downloads").select("email"),
    ]);

    const products = (prod.data ?? []) as Array<{ status: string }>;
    const downloads = (dl.data ?? []) as Array<any>;
    const blogs: Array<{ status: string }> = (blog.data as any) ?? [];
    const allSubs = (subsAll.data ?? []) as Array<{ email: string; source: string; subscribed_at: string }>;
    const freeSignups = (freeGuide.data ?? []) as Array<{ email: string }>;

    const uniqEmails = new Set<string>();
    downloads.forEach((d) => { if (d.email) uniqEmails.add(d.email.toLowerCase()); });

    const revenue = downloads.reduce((sum, d) => sum + (Number(d.amount ?? 0) || 0), 0);

    const subs7 = allSubs.filter((s) => s.subscribed_at >= iso7).length;
    const subs30 = allSubs.filter((s) => s.subscribed_at >= iso30).length;

    const freeEmails = new Set(
      allSubs.filter((s) => s.source === "free_guide").map((s) => s.email.toLowerCase()),
    );
    freeSignups.forEach((f) => freeEmails.add(f.email.toLowerCase()));
    const converted = Array.from(uniqEmails).filter((e) => freeEmails.has(e)).length;
    const freeConvPct = freeEmails.size ? Math.round((converted / freeEmails.size) * 1000) / 10 : 0;

    const buyersDownloaded = downloads.filter((d) => (d.download_count ?? 0) > 0).length;
    const dlPct = downloads.length ? Math.round((buyersDownloaded / downloads.length) * 1000) / 10 : 0;

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
      subscribers_last_7d: subs7,
      subscribers_last_30d: subs30,
      free_guide_signups_total: freeEmails.size,
      free_to_checkout_pct: freeConvPct,
      download_completion_pct: dlPct,
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