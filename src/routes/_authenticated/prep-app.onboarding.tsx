import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Minus, Plus, CalendarDays, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/prep-kit/lib/data";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/prep-app/onboarding")({
  head: () => ({ meta: [{ title: "Set up — Planted & Simple" }, { name: "description", content: "Tell us how you like to eat." }, { property: "og:title", content: "Set up — Planted & Simple" }, { property: "og:description", content: "Tell us how you like to eat." }] }),
  component: Onboarding,
});

export const GOALS = [
  { v: "high-protein", l: "Hit more protein", d: "Build meals around tofu, tempeh & legumes", e: "💪" },
  { v: "save-time", l: "Save time on weekdays", d: "Batch once, eat well all week", e: "⚡" },
  { v: "budget", l: "Eat well on a budget", d: "Pantry staples, smart leftovers", e: "💰" },
  { v: "variety", l: "More variety", d: "New flavours every week", e: "🥗" },
];
const DAYS = ["Saturday", "Sunday", "Monday", "Wednesday"];
const ALLERGENS = ["peanuts", "tree nuts", "soy", "gluten", "sesame"];
const PRESETS = [80, 100, 120, 140];
const BUDGETS = [{ v: "tight", s: "$", l: "Tight" }, { v: "moderate", s: "$$", l: "Moderate" }, { v: "flexible", s: "$$$", l: "Flexible" }];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-base font-bold text-primary">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProfileForm({ submitLabel, onDone }: { submitLabel: string; onDone?: () => void }) {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [f, setF] = useState({ display_name: "", goal: "high-protein", servings: 2, prep_day: "Sunday", budget: "moderate", protein_target: 100, allergies: [] as string[], dislikes: [] as string[] });
  const [skip, setSkip] = useState("");
  useEffect(() => {
    const p = profile.data;
    if (p) setF({ display_name: p.display_name ?? "", goal: p.goal ?? "high-protein", servings: p.servings, prep_day: p.prep_day ?? "Sunday", budget: p.budget ?? "moderate", protein_target: p.protein_target, allergies: p.allergies, dislikes: p.dislikes });
  }, [profile.data]);

  const pill = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-all ${on ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background text-primary hover:border-primary/50"}`;
  const addSkip = () => {
    const items = skip.split(",").map((x) => x.trim().toLowerCase()).filter((x) => x && !f.dislikes.includes(x));
    if (items.length) setF({ ...f, dislikes: [...f.dislikes, ...items] });
    setSkip("");
  };

  async function save() {
    try {
      const pending = skip.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
      await update.mutateAsync({ ...f, dislikes: Array.from(new Set([...f.dislikes, ...pending])), onboarded: true });
      setSkip("");
      toast.success("Profile saved");
      onDone?.();
    } catch { toast.error("Couldn't save. Try again."); }
  }

  return (
    <div className="space-y-4">
      <Section title="Your name">
        <Input className="max-w-xs" placeholder="What should we call you?" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} />
      </Section>

      <Section title="Main goal" hint="We'll shape suggestions around it.">
        <div className="grid grid-cols-2 gap-2.5">
          {GOALS.map((g) => {
            const on = f.goal === g.v;
            return (
              <button key={g.v} type="button" onClick={() => setF({ ...f, goal: g.v })} className={`relative rounded-xl border p-3 text-left transition-all ${on ? "border-primary bg-primary/5 ring-2 ring-primary" : "bg-background hover:border-primary/40"}`}>
                {on && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
                <span className="text-2xl">{g.e}</span>
                <p className="mt-1 text-sm font-bold text-primary">{g.l}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{g.d}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Cooking for">
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Fewer people" onClick={() => setF({ ...f, servings: Math.max(1, f.servings - 1) })} className="grid h-10 w-10 place-items-center rounded-full border text-primary hover:bg-muted"><Minus className="h-4 w-4" /></button>
            <div className="text-center"><p className="font-display text-3xl font-extrabold text-primary">{f.servings}</p><p className="text-xs text-muted-foreground">{f.servings === 1 ? "person" : "people"}</p></div>
            <button type="button" aria-label="More people" onClick={() => setF({ ...f, servings: Math.min(12, f.servings + 1) })} className="grid h-10 w-10 place-items-center rounded-full border text-primary hover:bg-muted"><Plus className="h-4 w-4" /></button>
          </div>
        </Section>
        <Section title="Daily protein target">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((n) => <button key={n} type="button" className={pill(f.protein_target === n)} onClick={() => setF({ ...f, protein_target: n })}>{n}g</button>)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            Custom <Input type="number" min={0} max={400} className="h-9 w-24" value={f.protein_target} onChange={(e) => setF({ ...f, protein_target: Number(e.target.value) || 0 })} /> g
          </div>
        </Section>
      </div>

      <Section title="Prep day" hint="The day you batch-cook for the week.">
        <div className="grid grid-cols-4 gap-2">
          {DAYS.map((d) => {
            const on = f.prep_day === d;
            return (
              <button key={d} type="button" onClick={() => setF({ ...f, prep_day: d })} className={`rounded-xl border py-2.5 text-center transition-all ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-primary hover:border-primary/40"}`}>
                <CalendarDays className="mx-auto h-4 w-4 opacity-80" />
                <p className="mt-1 text-xs font-bold">{d.slice(0, 3)}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Budget">
        <div className="grid grid-cols-3 gap-2">
          {BUDGETS.map((b) => {
            const on = f.budget === b.v;
            return (
              <button key={b.v} type="button" onClick={() => setF({ ...f, budget: b.v })} className={`rounded-xl border py-3 text-center transition-all ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-primary hover:border-primary/40"}`}>
                <p className="font-display text-lg font-extrabold">{b.s}</p>
                <p className="text-xs font-semibold opacity-80">{b.l}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Allergies to avoid" hint="Recipes with these are always left out.">
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => {
            const on = f.allergies.includes(a);
            return (
              <button key={a} type="button" className={`${pill(on)} inline-flex items-center gap-1.5 capitalize`} onClick={() => setF({ ...f, allergies: on ? f.allergies.filter((x) => x !== a) : [...f.allergies, a] })}>
                {on ? <ShieldAlert className="h-3.5 w-3.5" /> : null}{a}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Ingredients you'd rather skip">
        {f.dislikes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {f.dislikes.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary">
                {d}
                <button type="button" aria-label={`Remove ${d}`} onClick={() => setF({ ...f, dislikes: f.dislikes.filter((x) => x !== d) })}><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="e.g. mushrooms, cilantro" value={skip} onChange={(e) => setSkip(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkip(); } }} />
          <button type="button" onClick={addSkip} className="rounded-full border px-4 text-sm font-semibold text-primary hover:bg-muted">Add</button>
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <button onClick={save} disabled={update.isPending} className="w-full rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg disabled:opacity-60">{update.isPending ? "Saving…" : submitLabel}</button>
      </div>
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Welcome</p>
      <h1 className="mt-1 text-3xl font-extrabold text-primary">Let's set up your kitchen</h1>
      <p className="mb-8 mt-2 text-muted-foreground">A few quick questions so suggestions fit the way you eat. You can change these any time.</p>
      <ProfileForm submitLabel="Start planning" onDone={() => navigate({ to: "/prep-app/planner" })} />
    </div>
  );
}
