import { useEffect, useRef, useState } from "react";
import { Sparkles, Plus, ExternalLink, Image as ImageIcon, Eye, Pencil } from "lucide-react";
import { generateStudioImage } from "@/lib/ai/image-studio.functions";
import { adminListMedia, adminUploadMedia, adminAddMediaByUrl, adminListEntity } from "@/lib/library/admin.functions";
import { SeoDoctor } from "./SeoDoctor";

export type BlogDraft = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image_url: string;
  tags: string;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
};

const inp = "w-full rounded-xl border border-forest/20 bg-cream/40 px-3 py-2.5 text-sm outline-none focus:border-forest";
const ghost = "inline-flex items-center gap-1.5 rounded-xl border border-forest/15 px-3 py-2 text-xs font-semibold text-charcoal/75 hover:bg-forest/5 disabled:opacity-50";
const CATEGORIES = ["Dinner", "Breakfast", "Meal Prep", "Nutrition", "Lunch", "Snacks"];

const toB64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(f);
  });

const BRIDGES: Record<string, string> = {
  "Free cookbook": '<p class="bridge"><strong>Free:</strong> Get 12 fast high-protein recipes in our <a href="/free-cookbook">free cookbook</a>.</p>',
  "Meal Prep System": '<p class="bridge"><strong>Plan your week:</strong> The <a href="/prep">Meal Prep System</a> builds your weekly plan and grocery list.</p>',
  "$14.99 cookbook": '<p class="bridge"><strong>Want all 30 recipes?</strong> Get the <a href="/shop/high-protein-cookbook">High-Protein Plant-Based Cookbook</a>.</p>',
};

