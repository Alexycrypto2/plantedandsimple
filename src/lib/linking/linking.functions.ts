import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  chooseRelated, effectiveTaxonomy, hubAnchor, hubItems, hubMenuBlog, inferTaxonomy, pageHref, roundupRecipes,
  type LinkPage, type PageType, type Taxonomy,
} from "./related";

export type LinkCard = {
  type: PageType; slug: string; href: string; title: string; image: string | null;
  prep_minutes: number | null; difficulty: string | null; published_at: string | null;
};
export type PageLinks = {
  recipes: LinkCard[];
  blogs: LinkCard[];
  hubs: Array<{ name: string; anchor: string; menu: LinkCard | null }>;
  roundup: { tag: string; items: LinkCard[] } | null;
};
export type Hub = { name: string; items: LinkCard[] };
export type LinkingSettings = { live: boolean; hubs: string[] };

function serverPublic() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public database configuration is missing");
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const TAX_COLS = "link_category, occasions, main_ingredients, diet_tags";
const R_COLS = `id, slug, title, description, tags, status, published_at, hero_image_id, prep_minutes, difficulty, ${TAX_COLS}`;
const B_COLS = `id, slug, title, excerpt, category, tags, status, published_at, featured_image_url, roundup_tag, ${TAX_COLS}`;

const stored = (r: any): Partial<Taxonomy> => ({
  category: r.link_category, occasions: r.occasions ?? [], main_ingredients: r.main_ingredients ?? [], diet_tags: r.diet_tags ?? [],
});

type Loaded = { raw: any; page: LinkPage };

async function loadPages(sb: any, onlyPublished: boolean) {
  let rq = sb.from("recipes").select(R_COLS);
  let bq = sb.from("blog_posts").select(B_COLS);
  if (onlyPublished) { rq = rq.eq("status", "published"); bq = bq.eq("status", "published"); }
  const [r, b, s] = await Promise.all([rq, bq, sb.from("site_settings").select("value").eq("key", "internal_linking").maybeSingle()]);
  if (r.error) throw new Error(r.error.message);
  if (b.error) throw new Error(b.error.message);
  const ids = [...new Set((r.data ?? []).map((x: any) => x.hero_image_id).filter(Boolean))];
  const media = new Map<string, string>();
  if (ids.length) {
    const { data } = await sb.from("media").select("id, public_url").in("id", ids);
    for (const m of data ?? []) media.set(m.id, m.public_url);
  }
  const recipes: Loaded[] = (r.data ?? []).map((x: any) => ({
    raw: x,
    page: {
      type: "recipe" as const, id: x.id, slug: x.slug, title: x.title,
      image: x.hero_image_id ? media.get(x.hero_image_id) ?? null : null,
      prep_minutes: x.prep_minutes ?? null, difficulty: x.difficulty ?? null, published_at: x.published_at,
      ...effectiveTaxonomy(stored(x), { type: "recipe", title: x.title, tags: x.tags, description: x.description }),
    } satisfies LinkPage,
  }));
  const blogs: Loaded[] = (b.data ?? []).map((x: any) => ({
    raw: x,
    page: {
      type: "blog" as const, id: x.id, slug: x.slug, title: x.title, image: x.featured_image_url ?? null,
      prep_minutes: null, difficulty: null, published_at: x.published_at, roundup_tag: x.roundup_tag ?? null,
      ...effectiveTaxonomy(stored(x), { type: "blog", title: x.title, tags: x.tags, category: x.category, excerpt: x.excerpt }),
    } satisfies LinkPage,
  }));
  const v = (s.data?.value ?? {}) as any;
  const settings: LinkingSettings = { live: !!v.live, hubs: Array.isArray(v.hubs) ? v.hubs.filter((h: any) => typeof h === "string" && h.trim()) : ["Thanksgiving"] };
  return { recipes, blogs, settings };
}

const card = (p: LinkPage): LinkCard => ({
  type: p.type, slug: p.slug, href: pageHref(p), title: p.title, image: p.image,
  prep_minutes: p.prep_minutes, difficulty: p.difficulty, published_at: p.published_at,
});

