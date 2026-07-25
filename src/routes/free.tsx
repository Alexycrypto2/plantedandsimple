import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import ritualImg from "@/assets/home-ritual.jpg";

export const Route = createFileRoute("/free")({
  component: FreePage,
  head: () => ({
    meta: [
      { title: "Free Plant-Based Recipe Guide — PlantedAndSimple" },
      { name: "description", content: "Download our free plant-based recipe guide plus pantry essentials and weekly prep sheet — instant PDF, no cost." },
      { property: "og:title", content: "Free Recipe Guide — PlantedAndSimple" },
      { property: "og:description", content: "A free plant-based recipe guide, delivered instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function FreePage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Free & Lovely</p>
            <h1 className="mt-3 font-display text-5xl italic leading-[1.05] text-forest-deep md:text-6xl">
              Your free plant-based recipe guide.
            </h1>
            <p className="mt-5 max-w-md text-lg text-charcoal/70">
              Ten of our most-loved recipes, a pantry essentials checklist, and a printable weekly prep sheet — delivered instantly.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-charcoal/80">
              <li>✅ 10 tested plant-based recipes</li>
              <li>✅ Pantry essentials PDF</li>
              <li>✅ Weekly meal-prep template</li>
            </ul>
            {sent ? (
              <div className="mt-8 rounded-2xl border border-forest/20 bg-cream-warm p-6">
                <p className="font-display text-2xl italic text-forest-deep">Check your inbox ✨</p>
                <p className="mt-2 text-sm text-charcoal/70">Your free guide is on its way.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="flex-1 rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
                <button className="rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">Send free guide</button>
              </form>
            )}
            <p className="mt-3 text-xs text-charcoal/50">No spam. Unsubscribe anytime.</p>
          </div>
          <div className="overflow-hidden rounded-[2.5rem] bg-cream-warm shadow-card">
            <img src={ritualImg} alt="Free recipe guide preview" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="mt-24 text-center">
          <p className="font-display text-2xl italic text-forest-deep md:text-3xl">Ready for more?</p>
          <Link to="/shop" className="mt-4 inline-flex rounded-full border border-forest px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-forest hover:bg-forest hover:text-cream">
            Browse premium cookbooks
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}