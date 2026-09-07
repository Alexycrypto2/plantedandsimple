import { createFileRoute, Link } from "@tanstack/react-router";
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

const FALLBACK_POSTS: PublicPost[] = [
  { id: "fallback-blog-1", slug: "how-to-build-a-better-plant-based-bowl", title: "How to Build a Better Plant-Based Bowl", excerpt: "A simple framework for balanced, satisfying meals.", content: "", featured_image_url: "/recipes/tempeh-breakfast-scramble.jpg", category: "Kitchen Notes", tags: ["cooking"], seo_title: null, seo_description: null, published_at: null },
  { id: "fallback-blog-2", slug: "the-gentle-art-of-meal-prep", title: "The Gentle Art of Meal Prep", excerpt: "Make weekday cooking feel lighter without cooking everything in advance.", content: "", featured_image_url: "/recipes/harissa-chickpea-bowl.jpg", category: "Rituals", tags: ["meal prep"], seo_title: null, seo_description: null, published_at: null },
];

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
          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group block"
              >
                <div className="mb-5 aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream-warm">
                  {p.featured_image_url ? (
                    <img
                      src={p.featured_image_url}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-charcoal/30">No image</div>
                  )}
                </div>
                {p.category && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal/50">
                    {p.category}
                  </span>
                )}
                <h2 className="mt-2 font-display text-2xl italic text-forest-deep">{p.title}</h2>
                {p.excerpt && <p className="mt-3 text-sm leading-relaxed text-charcoal/60">{p.excerpt}</p>}
                <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-forest">
                  Read article →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}