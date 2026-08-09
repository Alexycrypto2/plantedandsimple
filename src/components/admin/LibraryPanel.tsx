import { useEffect, useMemo, useState } from "react";
import {
  ChefHat, FileText, Package, Image as ImageIcon, Layers, Search, Trash2, Link2, Plus, ExternalLink,
} from "lucide-react";
import {
  adminListEntity, adminListMedia, adminAddMediaByUrl, adminUploadMedia,
  adminUpdateMedia, adminDeleteMedia, adminSaveEntity, adminDeleteEntity, adminLinkableItems,
} from "@/lib/library/admin.functions";
import { adminListPosts } from "@/lib/blog.functions";
import { adminListProducts } from "@/lib/products.functions";
import { EmptyState, PanelCard, SectionTabs, SkeletonList, Skeleton } from "./AdminShell";

type Row = {
  id: string;
  type: "recipe" | "blog" | "product" | "collection";
  title: string;
  status: string;
  updated: string | null;
  href: string | null;
  image: string | null;
};

const TYPE_META = {
  recipe: { label: "Recipe", icon: ChefHat, tone: "bg-sage/20 text-forest-deep" },
  blog: { label: "Blog", icon: FileText, tone: "bg-amber-100 text-amber-800" },
  product: { label: "Product", icon: Package, tone: "bg-violet-100 text-violet-800" },
  collection: { label: "Collection", icon: Layers, tone: "bg-sky-100 text-sky-800" },
} as const;

/* ------------------------------- unified list ------------------------------ */

