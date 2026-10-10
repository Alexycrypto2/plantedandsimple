import { pageHead, pageUrl, plainDescription, jsonLd, breadcrumbs } from "@/lib/seo";
import { recipeJsonLd } from "@/lib/recipe-schema";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { fallbackRecipe } from "@/lib/fallback-content";
import { MediaImage, Pill } from "@/components/site/primitives";
import { getRecipeBySlug } from "@/lib/library/library.functions";
import { trackEvent } from "@/lib/analytics";
import type { Recipe } from "@/lib/library/types";
import { pickOffer } from "@/lib/content/product-bridge";

type Data = { recipe: Recipe; related: { recipes: any[]; blogs: any[]; products: any[] } };

export const Route = createFileRoute("/recipes/$slug")({
  component: RecipeDetail,
  loader: async ({ params }): Promise<Data> => {
    let res: Data | null = null;
    try { res = (await getRecipeBySlug({ data: { slug: params.slug } })) as Data | null; } catch { res = null; }
    if (!res) res = fallbackRecipe(params.slug) as Data | null;
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const recipe = loaderData?.recipe;
    const path = `/recipes/${encodeURIComponent(params.slug)}`;
    const title = recipe?.seo_title?.trim() || `${recipe?.title ?? "Recipe not found"} — PlantedAndSimple`;
    const description = plainDescription(recipe?.seo_description?.trim() || recipe?.description || "Explore plant-based recipes from PlantedAndSimple.");
    const head = pageHead(path, title, description, "article");
    if (!recipe) return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
    const image = recipe.hero_image_url?.startsWith("https://") ? recipe.hero_image_url : undefined;
    const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
    return {
      ...head,
      meta: [...head.meta, ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [])],
      scripts: [jsonLd(recipeJsonLd(recipe, pageUrl(path), image)), breadcrumbs("Recipes", "/recipes", recipe.title, path)],
    };
  },
  notFoundComponent: RecipeMissing,
  errorComponent: RecipeError,
});

function RecipeError({ error, reset }: { error: unknown; reset: () => void }) {
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
        <p className="sr-only">{error instanceof Error ? error.message : String(error)}</p>
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
                <li key={i} id={`step-${i + 1}`} className="grid scroll-mt-24 grid-cols-[auto_minmax(0,1fr)] gap-4">
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

        <RecipeOffer text={`${r.title} ${(r.tags ?? []).join(" ")}`} />

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
/** Matching product box: meal prep → Meal Prep System, protein meals → cookbook, otherwise the free cookbook. */
function RecipeOffer({ text }: { text: string }) {
  const offer = pickOffer(text);
  return (
    <aside className="mt-14 rounded-[1.5rem] bg-forest p-6 text-cream sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/75">{offer.eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl italic">{offer.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-cream/85">{offer.pitch}</p>
      <a
        href={`${offer.href}?utm_source=recipe&utm_medium=content&utm_campaign=product_bridge`}
        onClick={() => void trackEvent("upsell_click", { refSlug: offer.key, metadata: { source: "recipe_bridge" } })}
        className="mt-5 inline-block rounded-full bg-cream px-6 py-3 text-sm font-bold text-forest-deep hover:bg-cream-warm"
      >
        {offer.cta} →
      </a>
    </aside>
  );
}