function computeLinks(current: LinkPage, recipes: LinkPage[], blogs: LinkPage[], hubs: string[], now: number): PageLinks {
  const rel = chooseRelated(current, recipes, blogs, now);
  const myHubs = hubs.filter((h) => current.occasions.some((o) => o.toLowerCase() === h.toLowerCase()));
  return {
    recipes: rel.recipes.map((x) => card(x.page)),
    blogs: rel.blogs.map((x) => card(x.page)),
    hubs: myHubs.map((h) => {
      const menu = hubMenuBlog(h, blogs, current.type === "blog" ? current.slug : undefined);
      return { name: h, anchor: hubAnchor(h), menu: menu ? card(menu) : null };
    }),
    roundup: current.type === "blog" && current.roundup_tag
      ? { tag: current.roundup_tag, items: roundupRecipes(current.roundup_tag, recipes).map(card) }
      : null,
  };
}

/** Public: related links for one published page. Returns null until linking is switched live. */
export const getPageLinks = createServerFn({ method: "GET" })
  .inputValidator((d: { type: PageType; slug: string }) => d)
  .handler(async ({ data }): Promise<PageLinks | null> => {
    const { recipes, blogs, settings } = await loadPages(serverPublic() as any, true);
    if (!settings.live) return null;
    const list = data.type === "recipe" ? recipes : blogs;
    const current = list.find((x) => x.page.slug === data.slug)?.page;
    if (!current) return null;
    return computeLinks(current, recipes.map((x) => x.page), blogs.map((x) => x.page), settings.hubs, Date.now());
  });

/** Public: holiday hubs (e.g. Thanksgiving) for /recipes and /blog. */
export const getHubs = createServerFn({ method: "GET" }).handler(async (): Promise<Hub[]> => {
  const { recipes, blogs, settings } = await loadPages(serverPublic() as any, true);
  if (!settings.live) return [];
  const all = [...recipes, ...blogs].map((x) => x.page);
  return settings.hubs.map((h) => ({ name: h, items: hubItems(h, all).map(card) })).filter((h) => h.items.length);
});

/* ------------------------------------------------------------------ admin */

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => String(r.role));
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

export type AdminLinkRow = {
  type: PageType; id: string; slug: string; title: string; status: string; href: string;
  stored: Taxonomy & { roundup_tag: string | null };
  suggested: Taxonomy;
  effective: Taxonomy;
  links: PageLinks | null;
};

export const adminLinkingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settings: LinkingSettings; rows: AdminLinkRow[] }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recipes, blogs, settings } = await loadPages(supabaseAdmin as any, false);
    const pub = (xs: Loaded[]) => xs.filter((x) => x.raw.status === "published").map((x) => x.page);
    const pr = pub(recipes), pb = pub(blogs);
    const now = Date.now();
    const rows = [...recipes, ...blogs].map(({ raw, page }) => ({
      type: page.type, id: page.id, slug: page.slug, title: page.title, status: raw.status, href: pageHref(page),
      stored: { category: raw.link_category ?? null, occasions: raw.occasions ?? [], main_ingredients: raw.main_ingredients ?? [], diet_tags: raw.diet_tags ?? [], roundup_tag: raw.roundup_tag ?? null },
      suggested: inferTaxonomy({ type: page.type, title: raw.title, tags: raw.tags, category: raw.category, excerpt: raw.excerpt, description: raw.description }),
      effective: { category: page.category, occasions: page.occasions, main_ingredients: page.main_ingredients, diet_tags: page.diet_tags },
      links: raw.status === "published" ? computeLinks(page, pr, pb, settings.hubs, now) : null,
    }));
    return { settings, rows };
  });

const cleanList = (xs: unknown) => (Array.isArray(xs) ? xs : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 12);

export const adminSaveTaxonomy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { type: PageType; id: string; category: string | null; occasions: string[]; main_ingredients: string[]; diet_tags: string[]; roundup_tag?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      link_category: data.category?.trim() || null,
      occasions: cleanList(data.occasions), main_ingredients: cleanList(data.main_ingredients), diet_tags: cleanList(data.diet_tags),
    };
    if (data.type === "blog") payload.roundup_tag = data.roundup_tag?.trim() || null;
    const { error } = await (supabaseAdmin as any).from(data.type === "recipe" ? "recipes" : "blog_posts").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveLinkingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: LinkingSettings) => ({ live: !!d.live, hubs: cleanList(d.hubs) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("site_settings").upsert({ key: "internal_linking", value: data }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------ link checker */

const STATIC_PATHS = new Set([
  "/", "/recipes", "/blog", "/shop", "/about", "/contact", "/free", "/free-cookbook", "/planning-kit", "/prep",
  "/privacy", "/terms", "/refund", "/search", "/checkout", "/thank-you", "/auth", "/reset-password", "/sitemap.xml",
]);
const CANONICAL = "plantedandsimple.com";
const OWN_HOSTS = /^(www\.)?plantedandsimple\.(com|store)$|\.lovable\.app$/;

export type LinkIssue = {
  pageType: PageType; pageId: string; pageTitle: string; pageHref: string;
  href: string; problem: "not_found" | "unpublished" | "wrong_domain"; suggestion: string | null;
};

function extractHrefs(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) out.push(m[1]!);
  for (const m of text.matchAll(/\]\(((?:https?:\/\/[^)\s]+)|(?:\/[^)\s]*))\)/g)) out.push(m[1]!);
  return out;
}

