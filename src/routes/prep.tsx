import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { SiteLayout } from "@/components/SiteLayout";
import actionMealPrep from "@/assets/product-action-meal-prep.jpg";
import prepFeaturePlanner from "@/assets/prep-feature-planner.jpg";
import prepFeatureGrocery from "@/assets/prep-feature-grocery.jpg";
import prepSystemCover from "@/assets/prep-system-cover.jpg";

const PRICE_CENTS = 2700;
const COMPARE_CENTS = 5400;
const COVER_URL =
  "https://plantedandsimple.lovable.app/api/public/img/media/products/prep-system-cover.jpg";

function getStoredAffiliateRef(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("ref");
  if (fromUrl) {
    const code = fromUrl.trim().toUpperCase();
    window.localStorage.setItem("pas_affiliate_ref", code);
    return code;
  }
  return window.localStorage.getItem("pas_affiliate_ref");
}

export const Route = createFileRoute("/prep")({
  component: PrepSalesPage,
  head: () => ({
    meta: [
      { title: "Meal Prep System — Plan the week, cook once | Planted & Simple" },
      {
        name: "description",
        content:
          "The complete plant-based meal-prep system: 7-day planner with live nutrition, one aisle-sorted grocery list, and kitchen batch-cooking mode. Launch price $27 (normally $54).",
      },
      {
        property: "og:title",
        content: "Plan the week. Shop once. Cook once. — Planted & Simple",
      },
      {
        property: "og:description",
        content:
          "A plant-based meal-prep companion that turns Sunday chaos into one calm session. Launch offer: $27 instead of $54.",
      },
      { property: "og:type", content: "product" },
      { property: "og:image", content: COVER_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: COVER_URL },
    ],
    links: [
      { rel: "canonical", href: "https://www.primedownloads.store/prep" },
    ],
  }),
});

const STEPS = [
  {
    number: "01",
    title: "Plan your week",
    body: "Drag meals into your 7-day calendar — breakfast, lunch, dinner, and snacks. Protein, calories, and macros update live as you plan, so you always know your week is balanced.",
  },
  {
    number: "02",
    title: "Get one grocery list",
    body: "Every planned recipe pulls into a single list, scaled to your servings and sorted by aisle. Shop once — not five times a week.",
  },
  {
    number: "03",
    title: "Cook one calm session",
    body: "Kitchen mode walks you through batch-cooking steps with timers and storage notes. One focused session, and the whole week is ready to eat.",
  },
];

const INSIDE = [
  { icon: "🗓️", title: "7-day drag-and-drop planner", body: "Arrange meals around your real life — late meetings, gym days, leftovers." },
  { icon: "🥗", title: "Live protein & macro totals", body: "See calories, protein, and macros for the full day and the whole week as you build it." },
  { icon: "🛒", title: "One-tap grocery list", body: "Scaled by servings, grouped by aisle, ready on your phone in the store." },
  { icon: "🔥", title: "Kitchen batch-cooking mode", body: "Step-by-step prep flow with timers and storage notes for a calm Sunday session." },
  { icon: "🥫", title: "Pantry tracker", body: "Track your staples so you never run out of the basics mid-week again." },
  { icon: "📚", title: "4 ready-made weekly plans", body: "Not in the mood to plan? Start from a proven week and tweak it in seconds." },
  { icon: "🍽️", title: "30 plant-based recipes", body: "High-protein recipes that connect straight into your planner and grocery list." },
  { icon: "📱", title: "Works on every device", body: "Phone, tablet, or computer — in the kitchen, the store, or on the couch." },
];

const FAQ = [
  {
    q: "Is this a subscription?",
    a: "No. One payment of $27 and the system is yours forever — no renewals, no monthly fees, no surprises.",
  },
  {
    q: "What do I need to use it?",
    a: "Any browser — phone, tablet, or computer. There is nothing to install, and your plan follows you across devices.",
  },
  {
    q: "Does it work with the cookbook?",
    a: "Yes — the 30 high-protein recipes from 30 High-Protein Plant-Based Meals connect directly into the planner, grocery list, and kitchen mode.",
  },
  {
    q: "I'm not a confident cook. Will this help?",
    a: "That's exactly who it's for. Ready-made weekly plans and batch-cooking mode with timers mean you follow simple steps — no guesswork, no chef skills required.",
  },
  {
    q: "What if I don't love it?",
    a: "You're covered by the same 60-day, no-questions-asked money-back guarantee as the cookbook. If it doesn't make your weeks calmer, we refund every cent.",
  },
];

function PriceTag({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="font-display text-5xl font-bold text-forest-deep">$27</span>
      <span className="text-2xl text-charcoal/40 line-through">$54</span>
      <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-forest">
        🔥 Save 50% – Limited Launch Offer
      </span>
    </div>
  );
}

