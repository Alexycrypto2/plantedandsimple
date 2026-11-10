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

type Step = { title?: string | null; body: string; image_url?: string | null };

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

/** Finds the first cooking time in a step, e.g. "bake 25 minutes" or "10–12 min" → seconds (uses the upper bound). */
export function stepTimerSeconds(text: string): number | null {
  const m = text.match(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i);
  if (!m) return null;
  const n = Number(m[2] ?? m[1]);
  const unit = m[3]!.toLowerCase();
  const secs = unit.startsWith("h") ? n * 3600 : unit.startsWith("s") ? n : n * 60;
  return secs > 0 && secs <= 6 * 3600 ? secs : null;
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`;
};

function chime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
    });
  } catch { /* ignore */ }
  navigator.vibrate?.([300, 150, 300, 150, 300]);
}

type Timer = { step: number; label: string; end: number; total: number; paused?: number; done?: boolean };

/** Full-screen, one-step-at-a-time view: timers, swipe, ingredient sheet, step dots, read aloud; keeps the screen awake. */
function CookMode({ title, steps, groups, onClose }: { title: string; steps: Step[]; groups: Group[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [showIng, setShowIng] = useState(false);
  const [awake, setAwake] = useState<"on" | "off" | "unsupported">("off");
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [speaking, setSpeaking] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const lock = useRef<any>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const total = steps.length;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const go = (n: number) => { setI(Math.max(0, Math.min(total - 1, n))); if (canSpeak) { window.speechSynthesis.cancel(); setSpeaking(false); } };

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
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [onClose, total]);

  // Tick running timers; chime once when each finishes.
  useEffect(() => {
    if (!timers.some((t) => !t.done && !t.paused)) return;
    const id = window.setInterval(() => {
      const n = Date.now(); setNow(n);
      setTimers((ts) => ts.map((t) => (!t.done && !t.paused && t.end <= n ? (chime(), { ...t, done: true }) : t)));
    }, 500);
    return () => window.clearInterval(id);
  }, [timers]);

  const s = steps[i];
  const stepText = s ? cleanStep(s.body) : "";
  const suggested = s ? stepTimerSeconds(`${s.title ?? ""} ${s.body}`) : null;
  const hasTimer = timers.some((t) => t.step === i && !t.done);
  const startTimer = (secs: number) => {
    const label = s?.title ? cleanStepText(s.title) : `Step ${i + 1}`;
    setNow(Date.now());
    setTimers((ts) => [...ts.filter((t) => t.step !== i), { step: i, label, end: Date.now() + secs * 1000, total: secs }]);
  };
  const remaining = (t: Timer) => Math.max(0, Math.ceil(((t.paused ?? t.end) - (t.paused ? 0 : now)) / 1000));
  const toggle = (t: Timer) => setTimers((ts) => ts.map((x) => x !== t ? x : x.paused ? { ...x, end: Date.now() + x.paused, paused: undefined } : { ...x, paused: x.end - Date.now() }));

  const speak = () => {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(`Step ${i + 1}. ${s?.title ? cleanStepText(s.title) + ". " : ""}${stepText}`);
    u.rate = 0.95; u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    synth.cancel(); synth.speak(u); setSpeaking(true);
  };

  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]!; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current; touch.current = null;
    if (!start || showIng) return;
    const t = e.changedTouches[0]!; const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(i + (dx < 0 ? 1 : -1));
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Cook mode: ${title}`} className="no-print fixed inset-0 z-[100] flex flex-col bg-cream">
      <div className="flex items-center justify-between gap-3 border-b border-forest/15 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate font-display text-base italic text-forest-deep">{title}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
            {awake === "on" ? "● Screen staying on" : awake === "unsupported" ? "Screen lock not supported here" : "Keeping screen on…"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full bg-forest px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cream">Exit</button>
      </div>

      {/* Step dots: tap to jump */}
      <div className="flex gap-1 overflow-x-auto px-4 py-2" aria-label="Steps">
        {steps.map((_, n) => (
          <button key={n} type="button" onClick={() => go(n)} aria-label={`Go to step ${n + 1}`} aria-current={n === i ? "step" : undefined}
            className={`h-8 min-w-8 shrink-0 rounded-full text-xs font-bold transition ${n === i ? "bg-forest text-cream" : n < i ? "bg-sage-soft text-forest" : "border border-forest/20 text-forest/60"}`}>{n + 1}</button>
        ))}
      </div>

      {timers.length ? (
        <div className="flex gap-2 overflow-x-auto border-y border-forest/10 bg-cream-warm px-4 py-2">
          {timers.map((t) => (
            <div key={t.step} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${t.done ? "animate-pulse bg-destructive text-destructive-foreground" : "bg-card text-forest"}`}>
              <button type="button" onClick={() => go(t.step)} className="max-w-[9rem] truncate">{t.label}</button>
              <span className="font-mono">{t.done ? "Done!" : fmt(remaining(t))}</span>
              {!t.done ? <button type="button" onClick={() => toggle(t)} aria-label={t.paused ? "Resume" : "Pause"}>{t.paused ? "▶" : "❚❚"}</button> : null}
              <button type="button" onClick={() => setTimers((ts) => ts.filter((x) => x !== t))} aria-label="Remove timer">✕</button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-5 py-5" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {s ? (
          <div className="mx-auto max-w-2xl pb-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Step {i + 1} of {total}</p>
              {canSpeak ? <button type="button" onClick={speak} className="rounded-full border border-forest/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-forest">{speaking ? "■ Stop" : "🔊 Read aloud"}</button> : null}
            </div>
            {s.title ? <h2 className="mt-2 font-display text-2xl italic text-forest-deep md:text-3xl">{cleanStepText(s.title)}</h2> : null}
            {s.image_url ? <img src={s.image_url} alt={`Step ${i + 1}${s.title ? `: ${cleanStepText(s.title)}` : ""}`} className="mt-4 max-h-[30vh] w-full rounded-2xl object-cover" /> : null}
            <p className="mt-4 text-xl leading-relaxed text-charcoal md:text-2xl">{stepText}</p>
            {suggested && !hasTimer ? (
              <button type="button" onClick={() => startTimer(suggested)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream">⏱ Start {fmt(suggested)} timer</button>
            ) : null}
            {steps[i + 1] ? <p className="mt-6 border-t border-forest/15 pt-3 text-sm text-charcoal/60"><span className="font-bold text-forest">Next:</span> {cleanStepText(steps[i + 1]!.title || steps[i + 1]!.body).slice(0, 120)}</p> : <p className="mt-6 font-display text-xl italic text-forest">Last step — enjoy your meal!</p>}
            <p className="mt-3 text-center text-[11px] text-charcoal/40 md:hidden">Swipe left or right to change steps</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-forest/15 px-3 pt-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className="rounded-full border border-forest/25 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-forest disabled:opacity-30">← Back</button>
        <button type="button" onClick={() => setShowIng(true)} className="rounded-full bg-cream-warm px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-forest">Ingredients</button>
        <button type="button" disabled={i >= total - 1} onClick={() => go(i + 1)} className="rounded-full bg-forest py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-cream disabled:opacity-30">Next →</button>
      </div>

      {/* Slide-up ingredients sheet: step stays underneath */}
      {showIng ? (
        <div className="absolute inset-0 z-10 flex items-end bg-charcoal/40" onClick={() => setShowIng(false)}>
          <div className="max-h-[75%] w-full overflow-y-auto rounded-t-2xl bg-cream px-5 pb-8 pt-3 shadow-2xl animate-in slide-in-from-bottom-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-forest/20" />
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl italic text-forest-deep">Ingredients</h2>
              <button type="button" onClick={() => setShowIng(false)} className="rounded-full bg-forest px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cream">Back to step {i + 1}</button>
            </div>
            {groups.map((g, gi) => (
              <div key={gi} className="mt-4">
                {g.group ? <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sage">{g.group}</h3> : null}
                <ul className="mt-2 space-y-1">
                  {(g.items ?? []).map((it, j) => {
                    const k = `${gi}-${j}`;
                    return (
                      <li key={j}>
                        <label className="flex cursor-pointer items-start gap-3 border-b border-forest/10 py-2 text-base text-charcoal">
                          <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-forest)]" checked={!!checked[k]} onChange={() => setChecked((c) => ({ ...c, [k]: !c[k] }))} />
                          <span className={checked[k] ? "text-charcoal/40 line-through" : ""}>{it}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
