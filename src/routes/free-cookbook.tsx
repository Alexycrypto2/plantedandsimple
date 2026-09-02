import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/SiteLayout";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import freeCookbookAsset from "@/assets/free-cookbook.pdf.asset.json";

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
  return (
    <SiteLayout>
      <main className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
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
          <Button asChild size="lg" className="mt-8">
            <a href={freeCookbookAsset.url} download>
              Download my free cookbook
            </a>
          </Button>
          <p className="mt-4 text-sm text-charcoal/55">
            Keep this page bookmarked so your recipes are always close by.
          </p>
          <Link to="/shop" className="mt-8 inline-flex text-sm font-semibold text-forest underline-offset-4 hover:underline">
            Explore the full cookbook collection
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}