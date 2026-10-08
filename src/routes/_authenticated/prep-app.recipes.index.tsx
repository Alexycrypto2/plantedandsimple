import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RECIPES } from "@/prep-kit/data/recipes";
import { CATEGORY_LABEL } from "@/prep-kit/data/content";
import { COOKBOOKS } from "@/prep-kit/data/library";
import { RecipeCard } from "@/prep-kit/components/RecipeCard";
import { PageHeader, Empty } from "@/prep-kit/components/AppShell";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/prep-kit/lib/data";

export const Route = createFileRoute("/_authenticated/prep-app/recipes/")({
  head: () => ({ meta: [{ title: "Recipes — Planted & Simple" }, { name: "description", content: "Every plant-based recipe from your cookbooks." }, { property: "og:title", content: "Recipes — Planted & Simple" }, { property: "og:description", content: "Every recipe from your cookbooks." }] }),
  validateSearch: (s: Record<string, unknown>): { fav?: boolean } => (s["fav"] === true || s["fav"] === "true" ? { fav: true } : {}),
  component: Recipes,
});

const PROTEINS = ["tofu", "tempeh", "seitan", "lentil", "chickpea", "bean", "edamame"];

function Recipes() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [prot, setProt] = useState<string | null>(null);
  const [book, setBook] = useState<string>("all");
  const [quick, setQuick] = useState(false);
  const [freezer, setFreezer] = useState(false);
  const { fav } = Route.useSearch();
  const [favOnly, setFavOnly] = useState(!!fav);
  useEffect(() => setFavOnly(!!fav), [fav]);
  const favs = useFavorites();

  const list = useMemo(() => RECIPES.filter((r) =>
    (book === "all" || (r.cookbook ?? "core") === book) &&
    (cat === "all" || r.category === cat) &&
    (!prot || r.proteins.some((p) => p.includes(prot))) &&
    (!quick || r.totalMinutes <= 20) &&
    (!freezer || r.freezer) &&
    (!favOnly || favs.data?.has(r.id)) &&
    (!q || (r.title + " " + r.ingredients.join(" ")).toLowerCase().includes(q.toLowerCase())),
  ), [q, book, cat, prot, quick, freezer, favOnly, favs.data]);

  const chip = (on: boolean) => `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-primary"}`;

  return (
    <div>
      <PageHeader eyebrow={`${RECIPES.length} plant-based recipes`} title="Recipe library" />
      {COOKBOOKS.length > 1 && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ slug: "all", title: "All cookbooks" }, ...COOKBOOKS].map((b) => <button key={b.slug} className={chip(book === b.slug)} onClick={() => setBook(b.slug)}>{b.title}</button>)}
        </div>
      )}
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
