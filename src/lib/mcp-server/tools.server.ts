/** Content tools for the bearer-protected remote MCP endpoint. Server-only. */
import { z } from "zod";
import { auditSeo } from "@/lib/content/seo-doctor";

type Admin = any;
const legacyAdmin = async (): Promise<Admin> => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const POST_FIELDS = "id,slug,title,excerpt,content,category,tags,seo_title,seo_description,featured_image_url,status,published_at,updated_at";

function extractStructure(html: string) {
  const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: Number(m[1]), text: m[2].replace(/<[^>]+>/g, "").trim() }));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({
    src: /src="([^"]*)"/i.exec(m[0])?.[1] ?? "",
    alt: /alt="([^"]*)"/i.exec(m[0])?.[1] ?? "",
  }));
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: m[1], anchor: m[2].replace(/<[^>]+>/g, "").trim() }));
  return { headings, images, links };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Applies targeted heading / alt-text / internal-link edits to article HTML. */
export function applyContentEdits(html: string, e: {
  headings?: { from: string; to: string }[];
  alt_text?: { src: string; alt: string }[];
  internal_links?: { anchor: string; href: string }[];
}) {
  let out = html;
  for (const h of e.headings ?? []) {
    out = out.replace(new RegExp(`(<h([1-6])[^>]*>)\\s*${reEsc(h.from)}\\s*(</h\\2>)`, "i"), (_m, open, _l, close) => `${open}${esc(h.to)}${close}`);
  }
  for (const a of e.alt_text ?? []) {
    out = out.replace(/<img\b[^>]*>/gi, (tag) => {
      if (!tag.includes(`src="${a.src}"`)) return tag;
      return /alt="/i.test(tag) ? tag.replace(/alt="[^"]*"/i, `alt="${esc(a.alt)}"`) : tag.replace(/<img/i, `<img alt="${esc(a.alt)}"`);
    });
  }
  for (const l of e.internal_links ?? []) {
    // Link the first plain-text occurrence of the anchor that is not already inside a link.
    const parts = out.split(/(<a\b[\s\S]*?<\/a>|<[^>]+>)/i);
    let done = false;
    out = parts.map((p) => {
      if (done || p.startsWith("<")) return p;
      const i = p.toLowerCase().indexOf(l.anchor.toLowerCase());
      if (i < 0) return p;
      done = true;
      return `${p.slice(0, i)}<a href="${esc(l.href)}">${p.slice(i, i + l.anchor.length)}</a>${p.slice(i + l.anchor.length)}`;
    }).join("");
  }
  return out;
}

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const internalHref = z.string().regex(/^\/[a-z0-9\-/]*$/i, "Internal links must be site paths like /recipes/slug");

