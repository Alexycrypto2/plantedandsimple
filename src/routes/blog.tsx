import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import journalLead from "@/assets/home-journal-lead.jpg";
import ritualImg from "@/assets/home-ritual.jpg";
import peekRecipe from "@/assets/peek-recipe.jpg.asset.json";
import peekMealPrep from "@/assets/peek-meal-prep.jpg.asset.json";

const POSTS = [
  {
    kind: "Technique",
    title: "Mastering Plant-Based Umami: The Secret to Depth of Flavor",
    excerpt:
      "Why mushrooms, miso, and liquid aminos are the foundation of every savory dish worth serving.",
    img: journalLead,
  },
  {
    kind: "Seasonal",
    title: "Seasonal Eating: An Autumn Guide",
    excerpt: "Warm bowls, roasted roots, and the produce worth building your week around.",
    img: peekRecipe.url,
  },
  {
    kind: "Rituals",
    title: "5 Rituals for a Grounded Morning",
    excerpt: "Small kitchen habits that quietly change the way the whole day feels.",
    img: ritualImg,
  },
  {
    kind: "Meal Prep",
    title: "The 90-Minute Sunday Reset",
    excerpt: "One shopping list, three components, five weekday dinners.",
    img: peekMealPrep.url,
  },
];

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "The Journal — PlantedAndSimple" },
      { name: "description", content: "Recipes, rituals, and plant-based technique from the PlantedAndSimple kitchen." },
      { property: "og:title", content: "The Journal — PlantedAndSimple" },
      { property: "og:description", content: "Recipes, rituals, and plant-based technique from the PlantedAndSimple kitchen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function BlogPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
          From the kitchen
        </p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">The Journal</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/70">
          A slow read on plant-based cooking, seasonal eating, and gentle kitchen rituals.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
          {POSTS.map((p) => (
            <article key={p.title} className="group">
              <div className="mb-5 aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream-warm">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal/50">
                {p.kind}
              </span>
              <h2 className="mt-2 font-display text-2xl italic text-forest-deep">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/60">{p.excerpt}</p>
              <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-forest">
                Coming soon
              </span>
            </article>
          ))}
        </div>

        <div className="mt-20 rounded-[2.5rem] bg-cream-warm/60 p-10 text-center md:p-16">
          <p className="font-display text-2xl italic text-forest-deep md:text-3xl">
            Full articles are on the way.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-charcoal/70">
            In the meantime, our cookbooks are where the deepest recipes live.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-full bg-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep"
          >
            Browse Cookbooks
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}