import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, RefreshCw, BookOpen, Save } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/AppShell";
import { RecipePicker } from "@/components/RecipePicker";
import { COOKBOOK_PLANS, RECIPE_BY_ID } from "@/data/content";
import { DAYS, DAY_LABEL, SLOTS, type Day, type PlanSlots, type Slot } from "@/data/types";
import { useCurrentPlan, usePantry, useProfile, useSavePlan } from "@/lib/data";
import { generateAiPlan } from "@/lib/ai.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Weekly planner — Planted & Simple" }, { name: "description", content: "Plan breakfast, lunch, dinner and snacks for the week." }, { property: "og:title", content: "Weekly planner — Planted & Simple" }, { property: "og:description", content: "Plan your plant-based week." }] }),
  component: Planner,
});

function Planner() {
  const plan = useCurrentPlan();
  const save = useSavePlan();
  const profile = useProfile();
  const pantry = usePantry();
  const ai = useServerFn(generateAiPlan);
  const [picker, setPicker] = useState<{ day: Day; slot: Slot } | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReason, setAiReason] = useState<string | null>(null);

  const slots: PlanSlots = plan.data?.slots ?? {};
  const avoid = [...(profile.data?.dislikes ?? []), ...(profile.data?.allergies ?? [])];

  async function write(next: PlanSlots, extra: { name?: string; source?: string; reset?: boolean } = {}) {
    try {
      await save.mutateAsync({
        id: extra.reset ? undefined : plan.data?.id,
        slots: next,
        is_current: true,
        ...(extra.name ? { name: extra.name } : {}),
        ...(extra.source ? { source: extra.source } : {}),
        ...(extra.reset ? { grocery_checked: [], prep_done: [] } : {}),
      });
    } catch { toast.error("Couldn't save your plan."); }
  }

  function setSlot(day: Day, slot: Slot, id: string | null) {
    write({ ...slots, [day]: { ...(slots[day] ?? {}), [slot]: id } });
  }

  async function runAi() {
    setAiBusy(true);
    try {
      const p = profile.data;
      const res = await ai({ data: {
        goal: p?.goal ?? undefined, servings: p?.servings, dislikes: p?.dislikes ?? [], allergies: p?.allergies ?? [],
        proteinTarget: p?.protein_target, pantry: (pantry.data ?? []).map((x) => x.name), note: aiNote || undefined,
      } });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      if ("slots" in res && res.slots) {
        await write(res.slots as PlanSlots, { name: "Suggested week", source: "ai", reset: true });
        setAiReason(res.reason ?? null);
        setAiOpen(false);
        toast.success("Your suggested week is ready");
      }
    } finally { setAiBusy(false); }
  }

  const dayProtein = (d: Day) => SLOTS.reduce((s, k) => s + (slots[d]?.[k] ? RECIPE_BY_ID[slots[d]![k]!]?.nutrition.protein ?? 0 : 0), 0);

  return (
    <div>
      <PageHeader eyebrow={plan.data?.name ?? "This week"} title="Weekly planner">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStartOpen(true)} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" /> Cookbook weeks</button>
          <button onClick={() => setAiOpen(true)} className="flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground"><Sparkles className="h-4 w-4" /> Suggest a week</button>
          {plan.data && <Link to="/plans" className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary"><Save className="h-4 w-4" /> Saved weeks</Link>}
        </div>
      </PageHeader>

      {aiReason && (
        <div className="mb-5 rounded-2xl border border-gold/40 bg-accent p-4 text-sm">
          <p className="eyebrow">AI suggestion · cookbook recipes only</p>
          <p className="mt-1">{aiReason}</p>
        </div>
      )}

      {!plan.data && !plan.isLoading && (
        <div className="mb-6 rounded-2xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
          Start from one of the cookbook's weekly plans, let us suggest one, or tap any <Plus className="inline h-3.5 w-3.5" /> below to build your own.
        </div>
      )}

      <div className="space-y-4">
        {DAYS.map((d) => (
          <section key={d} className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold text-primary">{DAY_LABEL[d]}</h2>
              <span className="text-xs font-semibold text-gold">{dayProtein(d)}g protein{profile.data?.protein_target ? ` / ${profile.data.protein_target}g` : ""}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SLOTS.map((s) => {
                const id = slots[d]?.[s];
                const r = id ? RECIPE_BY_ID[id] : null;
                return r ? (
                  <div key={s} className="group flex items-center gap-3 rounded-xl bg-muted/60 p-2">
                    <Link to="/recipes/$id" params={{ id: r.id }}><img src={r.image} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" /></Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s}</p>
                      <Link to="/recipes/$id" params={{ id: r.id }} className="line-clamp-2 text-sm font-semibold leading-snug text-primary">{r.title}</Link>
                    </div>
                    <button onClick={() => setPicker({ day: d, slot: s })} className="rounded-full p-1.5 text-primary hover:bg-card" aria-label={`Swap ${s}`}><RefreshCw className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button key={s} onClick={() => setPicker({ day: d, slot: s })} className="flex items-center gap-3 rounded-xl border border-dashed p-2 text-left text-sm text-muted-foreground hover:border-primary">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted"><Plus className="h-5 w-5" /></span>
                    <span><span className="block text-[11px] font-bold uppercase tracking-wider">{s}</span>Add</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {picker && (
        <RecipePicker
          open onOpenChange={(o) => !o && setPicker(null)}
          slot={picker.slot} currentId={slots[picker.day]?.[picker.slot]} avoid={avoid}
          onPick={(id) => setSlot(picker.day, picker.slot, id)}
        />
      )}

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-primary">Start from the cookbook</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This replaces the meals in your current week. Your saved weeks stay safe.</p>
          <div className="space-y-2">
            {COOKBOOK_PLANS.map((p) => (
              <button key={p.id} onClick={async () => { await write(p.slots, { name: p.name, source: p.id, reset: true }); setAiReason(null); setStartOpen(false); toast.success(`${p.name} loaded`); }}
                className="w-full rounded-xl border p-3 text-left hover:border-primary">
                <p className="font-semibold text-primary">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.blurb} · Cookbook p.{p.page}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-primary">Suggest a week</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">We'll pick recipes from your cookbook only — using your preferences and what's in your pantry. You can swap anything after.</p>
          <Textarea placeholder="Anything for this week? e.g. quick dinners, use up chickpeas" value={aiNote} onChange={(e) => setAiNote(e.target.value)} maxLength={300} />
          <button onClick={runAi} disabled={aiBusy} className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
            <Sparkles className="h-4 w-4" /> {aiBusy ? "Planning your week…" : "Build my week"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
