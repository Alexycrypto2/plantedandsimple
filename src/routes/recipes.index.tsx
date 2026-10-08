import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FALLBACK_RECIPES } from "@/lib/fallback-content";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal, EditorialCard } from "@/components/site/primitives";
import { listCategories, listPublishedRecipes } from "@/lib/library/library.functions";
import type { Category, Recipe } from "@/lib/library/types";

export const Route = createFileRoute("/recipes/")({
  component: RecipesIndex,
  loader: async (): Promise<{ recipes: Recipe[]; categories: Category[] }> => {
    const [recipes, categories] = await Promise.allSettled([
      listPublishedRecipes({ data: { limit: 60 } }), listCategories(),
    ]).then(([recipeResult, categoryResult]) => [
      recipeResult.status === "fulfilled" ? recipeResult.value : [],
      categoryResult.status === "fulfilled" ? categoryResult.value : [],
    ] as const);
    return { recipes: recipes.length ? recipes : FALLBACK_RECIPES, categories };
  },
  head: () => pageHead("/recipes", "High-Protein Vegan & Plant-Based Recipes | PlantedAndSimple", "Find plant-based recipes with ingredients, step-by-step methods and cooking times. Browse vegan breakfasts, high-protein dinners and meal prep ideas."),
});


function RecipesIndex() {
  const { recipes, categories } = Route.useLoaderData() as { recipes: Recipe[]; categories: Category[] };
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(
    () => (tag ? recipes.filter((r) => r.tags.includes(tag)) : recipes),
    [recipes, tag],
  );

  const tags = useMemo(() => [...new Set(recipes.flatMap((r) => r.tags))].slice(0, 12), [recipes]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">The Library</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">Recipe Library</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/65">
          Every recipe here is cooked, photographed and refined in our kitchen before it is published. Full collections
          live inside our cookbooks.
        </p>

        {tags.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            <FilterChip active={tag === null} onClick={() => setTag(null)}>
              All
            </FilterChip>
            {tags.map((t) => (
              <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
                {t}
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
            <p className="font-display text-2xl italic text-forest-deep">The first recipes are on their way.</p>
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
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
        active ? "bg-forest text-cream" : "border border-forest/15 bg-white text-charcoal/70 hover:border-forest"
      }`}
    >
      {children}
    </button>
  );
}