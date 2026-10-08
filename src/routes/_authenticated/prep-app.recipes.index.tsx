import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RECIPES } from "@/data/recipes";
import { CATEGORY_LABEL } from "@/data/content";
import { RecipeCard } from "@/components/RecipeCard";
import { PageHeader, Empty } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/recipes/")({
  head: () => ({ meta: [{ title: "Recipes — Planted & Simple" }, { name: "description", content: "All 30 high-protein plant-based recipes from the cookbook." }, { property: "og:title", content: "Recipes — Planted & Simple" }, { property: "og:description", content: "All 30 cookbook recipes." }] }),
  validateSearch: (s: Record<string, unknown>): { fav?: boolean } => (s["fav"] === true || s["fav"] === "true" ? { fav: true } : {}),
  component: Recipes,
});

const PROTEINS = ["tofu", "tempeh", "seitan", "lentil", "chickpea", "bean", "edamame"];

function Recipes() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [prot, setProt] = useState<string | null>(null);
  const [quick, setQuick] = useState(false);
  const [freezer, setFreezer] = useState(false);
  const { fav } = Route.useSearch();
  const [favOnly, setFavOnly] = useState(!!fav);
  useEffect(() => setFavOnly(!!fav), [fav]);
  const favs = useFavorites();

  const list = useMemo(() => RECIPES.filter((r) =>
    (cat === "all" || r.category === cat) &&
    (!prot || r.proteins.some((p) => p.includes(prot))) &&
    (!quick || r.totalMinutes <= 20) &&
    (!freezer || r.freezer) &&
    (!favOnly || favs.data?.has(r.id)) &&
    (!q || (r.title + " " + r.ingredients.join(" ")).toLowerCase().includes(q.toLowerCase())),
  ), [q, cat, prot, quick, freezer, favOnly, favs.data]);

  const chip = (on: boolean) => `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-primary"}`;

  return (
    <div>
      <PageHeader eyebrow="30 High-Protein Plant-Based Meals" title="Recipe library" />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search recipes or ingredients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {["all", ...Object.keys(CATEGORY_LABEL)].map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{c === "all" ? "All" : CATEGORY_LABEL[c]}</button>)}
      </div>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {PROTEINS.map((p) => <button key={p} className={`${chip(prot === p)} capitalize`} onClick={() => setProt(prot === p ? null : p)}>{p === "bean" ? "Beans" : p}</button>)}
        <button className={chip(quick)} onClick={() => setQuick(!quick)}>20 min or less</button>
        <button className={chip(freezer)} onClick={() => setFreezer(!freezer)}>Freezer friendly</button>
        <button className={chip(favOnly)} onClick={() => setFavOnly(!favOnly)}>Favourites</button>
      </div>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((r) => <RecipeCard key={r.id} r={r} />)}</div>
      ) : (
        <Empty title="No recipes match">Try removing a filter.</Empty>
      )}
    </div>
  );
}
