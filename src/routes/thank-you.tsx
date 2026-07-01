import { createFileRoute } from "@tanstack/react-router";
import cookbookAsset from "@/assets/cookbook.pdf.asset.json";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";

export const Route = createFileRoute("/thank-you")({
  component: ThankYou,
  head: () => ({
    meta: [
      { title: "Thank you — Download your cookbook · PlantedAndSimple" },
      {
        name: "description",
        content:
          "Thanks for your order! Download your copy of 30 High-Protein Plant-Based Meals now.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "/thank-you" },
    ],
    links: [{ rel: "canonical", href: "/thank-you" }],
  }),
});

function ThankYou() {
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <a
          href="/"
          className="font-display text-2xl font-bold italic text-forest"
        >
          Planted<span className="text-sage">&amp;</span>Simple
        </a>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-8 pb-24">
        <div className="rounded-[2.5rem] bg-white p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-forest/10 md:p-14">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage/20 text-forest">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-none stroke-forest stroke-[2.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5 9-11" />
            </svg>
          </div>
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
            Order confirmed
          </p>
          <h1 className="mt-3 font-display text-4xl italic text-forest-deep sm:text-5xl">
            Thank you!
          </h1>
          <p className="mx-auto mt-4 max-w-md text-charcoal/70">
            Your copy of{" "}
            <strong className="text-charcoal">
              30 High-Protein Plant-Based Meals
            </strong>{" "}
            is ready. Tap the button below to download your PDF — it works on
            any device.
          </p>

          <img
            src={cookbookMockup}
            alt="Cookbook cover"
            width={800}
            height={1000}
            loading="lazy"
            className="mx-auto mt-10 w-48 rounded-2xl shadow-xl ring-1 ring-forest/10"
          />

          <a
            href={cookbookAsset.url}
            download
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-forest px-10 py-5 text-lg font-bold text-cream shadow-xl transition-all hover:-translate-y-0.5 hover:bg-forest-deep"
          >
            ⬇ Download Cookbook (PDF)
          </a>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-charcoal/50">
            You have lifetime access · Save the file to your device
          </p>

          <div className="mt-12 rounded-2xl border border-sage/20 bg-cream/60 p-6 text-left">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
              What's next
            </p>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/75">
              <li>· Save the PDF to your phone, tablet, or Kindle.</li>
              <li>· Print any recipe you'd like to keep in the kitchen.</li>
              <li>
                · Pin your favorite recipes on{" "}
                <a
                  href="https://pinterest.com"
                  className="font-semibold text-forest underline underline-offset-4"
                >
                  Pinterest
                </a>
                .
              </li>
            </ul>
          </div>

          <a
            href="/"
            className="mt-10 inline-block font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/50 hover:text-forest"
          >
            ← Back to home
          </a>
        </div>
      </main>
    </div>
  );
}
