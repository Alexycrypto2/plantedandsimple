import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, ChefHat, X, ChevronLeft, ChevronRight } from "lucide-react";
import { RECIPE_BY_ID, CATEGORY_LABEL } from "@/data/content";
import { useFavorites, useToggleFavorite } from "@/lib/data";
import { swapSuggestions } from "@/components/RecipePicker";

export const Route = createFileRoute("/_authenticated/recipes/$id")({
  loader: ({ params }) => {
    const r = RECIPE_BY_ID[params.id];
    if (!r) throw notFound();
    return { r };
  },
  head: ({ loaderData }) => loaderData
    ? { meta: [{ title: `${loaderData.r.title} — Planted & Simple` }, { name: "description", content: loaderData.r.description }, { property: "og:title", content: loaderData.r.title }, { property: "og:description", content: loaderData.r.description }] }
    : { meta: [{ title: "Recipe not found" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <p className="text-muted-foreground">That recipe isn't in the cookbook. <Link to="/recipes" className="text-primary underline">Back to recipes</Link></p>,
  errorComponent: () => <p className="text-muted-foreground">This recipe couldn't load.</p>,
  component: RecipeDetail,
});

function RecipeDetail() {
  const { r } = Route.useLoaderData();
  const favs = useFavorites();
  const toggle = useToggleFavorite();
  const fav = favs.data?.has(r.id) ?? false;
  const [cooking, setCooking] = useState(false);
  const similar = swapSuggestions(r.id, r.category === "breakfast" ? "breakfast" : r.category === "snack" ? "snack" : "dinner").slice(0, 3);

  if (cooking) return <CookingMode steps={r.steps} title={r.title} onClose={() => setCooking(false)} />;

  const n = r.nutrition;
  return (
    <article className="space-y-8">
      <Link to="/recipes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Recipes</Link>
      <div className="grid gap-6 md:grid-cols-2">
        <img src={r.image} alt={r.title} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md" />
        <div>
          <p className="eyebrow">Recipe No. {r.num} · {CATEGORY_LABEL[r.category]} · Cookbook p.{r.cookbookPage}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-primary">{r.title}</h1>
          <p className="mt-3 italic text-muted-foreground">{r.description}</p>
          <div className="mt-5 grid grid-cols-5 gap-2 text-center">
            {[["Cal", n.calories, ""], ["Protein", n.protein, "g"], ["Carbs", n.carbs, "g"], ["Fat", n.fat, "g"], ["Fiber", n.fiber, "g"]].map(([l, v, u]) => (
              <div key={l as string} className="rounded-lg bg-secondary py-2"><p className="font-display font-bold text-primary">{v}{u}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[["Prep", r.prep], ["Cook", r.cook], ["Serves", r.serves], ["Level", r.level]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-primary py-2 text-primary-foreground"><p className="font-display text-sm font-bold">{v}</p><p className="text-[10px] uppercase tracking-wider opacity-80">{l}</p></div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setCooking(true)} className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-semibold text-gold-foreground"><ChefHat className="h-4 w-4" /> Start cooking</button>
            <button onClick={() => toggle.mutate({ id: r.id, on: !fav })} className="flex items-center gap-2 rounded-full border px-5 py-2.5 font-semibold text-primary">
              <Heart className={`h-4 w-4 ${fav ? "fill-gold text-gold" : ""}`} /> {fav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {r.why.length > 0 && (
        <section className="rounded-2xl border-l-4 border-gold bg-accent p-5">
          <p className="eyebrow">Why you'll love this</p>
          <ul className="mt-2 space-y-1 text-sm">{r.why.map((w: string) => <li key={w}>{w}</li>)}</ul>
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section>
          <h2 className="text-xl font-bold text-primary">Ingredients</h2>
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {r.ingredients.map((i: string, k: number) => <li key={k} className="px-4 py-2.5 text-sm">{i}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary">Method</h2>
          <ol className="mt-3 space-y-3">
            {r.steps.map((s: string, k: number) => (
              <li key={k} className="flex gap-3"><span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{k + 1}</span><p className="pt-0.5 text-sm leading-relaxed">{s}</p></li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <p className="eyebrow">Storage & reheating</p>
          <dl className="mt-2 space-y-2 text-sm">
            {r.storage.fridge && <div><dt className="font-semibold text-primary">Refrigerator</dt><dd>{r.storage.fridge}</dd></div>}
            {r.storage.freezer && <div><dt className="font-semibold text-primary">Freezer</dt><dd>{r.storage.freezer}</dd></div>}
            {r.storage.reheat && <div><dt className="font-semibold text-primary">Reheating</dt><dd>{r.storage.reheat}</dd></div>}
          </dl>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <p className="eyebrow">Chef's tips</p>
          <dl className="mt-2 space-y-2 text-sm">
            {r.tips.substitutions && <div><dt className="font-semibold text-primary">Substitutions</dt><dd>{r.tips.substitutions}</dd></div>}
            {r.tips.serving && <div><dt className="font-semibold text-primary">Serving suggestion</dt><dd>{r.tips.serving}</dd></div>}
            {r.tips.variations && <div><dt className="font-semibold text-primary">Variation</dt><dd>{r.tips.variations}</dd></div>}
          </dl>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-primary">Similar recipes</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {similar.map((s) => (
            <Link key={s.id} to="/recipes/$id" params={{ id: s.id }} className="flex items-center gap-3 rounded-xl border bg-card p-2">
              <img src={s.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div><p className="line-clamp-2 text-sm font-semibold text-primary">{s.title}</p><p className="text-xs text-muted-foreground">{s.nutrition.protein}g protein</p></div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}

function CookingMode({ steps, title, onClose }: { steps: string[]; title: string; onClose: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary p-6 text-primary-foreground">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold opacity-80">{title}</p>
        <button onClick={onClose} aria-label="Close cooking mode" className="rounded-full p-2 hover:bg-primary-foreground/10"><X /></button>
      </div>
      <div className="mx-auto flex max-w-2xl flex-1 flex-col justify-center">
        <p className="eyebrow">Step {i + 1} of {steps.length}</p>
        <p className="mt-4 text-2xl font-semibold leading-relaxed md:text-3xl">{steps[i]}</p>
      </div>
      <div className="mx-auto flex w-full max-w-2xl gap-3">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="flex flex-1 items-center justify-center gap-1 rounded-full border border-primary-foreground/30 py-3 font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Back</button>
        {i < steps.length - 1
          ? <button onClick={() => setI(i + 1)} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-gold py-3 font-semibold text-gold-foreground">Next <ChevronRight className="h-4 w-4" /></button>
          : <button onClick={onClose} className="flex-1 rounded-full bg-gold py-3 font-semibold text-gold-foreground">Done — enjoy!</button>}
      </div>
    </div>
  );
}
