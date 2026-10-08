import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { trackEvent } from "@/lib/analytics";
import kitCover from "@/assets/kit-page-1.jpg";
import kitWeek from "@/assets/kit-page-3.jpg";
import kitGrocery from "@/assets/kit-page-5.jpg";
import kitPrep from "@/assets/kit-page-8.jpg";

const PRICE = "4.99";
const COMPARE = "14.99";

export const Route = createFileRoute("/planning-kit")({
  component: PlanningKitPage,
  head: () => pageHead("/planning-kit", "Printable Plant-Based Meal Planning Kit | PlantedAndSimple", "Plan meals, organise groceries and prep ahead with a 12-page printable plant-based planning kit. One-time $4.99 purchase with instant PDF download.", "product"),
});

function getRef(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pas_affiliate_ref");
}

const PAGES = [
  ["01", "Your Week at a Glance", "Breakfast, lunch, dinner and snacks for all seven days — plus prep notes."],
  ["02", "Balanced Plant-Based Week", "Protein, vegetables and grains for each day, without counting every gram."],
  ["03", "Grocery List by Aisle", "Produce, proteins, grains, pantry, frozen. One quick trip, nothing forgotten."],
  ["04", "Pantry & Fridge Check", "See what you already have before you spend a cent."],
  ["05", "Plant Protein Planner", "Beans, lentils, tofu, tempeh — spread your protein across the week."],
  ["06", "Batch Prep Planner", "Wash, chop, cook, portion, store. Prep by task, not by recipe."],
  ["07", "Leftovers Planner", "Turn what's in the fridge into tomorrow's lunch, not the bin."],
  ["08", "Recipes Worth Repeating", "Keep track of your favourites so the next week plans itself."],
  ["09", "Prep Checklist + Monthly Planner", "A simple routine and a month-at-a-glance for weekly themes."],
];

const FAQ = [
  ["What format is it?", "A high-quality PDF (US Letter) you download right after checkout. Print it at home or fill it in on a tablet."],
  ["Can I print it more than once?", "Yes — print a fresh copy every week, forever, for your own household."],
  ["Do I need the cookbook?", "No, it works with any recipes. But it's designed to pair perfectly with 30 High-Protein Plant-Based Meals."],
  ["How is this different from the Meal Prep System?", "The Meal Prep System is an interactive app that plans and builds grocery lists for you. The Planning Kit is the simple pen-and-paper version."],
  ["What if I don't like it?", "You're covered by our 60-day money-back guarantee. Just email us."],
];

