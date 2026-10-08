import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Archive } from "lucide-react";
import { PageHeader, Empty } from "@/components/AppShell";
import { AISLES, buildGrocery, inPantry } from "@/lib/grocery";
import { useCurrentPlan, usePantry, usePantryMutations, useSavePlan } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/grocery")({
  head: () => ({ meta: [{ title: "Grocery list — Planted & Simple" }, { name: "description", content: "Your week's shopping list, grouped by aisle." }, { property: "og:title", content: "Grocery list — Planted & Simple" }, { property: "og:description", content: "Shopping list grouped by aisle." }] }),
  component: Grocery,
});

function Grocery() {
  const plan = useCurrentPlan();
  const pantry = usePantry();
  const { add } = usePantryMutations();
  const save = useSavePlan();
  const [shopping, setShopping] = useState(false);

  const items = useMemo(() => (plan.data ? buildGrocery(plan.data.slots) : []), [plan.data]);
  const pantryNames = (pantry.data ?? []).map((p) => p.name);
  const checked = new Set(plan.data?.grocery_checked ?? []);

  if (!plan.isLoading && (!plan.data || !items.length)) {
    return (<><PageHeader eyebrow="Shop once" title="Grocery list" /><Empty title="Nothing to shop for yet">Add meals to your week and your list builds itself. <Link to="/planner" className="font-semibold text-primary underline">Open the planner</Link></Empty></>);
  }

  function toggle(key: string) {
    if (!plan.data) return;
    const next = new Set(checked);
    next.has(key) ? next.delete(key) : next.add(key);
    save.mutate({ id: plan.data.id, grocery_checked: [...next] });
  }

  const visible = items.filter((i) => !shopping || !inPantry(i, pantryNames));
  const toBuy = items.filter((i) => !inPantry(i, pantryNames));
  const left = toBuy.filter((i) => !checked.has(i.key)).length;

  return (
    <div>
      <PageHeader eyebrow="Check what you have. Then make your list." title="Grocery list">
        <button onClick={() => setShopping(!shopping)} className={`rounded-full px-4 py-2 text-sm font-semibold ${shopping ? "bg-primary text-primary-foreground" : "border bg-card text-primary"}`}>
          {shopping ? "Exit grocery mode" : "Grocery mode"}
        </button>
      </PageHeader>
      <p className="mb-5 text-sm text-muted-foreground">
        {left} of {toBuy.length} items left to buy{items.length - toBuy.length > 0 ? ` · ${items.length - toBuy.length} already in your pantry` : ""}.
        {shopping ? " Pantry items are hidden." : " Quantities show what each recipe needs (one batch as written in the cookbook)."}
      </p>

      <div className="space-y-5">
        {AISLES.map((aisle) => {
          const list = visible.filter((i) => i.aisle === aisle);
          if (!list.length) return null;
          return (
            <section key={aisle}>
              <h2 className="eyebrow mb-2">{aisle}</h2>
              <ul className="divide-y rounded-2xl border bg-card">
                {list.map((i) => {
                  const on = checked.has(i.key);
                  const have = inPantry(i, pantryNames);
                  return (
                    <li key={i.key} className="flex items-start gap-3 px-4 py-3">
                      <button onClick={() => toggle(i.key)} aria-label={on ? "Untick" : "Tick"} className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-primary/40"}`}>
                        {on && <Check className="h-4 w-4" />}
                      </button>
                      <div className={`min-w-0 flex-1 ${on ? "opacity-50 line-through" : ""}`}>
                        <p className={`font-semibold text-primary ${shopping ? "text-base" : "text-sm"}`}>{i.name}{have && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground no-underline">In pantry</span>}</p>
                        {!shopping && <p className="text-xs text-muted-foreground">{i.uses.map((u) => `${u.qty || "as needed"} · ${u.recipe}${u.times > 1 ? ` (×${u.times} meals)` : ""}`).join("  ·  ")}</p>}
                      </div>
                      {!shopping && !have && (
                        <button onClick={() => add.mutate([i.name])} className="rounded-full p-1.5 text-muted-foreground hover:text-primary" aria-label="I already have this" title="I already have this"><Archive className="h-4 w-4" /></button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
