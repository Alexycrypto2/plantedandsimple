import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import ritualImg from "@/assets/home-ritual.jpg";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => pageHead("/about", "About PlantedAndSimple | Plant-Based Cookbooks & Meal Planning", "PlantedAndSimple creates digital cookbooks, plant-based recipes and practical meal planning tools to help you plan, shop and cook satisfying meals."),
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Our story</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">
          Plant-based cooking, thoughtfully made.
        </h1>
        <div className="mt-14 grid grid-cols-1 gap-14 md:grid-cols-2">
          <div className="overflow-hidden rounded-[2.5rem] bg-cream-warm">
            <img src={ritualImg} alt="Our kitchen" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-5 text-base leading-relaxed text-charcoal/75">
            <p>PlantedAndSimple is a small digital cookbook studio. We publish recipes for people who want plant-based food that actually tastes good — without the fuss, gimmicks, or 30-ingredient marathons.</p>
            <p>Every recipe is developed in our home kitchen, photographed in natural light, and tested by real cooks before it ships. If it isn't something we'd make on a Wednesday night, it doesn't go in the book.</p>
            <p>Thank you for cooking with us.</p>
          </div>
        </div>
        <div className="mt-20 rounded-[2.5rem] bg-cream-warm/60 p-10 text-center md:p-16">
          <p className="font-display text-2xl italic text-forest-deep md:text-3xl">Start with our first cookbook.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">
            Browse the Shop
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}