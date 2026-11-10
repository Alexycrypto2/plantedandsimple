import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FALLBACK_POSTS } from "@/lib/fallback-content";
import { SiteLayout } from "@/components/SiteLayout";
import { listPublishedPosts, type PublicPost } from "@/lib/blog.functions";
import { EditorialCard } from "@/components/site/primitives";
import { getHubs, type Hub } from "@/lib/linking/linking.functions";
import { HubSections } from "@/components/site/RelatedLinks";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
  loader: async (): Promise<{ posts: PublicPost[]; hubs: Hub[] }> => {
    const hubsP = getHubs().catch(() => [] as Hub[]);
    let posts: PublicPost[] = [];
    try { posts = await listPublishedPosts(); } catch { /* show the editorial fallback while Cloud recovers */ }
    return { posts: posts.length ? posts : FALLBACK_POSTS, hubs: await hubsP };
  },
  head: () => pageHead("/blog", "Plant-Based Cooking Blog & Meal Prep Tips | PlantedAndSimple", "Explore plant-based cooking articles, vegan protein ideas and practical meal prep tips. Find inspiration for your next meal with PlantedAndSimple."),
});


function BlogPage() {
  const { posts, hubs } = Route.useLoaderData() as { posts: PublicPost[]; hubs: Hub[] };
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const topics = useMemo(() => BLOG_TOPICS.filter((t) => posts.some((p) => t.re.test(postText(p)))), [posts]);
  const shown = useMemo(() => {
    const t = BLOG_TOPICS.find((x) => x.id === topic);
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((p) => {
      const hay = postText(p);
      return (!t || t.re.test(hay)) && words.every((w) => hay.includes(w));
    });
  }, [posts, q, topic]);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">From the kitchen</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">The Blog</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/70">
          A slow read on plant-based cooking, seasonal eating, and gentle kitchen rituals.
        </p>

        {posts.length ? (
          <div className="sticky top-16 z-20 -mx-6 mt-10 bg-background/95 px-6 py-3 backdrop-blur">
            <label className="relative block max-w-xl">
              <span className="sr-only">Search articles</span>
              <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/45">⌕</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search protein, meal prep, pumpkin…" className="w-full rounded-full border border-forest/20 bg-card py-3 pl-10 pr-4 text-sm text-charcoal outline-none focus:border-forest" />
            </label>
            {topics.length ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                {[{ id: null as string | null, label: "All" }, ...topics].map((t) => (
                  <button key={t.label} type="button" onClick={() => setTopic(t.id === topic ? null : t.id)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${topic === t.id ? "bg-forest text-cream" : "border border-forest/15 bg-card text-charcoal/70 hover:border-forest"}`}>{t.label}</button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {posts.length > 0 && shown.length === 0 ? (
          <p className="mt-12 text-center font-display text-2xl italic text-forest-deep">No articles match that search.</p>
        ) : null}

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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3">
            {shown.map((p) => (
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
        <HubSections hubs={hubs} />
      </section>
    </SiteLayout>
  );
}
function postText(p: PublicPost) {
  return [p.title, p.excerpt, p.category, (p.tags ?? []).join(" ")].filter(Boolean).join(" ").toLowerCase();
}

const BLOG_TOPICS = [
  { id: "mealprep", label: "Meal Prep", re: /meal prep|batch/ },
  { id: "nutrition", label: "Nutrition", re: /protein|nutrition|supplement/ },
  { id: "dinner", label: "Dinner Ideas", re: /dinner|date night/ },
  { id: "snacks", label: "Snacks", re: /snack|seeds/ },
  { id: "seasonal", label: "Seasonal", re: /pumpkin|autumn|fall|thanksgiving|holiday|christmas/ },
];
