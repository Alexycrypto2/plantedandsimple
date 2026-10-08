import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play, Timer, X, Sun } from "lucide-react";
import type { PrepTask } from "@/lib/prep";

interface RunningTimer { id: string; title: string; endsAt: number; pausedLeft?: number | undefined }
const KEY = "ps-live-timers";

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1175, 1568].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.6);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.7);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch { /* audio unavailable */ }
}

const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export function KitchenLiveMode({ tasks, done, onToggle, onClose }: { tasks: PrepTask[]; done: Set<string>; onToggle: (id: string) => void; onClose: () => void }) {
  const firstOpen = Math.max(0, tasks.findIndex((t) => !done.has(t.id)));
  const [idx, setIdx] = useState(firstOpen);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [now, setNow] = useState(Date.now());
  const [awake, setAwake] = useState(false);
  const fired = useRef(new Set<string>());

  // restore timers
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setTimers(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(timers)); }, [timers]);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(i); }, []);

  // alarms
  useEffect(() => {
    timers.forEach((t) => {
      if (t.pausedLeft == null && t.endsAt <= now && !fired.current.has(t.id)) { fired.current.add(t.id); chime(); }
    });
  }, [now, timers]);

  // wake lock
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const get = async () => { try { if (nav.wakeLock) { lock = await nav.wakeLock.request("screen"); setAwake(true); } } catch { setAwake(false); } };
    get();
    const onVis = () => { if (document.visibilityState === "visible") get(); };
    document.addEventListener("visibilitychange", onVis);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("visibilitychange", onVis); lock?.release().catch(() => {}); document.body.style.overflow = ""; };
  }, []);

  const t = tasks[idx];
  if (!t) return null;
  const isDone = done.has(t.id);
  const completed = tasks.filter((x) => done.has(x.id)).length;
  const timer = timers.find((x) => x.id === t.id);
  const whileWaiting = t.passive > 0 ? tasks.filter((x, i) => i > idx && !done.has(x.id) && x.passive === 0 && x.active > 0).slice(0, 3) : [];

  function startTimer(task: PrepTask) {
    fired.current.delete(task.id);
    setTimers((ts) => [...ts.filter((x) => x.id !== task.id), { id: task.id, title: task.title, endsAt: Date.now() + task.passive * 60000 }]);
  }
  function togglePause(id: string) {
    setTimers((ts) => ts.map((x) => x.id !== id ? x : x.pausedLeft != null ? { ...x, endsAt: Date.now() + x.pausedLeft, pausedLeft: undefined } : { ...x, pausedLeft: x.endsAt - Date.now() }));
  }
  const removeTimer = (id: string) => setTimers((ts) => ts.filter((x) => x.id !== id));
  const left = (x: RunningTimer) => x.pausedLeft ?? x.endsAt - now;

  function markDone() {
    if (!isDone) onToggle(t!.id);
    const next = tasks.findIndex((x, i) => i > idx && !done.has(x.id));
    if (next >= 0) setIdx(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary text-primary-foreground print:hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Kitchen live mode</p>
          <p className="text-sm opacity-80">Step {idx + 1} of {tasks.length} · {completed} done</p>
        </div>
        <div className="flex items-center gap-2">
          {awake && <span className="hidden items-center gap-1 rounded-full border border-primary-foreground/25 px-3 py-1 text-xs sm:flex"><Sun className="h-3.5 w-3.5 text-gold" /> Screen stays on</span>}
          <button onClick={onClose} aria-label="Exit live mode" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10"><X className="h-6 w-6" /></button>
        </div>
      </header>
      <div className="h-1.5 bg-primary-foreground/10"><div className="h-full bg-gold transition-all" style={{ width: `${(completed / tasks.length) * 100}%` }} /></div>

      {timers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4">
          {timers.map((x) => {
            const ms = left(x); const over = ms <= 0;
            return (
              <div key={x.id} className={`flex flex-none items-center gap-2 rounded-2xl px-3 py-2 ${over ? "animate-pulse bg-gold text-primary" : "bg-primary-foreground/10"}`}>
                <Timer className="h-4 w-4" />
                <button onClick={() => setIdx(tasks.findIndex((k) => k.id === x.id))} className="max-w-[9rem] truncate text-left text-xs font-semibold">{x.title}</button>
                <span className="font-display text-lg font-extrabold tabular-nums">{over ? "Done" : mmss(ms)}</span>
                {!over && <button onClick={() => togglePause(x.id)} aria-label="Pause timer" className="p-1">{x.pausedLeft != null ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>}
                <button onClick={() => removeTimer(x.id)} aria-label="Dismiss timer" className="p-1"><X className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap gap-2">
            {t.active > 0 && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-sm font-semibold">{t.active} min hands-on</span>}
            {t.passive > 0 && <span className="rounded-full border border-gold px-3 py-1 text-sm font-semibold text-gold">{t.passive} min unattended</span>}
          </div>
          <h1 className={`mt-4 font-display text-3xl font-extrabold leading-tight sm:text-5xl ${isDone ? "line-through opacity-60" : ""}`}>{t.title}</h1>
          <p className="mt-4 text-lg leading-relaxed opacity-90 sm:text-xl">{t.detail}</p>
          {t.amounts.length > 0 && (
            <div className="mt-5 rounded-2xl bg-primary-foreground/10 p-4 text-lg">
              {t.amounts.map((a) => <p key={a} className="py-0.5">{a}</p>)}
            </div>
          )}
          {t.recipes.length > 0 && <p className="mt-4 text-sm opacity-70">For: {t.recipes.join(" · ")}</p>}

          {t.passive > 0 && (
            <div className="mt-6">
              {timer ? (
                <div className="flex items-center gap-4 rounded-2xl border border-gold/60 p-4">
                  <Timer className="h-8 w-8 text-gold" />
                  <span className="font-display text-5xl font-extrabold tabular-nums">{left(timer) <= 0 ? "Done!" : mmss(left(timer))}</span>
                </div>
              ) : (
                <button onClick={() => startTimer(t)} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gold py-5 text-xl font-bold text-primary"><Timer className="h-6 w-6" /> Start {t.passive}-min timer</button>
              )}
            </div>
          )}

          {whileWaiting.length > 0 && (
            <div className="mt-6 rounded-2xl bg-primary-foreground/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">While this cooks</p>
              <ul className="mt-2 space-y-2">
                {whileWaiting.map((w) => (
                  <li key={w.id}><button onClick={() => setIdx(tasks.indexOf(w))} className="text-left text-base underline-offset-4 hover:underline">→ {w.title} <span className="opacity-60">({w.active}m)</span></button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer className="grid grid-cols-[auto_1fr_auto] gap-3 border-t border-primary-foreground/15 p-4">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Previous step" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 disabled:opacity-30"><ChevronLeft className="h-8 w-8" /></button>
        <button onClick={isDone ? () => onToggle(t.id) : markDone} className={`flex h-16 items-center justify-center gap-3 rounded-2xl text-xl font-bold ${isDone ? "bg-primary-foreground/10" : "bg-gold text-primary"}`}>
          <Check className="h-7 w-7" /> {isDone ? "Undo" : completed === tasks.length - 1 ? "Finish" : "Done — next"}
        </button>
        <button disabled={idx === tasks.length - 1} onClick={() => setIdx(idx + 1)} aria-label="Next step" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 disabled:opacity-30"><ChevronRight className="h-8 w-8" /></button>
      </footer>
    </div>
  );
}
