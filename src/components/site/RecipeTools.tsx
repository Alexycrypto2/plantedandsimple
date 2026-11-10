import { useEffect, useRef, useState } from "react";
import { scaleLine, baseServings } from "@/lib/recipe-scale";

const btn = "inline-flex items-center gap-2 rounded-full border border-forest/20 bg-card px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest transition hover:bg-forest hover:text-cream";

export function pinterestUrl(url: string, image?: string | null, text?: string) {
  const p = new URLSearchParams({ url });
  if (image) p.set("media", image);
  if (text) p.set("description", text);
  return `https://www.pinterest.com/pin/create/button/?${p.toString()}`;
}

export function RecipeToolbar({ title, image }: { title: string; image?: string | null }) {
  const [cook, setCook] = useState(false);
  const [supported, setSupported] = useState(false);
  const lock = useRef<any>(null);
  const [href, setHref] = useState("");

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
    setHref(window.location.href);
  }, []);

  useEffect(() => {
    if (!cook) { lock.current?.release?.(); lock.current = null; return; }
    let cancelled = false;
    const acquire = async () => {
      try { const l = await (navigator as any).wakeLock.request("screen"); if (cancelled) l.release(); else lock.current = l; } catch { setCook(false); }
    };
    void acquire();
    const onVis = () => { if (document.visibilityState === "visible" && cook) void acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVis); lock.current?.release?.(); lock.current = null; };
  }, [cook]);

  const abs = image && href ? new URL(image, href).toString() : image;

  return (
    <div className="no-print mt-6 flex flex-wrap justify-center gap-2">
      <a href="#recipe-card" className={btn}>↓ Jump to recipe</a>
      <button type="button" onClick={() => window.print()} className={btn}>Print recipe</button>
      {href ? <a href={pinterestUrl(href, abs, title)} target="_blank" rel="noopener noreferrer" className={btn}>Save to Pinterest</a> : null}
      {supported ? (
        <button type="button" role="switch" aria-checked={cook} onClick={() => setCook((c) => !c)} className={`${btn} ${cook ? "bg-forest text-cream" : ""}`}>
          <span className={`h-2 w-2 rounded-full ${cook ? "bg-cream" : "bg-sage"}`} /> Cook mode {cook ? "on" : "off"}
        </button>
      ) : null}
      {cook ? <p className="w-full text-center text-xs text-charcoal/60">Your screen will stay on while you cook.</p> : null}
    </div>
  );
}

type Group = { group?: string | null; items?: string[] | null };

export function ScalableIngredients({ groups, servings }: { groups: Group[]; servings: string | null | undefined }) {
  const base = baseServings(servings);
  const [count, setCount] = useState(base ?? 1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const factor = base ? count / base : 1;
  const toggle = (k: string) => setChecked((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl italic text-forest-deep">Ingredients</h2>
        {base ? (
          <div className="no-print flex items-center gap-2 rounded-full border border-forest/20 px-1 py-1" aria-label="Adjust servings">
            <button type="button" aria-label="Fewer servings" disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))} className="grid h-7 w-7 place-items-center rounded-full bg-cream-warm text-forest disabled:opacity-40">−</button>
            <span className="min-w-[5.5rem] text-center text-xs font-bold uppercase tracking-[0.14em] text-forest" aria-live="polite">{count} serving{count === 1 ? "" : "s"}</span>
            <button type="button" aria-label="More servings" disabled={count >= 24} onClick={() => setCount((c) => Math.min(24, c + 1))} className="grid h-7 w-7 place-items-center rounded-full bg-cream-warm text-forest disabled:opacity-40">+</button>
          </div>
        ) : null}
      </div>
      {base && count !== base ? (
        <p className="no-print mt-2 text-xs text-charcoal/55">Scaled from {base}. <button type="button" className="underline" onClick={() => setCount(base)}>Reset</button></p>
      ) : null}
      {groups.map((g, i) => (
        <div key={i} className="mt-6">
          {g.group ? <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-sage">{g.group}</h3> : null}
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-charcoal/75">
            {(g.items ?? []).map((it, j) => {
              const k = `${i}-${j}`;
              const on = checked.has(k);
              return (
                <li key={j} className="border-b border-forest/10 pb-2">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={on} onChange={() => toggle(k)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--forest)]" />
                    <span className={on ? "text-charcoal/40 line-through" : ""}>{scaleLine(it, factor)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function KitchenNote({ kind }: { kind: "recipe" | "blog" }) {
  return (
    <aside className="no-print mt-14 flex gap-4 rounded-[1.5rem] border border-forest/15 bg-cream-warm p-5">
      <img src="/favicon.png" onError={(e) => ((e.currentTarget.style.display = "none"))} alt="" className="h-12 w-12 shrink-0 rounded-full bg-card object-contain p-1" />
      <div>
        <p className="font-display text-lg italic text-forest-deep">From the PlantedAndSimple kitchen</p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/70">
          {kind === "recipe"
            ? "Every recipe here is written for home kitchens: plant-based, everyday ingredients, and clear steps. Nutrition is an estimate per serving and changes with brands and portions."
            : "We write practical plant-based guides for home cooks. Nutrition notes are general information, not medical advice — check with a professional for specific dietary needs."}
        </p>
      </div>
    </aside>
  );
}