function Label({ t, children, wide }: { t: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/55">{t}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function BlogEditor({
  value,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  value: BlogDraft;
  onChange: (v: BlogDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const set = (p: Partial<BlogDraft>) => onChange({ ...value, ...p });
  const [media, setMedia] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [pick, setPick] = useState<null | "hero" | "inline">(null);
  const [prompt, setPrompt] = useState("");
  const [imgBusy, setImgBusy] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adminListMedia().then((m) => setMedia(m as any[])).catch(() => {});
    adminListEntity({ data: { entity: "recipes" } })
      .then((r) => setRecipes((r as any[]).filter((x) => x.status === "published")))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!prompt && value.title) setPrompt(`${value.title}, plant-based food, natural light editorial food photography`);
  }, [value.title]);

  const insert = (before: string, after = "") => {
    const el = ta.current;
    const c = value.content;
    const s = el?.selectionStart ?? c.length;
    const e = el?.selectionEnd ?? c.length;
    const sel = c.slice(s, e);
    const next = c.slice(0, s) + before + sel + after + c.slice(e);
    set({ content: next });
    requestAnimationFrame(() => {
      el?.focus();
      const pos = s + before.length + sel.length + after.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const useImage = (url: string, alt: string) => {
    if (pick === "inline") {
      insert(`\n<figure class="article-figure"><img src="${url}" alt="${alt.replace(/"/g, "")}" loading="lazy" /><figcaption>${alt}</figcaption></figure>\n`);
    } else set({ featured_image_url: url });
    setPick(null);
  };

  const regenerate = async () => {
    if (!prompt.trim()) return;
    setImgBusy("Creating a new photo… (about 30–60s)");
    setImgErr(null);
    try {
      const g: any = await generateStudioImage({ data: { preset: "blog_hero", subject: prompt, title: value.title } });
      const row: any = await adminAddMediaByUrl({ data: { url: g.preview_url, alt: value.title, title: value.title, tags: ["blog"] } });
      setMedia((m) => [row, ...m]);
      set({ featured_image_url: row.public_url });
    } catch (e: any) {
      setImgErr(e?.message ?? "Photo generation failed");
    } finally {
      setImgBusy(null);
    }
  };

  const upload = async (f: File | undefined, target: "hero" | "inline") => {
    if (!f) return;
    setImgBusy("Uploading…");
    setImgErr(null);
    try {
      const row: any = await adminUploadMedia({
        data: { fileName: f.name, contentType: f.type as any, base64: await toB64(f), alt: value.title, tags: ["blog"] },
      });
      setMedia((m) => [row, ...m]);
      if (target === "hero") set({ featured_image_url: row.public_url });
      else insert(`\n<figure class="article-figure"><img src="${row.public_url}" alt="${value.title}" loading="lazy" /><figcaption></figcaption></figure>\n`);
    } catch (e: any) {
      setImgErr(e?.message ?? "Upload failed");
    } finally {
      setImgBusy(null);
    }
  };

  const text = value.content.replace(/<[^>]+>/g, " ");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tools: [string, string, string][] = [
    ["H2", "<h2>", "</h2>"],
    ["H3", "<h3>", "</h3>"],
    ["Bold", "<strong>", "</strong>"],
    ["Italic", "<em>", "</em>"],
    ["Paragraph", "<p>", "</p>"],
    ["Bullets", "<ul>\n<li>", "</li>\n</ul>"],
    ["Numbered", "<ol>\n<li>", "</li>\n</ol>"],
    ["Quote", '<blockquote class="article-quote">', "</blockquote>"],
    ["Tip box", '<aside class="article-callout"><span>Tip</span><p>', "</p></aside>"],
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-forest/15 bg-white p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl italic text-forest-deep">{value.id ? "Edit post" : "New post"}</h3>
        {value.id && value.slug && (
          <a href={`/blog/${value.slug}`} target="_blank" rel="noreferrer" className={ghost}>
            <ExternalLink className="size-3.5" /> Open live post
          </a>
        )}
      </div>

      {/* Main photo */}
      <section className="rounded-xl border border-forest/10 p-4">
        <p className="mb-3 text-sm font-semibold text-forest-deep">Main photo</p>
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-forest/5">
            {value.featured_image_url ? (
              <img src={value.featured_image_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-xs text-charcoal/40">No photo yet</div>
            )}
          </div>
          <div className="space-y-2">
            <Label t="Describe the photo for AI">
              <textarea className={inp} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </Label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={regenerate} disabled={!!imgBusy} className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-cream hover:bg-forest-deep disabled:opacity-50">
                <Sparkles className="size-3.5" /> Regenerate with AI
              </button>
              <label className={`${ghost} cursor-pointer`}>
                <Plus className="size-3.5" /> Upload photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0], "hero")} />
              </label>
              <button type="button" onClick={() => setPick(pick === "hero" ? null : "hero")} className={ghost}>
                <ImageIcon className="size-3.5" /> Choose from library
              </button>
              {value.featured_image_url && (
                <button type="button" onClick={() => set({ featured_image_url: "" })} className={ghost}>Remove</button>
              )}
            </div>
            {imgBusy && <p className="text-xs text-forest">{imgBusy}</p>}
            {imgErr && <p className="text-xs text-destructive">{imgErr}</p>}
            <p className="text-[11px] text-charcoal/50">Changes go live after you press Save post.</p>
          </div>
        </div>
      </section>

      {pick && (
        <div className="rounded-xl border border-forest/10 p-3">
          <p className="mb-2 text-xs font-semibold text-charcoal/60">
            {pick === "hero" ? "Pick the main photo" : "Pick a photo to insert in the article"}
          </p>
          <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {media
              .filter((m) => (m.mime_type ?? "image").startsWith("image") && m.public_url)
              .slice(0, 150)
              .map((m) => (
                <button type="button" key={m.id} onClick={() => useImage(m.public_url, m.alt ?? value.title)} className="aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-forest">
                  <img src={m.public_url} alt={m.alt ?? ""} loading="lazy" className="size-full object-cover" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Essentials */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Label t="Title" wide>
          <input className={inp} value={value.title} onChange={(e) => set({ title: e.target.value })} />
        </Label>
        <Label t="Web address (slug)">
          <input className={inp} value={value.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
        </Label>
        <Label t="Status">
          <select className={inp} value={value.status} onChange={(e) => set({ status: e.target.value as any })}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (live)</option>
          </select>
        </Label>
        <Label t="Category">
          <input className={inp} list="blog-cats" value={value.category} onChange={(e) => set({ category: e.target.value })} />
          <datalist id="blog-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Label>
        <Label t="Tags (comma separated)">
          <input className={inp} value={value.tags} onChange={(e) => set({ tags: e.target.value })} />
        </Label>
        <Label t="Short summary (excerpt)" wide>
          <textarea className={inp} rows={2} value={value.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
        </Label>
      </section>

      {/* Article body */}
      <section className="rounded-xl border border-forest/10">
        <div className="flex flex-wrap items-center gap-2 border-b border-forest/10 p-2">
          <button type="button" onClick={() => setMode("edit")} className={`${ghost} ${mode === "edit" ? "bg-forest/10" : ""}`}><Pencil className="size-3.5" /> Edit</button>
          <button type="button" onClick={() => setMode("preview")} className={`${ghost} ${mode === "preview" ? "bg-forest/10" : ""}`}><Eye className="size-3.5" /> Preview</button>
          <span className="ml-auto text-[11px] text-charcoal/50">{words} words · {Math.max(1, Math.round(words / 220))} min read</span>
        </div>
        {mode === "edit" ? (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-forest/10 p-2">
              {tools.map(([l, b, a]) => (
                <button key={l} type="button" onClick={() => insert(b, a)} className={ghost}>{l}</button>
              ))}
              <button type="button" onClick={() => { const u = prompt_("Link address (e.g. /recipes/…)"); if (u) insert(`<a href="${u}">`, "</a>"); }} className={ghost}>Link</button>
              <button type="button" onClick={() => setPick("inline")} className={ghost}><ImageIcon className="size-3.5" /> Photo</button>
              <label className={`${ghost} cursor-pointer`}>
                <Plus className="size-3.5" /> Upload photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0], "inline")} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-forest/10 p-2">
              <select className="rounded-xl border border-forest/15 px-2 py-2 text-xs" value="" onChange={(e) => { const r = recipes.find((x) => x.slug === e.target.value); if (r) insert(`<a href="/recipes/${r.slug}">${r.title}</a>`); }}>
                <option value="">+ Link a recipe…</option>
                {recipes.map((r) => <option key={r.slug} value={r.slug}>{r.title}</option>)}
              </select>
              {Object.entries(BRIDGES).map(([k, html]) => (
                <button key={k} type="button" onClick={() => insert(`\n${html}\n`)} className={ghost}>+ {k}</button>
              ))}
            </div>
            <textarea ref={ta} className="h-[28rem] w-full resize-y bg-cream/30 p-3 font-mono text-[13px] outline-none" value={value.content} onChange={(e) => set({ content: e.target.value })} />
          </>
        ) : (
          <div className="max-h-[40rem] overflow-y-auto p-4">
            {value.featured_image_url && <img src={value.featured_image_url} alt="" className="mb-4 aspect-[16/9] w-full rounded-xl object-cover" />}
            <h1 className="font-display text-3xl italic text-forest-deep">{value.title}</h1>
            <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: value.content }} />
          </div>
        )}
      </section>

      {/* SEO */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Label t={`Google title (${value.seo_title.length}/60)`}>
          <input className={inp} value={value.seo_title} onChange={(e) => set({ seo_title: e.target.value })} />
        </Label>
        <Label t={`Google description (${value.seo_description.length}/160)`}>
          <input className={inp} value={value.seo_description} onChange={(e) => set({ seo_description: e.target.value })} />
        </Label>
        <div className="rounded-xl bg-cream/50 p-3 sm:col-span-2">
          <p className="text-[11px] text-charcoal/50">Google preview</p>
          <p className="truncate text-[15px] text-forest-deep">{value.seo_title || value.title || "Title"}</p>
          <p className="text-[11px] text-forest">plantedandsimple.com/blog/{value.slug}</p>
          <p className="line-clamp-2 text-xs text-charcoal/70">{value.seo_description || value.excerpt}</p>
        </div>
      </section>
      <SeoDoctor value={value} onApply={(patch) => set(patch as any)} />

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-forest/10 bg-white/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <button onClick={onCancel} className="rounded-full border border-forest/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-charcoal/70">Cancel</button>
        <button onClick={onSave} disabled={busy} className="rounded-full bg-forest px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep disabled:opacity-60">
          {busy ? "Saving…" : "Save post"}
        </button>
      </div>
    </div>
  );
}

function prompt_(q: string) {
  return typeof window !== "undefined" ? window.prompt(q) : null;
}