function PrepSalesPage() {
  const navigate = useNavigate();
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onBuy = (cta: string) => {
    const ref = getStoredAffiliateRef();
    void trackEvent("checkout_start", {
      refSlug: "meal-prep-system",
      metadata: { cta, price: PRICE_CENTS },
    });
    void navigate({
      to: "/checkout",
      search: {
        price: "prep_system_onetime",
        slug: "meal-prep-system",
        ...(ref ? { ref } : {}),
      },
    });
  };

  const BuyButton = ({ label, cta, className = "" }: { label: string; cta: string; className?: string }) => (
    <button
      type="button"
      onClick={() => onBuy(cta)}
      className={`inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-8 py-3 text-sm font-bold uppercase tracking-[0.16em] text-cream shadow-lg transition hover:-translate-y-0.5 hover:bg-forest-deep ${className}`}
    >
      {label}
    </button>
  );

  return (
    <SiteLayout>
      <main>
        {/* Hero */}
        <section className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-charcoal sm:min-h-[720px]">
          <img
            src={actionMealPrep}
            alt="A home cook prepping plant-based meals for the week"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 -z-10 bg-charcoal/60" />
          <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-32 text-cream sm:pb-20">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage-soft">
              The Meal Prep System — now open
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl italic leading-[1.02] sm:text-7xl">
              Plan the week. Shop once. Cook once.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
              A plant-based meal-prep companion that turns Sunday chaos into
              one calm session — with your protein, calories, and macros
              handled.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BuyButton label="Get instant access — $27" cta="hero" />
              <a
                href="#how"
                className="inline-flex min-h-12 items-center justify-center border border-cream/60 px-6 py-3 text-sm font-semibold text-cream transition hover:bg-cream hover:text-forest"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-cream/70">
              One-time payment · Yours forever · 60-day guarantee
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-forest/10 bg-cream-warm px-6 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-forest/80">
            <span>One-time payment</span>
            <span aria-hidden="true" className="hidden sm:inline text-sage">•</span>
            <span>Works on phone, tablet &amp; computer</span>
            <span aria-hidden="true" className="hidden sm:inline text-sage">•</span>
            <span>30 plant-based recipes included</span>
            <span aria-hidden="true" className="hidden sm:inline text-sage">•</span>
            <span>60-day money-back guarantee</span>
          </div>
        </section>

        {/* Problem */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
              The real problem
            </p>
            <h2 className="mt-3 font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
              The 6pm scramble ends today.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-charcoal/70">
              You eat well most days — until the week gets busy. Then it's
              scramble mode: whatever is fastest, whatever is easiest, and the
              groceries you meant to buy quietly go bad in the fridge. It's
              not a discipline problem. It's a planning problem.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-charcoal/85">
              The Meal Prep System fixes the planning — so eating well becomes
              the easiest option you have.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-cream-warm/60 px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
              How it works
            </p>
            <h2 className="mt-3 text-center font-display text-4xl italic text-forest-deep sm:text-5xl">
              Three steps. One calm week.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="rounded-[1.75rem] border border-forest/10 bg-white p-7 shadow-[var(--shadow-soft)]">
                  <span className="font-mono text-xs font-semibold text-sage">{step.number}</span>
                  <h3 className="mt-3 font-display text-2xl italic text-forest-deep">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature scene: planner */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-[1.75rem] border border-forest/10 shadow-[var(--shadow-card)]">
              <img
                src={prepFeaturePlanner}
                alt="The Planted & Simple weekly meal planner on a laptop"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="max-w-xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
                Feature 01 — The weekly planner
              </p>
              <h2 className="mt-3 font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
                See your whole week in one glance.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/70">
                Drop meals into any day and watch your protein, calories, and
                macros update instantly. Moving a dinner? The numbers follow.
                You'll never reach Friday wondering whether the week actually
                added up.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-charcoal/75">
                <li>✓ Breakfast, lunch, dinner, and snacks — all seven days</li>
                <li>✓ Live nutrition totals as you plan</li>
                <li>✓ Swap any meal without breaking the week</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feature scene: grocery */}
        <section className="bg-cream-warm/60 px-6 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 max-w-xl lg:order-1">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
                Feature 02 — The grocery engine
              </p>
              <h2 className="mt-3 font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
                Shop once, not five times.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/70">
                Your week becomes one list, scaled to your servings and sorted
                the way a store is actually laid out — produce together,
                pantry together, chilled together. One trip, no forgotten
                ingredients, no 6pm dashes.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-charcoal/75">
                <li>✓ Every planned recipe merged into one list</li>
                <li>✓ Quantities scaled to the people you feed</li>
                <li>✓ Grouped by aisle so you never backtrack</li>
              </ul>
            </div>
            <div className="order-1 overflow-hidden rounded-[1.75rem] border border-forest/10 shadow-[var(--shadow-card)] lg:order-2">
              <img
                src={prepFeatureGrocery}
                alt="A shopper using the aisle-grouped grocery list on a phone in the store"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* What's inside */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
              What's inside
            </p>
            <h2 className="mt-3 text-center font-display text-4xl italic text-forest-deep sm:text-5xl">
              Everything you need for calmer weeks.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INSIDE.map((item) => (
                <div key={item.title} className="rounded-2xl border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)]">
                  <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                  <h3 className="mt-3 font-display text-lg italic text-forest-deep">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cookbook bridge */}
        <section className="bg-cream-warm/60 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
              Already own the cookbook?
            </p>
            <h2 className="mt-3 font-display text-3xl italic text-forest-deep sm:text-4xl">
              It plugs straight in.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal/70">
              The 30 recipes from{" "}
              <strong className="text-forest">30 High-Protein Plant-Based Meals</strong>{" "}
              connect directly into the planner, grocery list, and kitchen
              mode — your cookbook becomes complete weeks of food with one
              tap.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-forest/15 bg-white shadow-[var(--shadow-card)]">
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              <div className="bg-cream-warm/70 p-8 sm:p-10">
                <img
                  src={prepSystemCover}
                  alt="The Plant-Based Meal Prep & Kitchen System"
                  loading="lazy"
                  className="w-full max-w-[220px] rounded-2xl shadow-xl ring-1 ring-forest/10"
                />
              </div>
              <div className="p-8 sm:p-10">
                <h2 className="font-display text-3xl italic text-forest-deep sm:text-4xl">
                  Plant-Based Meal Prep &amp; Kitchen System
                </h2>
                <PriceTag className="mt-5" />
                <ul className="mt-6 space-y-2 text-sm text-charcoal/75">
                  <li>✓ 7-day planner with live protein &amp; macro totals</li>
                  <li>✓ Grocery list builder — scaled &amp; aisle-sorted</li>
                  <li>✓ Kitchen batch-cooking mode with timers</li>
                  <li>✓ Pantry tracker + 4 ready-made weekly plans</li>
                  <li>✓ 30 connected plant-based recipes</li>
                  <li>✓ Works on phone, tablet &amp; computer</li>
                </ul>
                <BuyButton
                  label="Get instant access — $27"
                  cta="pricing_card"
                  className="mt-7 w-full"
                />
                <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
                  One-time payment · No subscription · Yours forever
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Guarantee */}
        <section className="bg-forest px-6 py-16 text-cream sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-4xl" aria-hidden="true">🛡️</span>
            <h2 className="mt-4 font-display text-4xl italic sm:text-5xl">
              Try it for 60 days. Love it, or it's free.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/85">
              Plan a full week. Shop with the list. Run one batch session. If
              your weeks don't feel calmer and lighter, email us within 60
              days and we'll refund every cent — no questions, no forms, no
              hard feelings.
            </p>
            <BuyButton label="Start your 60 days — $27" cta="guarantee" className="mt-8 bg-cream text-forest hover:bg-sage-soft hover:text-forest-deep" />
            <p className="mt-5 text-sm text-cream/80">
              Already bought it?{" "}
              <a href="/auth?next=/prep-app" className="font-semibold underline">Sign in to open your Meal Prep System</a>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sage">
              A few helpful answers
            </p>
            <h2 className="mt-3 text-center font-display text-4xl italic text-forest-deep sm:text-5xl">
              Before you plan
            </h2>
            <div className="mt-8 divide-y divide-forest/15 border-y border-forest/15">
              {FAQ.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-forest-deep marker:content-none">
                    {faq.q}
                    <span aria-hidden="true" className="text-xl font-normal text-sage transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-8 text-sm leading-relaxed text-charcoal/70">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-cream-warm/60 px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl italic leading-tight text-forest-deep sm:text-5xl">
              Next Sunday can feel completely different.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-charcoal/70">
              One plan. One list. One calm session. Your weeks of good food,
              handled.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <BuyButton label="Get instant access — $27" cta="final" />
              <Link
                to="/shop/$slug"
                params={{ slug: "high-protein-cookbook" }}
                className="inline-flex min-h-12 items-center justify-center border border-forest/30 px-6 py-3 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream"
              >
                Or shop the cookbook
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal/50">
              Launch offer — save 50% while it lasts
            </p>
          </div>
        </section>
      </main>

      {/* Sticky buy bar */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-forest/10 bg-cream/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-base italic text-forest-deep">
                Meal Prep &amp; Kitchen System
              </p>
              <p className="text-xs text-charcoal/60">
                <span className="font-bold text-forest-deep">$27</span>{" "}
                <span className="line-through">$54</span> · one-time payment
              </p>
            </div>
            <BuyButton label="Buy now" cta="sticky_bar" className="shrink-0 px-6 py-2.5" />
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