function stringsOf(v: unknown, acc: string[] = []): string[] {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => stringsOf(x, acc));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => stringsOf(x, acc));
  return acc;
}

export const adminCheckInternalLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ scanned: number; links: number; issues: LinkIssue[] }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const [r, b, p, c] = await Promise.all([
      sb.from("recipes").select("id, slug, title, status, description, tips, instructions, subtitle"),
      sb.from("blog_posts").select("id, slug, title, status, content, excerpt"),
      sb.from("products").select("slug, status"),
      sb.from("collections").select("slug"),
    ]);
    const recipeStatus = new Map<string, string>((r.data ?? []).map((x: any) => [x.slug, x.status]));
    const blogStatus = new Map<string, string>((b.data ?? []).map((x: any) => [x.slug, x.status]));
    const productStatus = new Map<string, string>((p.data ?? []).map((x: any) => [x.slug, x.status]));
    const collections = new Set<string>((c.data ?? []).map((x: any) => x.slug));
    const issues: LinkIssue[] = [];
    let links = 0;
    const pages = [
      ...(r.data ?? []).filter((x: any) => x.status === "published").map((x: any) => ({ type: "recipe" as const, x, text: stringsOf([x.description, x.subtitle, x.tips, x.instructions]).join("\n") })),
      ...(b.data ?? []).filter((x: any) => x.status === "published").map((x: any) => ({ type: "blog" as const, x, text: [x.content ?? "", x.excerpt ?? ""].join("\n") })),
    ];
    for (const pg of pages) {
      const seen = new Set<string>();
      for (const href of extractHrefs(pg.text)) {
        if (seen.has(href)) continue;
        seen.add(href);
        let path: string;
        let wrongDomain = false;
        if (/^https?:\/\//i.test(href)) {
          let u: URL;
          try { u = new URL(href); } catch { continue; }
          if (!OWN_HOSTS.test(u.hostname)) continue;
          path = u.pathname;
          wrongDomain = u.hostname !== CANONICAL;
        } else if (href.startsWith("/") && !href.startsWith("//")) path = href;
        else continue;
        links++;
        path = decodeURI(path.split(/[?#]/)[0]!).replace(/\/+$/, "") || "/";
        const base = { pageType: pg.type, pageId: pg.x.id, pageTitle: pg.x.title, pageHref: pageHref({ type: pg.type, slug: pg.x.slug }), href };
        let status: "ok" | "not_found" | "unpublished" = "ok";
        const m = path.match(/^\/(recipes|blog|shop|collections)\/([^/]+)$/);
        if (m) {
          const map = m[1] === "recipes" ? recipeStatus : m[1] === "blog" ? blogStatus : m[1] === "shop" ? productStatus : null;
          if (map) {
            const st = map.get(m[2]!);
            status = !st ? (m[1] === "blog" && recipeStatus.get(m[2]!) === "published" ? "ok" : "not_found") : st !== "published" ? "unpublished" : "ok";
          } else status = collections.has(m[2]!) ? "ok" : "not_found";
        } else if (!STATIC_PATHS.has(path) && !path.startsWith("/api/") && !path.startsWith("/products/") && !path.startsWith("/p/")) {
          status = "not_found";
        }
        if (status !== "ok") issues.push({ ...base, problem: status, suggestion: null });
        else if (wrongDomain) issues.push({ ...base, problem: "wrong_domain", suggestion: path });
      }
    }
    return { scanned: pages.length, links, issues };
  });

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function rewriteLink(text: string, href: string, action: "remove" | "replace", newHref?: string) {
  const h = escapeRe(href);
  if (action === "remove") {
    return text
      .replace(new RegExp(`<a\\b[^>]*href\\s*=\\s*["']${h}["'][^>]*>([\\s\\S]*?)</a>`, "gi"), "$1")
      .replace(new RegExp(`\\[([^\\]]*)\\]\\(${h}\\)`, "g"), "$1");
  }
  const to = newHref ?? href;
  return text
    .replace(new RegExp(`(href\\s*=\\s*["'])${h}(["'])`, "gi"), `$1${to}$2`)
    .replace(new RegExp(`\\]\\(${h}\\)`, "g"), `](${to})`);
}

function mapStrings(v: any, fn: (s: string) => string): any {
  if (typeof v === "string") return fn(v);
  if (Array.isArray(v)) return v.map((x) => mapStrings(x, fn));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, fn)]));
  return v;
}

