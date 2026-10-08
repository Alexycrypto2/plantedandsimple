import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { GUIDES, PROTEIN_CHEAT, SMOOTHIES } from "@/data/content";

export const Route = createFileRoute("/_authenticated/guides")({
  head: () => ({ meta: [{ title: "Guides & smoothies — Planted & Simple" }, { name: "description", content: "Protein cheat sheet, 15 smoothies, meal prep hacks and budget tips from the cookbook." }, { property: "og:title", content: "Guides & smoothies — Planted & Simple" }, { property: "og:description", content: "Bonus chapters from the cookbook." }] }),
  component: Guides,
});

function Guides() {
  const [tab, setTab] = useState<"smoothies" | "protein" | "tips">("smoothies");
  const [minProtein, setMinProtein] = useState(0);
  const tabs = [["smoothies", "15 Smoothies"], ["protein", "Protein cheat sheet"], ["tips", "Prep & budget tips"]] as const;
  return (
    <div>
      <PageHeader eyebrow="Bonus chapters" title="Guides & smoothies" />
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${tab === k ? "border-primary bg-primary text-primary-foreground" : "bg-card text-primary"}`}>{l}</button>)}
      </div>

      {tab === "smoothies" && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {[0, 26, 28, 30].map((n) => <button key={n} onClick={() => setMinProtein(n)} className={`rounded-full border px-3 py-1 ${minProtein === n ? "border-gold bg-accent font-semibold" : ""}`}>{n ? `${n}g+ protein` : "All"}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SMOOTHIES.filter((s) => s.protein >= minProtein).map((s) => (
              <div key={s.n} className="rounded-2xl border bg-card p-4">
                <div className="flex items-baseline justify-between"><p className="font-display font-bold text-primary">{s.n}. {s.name}</p><span className="text-sm font-semibold text-gold">{s.protein}g</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{s.ingredients.join(" · ")}</p>
                <p className="mt-2 text-xs text-muted-foreground">Blend on high 45–60 seconds until smooth.</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Cookbook pp. 85–87</p>
        </>
      )}

      {tab === "protein" && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-primary text-left text-primary-foreground"><tr><th className="p-3">Food</th><th className="p-3">Serving</th><th className="p-3">Protein</th><th className="hidden p-3 sm:table-cell">Best used in</th></tr></thead>
            <tbody className="divide-y">{PROTEIN_CHEAT.map(([f, s, p, b]) => <tr key={f}><td className="p-3 font-semibold text-primary">{f}</td><td className="p-3">{s}</td><td className="p-3 font-semibold text-gold">{p}</td><td className="hidden p-3 text-muted-foreground sm:table-cell">{b}</td></tr>)}</tbody>
          </table>
          <div className="border-t bg-accent p-4 text-sm"><p className="eyebrow">Quick protein math</p><p className="mt-1">Two scoops of vegan protein powder + 1 block of tofu + 1 can of chickpeas + 3 tbsp hemp seeds = ~80 grams of protein right there. Build from this base.</p></div>
        </div>
      )}

      {tab === "tips" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <section key={g.title} className="rounded-2xl border bg-card p-5">
              <p className="eyebrow">Cookbook p.{g.page}</p>
              <h2 className="mt-1 font-display text-lg font-bold text-primary">{g.title}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