function UnifiedLibrary({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [recipes, blogs, products, collections] = await Promise.all([
        adminListEntity({ data: { entity: "recipes" } }).catch(() => []),
        adminListPosts().catch(() => []),
        adminListProducts().catch(() => []),
        adminListEntity({ data: { entity: "collections" } }).catch(() => []),
      ]);
      const all: Row[] = [
        ...(recipes as any[]).map((r) => ({
          id: r.id, type: "recipe" as const, title: r.title, status: r.status ?? "draft",
          updated: r.updated_at ?? r.created_at, href: `/recipes/${r.slug}`, image: r.hero_image_url ?? null,
        })),
        ...(blogs as any[]).map((b) => ({
          id: b.id, type: "blog" as const, title: b.title, status: b.status ?? "draft",
          updated: b.updated_at ?? b.created_at, href: `/blog/${b.slug}`, image: b.featured_image_url ?? null,
        })),
        ...(products as any[]).map((p) => ({
          id: p.id, type: "product" as const, title: p.title, status: p.status ?? "draft",
          updated: p.updated_at ?? p.created_at, href: `/shop/${p.slug}`, image: p.cover_image_url ?? null,
        })),
        ...(collections as any[]).map((c) => ({
          id: c.id, type: "collection" as const, title: c.name, status: c.is_featured ? "featured" : "live",
          updated: c.updated_at ?? c.created_at, href: `/collections/${c.slug}`, image: c.image_url ?? null,
        })),
      ];
      all.sort((a, b) => String(b.updated ?? "").localeCompare(String(a.updated ?? "")));
      setRows(all);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (type === "all" || r.type === type) &&
          (!q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [rows, q, type],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { recipe: 0, blog: 0, product: 0, collection: 0 };
    for (const r of rows ?? []) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((k) => {
          const Icon = TYPE_META[k].icon;
          return (
            <button
              key={k}
              onClick={() => setType(type === k ? "all" : k)}
              className={`group rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/10 ${
                type === k ? "border-forest/40 bg-white shadow-md" : "border-forest/10 bg-white/80"
              }`}
            >
              <span className={`grid size-8 place-items-center rounded-xl ${TYPE_META[k].tone}`}>
                <Icon className="size-4" />
              </span>
              <p className="mt-3 font-display text-2xl italic text-forest-deep">
                {rows ? counts[k] : "—"}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/45">
                {TYPE_META[k].label}s
              </p>
            </button>
          );
        })}
      </div>

      <PanelCard
        title="Everything you've made"
        icon={Layers}
        action={
          <div className="flex items-center gap-2 rounded-xl border border-forest/10 bg-cream-warm/60 px-3 py-2">
            <Search className="size-3.5 text-charcoal/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search library…"
              className="w-28 bg-transparent text-xs outline-none placeholder:text-charcoal/40 sm:w-44"
            />
          </div>
        }
      >
        {!rows ? (
          <SkeletonList rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nothing here yet" hint="Create a recipe, blog or product and it will appear in the library instantly." />
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => {
              const meta = TYPE_META[r.type];
              const Icon = meta.icon;
              return (
                <li
                  key={`${r.type}-${r.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-forest/8 bg-white px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-md"
                >
                   {r.image ? <img src={r.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" /> : <span className={`grid size-12 shrink-0 place-items-center rounded-lg ${meta.tone}`}><Icon className="size-4" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal">{r.title}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/40">
                      {meta.label} · {r.status}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onNavigate(r.type === "recipe" ? "recipes" : r.type === "blog" ? "blogs" : r.type === "product" ? "products" : "library")
                    }
                    className="hidden rounded-full border border-forest/15 px-3 py-1.5 text-[11px] font-semibold text-forest transition hover:bg-forest/5 sm:inline-flex"
                  >
                    Edit
                  </button>
                  {r.href && (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-8 place-items-center rounded-full text-charcoal/40 transition hover:bg-forest/5 hover:text-forest"
                      aria-label="View on site"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

/* -------------------------------- collections ------------------------------ */

function CollectionsManager() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = () => adminListEntity({ data: { entity: "collections" } }).then((r) => setRows(r as any[]));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await adminSaveEntity({
        data: {
          entity: "collections",
          values: {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            description: form.description || null,
          },
        },
      });
      setForm({ name: "", slug: "", description: "" });
      await load();
    } finally { setBusy(false); }
  };

  return (
    <PanelCard title="Collections" icon={Layers}>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className={inputCls} placeholder="Collection name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={inputCls} placeholder="slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <button onClick={save} disabled={busy} className={btnCls}>
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      <div className="mt-4">
        {!rows ? <SkeletonList rows={3} /> : rows.length === 0 ? (
          <EmptyState title="No collections yet" hint="Group recipes, blogs and products into curated collections." />
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-forest/8 bg-white px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal">{c.name}</p>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/40">/{c.slug}</p>
                </div>
                <button
                  onClick={async () => { await adminDeleteEntity({ data: { entity: "collections", id: c.id } }); load(); }}
                  className="grid size-8 place-items-center rounded-full text-charcoal/40 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete collection"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelCard>
  );
}

/* ------------------------------- media library ----------------------------- */

export function MediaLibrary() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminListMedia().then((r) => setRows(r as any[]));
  useEffect(() => { load(); }, []);

  const addUrl = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try { await adminAddMediaByUrl({ data: { url: url.trim() } }); setUrl(""); await load(); }
    finally { setBusy(false); }
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const base64: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      await adminUploadMedia({ data: { fileName: file.name, contentType: file.type, base64 } });
      await load();
    } finally { setBusy(false); }
  };

  const filtered = (rows ?? []).filter(
    (m) => !q.trim() || `${m.title ?? ""} ${m.alt ?? ""} ${(m.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <PanelCard
      title="Media library"
      icon={ImageIcon}
      action={
        <div className="flex items-center gap-2 rounded-xl border border-forest/10 bg-cream-warm/60 px-3 py-2">
          <Search className="size-3.5 text-charcoal/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search media…" className="w-28 bg-transparent text-xs outline-none sm:w-40" />
        </div>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input className={inputCls} placeholder="Paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button onClick={addUrl} disabled={busy} className={btnCls}><Link2 className="size-3.5" /> Add URL</button>
        <label className={`${btnCls} cursor-pointer`}>
          <Plus className="size-3.5" /> Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
          />
        </label>
      </div>

      <div className="mt-4">
        {!rows ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No media yet" hint="Every AI-generated photo and upload lands here, ready to reuse anywhere." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {filtered.map((m) => (
              <figure key={m.id} className="group relative overflow-hidden rounded-2xl border border-forest/10 bg-white">
                <img src={m.public_url} alt={m.alt || m.title || "Media"} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-charcoal/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <input
                    defaultValue={m.alt ?? ""}
                    placeholder="alt text"
                    onBlur={(e) => adminUpdateMedia({ data: { id: m.id, alt: e.target.value } })}
                    className="min-w-0 flex-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] outline-none"
                  />
                  <button
                    onClick={async () => { await adminDeleteMedia({ data: { id: m.id } }); load(); }}
                    className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/90 text-rose-600"
                    aria-label="Delete media"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

/* ------------------------------- relationships ----------------------------- */

export function LinkableHint() {
  const [items, setItems] = useState<any>(null);
  useEffect(() => { adminLinkableItems().then(setItems).catch(() => setItems(null)); }, []);
  if (!items) return null;
  return (
    <p className="text-xs text-charcoal/55">
      {items.recipe.length} recipes · {items.blog.length} blogs · {items.product.length} products are linkable across the platform.
    </p>
  );
}

export const inputCls =
  "w-full rounded-xl border border-forest/12 bg-white px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-forest/40 focus:ring-2 focus:ring-forest/10";
export const btnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-cream shadow-md shadow-forest/20 transition hover:bg-forest-deep disabled:opacity-50";

/* --------------------------------- section --------------------------------- */

export function LibrarySection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [tab, setTab] = useState("all");
  return (
    <div>
      <SectionTabs
        active={tab}
        onSelect={setTab}
        tabs={[
          { id: "all", label: "Everything", icon: Layers },
          { id: "collections", label: "Collections", icon: Layers },
          { id: "media", label: "Media", icon: ImageIcon },
        ]}
      />
      <div key={tab} className="duration-300 animate-in fade-in slide-in-from-bottom-1">
        {tab === "all" && <UnifiedLibrary onNavigate={onNavigate} />}
        {tab === "collections" && <CollectionsManager />}
        {tab === "media" && <MediaLibrary />}
      </div>
    </div>
  );
}