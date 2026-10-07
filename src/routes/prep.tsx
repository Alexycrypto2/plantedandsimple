import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import actionKitchen from "@/assets/product-action-kitchen.jpg";
import actionMealPrep from "@/assets/product-action-meal-prep.jpg";
import actionBowl from "@/assets/product-action-bowl.jpg";
import actionGrocery from "@/assets/product-action-grocery.jpg";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";

export const Route = createFileRoute("/prep")({
  component: PrepPreviewPage,
  head: () => ({
    meta: [
      { title: "Plant-Based Meal Prep Planner Preview | Planted & Simple" },
      {
        name: "description",
        content:
          "Preview the upcoming Planted & Simple meal-prep toolkit: flexible weekly planning, practical grocery lists, and calmer batch cooking.",
      },
      { property: "og:title", content: "A calmer way to meal prep — Planted & Simple" },
      {
        property: "og:description",
        content:
          "Explore the upcoming plant-based weekly planner, grocery-list builder, and kitchen prep flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const pillars = [
  {
    number: "01",
    title: "A week that works around you",
    description:
      "Arrange breakfast, lunch, dinner, and snacks across seven days, then see your protein, calories, and macros update as meals change.",
  },
  {
    number: "02",
    title: "One thoughtful grocery list",
    description:
      "Bring planned recipes together into a single list, scale ingredient amounts by servings, and sort the shop into easy-to-follow aisles.",
  },
  {
    number: "03",
    title: "A calmer kitchen session",
    description:
      "Follow batch-cooking steps with timers and storage notes, so one focused prep session can make the week feel lighter.",
  },
  {
    number: "04",
    title: "A little help getting started",
    description:
      "Choose from ready-made weekly plans, keep track of pantry staples, and browse a collection of plant-based recipes.",
  },
];

const gallery = [
  { image: actionMealPrep, label: "Build a week of meals" },
  { image: actionKitchen, label: "Cook with a plan" },
  { image: actionBowl, label: "Make satisfying bowls" },
  { image: actionGrocery, label: "Shop with confidence" },
];

const faqs = [
  {
    question: "Can I use the interactive planner today?",
    answer:
      "Not yet. This page is a preview of the planned toolkit; the interactive planner, grocery builder, and kitchen mode are not available to use or buy yet.",
  },
  {
    question: "What can I get right now?",
    answer:
      "The Plant-Based Cookbook is available now. Its product page has the current price, full details, and secure checkout.",
  },
  {
    question: "Will I need to buy the planner with the cookbook?",
    answer:
      "The planner is intended as a separate companion offer. No planner purchase is being taken on this preview page.",
  },
  {
    question: "When will the full toolkit be ready?",
    answer:
      "A release date has not been announced. This page will be updated when the complete toolkit is ready.",
  },
];

function PrepPreviewPage() {
  return (
    <SiteLayout>
      <main>
        <section className="relative isolate flex min-h-[620px] items-end overflow-hidden bg-charcoal sm:min-h-[700px]">
          <img
            src={actionMealPrep}
            alt="A home cook preparing a colourful plant-based meal"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 -z-10 bg-charcoal/55" />
          <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-32 text-cream sm:pb-20">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-soft">
              A preview of what’s coming
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl italic leading-[1.02] sm:text-7xl">
              Plan the week. Make room for life.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
              A plant-based meal-prep companion designed to make choosing meals,
              shopping, and cooking feel simpler.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#inside"
                className="inline-flex min-h-12 items-center justify-center border border-cream/60 px-6 py-3 text-sm font-semibold text-cream transition hover:bg-cream hover:text-forest"
              >
                Explore the preview
              </a>
              <Link
                to="/shop/$slug"
                params={{ slug: "high-protein-cookbook" }}
                className="inline-flex min-h-12 items-center justify-center bg-cream px-6 py-3 text-sm font-semibold text-forest transition hover:bg-sage-soft"
              >
                Shop the cookbook
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-forest/10 bg-cream-warm/60 px-6 py-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
            <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">
              Preview only
            </span>
            <p className="max-w-3xl text-sm leading-relaxed text-charcoal/75">
              The interactive planner and kitchen tools are not available to use
              or buy yet. You can shop the cookbook now; this page does not take
              payment for the upcoming toolkit.
            </p>
          </div>
        </section>

        <section id="inside" className="px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
                The meal-prep companion
              </p>
              <h2 className="mt-3 max-w-xl font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
                Less weekday guesswork. More meals you look forward to.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-charcoal/70">
                The planned toolkit brings meal choices, nutrition, shopping,
                and batch cooking into one connected weekly routine.
              </p>
            </div>
            <div className="divide-y divide-forest/15 border-y border-forest/15">
              {pillars.map((pillar) => (
                <article key={pillar.number} className="grid gap-3 py-6 sm:grid-cols-[56px_1fr] sm:gap-5 sm:py-8">
                  <span className="font-mono text-xs font-semibold text-sage">{pillar.number}</span>
                  <div>
                    <h3 className="font-display text-2xl italic text-forest-deep">{pillar.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-charcoal/70">
                      {pillar.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-warm/50 px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
                  Made for real kitchens
                </p>
                <h2 className="mt-2 font-display text-4xl italic text-forest-deep sm:text-5xl">
                  A glimpse of the weekly rhythm
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-charcoal/65">
                From the first plan to the last weeknight bowl, keep good food
                feeling doable.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {gallery.map((item, index) => (
                <figure key={item.label} className="min-w-0">
                  <div className="relative overflow-hidden rounded-sm bg-sage-soft">
                    <img
                      src={item.image}
                      alt={item.label}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 bg-cream/90 px-2 py-1 font-mono text-[10px] font-semibold text-forest-deep">
                      0{index + 1}
                    </span>
                  </div>
                  <figcaption className="pt-3 text-sm font-medium text-charcoal/80">
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
            <div className="overflow-hidden rounded-sm bg-cream-warm">
              <img
                src={cookbookMockup}
                alt="The Planted & Simple plant-based cookbook with fresh ingredients"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="max-w-xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
                Start cooking today
              </p>
              <h2 className="mt-3 font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
                The cookbook is ready when you are.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-charcoal/70">
                Explore 30 high-protein plant-based recipes, meal-planning
                support, and practical ideas for making nourishing food fit
                your week. The product page shows the current price and details.
              </p>
              <Link
                to="/shop/$slug"
                params={{ slug: "high-protein-cookbook" }}
                className="mt-7 inline-flex min-h-12 items-center justify-center bg-forest px-7 py-3 text-sm font-semibold text-cream transition hover:bg-forest-deep"
              >
                Explore the cookbook
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-cream-warm/50 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
              A few helpful answers
            </p>
            <h2 className="mt-3 text-center font-display text-4xl italic text-forest-deep sm:text-5xl">
              Before you plan
            </h2>
            <div className="mt-8 divide-y divide-forest/15 border-y border-forest/15">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-forest-deep marker:content-none">
                    {faq.question}
                    <span aria-hidden="true" className="text-xl font-normal text-sage transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-8 text-sm leading-relaxed text-charcoal/70">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}