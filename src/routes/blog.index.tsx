import { createFileRoute, Link } from "@tanstack/react-router";
import { FALLBACK_POSTS } from "@/lib/fallback-content";
import { SiteLayout } from "@/components/SiteLayout";
import { listPublishedPosts, type PublicPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
  loader: async (): Promise<{ posts: PublicPost[] }> => {
    let posts: PublicPost[] = [];
    try { posts = await listPublishedPosts(); } catch { /* show the editorial fallback while Cloud recovers */ }
    return { posts: posts.length ? posts : FALLBACK_POSTS };
  },
  head: () => ({
    meta: [
      { title: "The Blog — PlantedAndSimple" },
      { name: "description", content: "Recipes, rituals, and plant-based technique from the PlantedAndSimple kitchen." },
      { property: "og:title", content: "The Blog — PlantedAndSimple" },
      { property: "og:description", content: "Recipes, rituals, and plant-based technique from the PlantedAndSimple kitchen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});


function BlogPage() {
  const { posts } = Route.useLoaderData() as { posts: PublicPost[] };
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">From the kitchen</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">The Blog</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/70">
          A slow read on plant-based cooking, seasonal eating, and gentle kitchen rituals.
        </p>

        {posts.length === 0 ? (
          <div className="mt-20 rounded-[2.5rem] bg-cream-warm/60 p-10 text-center md:p-16">
            <p className="font-display text-2xl italic text-forest-deep md:text-3xl">
              Fresh articles are on the way.
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm text-charcoal/70">
              In the meantime, our cookbooks are where the deepest recipes live.
            </p>
            <Link to="/shop" className="mt-6 inline-flex rounded-full bg-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">
              Browse Cookbooks
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-6 lg:grid-cols-3">
            {posts.map((p) => (
              <EditorialCard
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                image={p.featured_image_url}
                alt={p.title}
                eyebrow={p.category}
                title={p.title}
                meta={p.excerpt}
              />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}