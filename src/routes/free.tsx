import { pageHead } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import freeBundle from "@/assets/free-cookbook-bundle.jpg";
import { subscribeFreeGuide } from "@/lib/free-guide.functions";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/free")({
  component: FreePage,
  head: () => pageHead("/free", "Free Plant-Based Cookbook | PlantedAndSimple", "Get the free 20-Minute Plant Protein Kitchen cookbook. Get 12 fast high-protein plant-based meals and download your PDF for easy weeknight cooking."),
});

// Details below are taken directly from the free guide PDF.
const PILLS = ["12 recipes", "Ready in ~20 min", "Up to 29g protein", "No protein powders", "5-day starter plan"];

const PREVIEWS = [
  { n: "04", chapter: "Lunch", name: "Crispy Tempeh Caesar Wraps", protein: 29 },
  { n: "05", chapter: "Lunch", name: "Peanut Sesame Tofu Noodle Bowl", protein: 28 },
  { n: "09", chapter: "Dinner", name: "Miso Ginger Tofu Stir-Fry", protein: 27 },
  { n: "10", chapter: "Dinner", name: "Creamy Sun-Dried Tomato Bean Pasta", protein: 26 },
  { n: "03", chapter: "Breakfast", name: "Green Protein Smoothie Bowl", protein: 24 },
  { n: "07", chapter: "Dinner", name: "Red Lentil Coconut Dal", protein: 21 },
];

const INSIDE = [
  ["Fast Mornings", "3 high-protein breakfasts"],
  ["Lunches", "3 portable, prep-friendly meals"],
  ["20-Minute Dinners", "4 one-pan weeknight dinners"],
  ["Snacks & Sweet Bites", "2 quick bites and a dessert"],
];

function SignupForm({ id }: { id: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await subscribeFreeGuide({ data: { email, source: "free_page" } });
      void trackEvent("free_cookbook_signup", { metadata: { source: "free_page" } });
      await navigate({ to: "/free-cookbook" });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">Email address</label>
        <input
          id={id}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your best email"
          className="flex-1 rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none"
        />
        <button disabled={busy} className="rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream shadow-card hover:bg-forest-deep disabled:opacity-60">
          {busy ? "Sending…" : "Get my free cookbook"}
        </button>
      </form>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      <p className="mt-3 text-xs text-charcoal/55">Instant download on screen + a copy to your inbox. No spam, unsubscribe anytime.</p>
    </div>
  );
}

function FreePage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="order-1 overflow-hidden rounded-[2rem] bg-cream-warm shadow-card lg:order-2">
            <img
              src={freeBundle}
              alt="20-Minute Plant Protein Kitchen free cookbook on a tablet, phone and printed pages"
              className="h-full w-full object-cover"
              width={1200}
              height={900}
            />
          </div>
          <div className="order-2 lg:order-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Free PDF cookbook</p>
            <h1 className="mt-3 font-display text-4xl italic leading-[1.05] text-forest-deep md:text-6xl">
              High-protein plant meals in 20 minutes. Free.
            </h1>
            <p className="mt-4 max-w-md text-base text-charcoal/75 md:text-lg">
              <strong className="text-charcoal">20-Minute Plant Protein Kitchen</strong>: 12 fast recipes built on tofu, tempeh, beans and lentils — no protein powders, no complicated steps.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {PILLS.map((p) => (
                <li key={p} className="rounded-full border border-forest/15 bg-cream-warm px-3.5 py-1.5 text-xs font-semibold text-forest-deep">
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <SignupForm id="free-email-top" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-warm py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">A peek inside</p>
          <h2 className="mt-2 font-display text-3xl italic text-forest-deep md:text-4xl">Recipes you'll actually cook tonight</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {PREVIEWS.map((r) => (
              <article key={r.n} className="flex flex-col justify-between rounded-2xl border border-forest/10 bg-background p-4 shadow-card md:p-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sage">Recipe {r.n} · {r.chapter}</p>
                  <h3 className="mt-2 font-display text-lg leading-tight text-forest-deep md:text-xl">{r.name}</h3>
                </div>
                <p className="mt-4 font-display text-2xl italic text-forest">
                  {r.protein}g <span className="font-sans text-[10px] font-bold uppercase not-italic tracking-[0.2em] text-charcoal/60">protein</span>
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-charcoal/55">Protein figures are per serving, as listed in the guide.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl italic text-forest-deep md:text-4xl">What's inside</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {INSIDE.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-cream-warm p-4 md:p-6">
              <h3 className="font-display text-lg text-forest-deep">{t}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-charcoal/70">Plus: the five protein anchors guide and a 5-day starter meal plan.</p>
      </section>

      <section className="bg-forest-deep py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
          <h2 className="font-display text-3xl italic text-cream md:text-4xl">Get your free copy now</h2>
          <p className="mt-3 text-cream/80">12 recipes · 36-page PDF · instant download</p>
          <div className="mt-6 w-full max-w-md rounded-3xl bg-cream p-4 text-left">
            <SignupForm id="free-email-bottom" />
          </div>
          <Link to="/shop" className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-cream/80 underline-offset-4 hover:underline">
            Or browse the full 30-recipe cookbook
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
