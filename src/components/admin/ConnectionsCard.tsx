import { useEffect, useMemo, useState } from "react";
import { Link2, Search, Sparkles, X } from "lucide-react";
import { adminLinkableItems } from "@/lib/library/admin.functions";

export type ConnLink = { type: string; id: string };
type Item = { id: string; title: string; status?: string };
type Kind = "recipe" | "blog" | "product";
const KINDS: Kind[] = ["recipe", "blog", "product"];
const LABEL: Record<Kind, string> = { recipe: "Recipes", blog: "Blogs", product: "Products" };
const STOP = new Set("the a an and or with for of to in on easy vegan plant based high protein recipe recipes how your you best".split(" "));

const words = (s: string) =>
  new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

/** Scores items by shared meaningful words with the page text. */
export function suggestConnections(text: string, items: Record<Kind, Item[]>, selfId?: string | null, perKind = { recipe: 3, blog: 2, product: 1 }) {
  const base = words(text);
  const out: ConnLink[] = [];
  for (const k of KINDS) {
    const scored = (items[k] ?? [])
      .filter((it) => it.id !== selfId)
      .map((it) => ({ it, s: [...words(it.title)].filter((w) => base.has(w)).length }))
      .sort((a, b) => b.s - a.s);
    const picks = scored.filter((x) => x.s > 0).slice(0, perKind[k]);
    // Always offer at least one product so every page points to a sale.
    if (k === "product" && !picks.length && scored[0]) picks.push(scored[0]);
    for (const p of picks) out.push({ type: k, id: p.it.id });
  }
  return out;
}

export function ConnectionsCard({
  links, onChange, selfId, contextText,
}: { links: ConnLink[]; onChange: (l: ConnLink[]) => void; selfId?: string | null; contextText: string }) {
  const [items, setItems] = useState<Record<Kind, Item[]> | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Kind>("recipe");
  useEffect(() => { adminLinkableItems().then((d: any) => setItems(d)).catch(() => setItems({ recipe: [], blog: [], product: [] })); }, []);

  const byKey = useMemo(() => {
    const m = new Map<string, Item>();
    for (const k of KINDS) for (const it of items?.[k] ?? []) m.set(`${k}:${it.id}`, it);
    return m;
  }, [items]);
  const isOn = (t: string, id: string) => links.some((l) => l.type === t && l.id === id);
  const toggle = (t: string, id: string) =>
    onChange(isOn(t, id) ? links.filter((l) => !(l.type === t && l.id === id)) : [...links, { type: t, id }]);
  const auto = () => {
    if (!items) return;
    const add = suggestConnections(contextText, items, selfId).filter((s) => !isOn(s.type, s.id));
    onChange([...links, ...add]);
  };
  const list = (items?.[tab] ?? []).filter((it) => it.id !== selfId && (!q || it.title.toLowerCase().includes(q.toLowerCase())));

  return (
    <section className="rounded-2xl border border-forest/10 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg italic text-forest-deep"><Link2 className="h-4 w-4" /> Connections</h3>
        <button type="button" onClick={auto} disabled={!items} className="flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cream disabled:opacity-50">
          <Sparkles className="h-3.5 w-3.5" /> Auto-connect
        </button>
      </div>
      <p className="mt-1 text-xs text-charcoal/55">Connected pages show on this page and link back automatically after you save.</p>

      <div className="mt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/40">Connected ({links.length})</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {links.length === 0 && <span className="text-xs text-charcoal/40">Nothing yet — tap Auto-connect or pick below.</span>}
          {links.map((l) => (
            <button key={`${l.type}:${l.id}`} type="button" onClick={() => toggle(l.type, l.id)} className="flex max-w-full items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-[11px] font-semibold text-cream">
              <span className="opacity-70">{l.type}</span><span className="truncate">{byKey.get(`${l.type}:${l.id}`)?.title ?? "…"}</span><X className="h-3 w-3 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {KINDS.map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tab === k ? "bg-forest/10 text-forest-deep" : "text-charcoal/50"}`}>
            {LABEL[k]} {items ? `(${(items[k] ?? []).length})` : ""}
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 rounded-xl border border-forest/15 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-charcoal/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${LABEL[tab].toLowerCase()}…`} className="w-full bg-transparent text-sm outline-none" />
      </label>
      <div className="mt-2 max-h-56 overflow-y-auto">
        {!items ? <p className="p-2 text-xs text-charcoal/40">Loading…</p> : list.length === 0 ? <p className="p-2 text-xs text-charcoal/40">No matches</p> : (
          <div className="flex flex-wrap gap-1.5">
            {list.map((it) => (
              <button key={it.id} type="button" onClick={() => toggle(tab, it.id)} className={`rounded-full border px-3 py-1.5 text-left text-[11px] font-semibold ${isOn(tab, it.id) ? "border-forest bg-forest text-cream" : "border-forest/15 text-charcoal/60"}`}>
                {it.title}{it.status && it.status !== "published" ? " · draft" : ""}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
