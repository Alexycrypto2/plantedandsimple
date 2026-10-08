import { pageHead, plainDescription } from "@/lib/seo";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { EditorialCard, Reveal } from "@/components/site/primitives";
import { getCollectionBySlug } from "@/lib/library/library.functions";

export const Route = createFileRoute("/collections/$slug")({
  component: CollectionPage,
  loader: async ({ params }) => {
    const res = await getCollectionBySlug({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const collection = loaderData?.collection;
    const path = `/collections/${encodeURIComponent(params.slug)}`;
    const head = pageHead(path,
      collection?.seo_title?.trim() || `${collection?.name ?? "Collection not found"} — PlantedAndSimple`,
      plainDescription(collection?.seo_description || collection?.description || "Explore plant-based collections from PlantedAndSimple."));
    return collection ? head : { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">Collection not found</h1>
        <Link to="/shop" className="mt-8 inline-flex rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream">
          Browse the shop
        </Link>
      </section>
    </SiteLayout>
  ),
});

function CollectionPage() {
  const { collection, recipes, products, blogs } = Route.useLoaderData();
  const empty = !recipes.length && !products.length && !blogs.length;
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">Collection</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">{collection.name}</h1>
        {collection.description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/65">{collection.description}</p>
        ) : null}

        {empty ? (
          <div className="mt-14 rounded-[2rem] border border-dashed border-forest/20 bg-white p-14 text-center">
            <p className="font-display text-2xl italic text-forest-deep">This collection is being curated.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream">
              Browse cookbooks
            </Link>
          </div>
        ) : null}

        {products.length ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p: any, i: number) => (
              <Reveal key={p.id} delay={i * 60}>
                <EditorialCard to="/shop/$slug" params={{ slug: p.slug }} image={p.cover_image_url} alt={p.title} eyebrow="Cookbook" title={p.title} meta={p.subtitle} ratio="aspect-[4/5]" />
              </Reveal>
            ))}
          </div>
        ) : null}

        {recipes.length ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r: any, i: number) => (
              <Reveal key={r.id} delay={i * 60}>
                <EditorialCard to="/recipes/$slug" params={{ slug: r.slug }} image={r.hero_image_url} alt={r.title} eyebrow="Recipe" title={r.title} meta={r.subtitle} />
              </Reveal>
            ))}
          </div>
        ) : null}

        {blogs.length ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((b: any, i: number) => (
              <Reveal key={b.id} delay={i * 60}>
                <EditorialCard to="/blog/$slug" params={{ slug: b.slug }} image={b.featured_image_url} alt={b.title} eyebrow="Blog" title={b.title} meta={b.excerpt} ratio="aspect-[3/2]" />
              </Reveal>
            ))}
          </div>
        ) : null}
      </section>
    </SiteLayout>
  );
}