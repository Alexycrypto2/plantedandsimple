import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up — Planted & Simple" }, { name: "description", content: "Tell us how you like to eat." }, { property: "og:title", content: "Set up — Planted & Simple" }, { property: "og:description", content: "Tell us how you like to eat." }] }),
  component: Onboarding,
});

export const GOALS = [
  { v: "high-protein", l: "Hit more protein" },
  { v: "save-time", l: "Save time on weekdays" },
  { v: "budget", l: "Eat well on a budget" },
  { v: "variety", l: "More variety" },
];
const DAYS = ["Saturday", "Sunday", "Monday", "Wednesday"];
const ALLERGENS = ["peanuts", "tree nuts", "soy", "gluten", "sesame"];

export function ProfileForm({ submitLabel, onDone }: { submitLabel: string; onDone?: () => void }) {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [f, setF] = useState({ display_name: "", goal: "high-protein", servings: 2, prep_day: "Sunday", budget: "moderate", protein_target: 100, allergies: [] as string[], dislikes: "" });
  useEffect(() => {
    const p = profile.data;
    if (p) setF({ display_name: p.display_name ?? "", goal: p.goal ?? "high-protein", servings: p.servings, prep_day: p.prep_day ?? "Sunday", budget: p.budget ?? "moderate", protein_target: p.protein_target, allergies: p.allergies, dislikes: p.dislikes.join(", ") });
  }, [profile.data]);

  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-primary"}`;

  async function save() {
    try {
      await update.mutateAsync({ ...f, dislikes: f.dislikes.split(",").map((s) => s.trim()).filter(Boolean), onboarded: true });
      toast.success("Saved");
      onDone?.();
    } catch { toast.error("Couldn't save. Try again."); }
  }

  return (
    <div className="space-y-7">
      <div><Label>What should we call you?</Label><Input className="mt-2 max-w-xs" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
      <div><Label>Your main goal</Label><div className="mt-2 flex flex-wrap gap-2">{GOALS.map((g) => <button key={g.v} type="button" className={chip(f.goal === g.v)} onClick={() => setF({ ...f, goal: g.v })}>{g.l}</button>)}</div></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label>How many people are you cooking for?</Label><Input type="number" min={1} max={12} className="mt-2 w-24" value={f.servings} onChange={(e) => setF({ ...f, servings: Number(e.target.value) || 1 })} /></div>
        <div><Label>Daily protein target (g)</Label><Input type="number" min={0} max={400} className="mt-2 w-28" value={f.protein_target} onChange={(e) => setF({ ...f, protein_target: Number(e.target.value) || 0 })} /></div>
      </div>
      <div><Label>Your prep day</Label><div className="mt-2 flex flex-wrap gap-2">{DAYS.map((d) => <button key={d} type="button" className={chip(f.prep_day === d)} onClick={() => setF({ ...f, prep_day: d })}>{d}</button>)}</div></div>
      <div><Label>Budget</Label><div className="mt-2 flex flex-wrap gap-2">{["tight", "moderate", "flexible"].map((b) => <button key={b} type="button" className={`${chip(f.budget === b)} capitalize`} onClick={() => setF({ ...f, budget: b })}>{b}</button>)}</div></div>
      <div><Label>Allergies to avoid</Label><div className="mt-2 flex flex-wrap gap-2">{ALLERGENS.map((a) => { const on = f.allergies.includes(a); return <button key={a} type="button" className={`${chip(on)} capitalize`} onClick={() => setF({ ...f, allergies: on ? f.allergies.filter((x) => x !== a) : [...f.allergies, a] })}>{a}</button>; })}</div></div>
      <div><Label>Ingredients you'd rather skip</Label><Input className="mt-2" placeholder="e.g. mushrooms, cilantro" value={f.dislikes} onChange={(e) => setF({ ...f, dislikes: e.target.value })} /></div>
      <button onClick={save} disabled={update.isPending} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60">{submitLabel}</button>
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
      <ProfileForm submitLabel="Start planning" onDone={() => navigate({ to: "/planner" })} />
    </div>
  );
}
