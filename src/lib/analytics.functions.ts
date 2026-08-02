import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

export type AnalyticsSeriesPoint = { date: string; views: number; clicks: number; sales: number };

export type AnalyticsOverview = {
  window_days: number;
  totals: {
    page_views: number;
    sessions: number;
    pinterest_clicks: number;
    pinterest_ctr: number;
    affiliate_clicks: number;
    cta_clicks: number;
    checkout_starts: number;
    purchases: number;
    conversion_pct: number;
    downloads: number;
    download_rate_pct: number;
    revenue: number;
    subscribers: number;
  };
  channels: Array<{ channel: string; views: number; conversions: number; ctr: number }>;
  top_pages: Array<{ slug: string; views: number; clicks: number }>;
  pins: Array<{ id: string; title: string; status: string; clicks: number }>;
  seo: Array<{ slug: string; title: string; views: number; has_meta: boolean }>;
  series: AnalyticsSeriesPoint[];
  recommendations: Array<{ id: string; title: string; reasoning: string; priority: number; kind: string }>;
  generated_at: string;
};

const day = (iso: string) => iso.slice(0, 10);

export const adminAnalyticsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { windowDays?: number } | undefined) => ({
    windowDays: Math.min(Math.max(Number(d?.windowDays ?? 30), 1), 365),
  }))
  .handler(async ({ data, context }): Promise<AnalyticsOverview> => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const since = new Date(Date.now() - data.windowDays * 864e5).toISOString();

    const [events, clicksRes, downloads, subs, pins, posts, recs] = await Promise.all([
      db.from("analytics_events").select("kind, ref_slug, session_id, metadata, occurred_at").gte("occurred_at", since).limit(20000),
      db.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("cookbook_downloads").select("id, email, download_count, created_at").gte("created_at", since).limit(5000),
      db.from("subscribers").select("id", { count: "exact", head: true }).gte("subscribed_at", since),
      db.from("pinterest_pins").select("id, title, status, link_url, created_at").order("created_at", { ascending: false }).limit(60),
      db.from("blog_posts").select("slug, title, seo_title, seo_description, status").limit(300),
      db.from("ai_recommendations").select("id, title, reasoning, priority, kind, status").eq("status", "new").order("priority", { ascending: false }).limit(6),
    ]);

    const rows = (events.data ?? []) as Array<any>;
    const dls = (downloads.data ?? []) as Array<any>;

    const sessions = new Set<string>();
    let views = 0, pinClicks = 0, ctaClicks = 0, checkouts = 0, purchases = 0;
    const byChannel = new Map<string, { views: number; conversions: number }>();
    const byPage = new Map<string, { views: number; clicks: number }>();
    const byDay = new Map<string, AnalyticsSeriesPoint>();
    const pinClickBySlug = new Map<string, number>();

    for (const e of rows) {
      const channel = String(e.metadata?.channel ?? "direct");
      const slug = e.ref_slug ?? String(e.metadata?.path ?? "/");
      const d = day(e.occurred_at);
      const point = byDay.get(d) ?? { date: d, views: 0, clicks: 0, sales: 0 };
      const ch = byChannel.get(channel) ?? { views: 0, conversions: 0 };
      const pg = byPage.get(slug) ?? { views: 0, clicks: 0 };
      if (e.session_id) sessions.add(e.session_id);

      switch (e.kind) {
        case "page_view":
        case "recipe_view":
        case "product_view":
        case "blog_view":
          views += 1; point.views += 1; ch.views += 1; pg.views += 1; break;
        case "pinterest_click":
          pinClicks += 1; point.clicks += 1; pg.clicks += 1;
          pinClickBySlug.set(slug, (pinClickBySlug.get(slug) ?? 0) + 1);
          break;
        case "cta_click":
        case "homepage_click":
        case "internal_link_click":
          ctaClicks += 1; point.clicks += 1; pg.clicks += 1; break;
        case "checkout_start":
          checkouts += 1; break;
        case "purchase":
          purchases += 1; point.sales += 1; ch.conversions += 1; break;
        default:
          break;
      }
      byDay.set(d, point);
      byChannel.set(channel, ch);
      byPage.set(slug, pg);
    }

    // Orders are the source of truth for revenue/downloads.
    const orders = dls.length;
    const revenue = orders * 14.99;
    const downloaded = dls.filter((d) => (d.download_count ?? 0) > 0).length;

    const series: AnalyticsSeriesPoint[] = [];
    for (let i = data.windowDays - 1; i >= 0; i--) {
      const d = day(new Date(Date.now() - i * 864e5).toISOString());
      series.push(byDay.get(d) ?? { date: d, views: 0, clicks: 0, sales: 0 });
    }

    const postList = (posts.data ?? []) as Array<any>;

    return {
      window_days: data.windowDays,
      totals: {
        page_views: views,
        sessions: sessions.size,
        pinterest_clicks: pinClicks,
        pinterest_ctr: views ? Math.round((pinClicks / views) * 1000) / 10 : 0,
        affiliate_clicks: clicksRes.count ?? 0,
        cta_clicks: ctaClicks,
        checkout_starts: checkouts,
        purchases: Math.max(purchases, orders),
        conversion_pct: views ? Math.round((Math.max(purchases, orders) / views) * 1000) / 10 : 0,
        downloads: downloaded,
        download_rate_pct: orders ? Math.round((downloaded / orders) * 1000) / 10 : 0,
        revenue: Math.round(revenue * 100) / 100,
        subscribers: subs.count ?? 0,
      },
      channels: [...byChannel.entries()]
        .map(([channel, v]) => ({
          channel,
          views: v.views,
          conversions: v.conversions,
          ctr: v.views ? Math.round((v.conversions / v.views) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      top_pages: [...byPage.entries()]
        .map(([slug, v]) => ({ slug, ...v }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      pins: ((pins.data ?? []) as Array<any>).slice(0, 10).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        clicks: pinClickBySlug.get(String(p.link_url ?? "").split("/").filter(Boolean).pop() ?? "") ?? 0,
      })),
      seo: postList
        .filter((p) => p.status === "published")
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          views: byPage.get(p.slug)?.views ?? 0,
          has_meta: Boolean(p.seo_title && p.seo_description),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      series,
      recommendations: ((recs.data ?? []) as Array<any>).map((r) => ({
        id: r.id,
        title: r.title,
        reasoning: r.reasoning,
        priority: r.priority,
        kind: r.kind,
      })),
      generated_at: new Date().toISOString(),
    };
  });
