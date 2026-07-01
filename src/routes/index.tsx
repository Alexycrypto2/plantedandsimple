import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import recipeSesameTofu from "@/assets/recipe-sesame-tofu.jpg";
import recipeProteinOats from "@/assets/recipe-protein-oats.jpg";
import recipeSmoothieBowl from "@/assets/recipe-smoothie-bowl.jpg";
import recipeLentilBolognese from "@/assets/recipe-lentil-bolognese.jpg";
import recipeTempehBowl from "@/assets/recipe-tempeh-bowl.jpg";
import recipeFajitas from "@/assets/recipe-fajitas.jpg";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

const PRICE_ID = "high_protein_cookbook_onetime";

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "30 High-Protein Plant-Based Meals",
  description:
    "A premium digital cookbook with 30 high-protein vegan recipes plus 6 bonus guides. Instant PDF download.",
  brand: { "@type": "Brand", name: "PlantedAndSimple" },
  offers: {
    "@type": "Offer",
    price: "9.99",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "2143",
  },
};

export const Route = createFileRoute("/")({
  component: SalesPage,
  head: () => ({
    meta: [
      { title: "30 High-Protein Plant-Based Meals — PlantedAndSimple" },
      {
        name: "description",
        content:
          "Instant PDF cookbook: 30 high-protein vegan recipes, 4 weekly meal plans, and 6 bonuses. Quick, satisfying, meal-prep friendly. Just $9.99 today.",
      },
      {
        name: "keywords",
        content:
          "high protein vegan recipes, plant based cookbook, vegan meal prep, high protein plant based, vegan protein recipes, plant based meal plan",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "product" },
      {
        property: "og:title",
        content: "30 High-Protein Plant-Based Meals — PlantedAndSimple",
      },
      {
        property: "og:description",
        content:
          "Simple plant-based meals. Powerful nutrition. Instant PDF cookbook + 6 free bonuses for $9.99.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(productJsonLd),
      },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

// Checkout is handled by the embedded Stripe modal — buttons that need to
// open it use the onBuy handler passed down from the SalesPage component.

const trustBadges = [
  "Digital Download",
  "Lifetime Access",
  "Beginner Friendly",
  "Meal Prep Friendly",
];

const reviews = [
  {
    quote:
      "These recipes completely changed my meal prep routine. I actually look forward to lunch again.",
    name: "Sarah J.",
    role: "Busy Professional",
  },
  {
    quote:
      "I never knew plant-based meals could be this filling. The tempeh bowl is a weekly staple.",
    name: "Marcus T.",
    role: "Fitness Enthusiast",
  },
  {
    quote:
      "My whole family loved them — even my picky teenager asked for seconds of the lentil bolognese.",
    name: "Priya K.",
    role: "Mom of 3",
  },
];

const painPoints = [
  "Boring salads that leave you hungry",
  "Never hitting your protein goals",
  "Expensive specialty ingredients",
  "No idea what to meal prep",
  "Spending hours cooking every night",
];

const insideItems = [
  "30 High-Protein Recipes",
  "Breakfast, Lunch, Dinner & Snacks",
  "20–32g Protein Per Recipe",
  "Ready in Under 30 Minutes",
  "Meal Prep Instructions",
  "Freezer-Friendly Options",
];

const bonuses = [
  { title: "4 Weekly Meal Plans", value: "$19 value" },
  { title: "7-Day High-Protein Plan", value: "$14 value" },
  { title: "15 High-Protein Smoothies", value: "$12 value" },
  { title: "Meal Prep Guide", value: "$9 value" },
  { title: "Budget Grocery Guide", value: "$9 value" },
  { title: "Plant Protein Cheat Sheet", value: "$7 value" },
];

const recipes = [
  { name: "Sticky Sesame Tofu", img: recipeSesameTofu, ratio: "aspect-[3/4]" },
  {
    name: "Chocolate PB Protein Oats",
    img: recipeProteinOats,
    ratio: "aspect-square",
  },
  {
    name: "Berry Almond Smoothie Bowl",
    img: recipeSmoothieBowl,
    ratio: "aspect-[4/5]",
  },
  {
    name: "Lentil Bolognese",
    img: recipeLentilBolognese,
    ratio: "aspect-[3/4]",
  },
  { name: "BBQ Tempeh Bowls", img: recipeTempehBowl, ratio: "aspect-square" },
  {
    name: "Seitan Steak Fajitas",
    img: recipeFajitas,
    ratio: "aspect-[3/4]",
  },
];

const features = [
  "High Protein",
  "Quick Meals",
  "Easy Ingredients",
  "Meal Prep Friendly",
  "Budget Friendly",
  "Family Friendly",
  "Freezer Friendly",
  "Beginner Friendly",
];

const audience = [
  "Busy professionals",
  "Students",
  "Fitness enthusiasts",
  "Families",
  "Beginners",
  "Anyone wanting more plant-based protein",
];

const faqs = [
  {
    q: "Is this a physical book?",
    a: "No — it's an instant digital PDF you can download the moment you check out.",
  },
  {
    q: "Do I need special ingredients?",
    a: "No. Every recipe uses everyday grocery-store ingredients like tofu, lentils, beans, oats, and nuts.",
  },
  {
    q: "Is it beginner friendly?",
    a: "Absolutely. Recipes are written in clear step-by-step instructions with no fancy technique required.",
  },
  {
    q: "Can I print it?",
    a: "Yes — the PDF is optimized for printing at home so you can keep it in your kitchen.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The cookbook works beautifully on phones, tablets, laptops, and e-readers.",
  },
];

/* ------------------------------------------------------------------ */

function Star() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 fill-forest"
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.3 2.8 1-5.8L1.5 7.8l5.9-.9L10 1.5z" />
    </svg>
  );
}

function Check() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage/25 text-forest"
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-forest stroke-[3]">
        <path d="M4 10l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CTAButton({
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "sage";
  className?: string;
  onClick: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sage/40";
  const variants = {
    primary: "bg-forest text-cream hover:bg-forest-deep",
    sage: "bg-sage text-cream hover:bg-forest",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
      {children}
    </p>
  );
}

function SalesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { openCheckout: openPaddle } = usePaddleCheckout();
  const openCheckout = () =>
    openPaddle({
      priceId: PRICE_ID,
      successUrl: `${window.location.origin}/thank-you`,
    });

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal selection:bg-sage/30">
      <PaymentTestModeBanner />

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-4 z-50 px-4 md:hidden">
        <button
          type="button"
          onClick={openCheckout}
          className="mx-auto flex w-full max-w-md items-center justify-between rounded-full bg-forest px-6 py-4 text-cream shadow-2xl ring-1 ring-forest-deep/20 active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest opacity-70 line-through">
              $24.99
            </span>
            <span className="text-base font-semibold">$9.99</span>
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider">
            Get the Book →
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold italic tracking-tight text-forest sm:text-2xl">
          Planted<span className="text-sage">&amp;</span>Simple
        </span>
        <button
          type="button"
          onClick={openCheckout}
          className="hidden rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-deep md:inline-flex"
        >
          Get the Book · $9.99
        </button>
      </nav>

      {/* ================= HERO ================= */}
      <header className="mx-auto max-w-6xl px-6 pt-4 pb-16 md:pt-10 md:pb-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div className="animate-fade-up order-2 md:order-1">
            <SectionLabel>Simple. Powerful. Plant-Based.</SectionLabel>
            <h1 className="font-display text-4xl leading-[1.05] text-balance text-forest-deep sm:text-5xl md:text-6xl">
              Eat More <span className="italic">Protein</span> Without Giving
              Up Plant-Based Foods
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/75 text-pretty">
              Discover 30 delicious high-protein vegan recipes that are quick,
              satisfying, meal-prep friendly, and made with everyday
              ingredients.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTAButton onClick={openCheckout}>Get the Cookbook →</CTAButton>
              <div className="flex items-center gap-2 text-sm text-charcoal/60">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} />
                  ))}
                </div>
                <span className="font-medium">4.9/5 · 2,143 readers</span>
              </div>
            </div>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-charcoal/50">
              Instant PDF · Phone, Tablet & Computer
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {trustBadges.map((b) => (
                <div
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-forest-deep backdrop-blur"
                >
                  <span className="text-sage">✓</span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Cookbook mockup */}
          <div className="animate-fade-up relative order-1 md:order-2">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sage/20 via-transparent to-forest/10 blur-2xl" />
            <div className="relative">
              <img
                src={cookbookMockup}
                alt="30 High-Protein Plant-Based Meals cookbook, forest green hardcover"
                width={800}
                height={1000}
                className="animate-float relative w-full rounded-3xl object-cover shadow-[var(--shadow-card)] ring-1 ring-forest/10"
              />
              <div className="absolute -bottom-5 -right-3 flex flex-col items-center rounded-2xl bg-white px-5 py-3 shadow-lg ring-1 ring-forest/10 sm:-right-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40 line-through">
                  $24.99
                </span>
                <span className="font-display text-2xl font-bold text-forest">
                  $9.99
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-sage">
                  Today Only
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= SOCIAL PROOF ================= */}
      <section className="border-y border-forest/5 bg-white/60 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <SectionLabel>Loved by readers everywhere</SectionLabel>
            <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
              Join Thousands of Plant-Based Food Lovers
            </h2>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} />
                ))}
              </div>
              <span className="font-mono text-sm font-semibold text-forest">
                4.9/5 average rating
              </span>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure
                key={r.name}
                className="rounded-3xl bg-cream/70 p-7 ring-1 ring-forest/10 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} />
                  ))}
                </div>
                <blockquote className="font-display text-lg leading-snug italic text-charcoal/85">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-widest text-forest">
                  — {r.name} · <span className="text-sage">{r.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <SectionLabel>Sound familiar?</SectionLabel>
            <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
              Plant-based eating shouldn't feel this <span className="italic">hard</span>.
            </h2>
            <ul className="mt-8 space-y-4">
              {painPoints.map((p) => (
                <li key={p} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-charcoal/5 text-charcoal/60"
                  >
                    ✕
                  </span>
                  <span className="text-lg leading-snug text-charcoal/80">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] bg-forest p-10 text-cream shadow-[var(--shadow-card)] md:p-12">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage-soft/80">
              The solution
            </p>
            <h3 className="mt-4 font-display text-3xl leading-tight italic md:text-4xl">
              This cookbook solves all of that.
            </h3>
            <p className="mt-5 text-cream/80 leading-relaxed">
              30 tested recipes packed with 20–32g of plant protein each, ready
              in under 30 minutes, using ingredients already in your grocery
              store. No powders. No mock meats. Just real food that works.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["20–32g Protein", "< 30 Minutes", "Everyday Ingredients"].map(
                (b) => (
                  <span
                    key={b}
                    className="rounded-full border border-cream/20 bg-cream/5 px-3 py-1.5 text-xs font-medium text-cream/90"
                  >
                    {b}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHAT'S INSIDE ================= */}
      <section className="bg-cream-warm/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <SectionLabel>What's inside</SectionLabel>
            <h2 className="mx-auto max-w-2xl font-display text-3xl text-balance text-forest-deep sm:text-4xl">
              Everything you need to eat well, all in one place.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insideItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-2xl bg-white p-6 ring-1 ring-forest/10 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
              >
                <Check />
                <span className="text-base font-medium text-charcoal">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BONUSES ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <SectionLabel>Bonus bundle · Included FREE</SectionLabel>
          <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
            6 <span className="italic">exclusive</span> bonuses
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-charcoal/70">
            An extra $70 of guides, plans, and cheat sheets — yours today, at
            no extra cost.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bonuses.map((b, i) => (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-forest/10 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="mb-6 flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-sage">
                  Bonus #{String(i + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full bg-forest/5 px-2.5 py-1 font-mono text-[10px] font-semibold text-forest">
                  {b.value}
                </span>
              </div>
              <h3 className="font-display text-2xl leading-tight text-forest-deep">
                {b.title}
              </h3>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sage">
                <Check /> Included FREE
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RECIPE GALLERY ================= */}
      <section className="bg-white/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel>On the menu</SectionLabel>
              <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
                A preview of what's <span className="italic">cooking</span>
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-sage">
              + 24 more recipes inside
            </span>
          </div>

          <div className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-3 [&>*]:mb-4">
            {recipes.map((r) => (
              <figure
                key={r.name}
                className="group relative break-inside-avoid overflow-hidden rounded-3xl ring-1 ring-forest/10 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <img
                  src={r.img}
                  alt={r.name}
                  loading="lazy"
                  className={`${r.ratio} w-full object-cover transition duration-700 group-hover:scale-105`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/30 to-transparent p-4">
                  <span className="font-display text-lg italic text-cream drop-shadow">
                    {r.name}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY YOU'LL LOVE IT ================= */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <SectionLabel>Why you'll love it</SectionLabel>
          <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
            Made for real life.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {features.map((f) => (
            <div
              key={f}
              className="rounded-2xl border border-forest/10 bg-white/70 p-5 text-center transition hover:-translate-y-1 hover:border-sage/40 hover:bg-white"
            >
              <span className="text-sm font-semibold text-forest-deep">
                {f}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WHO IT'S FOR ================= */}
      <section className="bg-cream-warm/60 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <SectionLabel>Who this is for</SectionLabel>
          <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
            If you've been putting off eating better…
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/70">
            This cookbook was made for you.
          </p>
          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
            {audience.map((a) => (
              <li
                key={a}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-forest/10"
              >
                <Check />
                <span className="text-sm font-medium text-charcoal">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= GUARANTEE ================= */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-[var(--shadow-card)] ring-1 ring-forest/10 md:p-14">
          <div className="mx-auto mb-6 grid size-24 place-items-center rounded-full border-2 border-dashed border-sage/60 bg-sage/10">
            <div className="text-center">
              <div className="font-display text-2xl font-bold italic text-forest">
                60
              </div>
              <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-sage">
                Days
              </div>
            </div>
          </div>
          <SectionLabel>Risk-free purchase</SectionLabel>
          <h2 className="font-display text-3xl italic text-forest-deep sm:text-4xl">
            60-Day Money-Back Guarantee
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-charcoal/70">
            If you're not completely satisfied, you can request a refund within
            60 days according to the purchase platform's refund policy.
          </p>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="bg-forest py-20 text-cream md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-sage/20 blur-3xl" />
            <img
              src={cookbookMockup}
              alt="30 High-Protein Plant-Based Meals cookbook"
              loading="lazy"
              width={800}
              height={1000}
              className="animate-float relative mx-auto w-full max-w-sm rounded-3xl object-cover shadow-2xl ring-1 ring-cream/20"
            />
          </div>

          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage-soft">
              Limited-time launch offer
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-cream sm:text-5xl">
              30 High-Protein <br />
              <span className="italic">Plant-Based Meals</span>
            </h2>

            <div className="mt-8 flex items-baseline gap-4">
              <span className="font-mono text-xl text-cream/50 line-through">
                $24.99
              </span>
              <span className="font-display text-6xl font-bold">$9.99</span>
              <span className="font-mono text-xs uppercase tracking-widest text-sage-soft">
                USD
              </span>
            </div>
            <p className="mt-2 text-sm text-cream/70">
              Instant PDF download · Lifetime access · All 6 bonuses included
            </p>

            <button
              type="button"
              onClick={openCheckout}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cream px-8 py-5 text-lg font-bold text-forest shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98] sm:w-auto"
            >
              Get Instant Access →
            </button>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-cream/60">
              🔒 Secure checkout · Instant download
            </p>

            <ul className="mt-8 space-y-2 text-sm text-cream/85">
              <li className="flex items-center gap-2">
                <span className="text-sage-soft">✓</span> 30 tested recipes with photos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sage-soft">✓</span> 6 exclusive bonuses ($70 value)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sage-soft">✓</span> 60-day money-back guarantee
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-center">
          <SectionLabel>Frequently asked</SectionLabel>
          <h2 className="font-display text-3xl text-forest-deep sm:text-4xl">
            Everything you might be wondering.
          </h2>
        </div>
        <div className="mt-10 divide-y divide-forest/10 rounded-3xl bg-white/70 px-6 ring-1 ring-forest/10">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className="font-medium text-charcoal">{f.q}</span>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full bg-sage/15 text-forest transition-transform ${
                      open ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid overflow-hidden text-sm leading-relaxed text-charcoal/70 transition-all duration-300 ${
                    open ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="pr-10">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-4 text-center md:pb-32">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-forest to-forest-deep p-12 text-cream shadow-[var(--shadow-card)] md:p-16">
          <SectionLabel>
            <span className="text-sage-soft">One last thing</span>
          </SectionLabel>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Healthy Food Should Never Be <span className="italic">Boring.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-cream/75">
            Start eating meals you actually look forward to, tonight.
          </p>
          <button
            type="button"
            onClick={openCheckout}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-cream px-10 py-5 text-lg font-bold text-forest shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
          >
            Download My Cookbook Now →
          </button>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-cream/60">
            $9.99 · Instant PDF · 60-day guarantee
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-forest/10 bg-cream-warm/40 pb-28 pt-16 md:pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <span className="font-display text-2xl font-bold italic text-forest">
                Planted<span className="text-sage">&amp;</span>Simple
              </span>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-sage">
                Simple Plant-Based Meals. Powerful Nutrition.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/60">
              <a href="https://pinterest.com" className="hover:text-forest">
                Pinterest
              </a>
              <a href="/privacy" className="hover:text-forest">
                Privacy
              </a>
              <a href="/terms" className="hover:text-forest">
                Terms
              </a>
              <a href="/refund" className="hover:text-forest">
                Refunds
              </a>
              <a
                href="mailto:support@primedownloads.store"
                className="hover:text-forest"
              >
                Contact
              </a>
            </nav>
          </div>
          <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
            © 2026 PlantedAndSimple. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Analytics placeholders */}
      {/* TODO: Add Pinterest Tag: <script>...</script> */}
      {/* TODO: Add Google Analytics gtag script */}

    </div>
  );
}
