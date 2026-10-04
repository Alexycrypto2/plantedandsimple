import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/SiteLayout";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import freeCookbookAsset from "@/assets/free-cookbook.pdf.asset.json";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/free-cookbook")({
  head: () => ({
    meta: [
      { title: "Your Free Cookbook — PlantedAndSimple" },
      {
        name: "description",
        content:
          "Download your free PlantedAndSimple plant-based cookbook with quick, nourishing recipes for real weeknights.",
      },
      { property: "og:title", content: "Your Free Cookbook — PlantedAndSimple" },
      {
        property: "og:description",
        content: "Your free collection of simple, satisfying plant-based recipes is ready to download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreeCookbookPage,
});

function FreeCookbookPage() {
  useEffect(() => {
    void trackEvent("free_cookbook_view");
  }, []);

  const download = () => {
    void trackEvent("free_cookbook_download", {
      metadata: { asset: "free-cookbook.pdf" },
    });
  };

  return (
    <SiteLayout>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.82fr_1fr] lg:gap-20 lg:py-24">
        <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-cream-warm shadow-card">
          <img
            src={cookbookMockup}
            alt="20-Minute Plant Protein Kitchen cookbook cover"
            width={800}
            height={1000}
            className="h-auto w-full"
          />
        </div>
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
            Your gift is ready
          </p>
          <h1 className="mt-3 font-display text-5xl italic leading-[1.05] text-forest-deep md:text-6xl">
            Simple plant-based meals, ready for your kitchen.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal/70">
            Download your free copy of <strong className="text-charcoal">20-Minute Plant Protein Kitchen</strong> and start cooking satisfying recipes for real weeknights.
          </p>
        </div>
        </section>

        <section className="border-y border-forest/10 bg-cream-warm/40 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Start tonight</p>
            <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">From download to dinner in three simple steps.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Choose one recipe", "Pick the meal that fits the time and ingredients you have today."],
                ["02", "Set out your basics", "Use the short ingredient list and let the guide do the thinking."],
                ["03", "Cook something satisfying", "Make a colourful, protein-forward meal you will want to repeat."],
              ].map(([number, title, body]) => (
                <div key={number} className="border-l-2 border-sage px-5 py-2">
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-sage">{number}</span>
                  <h3 className="mt-3 font-display text-2xl italic text-forest-deep">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-forest/10 bg-cream-warm/40 px-6 py-14 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl italic text-forest-deep md:text-4xl">
            Take the recipes into your kitchen.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-charcoal/65">
            Your free cookbook is here whenever you’re ready to read, save, or cook from it.
          </p>
          <Button asChild size="lg" className="mt-7">
            <a
              href={freeCookbookAsset.url}
              target="_blank"
              rel="noreferrer"
              onClick={download}
            >
              Read &amp; download the free cookbook
            </a>
          </Button>
          <p className="mt-4 text-sm text-charcoal/55">
            This page will stay open while your cookbook opens in a new tab.
          </p>
          <Link to="/shop" className="mt-5 inline-flex text-sm font-semibold text-forest underline-offset-4 hover:underline">
            Explore the full cookbook collection
          </Link>
        </section>

        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">When you are ready for more</p>
            <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">The free guide gets you started. The full cookbook makes it effortless.</h2>
            <p className="mt-5 max-w-xl leading-relaxed text-charcoal/70">Build a complete week of simple meals with 30 recipes, a seven-day meal plan, grocery lists, and practical prep guides designed to keep healthy eating moving.</p>
            <Link
              to="/shop/$slug"
              params={{ slug: "high-protein-cookbook" }}
              onClick={() => void trackEvent("upsell_click", { refSlug: "high-protein-cookbook", metadata: { source: "free_cookbook" } })}
              className="mt-8 inline-flex rounded-full bg-forest px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-forest-deep"
            >
              Explore the full cookbook
            </Link>
          </div>
          <div className="border border-forest/15 bg-cream-warm p-7">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 text-sm">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sage">Free guide</p>
                <ul className="mt-5 space-y-3 text-charcoal/70"><li>5 quick recipes</li><li>Starter pantry list</li><li>Instant PDF download</li></ul>
              </div>
              <div className="h-full w-px bg-forest/15" />
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-forest">Full cookbook</p>
                <ul className="mt-5 space-y-3 font-medium text-charcoal"><li>30 high-protein recipes</li><li>7-day meal plan + grocery list</li><li>Prep guides and bonuses</li></ul>
              </div>
            </div>
            <p className="mt-7 border-t border-forest/10 pt-5 text-sm font-semibold text-forest-deep">Covered by a 60-day money-back guarantee.</p>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}