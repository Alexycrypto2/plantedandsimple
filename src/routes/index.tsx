import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteLayout";
import heroImg from "@/assets/home-hero.jpg";
import heroEditorial from "@/assets/hero-editorial.jpg";
import ritualImg from "@/assets/home-ritual.jpg";
import journalLead from "@/assets/home-journal-lead.jpg";
import catBreakfast from "@/assets/cat-breakfast.jpg";
import catProtein from "@/assets/cat-protein.jpg";
import catDesserts from "@/assets/cat-desserts.jpg";
import catDinners from "@/assets/cat-dinners.jpg";
import peekMealPrep from "@/assets/peek-meal-prep.jpg.asset.json";
import peekSmoothies from "@/assets/peek-smoothies.jpg.asset.json";
import peekRecipe from "@/assets/peek-recipe.jpg.asset.json";
import { listPublishedProducts, type PublicProduct } from "@/lib/products.functions";
import { trackAffiliateClick } from "@/lib/affiliates.functions";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async (): Promise<{ products: PublicProduct[] }> => {
    const products = await listPublishedProducts({ data: {} });
    return { products };
  },
  head: () => ({
    meta: [
      { title: "PlantedAndSimple — Premium Plant-Based Cookbooks & Recipes" },
      {
        name: "description",
        content:
          "Digital cookbooks, seasonal meal plans, and recipes for the intentional plant-based kitchen. Instant PDF downloads made with care.",
      },
      { property: "og:title", content: "PlantedAndSimple — Premium Plant-Based Cookbooks" },
      {
        property: "og:description",
        content:
          "Simple recipes, refined for the modern home cook. Explore our digital cookbook studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const CATEGORIES = [
  { name: "Breakfast", img: catBreakfast },
  { name: "High-Protein", img: catProtein },
  { name: "Meal Prep", img: peekMealPrep.url },
  { name: "Smoothies", img: peekSmoothies.url },
  { name: "Desserts", img: catDesserts },
  { name: "Quick Dinners", img: catDinners },
];

const BLOG = [
  {
    kind: "Technique",
    title: "Mastering Plant-Based Umami: The Secret to Depth of Flavor",
    excerpt:
      "Why mushrooms, miso, and liquid aminos are the foundation of every savory dish we create.",
    img: journalLead,
    featured: true,
  },
  {
    kind: "Seasonal",
    title: "Seasonal Eating: An Autumn Guide",
    img: peekRecipe.url,
  },
  {
    kind: "Rituals",
    title: "5 Rituals for a Grounded Morning",
    img: ritualImg,
  },
];

function HomePage() {
  const { products } = Route.useLoaderData() as { products: PublicProduct[] };
  const featured = products.filter((p) => p.is_featured);
  const rest = products.filter((p) => !p.is_featured);
  const primary: PublicProduct | undefined = featured[0] ?? products[0];
  const secondary: PublicProduct | undefined =
    featured[1] ?? rest[0] ?? products[1];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) trackAffiliateClick({ data: { code: ref } }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal antialiased">
      <SiteNav />
      <Hero primary={primary} />
      <FeaturedCollection primary={primary} secondary={secondary} />
      <ShopGrid products={products} />
      <FreeResources />
      <CategoryGrid />
      <BestSellersMarquee bestsellers={products.filter((p) => p.is_bestseller)} />
      <WhyChoose />
      <Testimonial />
      <JournalBento />
      <Newsletter />
      <SiteFooter />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ primary }: { primary?: PublicProduct }) {
  return (
    <header className="px-6 py-14 md:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
            Simple Plant-Based Meals. Powerful Nutrition.
          </p>
          <h1 className="font-display text-[3.25rem] leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Eat well <br />
            <span className="italic text-forest">without the effort.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-charcoal/70">
            Beautiful, dependable plant-based recipes — designed to make healthy eating feel simple, joyful, and something you actually look forward to.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/free"
              className="rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream shadow-soft transition hover:-translate-y-0.5 hover:bg-forest-deep"
            >
              Download Free Recipe Book
            </Link>
            <Link
              to="/shop"
              className="rounded-full border border-forest/30 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-forest-deep transition hover:bg-cream-warm"
            >
              Browse Cookbooks
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            <span>✦ 15,000+ home cooks</span>
            <span>✦ 60-day guarantee</span>
            <span>✦ Instant PDF</span>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="relative">
            <div className="aspect-[16/11] overflow-hidden rounded-[2.5rem] bg-cream-warm shadow-card">
              <img
                src={heroImg}
                alt="A vibrant plant-based grain bowl with roasted vegetables, avocado, chickpeas and tahini"
                width={1600}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
            {primary && (
              <div className="absolute -bottom-6 left-6 hidden max-w-xs rounded-2xl border border-white/60 bg-cream/90 px-6 py-4 shadow-soft backdrop-blur md:block">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">
                  Featured Release
                </p>
                <p className="mt-1 font-display text-xl italic text-forest-deep">
                  {primary.title}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Featured collection bento ---------------- */

function FeaturedCollection({
  primary,
  secondary,
}: {
  primary?: PublicProduct;
  secondary?: PublicProduct;
}) {
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl italic text-forest-deep md:text-5xl">
            Digital Collections
          </h2>
          <p className="max-w-xs text-sm text-charcoal/60">
            Our premium digital cookbooks live beautifully on your tablet, phone, or printed for the kitchen.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Big card */}
          <article className="lg:col-span-2">
            <div className="flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-forest/10 bg-cream-warm/50 md:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-5 p-8 md:p-12">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-forest">
                  {primary?.is_bestseller ? "The Best Seller" : "Featured"}
                </span>
                <h3 className="font-display text-3xl italic text-forest-deep md:text-[2.5rem]">
                  {primary?.title ?? "The Foundation"}
                </h3>
                <p className="text-sm leading-relaxed text-charcoal/70">
                  {primary?.subtitle ??
                    "Recipes to build a sustainable plant-based lifestyle without the complexity."}
                </p>
                <div className="flex items-baseline gap-3 pt-2">
                  {primary && (
                    <>
                      <span className="font-display text-3xl text-forest-deep">
                        ${primary.price_display}
                      </span>
                      {primary.compare_at_cents > primary.price_cents && (
                        <span className="text-sm text-charcoal/40 line-through">
                          ${primary.compare_at_display}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="pt-2">
                  {primary ? (
                    <Link
                      to="/shop/$slug"
                      params={{ slug: primary.slug }}
                      className="inline-flex rounded-full bg-charcoal px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-forest"
                    >
                      View Cookbook
                    </Link>
                  ) : (
                    <Link
                      to="/shop"
                      className="inline-flex rounded-full bg-charcoal px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream"
                    >
                      Browse Shop
                    </Link>
                  )}
                </div>
              </div>
              <div className="min-h-[280px] w-full bg-sage-soft md:min-h-[420px] md:w-1/2">
                {primary?.cover_image_url ? (
                  <img
                    src={primary.cover_image_url}
                    alt={primary.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={heroImg}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </article>

          {/* Dark green card */}
          <article className="lg:col-span-1">
            {secondary ? (
              <Link
                to="/shop/$slug"
                params={{ slug: secondary.slug }}
                className="group flex h-full flex-col rounded-[2.5rem] bg-forest p-6 text-cream md:p-8"
              >
                <div className="aspect-square overflow-hidden rounded-2xl bg-forest-deep">
                  {secondary.cover_image_url ? (
                    <img
                      src={secondary.cover_image_url}
                      alt={secondary.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={ritualImg}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <h3 className="mt-6 font-display text-3xl italic">{secondary.title}</h3>
                <p className="mt-3 text-sm text-cream/70">
                  {secondary.subtitle ?? "A new plant-based release."}
                </p>
                <span className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-cream/25 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition group-hover:bg-cream/10">
                  Explore →
                </span>
              </Link>
            ) : (
              <div className="flex h-full flex-col rounded-[2.5rem] bg-forest p-8 text-cream">
                <div className="aspect-square overflow-hidden rounded-2xl bg-forest-deep">
                  <img
                    src={ritualImg}
                    alt="Green morning ritual smoothie"
                    loading="lazy"
                    width={1200}
                    height={1200}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-6 font-display text-3xl italic">
                  7-Day Morning Ritual
                </h3>
                <p className="mt-3 text-sm text-cream/70">
                  High-protein smoothies &amp; morning habits — coming soon.
                </p>
                <Link
                  to="/shop"
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-cream/25 py-3.5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-cream/10"
                >
                  Browse Shop
                </Link>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Free resources ---------------- */

function FreeResources() {
  return null; // moved below; kept for future re-use
}

/* ---------------- Shop grid (all products) ---------------- */

function ShopGrid({ products }: { products: PublicProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="bg-cream px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
              The Shop
            </p>
            <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">
              Every cookbook we make
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest hover:underline"
          >
            Browse the full shop →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              to="/shop/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-sage-soft">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={heroImg}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                {p.category_name && (
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sage">
                    {p.category_name}
                  </p>
                )}
                <h3 className="mt-2 font-display text-xl italic text-forest-deep">
                  {p.title}
                </h3>
                {p.subtitle && (
                  <p className="mt-1 line-clamp-2 text-sm text-charcoal/60">
                    {p.subtitle}
                  </p>
                )}
                <div className="mt-auto flex items-baseline justify-between pt-5">
                  <div>
                    <span className="font-display text-2xl font-bold text-forest-deep">
                      ${p.price_display}
                    </span>
                    {p.compare_at_cents > p.price_cents && (
                      <span className="ml-2 text-xs text-charcoal/40 line-through">
                        ${p.compare_at_display}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest group-hover:underline">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function _FreeResourcesUnused() {
  const items = [
    {
      title: "Pantry Essentials PDF",
      body: "A complete list of must-have plant-based ingredients for a vibrant kitchen.",
    },
    {
      title: "Weekly Prep Sheet",
      body: "A printable batch-cooking template for your busiest weeks.",
    },
  ];
  return (
    <section id="free-resources" className="bg-cream-warm/40 px-6 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-4">
        <div className="py-2 md:col-span-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
            Free & lovely
          </p>
          <h2 className="mt-3 font-display text-3xl italic text-forest-deep md:text-4xl">
            Free Pantry Tools
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
            Downloadable guides to help you master the plant-based kitchen essentials.
          </p>
        </div>
        {items.map((it) => (
          <div
            key={it.title}
            className="flex flex-col rounded-3xl border border-forest/10 bg-white p-8 transition hover:-translate-y-1 hover:shadow-card"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-cream">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14"
                  stroke="var(--forest)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-6 font-display text-xl text-forest-deep">{it.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-charcoal/60">{it.body}</p>
            <a
              href="#free-resources"
              className="mt-6 self-start border-b-2 border-forest pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-forest"
            >
              Download free
            </a>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center rounded-3xl bg-forest p-8 text-center text-cream">
          <p className="font-display text-2xl italic">Join 15,000+ others</p>
          <p className="mt-2 text-xs text-cream/70">Access every free guide.</p>
          <a
            href="#newsletter"
            className="mt-6 rounded-full bg-cream px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-forest-deep hover:bg-white"
          >
            Sign up
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Category grid ---------------- */

function CategoryGrid() {
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
            The Recipe Library
          </p>
          <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">
            Explore the Library
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              to="/recipes"
              className="group block space-y-3"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-cream-warm">
                <img
                  src={c.img}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              </div>
              <p className="text-center text-sm font-medium text-charcoal/80 group-hover:text-forest">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Bestsellers marquee ---------------- */

function BestSellersMarquee({ bestsellers }: { bestsellers: PublicProduct[] }) {
  const labels =
    bestsellers.length > 0
      ? bestsellers.map((b) => b.title)
      : [
          "The Green Kitchen Handbook",
          "7-Day Ritual Masterclass",
          "High-Protein Vegan Fuel",
          "Seasonal Dinner Guide",
        ];
  const loop = [...labels, ...labels, ...labels];
  return (
    <div className="overflow-hidden bg-charcoal py-6 text-cream">
      <div className="animate-marquee flex gap-12 whitespace-nowrap text-sm font-medium uppercase tracking-[0.3em]">
        {loop.map((label, i) => (
          <span key={i} className="flex items-center gap-12">
            {label}
            <span className="text-cream/30">/</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .animate-marquee { display:flex; width:max-content; animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}

/* ---------------- Testimonial ---------------- */

function Testimonial() {
  return (
    <section className="bg-cream px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 flex justify-center gap-1 text-forest">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <blockquote className="font-display text-3xl italic leading-tight text-forest-deep sm:text-4xl md:text-5xl">
          &ldquo;PlantedAndSimple has completely removed the guesswork from my weekly meal prep. The recipes are approachable yet feel like they came from a professional kitchen.&rdquo;
        </blockquote>
        <cite className="mt-10 block text-[11px] font-bold uppercase not-italic tracking-[0.25em] text-charcoal/50">
          Emma Richardson &middot; Home Cook
        </cite>
      </div>
    </section>
  );
}

/* ---------------- Journal / Blog bento ---------------- */

function JournalBento() {
  const [lead, ...side] = BLOG;
  return (
    <section className="bg-white px-6 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
              From the kitchen
            </p>
            <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">
              The Journal
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest hover:underline"
          >
            Read all articles →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <article className="group cursor-pointer md:col-span-8">
            <div className="mb-6 aspect-[16/9] overflow-hidden rounded-[2rem] bg-cream-warm">
              <img
                src={lead.img}
                alt={lead.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="max-w-xl">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal/50">
                {lead.kind}
              </span>
              <h3 className="mt-2 font-display text-3xl italic text-forest-deep">
                {lead.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/60">
                {lead.excerpt}
              </p>
            </div>
          </article>
          <div className="space-y-10 md:col-span-4">
            {side.map((a) => (
              <article key={a.title} className="group cursor-pointer">
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-cream-warm">
                  <img
                    src={a.img}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-charcoal/50">
                  {a.kind}
                </span>
                <h4 className="mt-1 font-display text-xl italic text-forest-deep">
                  {a.title}
                </h4>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Newsletter ---------------- */

function Newsletter() {
  return (
    <section id="newsletter" className="px-6 py-24">
      <div className="mx-auto max-w-4xl rounded-[3rem] bg-cream-warm/70 p-10 text-center shadow-soft md:p-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
          The Sunday Table
        </p>
        <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-6xl">
          Gather with us.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-charcoal/70">
          Join our weekly digest for seasonal recipes, cookbook previews, and intentional kitchen inspiration.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-10 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="Your email address"
            className="flex-1 rounded-full border border-forest/15 bg-white px-6 py-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-forest-deep"
          >
            Join now
          </button>
        </form>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
/* SiteFooter provided by @/components/SiteLayout */

function WhyChoose() {
  const items = [
    { title: "Tested, Not Guessed", body: "Every recipe is developed and re-tested in a real home kitchen before it ever ships." },
    { title: "Simple Ingredients", body: "Whole, easy-to-find pantry staples — no obscure powders or specialty grocery runs." },
    { title: "Nutrition That Fits Life", body: "Balanced, protein-forward meals designed for people with jobs, kids, and busy weeks." },
    { title: "Beautifully Photographed", body: "Full-color photos with every recipe, so you always know exactly what you're cooking toward." },
    { title: "Instant Digital Delivery", body: "Download your cookbook as a premium PDF — read it on phone, tablet, or print it out." },
    { title: "60-Day Money-Back", body: "Cook the recipes. If you don't love them, we'll refund every cent. No questions." },
  ];
  return (
    <section className="bg-cream-warm/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Why home cooks trust us</p>
          <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">
            Why Choose Our Cookbooks
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-3xl border border-forest/10 bg-white p-8 transition hover:-translate-y-1 hover:shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cream text-forest">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="mt-5 font-display text-xl text-forest-deep">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}