export function createPostTools(admin: () => Promise<any> = legacyAdmin) {
return [
  {
    name: "list_recipes",
    description: "List recipes with id, title, slug, status and publish date.",
    inputSchema: z.object({ status: z.enum(["draft", "published", "all"]).default("all"), limit: z.number().int().min(1).max(200).default(100) }).strict(),
    readOnly: true,
    async run({ status, limit }: any) {
      let q = (await admin()).from("recipes").select("id,title,slug,status,published_at,updated_at").order("updated_at", { ascending: false }).limit(limit);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { recipes: data };
    },
  },
  {
    name: "list_posts",
    description: "List blog posts with id, title, slug, category, status and dates.",
    inputSchema: z.object({ status: z.enum(["draft", "published", "all"]).default("all"), limit: z.number().int().min(1).max(200).default(100) }).strict(),
    readOnly: true,
    async run({ status, limit }: any) {
      let q = (await admin()).from("blog_posts").select("id,title,slug,category,status,published_at,updated_at").order("updated_at", { ascending: false }).limit(limit);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { posts: data };
    },
  },
  {
    name: "get_post",
    description: "Get one blog post by id or slug, including content, meta tags, headings, image alt text and links.",
    inputSchema: z.object({ id: z.string().uuid().optional(), slug: z.string().max(200).optional() }).strict().refine((v) => v.id || v.slug, "Provide id or slug"),
    readOnly: true,
    async run({ id, slug }: any) {
      const q = (await admin()).from("blog_posts").select(POST_FIELDS);
      const { data, error } = await (id ? q.eq("id", id) : q.eq("slug", slug)).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Post not found");
      return { post: data, structure: extractStructure(data.content ?? "") };
    },
  },
  {
    name: "create_draft",
    description: "Create a new blog post as an unpublished draft.",
    inputSchema: z.object({
      title: z.string().min(3).max(200), slug: z.string().regex(slugRe).max(120).optional(), content: z.string().max(200000).default(""),
      excerpt: z.string().max(500).optional(), category: z.string().max(80).optional(), meta_title: z.string().max(120).optional(), meta_description: z.string().max(320).optional(),
    }).strict(),
    readOnly: false,
    async run(i: any) {
      const slug = i.slug ?? i.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
      const { data, error } = await (await admin()).from("blog_posts").insert({
        title: i.title, slug, content: i.content, excerpt: i.excerpt ?? null, category: i.category ?? null,
        seo_title: i.meta_title ?? null, seo_description: i.meta_description ?? null, status: "draft",
      }).select("id,slug,status").single();
      if (error) throw new Error(error.message);
      return { created: data };
    },
  },
  {
    name: "update_post",
    description: "Update a blog post (title, content, meta title/description, slug, headings, alt text, internal links). The previous version is saved first for rollback.",
    inputSchema: z.object({
      id: z.string().uuid(),
      title: z.string().min(3).max(200).optional(), content: z.string().max(200000).optional(),
      meta_title: z.string().max(120).optional(), meta_description: z.string().max(320).optional(),
      excerpt: z.string().max(600).optional(),
      slug: z.string().regex(slugRe).max(120).optional(),
      headings: z.array(z.object({ from: z.string().min(1).max(200), to: z.string().min(1).max(200) })).max(50).optional(),
      alt_text: z.array(z.object({ src: z.string().min(1).max(2000), alt: z.string().max(300) })).max(50).optional(),
      internal_links: z.array(z.object({ anchor: z.string().min(2).max(120), href: internalHref })).max(30).optional(),
    }).strict(),
    readOnly: false,
    async run(i: any) {
      const db = await admin();
      const { data: cur, error } = await db.from("blog_posts").select(POST_FIELDS).eq("id", i.id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!cur) throw new Error("Post not found");
      const patch: Record<string, unknown> = {};
      if (i.title !== undefined) patch.title = i.title;
      if (i.meta_title !== undefined) patch.seo_title = i.meta_title;
      if (i.meta_description !== undefined) patch.seo_description = i.meta_description;
      if (i.slug !== undefined) patch.slug = i.slug;
      if (i.excerpt !== undefined) patch.excerpt = i.excerpt;
      let content: string = i.content ?? cur.content ?? "";
      if (i.headings || i.alt_text || i.internal_links) content = applyContentEdits(content, i);
      if (content !== cur.content) patch.content = content;
      const changed = Object.keys(patch);
      if (!changed.length) return { updated: false, reason: "Nothing changed" };
      const { data: ver, error: vErr } = await db.from("post_versions").insert({ post_id: cur.id, snapshot: cur, changed_fields: changed, source: "mcp" }).select("id").single();
      if (vErr) throw new Error(`Could not save rollback version, nothing was changed: ${vErr.message}`);
      const { error: uErr } = await db.from("blog_posts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", cur.id);
      if (uErr) throw new Error(uErr.message);
      return { updated: true, changed_fields: changed, rollback_version_id: ver.id };
    },
  },
  {
    name: "rollback_post",
    description: "Restore a blog post to a saved version (the current state is saved as a new version first).",
    inputSchema: z.object({ version_id: z.string().uuid() }).strict(),
    readOnly: false,
    async run({ version_id }: any) {
      const db = await admin();
      const { data: v } = await db.from("post_versions").select("post_id,snapshot").eq("id", version_id).maybeSingle();
      if (!v) throw new Error("Version not found");
      const { data: cur } = await db.from("blog_posts").select(POST_FIELDS).eq("id", v.post_id).maybeSingle();
      if (!cur) throw new Error("Post not found");
      await db.from("post_versions").insert({ post_id: cur.id, snapshot: cur, changed_fields: ["rollback"], source: "mcp-rollback" });
      const s = v.snapshot;
      const { error } = await db.from("blog_posts").update({ title: s.title, slug: s.slug, content: s.content, excerpt: s.excerpt, seo_title: s.seo_title, seo_description: s.seo_description, updated_at: new Date().toISOString() }).eq("id", cur.id);
      if (error) throw new Error(error.message);
      return { restored: true, post_id: cur.id };
    },
  },
  {
    name: "set_post_status",
    description: "Publish a draft blog post or move it back to draft. Publishing keeps an existing publish date. The previous version is saved first.",
    inputSchema: z.object({ id: z.string().uuid(), status: z.enum(["published", "draft"]) }).strict(),
    readOnly: false,
    async run({ id, status }: any) {
      const db = await admin();
      const { data: cur, error } = await db.from("blog_posts").select(POST_FIELDS).eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!cur) throw new Error("Post not found");
      const url = `https://plantedandsimple.com/blog/${cur.slug}`;
      if (cur.status === status) return { updated: false, status, url };
      const { error: vErr } = await db.from("post_versions").insert({ post_id: cur.id, snapshot: cur, changed_fields: ["status"], source: "mcp-status" });
      if (vErr) throw new Error(`Could not save rollback version, nothing was changed: ${vErr.message}`);
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "published" && !cur.published_at) patch.published_at = now;
      const { error: uErr } = await db.from("blog_posts").update(patch).eq("id", cur.id);
      if (uErr) throw new Error(uErr.message);
      return { updated: true, status, url };
    },
  },
  {
    name: "list_post_versions",
    description: "List saved rollback versions for a blog post.",
    inputSchema: z.object({ id: z.string().uuid() }).strict(),
    readOnly: true,
    async run({ id }: any) {
      const { data, error } = await (await admin()).from("post_versions").select("id,changed_fields,source,created_at").eq("post_id", id).order("created_at", { ascending: false }).limit(50);
      if (error) throw new Error(error.message);
      return { versions: data };
    },
  },
  {
    name: "generate_post",
    description: "Run the site's AI blog writer for a title. The result lands in AI Studio for review (never auto-published). Can take a few minutes.",
    inputSchema: z.object({ title: z.string().min(5).max(240) }).strict(),
    readOnly: false,
    async run({ title }: any) {
      const db = await admin();
      const { data: boss } = await db.from("user_roles").select("user_id").eq("role", "boss").limit(1).maybeSingle();
      if (!boss) throw new Error("No owner account found to attribute the draft to");
      const brief: any = {
        topic: title, tone: "Editorial", wordCount: 1600, readingLevel: "Standard", goal: "SEO Ranking",
        includeRecipe: true, includeFaq: true, includeToc: true, includeInternalLinks: true, includeProduct: true, includeCta: true,
        imageCount: null, format: null, research: null, rewriteBrief: null,
      };
      const { writeArticle, buildAndStoreArticle } = await import("@/lib/ai/blog-core.server");
      const article = await writeArticle(brief);
      const r: any = await buildAndStoreArticle({ brief, article, userId: boss.user_id });
      return { generation_id: r.id, title: r.title, slug: r.slug, quality_score: r.quality?.overall ?? null, needs_review: true, where: "Admin → AI Studio" };
    },
  },
  {
    name: "get_seo_score",
    description: "Run SEO Doctor on a blog post and return the score plus every failing check.",
    inputSchema: z.object({ id: z.string().uuid(), keyword: z.string().max(120).optional() }).strict(),
    readOnly: true,
    async run({ id, keyword }: any) {
      const { data: p } = await (await admin()).from("blog_posts").select(POST_FIELDS).eq("id", id).maybeSingle();
      if (!p) throw new Error("Post not found");
      const r = auditSeo({ title: p.title, seoTitle: p.seo_title ?? "", seoDescription: p.seo_description ?? "", html: p.content ?? "", keyword: keyword ?? p.title, slug: p.slug, kind: "blog" });
      const fmt = (c: any) => ({ id: c.id, label: c.label, category: c.category, weight: c.weight, fix: c.fix, manual: !!c.manual });
      return { score: r.score, keyword: r.keyword, words: r.words, failing_checks: r.checks.filter((c) => !c.pass).map(fmt), passing_checks: r.checks.filter((c) => c.pass).map((c) => c.label) };
    },
  },
  {
    name: "delete_post",
    description: "Permanently delete a blog post (e.g. a duplicate or unwanted draft) by id or slug. A final snapshot is saved to post_versions first. Set confirm to true.",
    inputSchema: z.object({ id: z.string().uuid().optional(), slug: z.string().max(200).optional(), confirm: z.literal(true) }).strict().refine((v) => v.id || v.slug, "Provide id or slug"),
    readOnly: false,
    async run({ id, slug }: any) {
      const db = await admin();
      const q = db.from("blog_posts").select(POST_FIELDS);
      const { data: cur } = await (id ? q.eq("id", id) : q.eq("slug", slug)).maybeSingle();
      if (!cur) throw new Error("Post not found");
      await db.from("post_versions").insert({ post_id: cur.id, snapshot: cur, changed_fields: ["delete"], source: "mcp-delete" });
      await db.from("content_relations").delete().eq("from_type", "blog").eq("from_id", cur.id);
      await db.from("content_relations").delete().eq("to_type", "blog").eq("to_id", cur.id);
      const { error } = await db.from("blog_posts").delete().eq("id", cur.id);
      if (error) throw new Error(error.message);
      return { deleted: true, id: cur.id, title: cur.title, was_status: cur.status };
    },
  },
] as const;
}
export const TOOLS = createPostTools();
