import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import catBreakfast from "@/assets/cat-breakfast.jpg";
import catProtein from "@/assets/cat-protein.jpg";
import catDesserts from "@/assets/cat-desserts.jpg";
import catDinners from "@/assets/cat-dinners.jpg";
import peekMealPrep from "@/assets/peek-meal-prep.jpg.asset.json";
import peekSmoothies from "@/assets/peek-smoothies.jpg.asset.json";

const CATS = [
  { name: "Breakfast", img: catBreakfast, count: "12 recipes" },
  { name: "High-Protein", img: catProtein, count: "18 recipes" },
  { name: "Meal Prep", img: peekMealPrep.url, count: "9 recipes" },
  { name: "Smoothies", img: peekSmoothies.url, count: "7 recipes" },
  { name: "Desserts", img: catDesserts, count: "10 recipes" },
  { name: "Quick Dinners", img: catDinners, count: "15 recipes" },
];

export const Route = createFileRoute("/recipes")({
  component: RecipesPage,
  head: () => ({
    meta: [
      { title: "Recipe Library — PlantedAndSimple" },
      { name: "description", content: "Browse plant-based recipes by category. Free recipes and premium cookbook collections in one library." },
      { property: "og:title", content: "Recipe Library — PlantedAndSimple" },
      { property: "og:description", content: "Plant-based recipes organized the way you cook." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function RecipesPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">The Library</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">Recipe Library</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/70">
          Every recipe is designed to be simple, seasonal, and quietly nourishing. Full collections live inside our cookbooks.
        </p>
        <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3">
          {CATS.map((c) => (
            <div key={c.name} className="group overflow-hidden rounded-3xl border border-forest/10 bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-cream-warm">
                <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-display text-xl italic text-forest-deep">{c.name}</h3>
                  <p className="text-xs text-charcoal/50">{c.count}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Soon</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20 rounded-[2.5rem] bg-forest p-10 text-center text-cream md:p-16">
          <p className="font-display text-3xl italic md:text-4xl">Want 30 recipes today?</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-cream/80">
            Our flagship cookbook has 30 tested, photographed plant-based recipes — instant PDF download.
          </p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-forest-deep hover:bg-white">
            Browse Cookbooks
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}