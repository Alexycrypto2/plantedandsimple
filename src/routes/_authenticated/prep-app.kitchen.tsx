import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Clock, Hand, Package, Play, Printer, Refrigerator, Snowflake, Layers } from "lucide-react";
import { KitchenLiveMode } from "@/prep-kit/components/KitchenLiveMode";
import { PageHeader, Empty } from "@/prep-kit/components/AppShell";
import { buildPrepPlan, STATIONS, type PrepTask } from "@/prep-kit/lib/prep";
import { useCurrentPlan, useProfile, useSavePlan } from "@/prep-kit/lib/data";

export const Route = createFileRoute("/_authenticated/prep-app/kitchen")({
  head: () => ({ meta: [{ title: "Prep day — Planted & Simple" }, { name: "description", content: "Your station-by-station prep-day workflow with combined batch amounts." }, { property: "og:title", content: "Prep day — Planted & Simple" }, { property: "og:description", content: "Prep once, eat all week." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Prep,
});

const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim() : `${m}m`);

function Prep() {
  const plan = useCurrentPlan();
  const profile = useProfile();
  const save = useSavePlan();
  const [mode, setMode] = useState<"stations" | "timeline">("stations");
  const [live, setLive] = useState(false);
  const servings = Number(profile.data?.servings ?? 1) || 1;
  const p = useMemo(() => (plan.data ? buildPrepPlan(plan.data.slots, servings) : null), [plan.data, servings]);
  const done = new Set(plan.data?.prep_done ?? []);

  if (!plan.isLoading && (!p || p.batches.length === 0)) {
    return (<><PageHeader eyebrow="Prep once" title="Prep day" /><Empty title="Plan a few meals first">Your prep-day workflow is built from this week's recipes. <Link to="/prep-app/planner" className="font-semibold text-primary underline">Open the planner</Link></Empty></>);
  }
  if (!p) return null;

  function toggle(id: string) {
    if (!plan.data) return;
    const next = new Set(done);
    next.has(id) ? next.delete(id) : next.add(id);
    save.mutate({ id: plan.data.id, prep_done: [...next] });
  }

  const completed = p.tasks.filter((t) => done.has(t.id)).length;
  const pct = Math.round((completed / p.tasks.length) * 100);

  return (
    <div className="space-y-8">
      {live && <KitchenLiveMode tasks={p.tasks} done={done} onToggle={toggle} onClose={() => setLive(false)} />}
      <PageHeader eyebrow={`${profile.data?.prep_day ?? "Sunday"} · serving ${servings}`} title="Prep day workflow">
        <div className="flex gap-2 print:hidden">
          <button onClick={() => setLive(true)} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Play className="h-4 w-4" /> {completed > 0 && completed < p.tasks.length ? "Resume prep" : "Start prep"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </PageHeader>

      {/* Summary */}
      <section className="overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-sm">
        <div className="grid grid-cols-2 divide-primary-foreground/15 sm:grid-cols-4 sm:divide-x">
          <Stat icon={Clock} label="Total time" value={fmt(p.stats.totalMinutes)} />
          <Stat icon={Hand} label="Hands-on" value={fmt(p.stats.activeMinutes)} />
          <Stat icon={Package} label="Containers" value={String(p.stats.containers)} />
          <Stat icon={Layers} label="Meals covered" value={String(p.stats.meals)} />
        </div>
        <div className="border-t border-primary-foreground/15 px-5 py-4">
          <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-widest">
            <span className="text-gold">{pct}% complete</span><span className="opacity-75">{completed}/{p.tasks.length} steps</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        </div>
      </section>

      {/* Prep once → eat many */}
      {p.shared.length > 0 && (
        <section>
          <p className="eyebrow">Prep once, eat many times</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {p.shared.map((c) => (
              <div key={c.name} className="rounded-2xl border bg-card p-4">
                <div className="flex items-baseline justify-between"><span className="font-display text-lg font-bold text-primary">{c.name}</span><span className="text-xs font-semibold text-gold">{c.recipes.length} meals</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{c.recipes.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mode switch */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <p className="eyebrow">The workflow</p>
        <div className="inline-flex rounded-full border bg-card p-1 text-sm font-semibold">
          {(["stations", "timeline"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 capitalize transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-primary"}`}>{m === "stations" ? "By station" : "Timeline"}</button>
          ))}
        </div>
      </div>

      {mode === "stations" ? (
        <div className="space-y-8">
          {STATIONS.map((s, i) => {
            const ts = p.tasks.filter((t) => t.station === s.id);
            if (!ts.length) return null;
            return (
              <section key={s.id}>
                <div className="mb-3 flex items-baseline gap-3 border-b pb-2">
                  <span className="font-display text-2xl font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <div><h2 className="font-display text-lg font-bold text-primary">{s.label}</h2><p className="text-xs text-muted-foreground">{s.blurb}</p></div>
                </div>
                <ul className="space-y-2.5">{ts.map((t) => <TaskRow key={t.id} t={t} on={done.has(t.id)} onToggle={() => toggle(t.id)} />)}</ul>
              </section>
            );
          })}
        </div>
      ) : (
        <ol className="relative space-y-2.5 border-l-2 border-gold/40 pl-5">
          {p.tasks.map((t) => (
            <li key={t.id} className="relative">
              <span className="absolute -left-[27px] top-5 h-3 w-3 rounded-full border-2 border-gold bg-background" />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gold">+{fmt(t.start ?? 0)}</p>
              <TaskRow t={t} on={done.has(t.id)} onToggle={() => toggle(t.id)} />
            </li>
          ))}
        </ol>
      )}

      {/* Equipment + storage */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <p className="eyebrow">Before you start</p>
          <ul className="mt-3 space-y-2 text-sm">{p.equipment.map((e) => <li key={e} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold" />{e}</li>)}</ul>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <p className="eyebrow">Storage roadmap</p>
          <ul className="mt-3 divide-y text-sm">
            {p.storage.map((s) => (
              <li key={s.recipe} className="flex items-start gap-3 py-2">
                {s.where === "freezer" ? <Snowflake className="mt-0.5 h-4 w-4 flex-none text-primary" /> : <Refrigerator className="mt-0.5 h-4 w-4 flex-none text-primary" />}
                <div className="min-w-0"><p className="font-semibold text-primary">{s.recipe}</p><p className="text-xs text-muted-foreground">{s.where === "freezer" ? "Freezer" : "Fridge"} · {s.eatBy}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="px-5 py-5">
      <Icon className="h-4 w-4 text-gold" />
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-75">{label}</p>
    </div>
  );
}

function TaskRow({ t, on, onToggle }: { t: PrepTask; on: boolean; onToggle: () => void }) {
  return (
    <li className="list-none">
      <button onClick={onToggle} className={`flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary/40 ${on ? "opacity-55" : "shadow-sm"}`}>
        <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-primary/30"}`}>{on && <Check className="h-4 w-4" />}</span>
        <span className="min-w-0 flex-1">
          <span className={`block font-semibold text-primary ${on ? "line-through" : ""}`}>{t.title}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {t.active > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">{t.active}m hands-on</span>}
            {t.passive > 0 && <span className="rounded-full border border-gold/50 px-2 py-0.5 text-[11px] font-semibold text-primary">{t.passive}m unattended</span>}
          </span>
          <span className="mt-2 block text-sm text-muted-foreground">{t.detail}</span>
          {t.amounts.length > 0 && (
            <span className="mt-2 block rounded-xl bg-muted/60 px-3 py-2 text-sm">
              {t.amounts.map((a) => <span key={a} className="block text-foreground">{a}</span>)}
            </span>
          )}
          {t.recipes.length > 1 && <span className="mt-2 block text-xs text-muted-foreground">For: {t.recipes.join(" · ")}</span>}
        </span>
      </button>
    </li>
  );
}