export const adminFixInternalLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pageType: PageType; pageId: string; href: string; action: "remove" | "replace"; newHref?: string }) => {
    if (d.action === "replace") {
      const n = (d.newHref ?? "").trim();
      if (!/^\/[a-z0-9\-/]*$/i.test(n)) throw new Error("Replacement must be a site path like /recipes/your-recipe");
      d.newHref = n;
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const fn = (s: string) => rewriteLink(s, data.href, data.action, data.newHref);
    if (data.pageType === "blog") {
      const { data: row, error } = await sb.from("blog_posts").select("content, excerpt").eq("id", data.pageId).single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await sb.from("blog_posts").update({ content: fn(row.content ?? ""), excerpt: row.excerpt ? fn(row.excerpt) : row.excerpt }).eq("id", data.pageId);
      if (e2) throw new Error(e2.message);
    } else {
      const { data: row, error } = await sb.from("recipes").select("description, subtitle, tips, instructions").eq("id", data.pageId).single();
      if (error) throw new Error(error.message);
      const { error: e2 } = await sb.from("recipes").update(mapStrings(row, fn)).eq("id", data.pageId);
      if (e2) throw new Error(e2.message);
    }
    return { ok: true };
  });

/* ------------------------------------------------- SEO Doctor link ideas */

export type LinkSuggestion = { type: PageType; title: string; href: string; url: string; reason: string };

/** Admin: live published pages that best match a draft, skipping pages it already links to. */
export const suggestInternalLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: PageType; title: string; slug?: string; tags?: string; html?: string }) => ({
    kind: d.kind === "recipe" ? ("recipe" as const) : ("blog" as const),
    title: String(d.title ?? "").slice(0, 200),
    slug: String(d.slug ?? "").slice(0, 200),
    tags: String(d.tags ?? "").slice(0, 600),
    html: String(d.html ?? "").slice(0, 80000),
  }))
  .handler(async ({ data, context }): Promise<LinkSuggestion[]> => {
    await requireBoss(context.supabase, context.userId);
    const { recipes, blogs } = await loadPages(serverPublic() as any, true);
    const tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const current: LinkPage = {
      type: data.kind, id: "draft", slug: data.slug, title: data.title, image: null, prep_minutes: null, difficulty: null, published_at: null,
      ...inferTaxonomy({ type: data.kind, title: data.title, tags, excerpt: data.html.replace(/<[^>]+>/g, " ").slice(0, 3000) }),
    };
    const linked = new Set([...data.html.matchAll(/href="(?:https?:\/\/(?:www\.)?plantedandsimple\.com)?(\/[^"#?]*)/gi)].map((m) => m[1]));
    const words = new Set(data.title.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
    const now = Date.now();
    const { scorePage } = await import("./related");
    return [...recipes, ...blogs]
      .map((x) => x.page)
      .filter((p) => !(p.type === data.kind && p.slug === data.slug) && !linked.has(pageHref(p)))
      .map((p) => {
        const overlap = p.title.toLowerCase().split(/[^a-z]+/).filter((w) => words.has(w)).length;
        const shared = [p.category === current.category ? p.category : null, ...p.main_ingredients.filter((i) => current.main_ingredients.includes(i)), ...p.occasions.filter((o) => current.occasions.includes(o))].filter(Boolean) as string[];
        return { p, score: scorePage(current, p, now) + overlap * 2, shared, overlap };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ p, shared, overlap }) => ({
        type: p.type, title: p.title, href: pageHref(p), url: `https://plantedandsimple.com${pageHref(p)}`,
        reason: shared.length ? `Shares ${[...new Set(shared)].slice(0, 2).join(", ")}` : overlap ? "Similar topic in title" : "Related page",
      }));
  });
