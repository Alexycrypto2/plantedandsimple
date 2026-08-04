import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { MediaImage, Pill } from "@/components/site/primitives";
import { getRecipeBySlug } from "@/lib/library/library.functions";
import { trackEvent } from "@/lib/analytics";
import type { Recipe } from "@/lib/library/types";

type Data = { recipe: Recipe; related: { recipes: any[]; blogs: any[]; products: any[] } };

export const Route = createFileRoute("/recipes/$slug")({
  component: RecipeDetail,
  loader: async ({ params }): Promise<Data> => {
    const res = await getRecipeBySlug({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res as Data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Recipe not found — PlantedAndSimple" }, { name: "robots", content: "noindex" }] };
    }
    const r = loaderData.recipe;
    const title = r.seo_title ?? `${r.title} — PlantedAndSimple`;
    const description = r.seo_description ?? r.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(r.hero_image_url?.startsWith("https://")
          ? [
              { property: "og:image", content: r.hero_image_url },
              { name: "twitter:image", content: r.hero_image_url },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            name: r.title,
            description: r.description,
            image: r.hero_image_url ? [r.hero_image_url] : undefined,
            recipeYield: r.servings ?? undefined,
            prepTime: r.prep_minutes ? `PT${r.prep_minutes}M` : undefined,
            cookTime: r.cook_minutes ? `PT${r.cook_minutes}M` : undefined,
            recipeIngredient: (r.ingredients ?? []).flatMap((g) => g.items ?? []),
            recipeInstructions: (r.instructions ?? []).map((s) => ({ "@type": "HowToStep", text: s.body })),
          }),
        },
      ],
    };
  },
  notFoundComponent: RecipeMissing,
  errorComponent: RecipeError,
});

function RecipeError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">We couldn&apos;t open this recipe</h1>
        <p className="mt-4 text-charcoal/60">The recipe is safe. Try loading it again or return to the recipe library.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => { void router.invalidate(); reset(); }} className="rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream">Try again</button>
          <Link to="/recipes" className="rounded-full border border-forest/20 px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-forest">Recipe library</Link>
        </div>
        <p className="sr-only">{error.message}</p>
      </section>
    </SiteLayout>
  );
}

function RecipeMissing() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">Recipe not found</h1>
        <p className="mt-4 text-charcoal/60">This recipe may have moved or is not published yet.</p>
        <Link to="/recipes" className="mt-8 inline-flex rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream">
          Back to the library
        </Link>
      </section>
    </SiteLayout>
  );
}

function RecipeDetail() {
  const { recipe: r, related } = Route.useLoaderData() as Data;
  const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);

  useEffect(() => {
    void trackEvent("recipe_view", { refId: (r as any).id ?? null, refSlug: r.slug });
  }, [r.slug]);

  return (
    <SiteLayout>
      <article className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">Recipe</p>
          <h1 className="mt-4 font-display text-5xl italic leading-tight text-forest-deep md:text-6xl">{r.title}</h1>
          {r.subtitle ? <p className="mt-4 text-lg text-charcoal/65">{r.subtitle}</p> : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {r.prep_minutes ? <Pill>{r.prep_minutes} min prep</Pill> : null}
            {r.cook_minutes ? <Pill>{r.cook_minutes} min cook</Pill> : null}
            {total ? <Pill>{total} min total</Pill> : null}
            {r.servings ? <Pill>Serves {r.servings}</Pill> : null}
            <Pill>{r.difficulty}</Pill>
          </div>
        </header>

        <MediaImage src={r.hero_image_url} alt={r.title} ratio="aspect-[3/2]" className="mt-10 rounded-[2rem]" priority />

        {r.description ? <p className="mt-10 text-lg leading-relaxed text-charcoal/75">{r.description}</p> : null}

        <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,1fr)_1.4fr]">
          <section>
            <h2 className="font-display text-3xl italic text-forest-deep">Ingredients</h2>
            {(r.ingredients ?? []).map((g, i) => (
              <div key={i} className="mt-6">
                {g.group ? (
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-sage">{g.group}</h3>
                ) : null}
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-charcoal/75">
                  {(g.items ?? []).map((it, j) => (
                    <li key={j} className="border-b border-forest/10 pb-2">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section>
            <h2 className="font-display text-3xl italic text-forest-deep">Method</h2>
            <ol className="mt-6 space-y-6">
              {(r.instructions ?? []).map((s, i) => (
                <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-xs font-bold text-cream">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    {s.title ? <p className="font-semibold text-forest-deep">{s.title}</p> : null}
                    <p className="text-sm leading-relaxed text-charcoal/75">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {(r.nutrition ?? []).length ? (
          <section className="mt-14 rounded-[2rem] bg-cream-warm p-8">
            <h2 className="font-display text-2xl italic text-forest-deep">Nutrition per serving</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(r.nutrition ?? []).map((n) => (
                <div key={n.label}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/50">{n.label}</p>
                  <p className="mt-1 font-display text-2xl italic text-forest-deep">{n.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(r.tips ?? []).length ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl italic text-forest-deep">Cooking tips</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/75">
              {(r.tips ?? []).map((t, i) => (
                <li key={i}>— {t}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {(related?.products ?? []).length ? (
          <section className="mt-16">
            <h2 className="font-display text-3xl italic text-forest-deep">Goes with</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {(related?.products ?? []).map((p) => (
                <Link
                  key={p.id}
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  className="group flex gap-4 rounded-[1.5rem] border border-forest/10 bg-white p-4 transition hover:shadow-[var(--shadow-card)]"
                >
                  <MediaImage src={p.cover_image_url} alt={p.title} ratio="aspect-square" className="w-24 shrink-0 rounded-2xl" />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-xl italic text-forest-deep">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-charcoal/60">{p.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {(related?.recipes ?? []).length ? (
          <section className="mt-16">
            <h2 className="font-display text-3xl italic text-forest-deep">More like this</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {(related?.recipes ?? []).map((p) => (
                <Link key={p.id} to="/recipes/$slug" params={{ slug: p.slug }} className="group">
                  <MediaImage src={p.image_url} alt={p.title} className="rounded-2xl" />
                  <h3 className="mt-3 font-display text-lg italic text-forest-deep">{p.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </SiteLayout>
  );
}