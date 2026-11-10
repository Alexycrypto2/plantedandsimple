import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FALLBACK_RECIPES } from "@/lib/fallback-content";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal, EditorialCard } from "@/components/site/primitives";
import { listCategories, listPublishedRecipes } from "@/lib/library/library.functions";
import type { Category, Recipe } from "@/lib/library/types";
import { getHubs, type Hub } from "@/lib/linking/linking.functions";
import { HubSections } from "@/components/site/RelatedLinks";

export const Route = createFileRoute("/recipes/")({
  component: RecipesIndex,
  loader: async (): Promise<{ recipes: Recipe[]; categories: Category[]; hubs: Hub[] }> => {
    const hubsP = getHubs().catch(() => [] as Hub[]);
    const [recipes, categories] = await Promise.allSettled([
      listPublishedRecipes({ data: { limit: 60 } }), listCategories(),
    ]).then(([recipeResult, categoryResult]) => [
      recipeResult.status === "fulfilled" ? recipeResult.value : [],
      categoryResult.status === "fulfilled" ? categoryResult.value : [],
    ] as const);
    return { recipes: recipes.length ? recipes : FALLBACK_RECIPES, categories, hubs: await hubsP };
  },
  head: () => pageHead("/recipes", "High-Protein Vegan & Plant-Based Recipes | PlantedAndSimple", "Find plant-based recipes with ingredients, step-by-step methods and cooking times. Browse vegan breakfasts, high-protein dinners and meal prep ideas."),
});


function RecipesIndex() {
  const { recipes, categories, hubs } = Route.useLoaderData() as { recipes: Recipe[]; categories: Category[]; hubs: Hub[] };
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const tags = useMemo(() => RECIPE_FILTERS.filter((f) => recipes.some((r) => f.match(r))), [recipes]);

  const filtered = useMemo(() => {
    const f = RECIPE_FILTERS.find((x) => x.id === tag);
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return recipes.filter((r) => {
      if (f && !f.match(r)) return false;
      if (!words.length) return true;
      const hay = recipeText(r);
      return words.every((w) => hay.includes(w));
    });
  }, [recipes, tag, q]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">The Library</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">Recipe Library</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/65">
          Every recipe here is cooked, photographed and refined in our kitchen before it is published. Full collections
          live inside our cookbooks.
        </p>

        <div className="sticky top-16 z-20 -mx-6 mt-10 bg-background/95 px-6 py-3 backdrop-blur">
          <label className="relative block max-w-xl">
            <span className="sr-only">Search recipes</span>
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/45">⌕</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search lentil, tofu, pumpkin…"
              className="w-full rounded-full border border-forest/20 bg-card py-3 pl-10 pr-4 text-sm text-charcoal outline-none focus:border-forest"
            />
          </label>
        </div>

        {tags.length ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            <FilterChip active={tag === null} onClick={() => setTag(null)}>
              All
            </FilterChip>
            {tags.map((t) => (
              <FilterChip key={t.id} active={tag === t.id} onClick={() => setTag(tag === t.id ? null : t.id)}>
                {t.label}
              </FilterChip>
            ))}
          </div>
        ) : null}

        {filtered.length ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <Reveal key={r.id} delay={i * 60}>
                <EditorialCard
                  to="/recipes/$slug"
                  params={{ slug: r.slug }}
                  image={r.hero_image_url}
                  alt={r.title}
                  eyebrow={r.difficulty}
                  title={r.title}
                  meta={
                    [r.prep_minutes ? `${r.prep_minutes} min prep` : null, r.servings ? `Serves ${r.servings}` : null]
                      .filter(Boolean)
                      .join(" · ") || r.subtitle
                  }
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[2rem] border border-dashed border-forest/20 bg-white p-14 text-center">
            <p className="font-display text-2xl italic text-forest-deep">{q || tag ? "No recipes match that search." : "The first recipes are on their way."}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/60">
              In the meantime, our flagship cookbook has 30 tested plant-based recipes ready to download today.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep"
            >
              Browse cookbooks
            </Link>
          </div>
        )}

        <HubSections hubs={hubs} />

        {categories.length ? (
          <div className="mt-20">
            <h2 className="font-display text-3xl italic text-forest-deep">Browse by category</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-forest/15 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </SiteLayout>
  );
}

function recipeText(r: Recipe) {
  const ing = (r.ingredients ?? []).flatMap((g: any) => g?.items ?? []).join(" ");
  return [r.title, r.subtitle, r.description, (r.tags ?? []).join(" "), ing].filter(Boolean).join(" ").toLowerCase();
}

const has = (r: Recipe, re: RegExp) => re.test([r.title, (r.tags ?? []).join(" ")].join(" ").toLowerCase());
const RECIPE_FILTERS: { id: string; label: string; match: (r: Recipe) => boolean }[] = [
  { id: "protein", label: "High-Protein", match: (r) => has(r, /protein/) },
  { id: "dinner", label: "Dinner", match: (r) => has(r, /dinner|pasta|noodle|taco|wrap|bowl|loaf|chili|stew|dahl|curry/) },
  { id: "breakfast", label: "Breakfast", match: (r) => has(r, /breakfast|oats|scramble|pancake|smoothie/) },
  { id: "quick", label: "Quick & Easy", match: (r) => (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0) > 0 && (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0) <= 30 },
  { id: "soups", label: "Soups & Stews", match: (r) => has(r, /soup|stew|chili|dahl|curry/) },
  { id: "thanksgiving", label: "Thanksgiving", match: (r) => has(r, /thanksgiving|holiday|casserole/) },
  { id: "mealprep", label: "Meal Prep", match: (r) => has(r, /meal prep|meal-prep|batch/) },
];

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
        active ? "bg-forest text-cream" : "border border-forest/15 bg-white text-charcoal/70 hover:border-forest"
      }`}
    >
      {children}
    </button>
  );
}