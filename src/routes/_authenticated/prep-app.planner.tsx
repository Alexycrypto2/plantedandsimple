import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, RefreshCw, BookOpen, Save, Printer } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/prep-kit/components/AppShell";
import { RecipePicker } from "@/prep-kit/components/RecipePicker";
import { COOKBOOK_PLANS, RECIPE_BY_ID } from "@/prep-kit/data/content";
import { DAYS, DAY_LABEL, SLOTS, type Day, type PlanSlots, type Slot } from "@/prep-kit/data/types";
import { useCurrentPlan, usePantry, useProfile, useSavePlan } from "@/prep-kit/lib/data";
import { generateAiPlan } from "@/prep-kit/lib/ai.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FridgeSheet } from "@/prep-kit/components/FridgeSheet";
import { buildSmartWeek } from "@/prep-kit/lib/smart-week";
import { RECIPES } from "@/prep-kit/data/recipes";

export const Route = createFileRoute("/_authenticated/prep-app/planner")({
  head: () => ({ meta: [{ title: "Weekly planner — Planted & Simple" }, { name: "description", content: "Plan breakfast, lunch, dinner and snacks for the week." }, { property: "og:title", content: "Weekly planner — Planted & Simple" }, { property: "og:description", content: "Plan your plant-based week." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
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
  const planning = useRef(false);
  const [proteinTarget, setProteinTarget] = useState(100);

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
      return true;
    } catch { toast.error("Couldn't save your plan."); return false; }
  }

  function setSlot(day: Day, slot: Slot, id: string | null) {
    write({ ...slots, [day]: { ...(slots[day] ?? {}), [slot]: id } });
  }

  async function runAi(preset?: string) {
    if (planning.current || save.isPending || profile.isLoading || pantry.isLoading) return;
    if (Object.values(slots).some((d) => Object.values(d ?? {}).some(Boolean)) && !window.confirm("Build a new week? Your current meals will be replaced; saved weeks stay available.")) return;
    planning.current = true;
    setAiBusy(true);
    try {
      const p = profile.data;
      const preferences = {
        goal: p?.goal ?? undefined, servings: p?.servings, dislikes: p?.dislikes ?? [], allergies: p?.allergies ?? [],
        proteinTarget, pantry: (pantry.data ?? []).map((x) => x.name), note: [preset, aiNote].filter(Boolean).join(". ") || undefined,
      };
      const res = preset === "smart" ? buildSmartWeek(RECIPES, preferences) : await ai({ data: preferences });
      if (!res || !("slots" in res) || !res.slots) { toast.error("Couldn't build a plan — try Cookbook weeks."); return; }
      if ("slots" in res && res.slots) {
        const saved = await write(res.slots as PlanSlots, { name: "Smart week", source: preset === "smart" ? "cookbook" : "ai", reset: true });
        if (!saved) return;
        setAiReason(res.reason ?? null);
        setAiOpen(false);
        toast.success("Your suggested week is ready");
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't build a plan — try Cookbook weeks."); } finally { planning.current = false; setAiBusy(false); }
  }

  const dayProtein = (d: Day) => SLOTS.reduce((sum, slot) => { const id = slots[d]?.[slot]; return sum + (id ? RECIPE_BY_ID[id]?.nutrition.protein ?? 0 : 0); }, 0);
  const weekRecipes = [...new Set(DAYS.flatMap((d) => SLOTS.map((s) => slots[d]?.[s]).filter((id): id is string => Boolean(id))))].map((id) => RECIPE_BY_ID[id]).filter(Boolean);

  return (
    <div className="planner-page">
      <PageHeader eyebrow={plan.data?.name ?? "This week"} title="Weekly planner">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStartOpen(true)} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" /> Cookbook weeks</button>
          <button onClick={() => setAiOpen(true)} className="flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground"><Sparkles className="h-4 w-4" /> Suggest a week</button>
          <Button variant="outline" disabled={!weekRecipes.length} onClick={() => window.print()}><Printer /> Fridge sheet</Button>
          {plan.data && <Link to="/prep-app/plans" className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary"><Save className="h-4 w-4" /> Saved weeks</Link>}
        </div>
      </PageHeader>
      <section className="mb-6 flex flex-wrap items-end gap-3 border-b border-border pb-5">
        <label className="text-sm font-semibold text-primary">Daily protein target (g)<input aria-label="Daily protein target" type="number" min={20} max={200} step={5} value={proteinTarget} onChange={(e) => setProteinTarget(Math.min(200, Math.max(20, Number(e.target.value) || 100)))} className="mt-1 block w-28 rounded-md border border-input bg-background px-3 py-2" /></label>
        <Button disabled={aiBusy || save.isPending || profile.isLoading || pantry.isLoading} onClick={() => runAi("smart")}><Sparkles /> {aiBusy ? "Building…" : "Build my week"}</Button>
        <Button variant="link" asChild><Link to="/prep-app/grocery">Grocery list →</Link></Button>
      </section>

      {aiReason && (
        <div className="mb-5 rounded-2xl border border-gold/40 bg-accent p-4 text-sm">
          <p className="eyebrow">Your cookbook week</p>
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
                    <Link to="/prep-app/recipes/$id" params={{ id: r.id }}><img src={r.image} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" /></Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s}</p>
                      <Link to="/prep-app/recipes/$id" params={{ id: r.id }} className="line-clamp-2 text-sm font-semibold leading-snug text-primary">{r.title}</Link>
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

      {weekRecipes.length > 0 && <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-xl font-bold text-primary">This week’s storage & reheating</h2>
        <p className="mt-2 text-sm text-muted-foreground">Refrigerate within 2 hours at 4°C / 40°F or below. Freeze suitable later-week portions, or cook a fresh batch midweek. Follow the recipe’s shorter storage limit.</p>
        <div className="mt-4 divide-y divide-border">{weekRecipes.map((r) => <div key={r.id} className="py-3"><Link to="/prep-app/recipes/$id" params={{ id: r.id }} className="font-semibold text-primary">{r.title}</Link><dl className="mt-1 grid gap-2 text-xs sm:grid-cols-3"><div><dt className="font-semibold">Fridge</dt><dd>{r.storage.fridge || "No recipe-specific guidance; prepare fresh."}</dd></div><div><dt className="font-semibold">Freezer</dt><dd>{r.freezer ? r.storage.freezer || "See recipe before freezing." : "Not marked freezer-friendly; prepare a fresh batch."}</dd></div><div><dt className="font-semibold">Reheat</dt><dd>{r.storage.reheat || "Follow the recipe’s serving instructions."}</dd></div></dl></div>)}</div>
      </section>}
      <FridgeSheet slots={slots} servings={profile.data?.servings ?? 1} />

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
          <div className="grid grid-cols-2 gap-2">
            {[
              ["⚡ Under 25 mins", "Quick meals under 25 minutes"],
              ["💪 Max protein", "Maximum protein, aim for 100g+ per day"],
              ["🥣 Pantry clean-out", "Use up as much of my pantry as possible"],
              ["🥗 Light & fresh", "Light and fresh meals"],
            ].map(([label, preset]) => (
              <button key={label} type="button" disabled={aiBusy} onClick={() => runAi(preset)}
                className="rounded-xl border bg-card px-3 py-2.5 text-left text-sm font-semibold text-primary hover:border-primary disabled:opacity-60">{label}</button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Tap a quick pick to build instantly, or describe your week:</p>
          <Textarea placeholder="Anything for this week? e.g. quick dinners, use up chickpeas" value={aiNote} onChange={(e) => setAiNote(e.target.value)} maxLength={300} />
          <button onClick={() => runAi()} disabled={aiBusy} className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
            <Sparkles className="h-4 w-4" /> {aiBusy ? "Planning your week…" : "Build my week"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
