import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import logo from "@/assets/plantedandsimple-logo.png.asset.json";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => pageHead("/about", "About PlantedAndSimple | Plant-Based Cookbooks & Meal Planning", "PlantedAndSimple creates digital cookbooks, plant-based recipes and practical meal planning tools to help you plan, shop and cook satisfying meals."),
});

const PROMISES = [
  { title: "Whole-food ingredients", body: "Protein from beans, lentils, tofu and tempeh — real food you can find at any grocery store." },
  { title: "Weeknight-friendly", body: "Recipes built for busy evenings, with short ingredient lists and simple steps." },
  { title: "Planning made easy", body: "Meal plans and grocery lists that take the guesswork out of your week." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Our story</p>
        <h1 className="mt-3 font-display text-4xl italic text-forest-deep md:text-6xl">
          Plant-based cooking, thoughtfully made.
        </h1>
        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-14 md:grid-cols-2 md:gap-14">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] border border-forest/10 bg-cream-warm">
            <img src={logo.url} alt="PlantedAndSimple logo" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-5 text-base leading-relaxed text-charcoal/75">
            <p>PlantedAndSimple is a small digital cookbook studio. We publish recipes for people who want plant-based food that actually tastes good — without the fuss, gimmicks, or 30-ingredient marathons.</p>
            <p>Every recipe is developed in our home kitchen. If it isn't something we'd make on a Wednesday night, it doesn't go in the book.</p>
            <p>Thank you for cooking with us.</p>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <div key={p.title} className="rounded-3xl border border-forest/10 bg-cream-warm/50 p-6">
              <p className="font-display text-xl italic text-forest-deep">{p.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-[2.5rem] bg-cream-warm/60 p-10 text-center md:p-16">
          <p className="font-display text-2xl italic text-forest-deep md:text-3xl">Start with our first cookbook.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="inline-flex rounded-full bg-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">
              Browse the Shop
            </Link>
            <Link to="/free" className="inline-flex rounded-full border border-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-forest hover:bg-forest/5">
              Get the free guide
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
