import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { pageUrl } from "@/lib/seo";

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] ?? c);

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) throw new Error("Public content configuration is unavailable");
        const sb = createClient(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          } },
        });
        async function slugs(table: string, published: boolean) {
          const result: string[] = [];
          const pageSize = 500;
          for (let offset = 0; ; offset += pageSize) {
            let query = sb.from(table).select("slug").order("slug").range(offset, offset + pageSize - 1);
            if (published) query = query.eq("status", "published");
            const { data, error } = await query;
            if (error) throw new Error(`Sitemap content query failed: ${table} (${error.code})`);
            const rows = data ?? [];
            result.push(...rows.map(row => String(row.slug)).filter(Boolean));
            if (rows.length < pageSize) break;
          }
          return result;
        }
        const [recipes, posts, products, collections] = await Promise.all([
          slugs("recipes", true), slugs("blog_posts", true), slugs("products", true), slugs("collections", false),
        ]);
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "weekly", priority: "0.9" },
          { path: "/recipes", changefreq: "weekly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/free", changefreq: "monthly", priority: "0.7" },
          { path: "/free-cookbook", changefreq: "monthly", priority: "0.6" },
          { path: "/prep", changefreq: "monthly", priority: "0.8" },
          { path: "/planning-kit", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.4" },
          { path: "/privacy", changefreq: "monthly", priority: "0.3" },
          { path: "/terms", changefreq: "monthly", priority: "0.3" },
          { path: "/refund", changefreq: "monthly", priority: "0.3" },
          ...recipes.map(slug => ({ path: `/recipes/${encodeURIComponent(slug)}` })),
          ...posts.map(slug => ({ path: `/blog/${encodeURIComponent(slug)}` })),
          ...products.map(slug => ({ path: `/shop/${encodeURIComponent(slug)}` })),
          ...collections.map(slug => ({ path: `/collections/${encodeURIComponent(slug)}` })),
        ];

        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${escapeXml(pageUrl(e.path))}</loc>${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""}${e.priority ? `\n    <priority>${e.priority}</priority>` : ""}\n  </url>`,
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
        } catch (error) {
          console.error("Sitemap unavailable", error instanceof Error ? error.message : "Content query failed");
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store", "Retry-After": "300" } });
        }
      },
    },
  },
});
