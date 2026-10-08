import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { usePantry, usePantryMutations } from "@/lib/data";
import { RECIPES } from "@/data/recipes";
import { normalizeKey, splitIngredient } from "@/lib/grocery";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Pantry — Planted & Simple" }, { name: "description", content: "What you already have, and what you can cook with it." }, { property: "og:title", content: "Pantry — Planted & Simple" }, { property: "og:description", content: "Use what you have." }] }),
  component: Pantry,
});

const STAPLES = ["olive oil", "salt", "black pepper", "garlic powder", "smoked paprika", "cumin", "tamari", "maple syrup", "nutritional yeast", "rolled oats", "brown rice", "quinoa", "peanut butter", "tahini", "hemp seeds", "chia seeds"];

function Pantry() {
  const pantry = usePantry();
  const { add, remove } = usePantryMutations();
  const [text, setText] = useState("");
  const names = (pantry.data ?? []).map((p) => p.name);
  const keys = names.map(normalizeKey);

  // Use what I have: rank cookbook recipes by share of ingredients already in the pantry.
  const matches = useMemo(() => {
    if (!keys.length) return [];
    return RECIPES.map((r) => {
      const ing = r.ingredients.map((l) => normalizeKey(splitIngredient(l).name));
      const have = ing.filter((k) => keys.some((p) => p && (k.includes(p) || p.includes(k))));
      return { r, have: have.length, total: ing.length, missing: r.ingredients.filter((_, i) => !have.includes(ing[i] ?? "")).slice(0, 4) };
    }).filter((m) => m.have > 0).sort((a, b) => b.have / b.total - a.have / a.total).slice(0, 6);
  }, [keys.join("|")]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Plan around what you already have" title="Pantry" />
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(text.split(",")); setText(""); }} className="flex gap-2">
        <Input placeholder="Add items, separated by commas" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground">Add</button>
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Quick add staples</p>
        <div className="flex flex-wrap gap-2">
          {STAPLES.filter((s) => !keys.includes(normalizeKey(s))).map((s) => (
            <button key={s} onClick={() => add.mutate([s])} className="rounded-full border border-dashed px-3 py-1 text-sm text-primary">+ {s}</button>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold text-primary">In your kitchen ({names.length})</h2>
        {names.length ? (
          <div className="flex flex-wrap gap-2">
            {pantry.data!.map((p) => (
              <span key={p.id} className="flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm font-semibold text-secondary-foreground">
                {p.name}<button onClick={() => remove.mutate(p.id)} aria-label={`Remove ${p.name}`} className="rounded-full p-1 hover:bg-card"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Nothing yet. Items here are hidden from your grocery list in grocery mode.</p>}
      </section>

      {matches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-primary">Cook with what you have</h2>
          <p className="mb-3 text-sm text-muted-foreground">Cookbook recipes ranked by how many ingredients you already own.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.map(({ r, have, total, missing }) => (
              <Link key={r.id} to="/recipes/$id" params={{ id: r.id }} className="flex gap-3 rounded-2xl border bg-card p-3">
                <img src={r.image} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{r.title}</p>
                  <p className="text-xs font-semibold text-gold">You have {have} of {total}</p>
                  <p className="truncate text-xs text-muted-foreground">Need: {missing.join(", ")}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
