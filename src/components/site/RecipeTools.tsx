import { useEffect, useRef, useState } from "react";
import { scaleLine, baseServings } from "@/lib/recipe-scale";
import logo from "@/assets/plantedandsimple-logo.png.asset.json";
import { createPortal } from "react-dom";
import { SITE_URL } from "@/lib/seo";
import { cleanStep, cleanStepText, cleanTip, usNutritionLabel } from "@/lib/recipe-clean";

const btn = "inline-flex items-center gap-2 rounded-full border border-forest/20 bg-card px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest transition hover:bg-forest hover:text-cream";

export function pinterestUrl(url: string, image?: string | null, text?: string) {
  const p = new URLSearchParams({ url });
  if (image) p.set("media", image);
  if (text) p.set("description", text);
  return `https://www.pinterest.com/pin/create/button/?${p.toString()}`;
}

/** Opens Pinterest's save dialog in a small popup; falls back to a new tab if popups are blocked. */
export function openPinterest(pagePath: string, image?: string | null, text?: string) {
  const url = SITE_URL + pagePath;
  const media = image ? (/^https?:\/\//.test(image) ? image : SITE_URL + (image.startsWith("/") ? image : `/${image}`)) : null;
  const target = pinterestUrl(url, media, text);
  const w = 750, h = 620;
  const left = Math.max(0, (window.screen.width - w) / 2), top = Math.max(0, (window.screen.height - h) / 2);
  const win = window.open(target, "pinterest", `width=${w},height=${h},left=${left},top=${top},noopener=no`);
  if (!win) window.open(target, "_blank", "noopener,noreferrer");
}

type Step = { title?: string | null; body: string };

export function RecipeToolbar({ title, image, path, pinText, steps, groups }: {
  title: string; image?: string | null; path: string; pinText?: string | null; steps: Step[]; groups: Group[];
}) {
  const [cook, setCook] = useState(false);
  return (
    <>
      <div className="no-print mt-6 flex flex-wrap justify-center gap-2">
        <a href="#recipe-card" className={btn}>↓ Jump to recipe</a>
        <button type="button" onClick={() => window.print()} className={btn}>Print recipe</button>
        <button type="button" onClick={() => openPinterest(path, image, pinText || title)} className={btn}>Save to Pinterest</button>
        <button type="button" onClick={() => setCook(true)} className={btn}>
          <span className="h-2 w-2 rounded-full bg-sage" /> Cook mode
        </button>
      </div>
      {cook ? <CookMode title={title} steps={steps} groups={groups} onClose={() => setCook(false)} /> : null}
    </>
  );
}

/** Full-screen, one-step-at-a-time view with big text; keeps the screen awake where the phone allows it. */
function CookMode({ title, steps, groups, onClose }: { title: string; steps: Step[]; groups: Group[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [showIng, setShowIng] = useState(false);
  const [awake, setAwake] = useState<"on" | "off" | "unsupported">("off");
  const lock = useRef<any>(null);
  const total = steps.length;

  useEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      if (!("wakeLock" in navigator)) { setAwake("unsupported"); return; }
      try {
        const l = await (navigator as any).wakeLock.request("screen");
        if (cancelled) { l.release(); return; }
        lock.current = l; setAwake("on");
        l.addEventListener?.("release", () => { if (!cancelled) setAwake("off"); });
      } catch { setAwake("unsupported"); }
    };
    void acquire();
    const onVis = () => { if (document.visibilityState === "visible") void acquire(); };
    document.addEventListener("visibilitychange", onVis);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(total - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lock.current?.release?.(); lock.current = null;
    };
  }, [onClose, total]);

  const s = steps[i];
  return (
    <div role="dialog" aria-modal="true" aria-label={`Cook mode: ${title}`} className="no-print fixed inset-0 z-[100] flex flex-col bg-cream">
      <div className="flex items-center justify-between gap-3 border-b border-forest/15 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg italic text-forest-deep">{title}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
            {awake === "on" ? "● Screen staying on" : awake === "unsupported" ? "Screen lock not supported on this phone" : "Keeping screen on…"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full bg-forest px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cream">Exit</button>
      </div>
      <div className="h-1.5 bg-forest/10"><div className="h-full bg-forest transition-all" style={{ width: `${total ? ((i + 1) / total) * 100 : 0}%` }} /></div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {showIng ? (
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl italic text-forest-deep">Ingredients</h2>
            {groups.map((g, gi) => (
              <div key={gi} className="mt-5">
                {g.group ? <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sage">{g.group}</h3> : null}
                <ul className="mt-2 space-y-2 text-lg leading-relaxed text-charcoal">
                  {(g.items ?? []).map((it, j) => <li key={j} className="border-b border-forest/10 pb-2">{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ) : s ? (
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sage">Step {i + 1} of {total}</p>
            {s.title ? <h2 className="mt-3 font-display text-3xl italic text-forest-deep">{cleanStepText(s.title)}</h2> : null}
            <p className="mt-5 text-2xl leading-relaxed text-charcoal md:text-3xl">{cleanStep(s.body)}</p>
            {steps[i + 1] ? <p className="mt-10 border-t border-forest/15 pt-4 text-base text-charcoal/55"><span className="font-bold text-forest">Next:</span> {cleanStepText(steps[i + 1].title || steps[i + 1].body).slice(0, 120)}</p> : <p className="mt-10 font-display text-2xl italic text-forest">Last step — enjoy your meal!</p>}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-forest/15 px-4 py-3">
        <button type="button" disabled={i === 0 || showIng} onClick={() => setI((x) => Math.max(0, x - 1))} className="rounded-full border border-forest/25 py-4 text-sm font-bold uppercase tracking-[0.14em] text-forest disabled:opacity-30">← Back</button>
        <button type="button" onClick={() => setShowIng((v) => !v)} className="rounded-full bg-cream-warm px-4 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-forest">{showIng ? "Steps" : "Ingredients"}</button>
        <button type="button" disabled={i >= total - 1 || showIng} onClick={() => setI((x) => Math.min(total - 1, x + 1))} className="rounded-full bg-forest py-4 text-sm font-bold uppercase tracking-[0.14em] text-cream disabled:opacity-30">Next →</button>
      </div>
    </div>
  );
}

/** Clean printable sheet, portaled to <body> so print CSS can hide everything else (no blank pages). */
export function PrintSheet({ recipe, url }: { recipe: { title: string; description?: string | null; prep_minutes?: number | null; cook_minutes?: number | null; servings?: string | null; difficulty?: string | null; ingredients?: Group[] | null; instructions?: Step[] | null; nutrition?: { label: string; value: string }[] | null; tips?: string[] | null }; url: string }) {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => { setMount(document.body); }, []);
  if (!mount) return null;
  const r = recipe;
  const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
  const meta = [
    r.prep_minutes ? ["Prep", `${r.prep_minutes} min`] : null,
    r.cook_minutes ? ["Cook", `${r.cook_minutes} min`] : null,
    total ? ["Total", `${total} min`] : null,
    r.servings ? ["Serves", String(r.servings).replace(/\s*servings?$/i, "")] : null,
    r.difficulty ? ["Level", r.difficulty] : null,
  ].filter(Boolean) as string[][];
  return createPortal(
    <div className="print-sheet" aria-hidden="true">
      <header className="ps-head">
        <img src={logo.url} alt="" />
        <div>
          <h1>{r.title}</h1>
          {r.description ? <p className="ps-desc">{r.description}</p> : null}
        </div>
      </header>
      {meta.length ? <div className="ps-meta">{meta.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div> : null}
      <div className="ps-grid">
        <section className="ps-ing">
          <h2>Ingredients</h2>
          {(r.ingredients ?? []).map((g, i) => (
            <div key={i}>
              {g.group ? <h3>{g.group}</h3> : null}
              <ul>{(g.items ?? []).map((it, j) => <li key={j}><span className="ps-box" />{it}</li>)}</ul>
            </div>
          ))}
        </section>
        <section className="ps-steps">
          <h2>Method</h2>
          <ol>{(r.instructions ?? []).map((s, i) => (
            <li key={i}><span className="ps-num">{i + 1}</span><div>{s.title ? <strong>{cleanStepText(s.title)}. </strong> : null}{cleanStep(s.body)}</div></li>
          ))}</ol>
        </section>
      </div>
      {(r.nutrition ?? []).length ? (
        <div className="ps-nutri"><span className="ps-label">Nutrition per serving</span>{(r.nutrition ?? []).map((n) => <span key={n.label}><b>{n.value}</b> {usNutritionLabel(n.label)}</span>)}</div>
      ) : null}
      {(r.tips ?? []).length ? (
        <section className="ps-tips"><h2>Cooking tips</h2><ul>{(r.tips ?? []).map((t, i) => <li key={i}>{cleanTip(t)}</li>)}</ul></section>
      ) : null}
      <footer className="ps-foot">PlantedAndSimple · {url}</footer>
    </div>,
    mount,
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
      <img src={logo.url} alt="" className="h-12 w-12 shrink-0 rounded-full bg-card object-contain p-1" />
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