function PlanningKitPage() {
  const navigate = useNavigate();
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const on = () => setSticky(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const buy = (cta: string) => {
    const ref = getRef();
    void trackEvent("checkout_start", { refSlug: "planning-kit", metadata: { cta, price: 499 } });
    void navigate({ to: "/checkout", search: { price: "planning_kit_onetime", slug: "planning-kit", ...(ref ? { ref } : {}) } });
  };

  const Buy = ({ label, cta, className = "" }: { label: string; cta: string; className?: string }) => (
    <button type="button" onClick={() => buy(cta)}
      className={`inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-cream shadow-lg transition hover:-translate-y-0.5 hover:bg-forest-deep ${className}`}>
      {label}
    </button>
  );

  return (
    <SiteLayout>
      <main className="bg-cream">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-14 md:grid-cols-2 md:pt-20">
          <div>
            <span className="inline-block rounded-full bg-forest/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-forest">
              🔥 Save 67% · Launch price
            </span>
            <h1 className="mt-5 font-display text-5xl italic leading-[1.05] text-forest-deep sm:text-6xl">
              The cookbook brings the recipes. This kit makes them happen.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-charcoal/75">
              The Plant &amp; Simple Weekly Meal Planning Kit: 12 printable pages to plan the week,
              shop once, prep ahead and stop wasting food.
            </p>
            <div className="mt-7 flex items-baseline gap-3">
              <span className="font-display text-5xl text-forest-deep">${PRICE}</span>
              <span className="text-xl text-charcoal/40 line-through">${COMPARE}</span>
            </div>
            <Buy label="Get the Planning Kit" cta="hero" className="mt-6 w-full sm:w-auto" />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-charcoal/50">
              Instant PDF download · Print forever · 60-day guarantee
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <img src={kitWeek} alt="Weekly planner page" className="absolute -right-6 top-10 w-3/4 rotate-6 rounded-xl shadow-xl ring-1 ring-forest/10" loading="lazy" />
            <img src={kitCover} alt="Plant & Simple Weekly Meal Planning Kit cover" className="relative w-full -rotate-2 rounded-xl shadow-2xl ring-1 ring-forest/10" fetchPriority="high" />
          </div>
        </section>

        {/* Problem */}
        <section className="bg-forest-deep py-16 text-cream">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl italic sm:text-4xl">Sound familiar?</h2>
            <ul className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              {["It's 6pm and you still don't know what's for dinner.", "You buy great vegetables… then throw half of them away.", "You go to the shop three times a week for one missing thing."].map((t) => (
                <li key={t} className="rounded-2xl bg-cream/10 p-5 text-sm leading-relaxed">{t}</li>
              ))}
            </ul>
            <p className="mt-8 text-cream/80">Recipes aren't the problem. Planning is. Fifteen minutes with this kit on Sunday fixes the whole week.</p>
          </div>
        </section>

        {/* Pages */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">What's inside</p>
          <h2 className="mt-2 text-center font-display text-4xl italic text-forest-deep">12 pages. One calm week.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PAGES.map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-forest/10 bg-white p-6">
                <span className="font-mono text-xs font-bold text-sage">{n}</span>
                <h3 className="mt-2 font-display text-xl italic text-forest-deep">{t}</h3>
                <p className="mt-2 text-sm text-charcoal/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Peek */}
        <section className="bg-cream-warm/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-4xl italic text-forest-deep">Take a look inside</h2>
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6">
              {[[kitWeek, "Week at a glance"], [kitGrocery, "Grocery list by aisle"], [kitPrep, "Batch prep planner"]].map(([src, label]) => (
                <figure key={label}>
                  <img src={src} alt={label} loading="lazy" className="w-full rounded-xl bg-white shadow-lg ring-1 ring-forest/10" />
                  <figcaption className="mt-3 text-center text-xs font-semibold text-charcoal/70 sm:text-sm">{label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl italic text-forest-deep">Plan. Shop. Prep. Eat well.</h2>
          <ol className="mt-10 grid gap-4 text-left sm:grid-cols-5">
            {["Plan your meals", "Check what you have", "Build your list", "Prep what you can", "Enjoy your week"].map((s, i) => (
              <li key={s} className="rounded-2xl bg-white p-4 ring-1 ring-forest/10">
                <span className="font-mono text-xs font-bold text-sage">0{i + 1}</span>
                <p className="mt-1 text-sm font-semibold text-forest-deep">{s}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Offer */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-forest/10 sm:p-12">
            <img src={kitCover} alt="" className="mx-auto w-36 rounded-lg shadow-lg" loading="lazy" />
            <h2 className="mt-6 font-display text-3xl italic text-forest-deep">Weekly Meal Planning Kit</h2>
            <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-charcoal/75">
              {["12 printable planning pages", "Aisle-sorted grocery list", "Pantry, protein & leftover trackers", "Print unlimited copies", "Instant download"].map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-baseline justify-center gap-3">
              <span className="font-display text-5xl text-forest-deep">${PRICE}</span>
              <span className="text-xl text-charcoal/40 line-through">${COMPARE}</span>
            </div>
            <Buy label="Get instant access" cta="offer" className="mt-6 w-full" />
            <div className="mt-6 rounded-2xl bg-sage/10 p-4 text-sm text-charcoal/75">
              <strong className="text-forest-deep">60-day money-back guarantee.</strong> If it doesn't make your week easier, email us for a full refund.
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 pb-28">
          <h2 className="text-center font-display text-4xl italic text-forest-deep">Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="rounded-2xl bg-white p-5 ring-1 ring-forest/10">
                <summary className="cursor-pointer font-semibold text-forest-deep">{q}</summary>
                <p className="mt-3 text-sm text-charcoal/70">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <p className="text-sm text-charcoal/80"><strong className="text-forest-deep">${PRICE}</strong> <span className="line-through opacity-50">${COMPARE}</span> · Planning Kit</p>
            <Buy label="Get it now" cta="sticky" className="min-h-10 px-5 py-2 text-xs" />
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
