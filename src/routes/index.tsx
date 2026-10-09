import { pageHead } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { subscribeFreeGuide } from "@/lib/free-guide.functions";
import { trackEvent } from "@/lib/analytics";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import { FALLBACK_RECIPES, FALLBACK_PRODUCTS, FALLBACK_POSTS } from "@/lib/fallback-content";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal, SectionHeader, MediaImage, EditorialCard } from "@/components/site/primitives";
import { FlagshipWithCompanions, FLAGSHIP_SLUG, productImage } from "@/components/site/ProductFamily";
import heroEditorial from "@/assets/hero-editorial.jpg";
import heroRotation2 from "@/assets/hero-rotation-2.jpg";
import heroRotation4 from "@/assets/hero-rotation-4.jpg";
import heroRotation5 from "@/assets/hero-rotation-5.jpg";
import heroRotation6 from "@/assets/hero-rotation-6.jpg";
import { listPublishedProducts, type PublicProduct } from "@/lib/products.functions";
import { listPublishedPosts, type PublicPost } from "@/lib/blog.functions";
import { getHomepage, listCollections, listPublishedRecipes } from "@/lib/library/library.functions";
import type { Collection, HomepageSection, Recipe } from "@/lib/library/types";
import { trackAffiliateClick } from "@/lib/affiliates.functions";

type LoaderData = {
  sections: HomepageSection[];
  settings: Record<string, any>;
  products: PublicProduct[];
  collections: Collection[];
  recipes: Recipe[];
  posts: PublicPost[];
};

const FALLBACK_SECTIONS: HomepageSection[] = [
  { id: "fallback-hero", kind: "hero", title: null, subtitle: "Simple plant-based meals. Powerful nutrition.", config: {}, sort_order: 0, enabled: true },
  { id: "fallback-recipes", kind: "featured_collections", title: "Recipes to cook this week", subtitle: "Plant-forward plates, photographed and tested in our kitchen.", config: {}, sort_order: 1, enabled: true },
  { id: "fallback-products", kind: "featured_products", title: "Cookbooks for the intentional kitchen", subtitle: "Thoughtful digital guides for simple, nourishing meals.", config: {}, sort_order: 2, enabled: true },
  { id: "fallback-blog", kind: "latest_blogs", title: "From the kitchen", subtitle: "A slow read on plant-based cooking and gentle kitchen rituals.", config: {}, sort_order: 3, enabled: true },
  { id: "fallback-newsletter", kind: "newsletter", title: "Join the table", subtitle: "Get the free recipe guide and a little more ease in your inbox.", config: {}, sort_order: 4, enabled: true },
];




export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async (): Promise<LoaderData> => {
    const [home, products, collections, recipes, posts] = await Promise.allSettled([
      getHomepage(), listPublishedProducts({ data: {} }), listCollections({ data: { featuredOnly: true } }),
      listPublishedRecipes({ data: { limit: 6 } }), listPublishedPosts(),
    ]).then((results) => [
      results[0].status === "fulfilled" ? results[0].value : { sections: [], settings: {} },
      results[1].status === "fulfilled" ? results[1].value : [],
      results[2].status === "fulfilled" ? results[2].value : [],
      results[3].status === "fulfilled" ? results[3].value : [],
      results[4].status === "fulfilled" ? results[4].value : [],
    ] as const);
    return {
      sections: home.sections.length ? home.sections : FALLBACK_SECTIONS,
      settings: home.settings,
      products: products.length ? products : FALLBACK_PRODUCTS,
      collections,
      recipes: recipes.length ? recipes : FALLBACK_RECIPES,
      posts: posts.length ? posts : FALLBACK_POSTS,
    };
  },
  head: () => pageHead("/", "PlantedAndSimple | High-Protein Plant-Based Recipes & Cookbooks", "Simple Plant-Based Meals. Powerful Nutrition. Explore vegan recipes, digital cookbooks, meal planning guides and our interactive Meal Prep System."),
});

const ICONS: Record<string, string> = {
  zap: "M13 2L3 14h8l-1 8 10-12h-8l1-8z",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  lock: "M6 10V7a6 6 0 1112 0v3M5 10h14v11H5z",
  leaf: "M4 20c8 2 16-4 16-16-8 0-16 4-16 16zM4 20c2-6 6-9 10-11",
  refresh: "M4 12a8 8 0 0113-6m3 6a8 8 0 01-13 6M17 6h4V2M7 18H3v4",
  book: "M4 4h11a4 4 0 014 4v12H8a4 4 0 01-4-4V4z",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  heart: "M12 20s-7-4.6-7-9.5A4 4 0 0112 7a4 4 0 017 3.5C19 15.4 12 20 12 20z",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d={ICONS[name] ?? ICONS["sparkles"]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomePage() {
  const data = Route.useLoaderData() as LoaderData;

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      localStorage.setItem("ps_ref", ref);
      trackAffiliateClick({ data: { code: ref } }).catch(() => {});
    }
  }, []);

  // Conversion order: hero → trust → free-cookbook capture → products → everything else.
  const products = data.sections.filter((s) => s.kind === "featured_products");
  const rest = data.sections.filter((s) => s.kind !== "featured_products");
  const anchor = rest.findIndex((s) => s.kind === "trust_row");
  const insertAt = anchor >= 0 ? anchor + 1 : rest.findIndex((s) => s.kind === "hero") + 1;

  return (
    <SiteLayout>
      <main>
        {rest.slice(0, insertAt).map((section) => (
          <Section key={section.id} section={section} data={data} />
        ))}
        <FreeCookbookStrip />
        {products.map((section) => (
          <Section key={section.id} section={section} data={data} />
        ))}
        {rest.slice(insertAt).map((section) => (
          <Section key={section.id} section={section} data={data} />
        ))}
      </main>
    </SiteLayout>
  );
}

function FreeCookbookStrip() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 255) {
      setErr("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await subscribeFreeGuide({ data: { email: clean, source: "homepage_inline" } });
      void trackEvent("free_cookbook_signup", { metadata: { source: "homepage_inline" } });
      await navigate({ to: "/free-cookbook" });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="free-cookbook" className="px-6 py-14">
      <div className="mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-[2rem] border border-forest/10 bg-white p-6 shadow-[var(--shadow-soft)] md:grid-cols-[220px_1fr] md:p-10">
        <img
          src={cookbookMockup}
          alt="Free 20-Minute Plant Protein Kitchen cookbook"
          loading="lazy"
          className="mx-auto aspect-square w-40 rounded-2xl object-cover md:w-full"
        />
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-sage">Not ready to buy? Start free</p>
          <h2 className="mt-2 font-display text-3xl italic leading-tight text-forest-deep md:text-4xl">
            Get our free plant-protein cookbook
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
            Quick, tested plant-based recipes you can cook tonight — free PDF, instant download.
          </p>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="flex-1 rounded-full border border-forest/15 bg-cream px-5 py-3.5 text-sm focus:border-forest focus:outline-none"
            />
            <button
              disabled={busy}
              className="rounded-full bg-forest px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "Sending…" : "Get it free →"}
            </button>
          </form>
          {err ? <p className="mt-2 text-sm text-destructive">{err}</p> : null}
          <p className="mt-2 text-xs text-charcoal/45">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}

function Section({ section, data }: { section: HomepageSection; data: LoaderData }) {
  switch (section.kind) {
    case "hero":
      return <HeroSection section={section} />;
    case "trust_row":
      return <TrustRow items={data.settings["trust_badges"]?.items ?? []} />;
    case "featured_collections":
      // Collections shelf replaced by a photography-led recipe card grid.
      return <RecipesSection section={section} recipes={data.recipes} variant="feature" />;
    case "featured_products":
      return <ProductsSection section={section} products={data.products} />;
    case "latest_recipes":
      return <RecipesSection section={section} recipes={data.recipes.slice(6)} />;
    case "latest_blogs":
      return <BlogsSection section={section} posts={data.posts} />;
    case "why_choose":
      return <WhyChoose section={section} items={data.settings["why_choose"]?.items ?? []} />;
    case "newsletter":
      return <Newsletter section={section} />;
    default:
      return null;
  }
}

function HeroSection({ section }: { section: HomepageSection }) {
  const c = section.config ?? {};
  const heroImages = [c["image_url"] || heroEditorial, heroRotation2, heroRotation4, heroRotation5, heroRotation6];
  const words = ["Confidently", "Creatively", "Simply", "Beautifully"];
  const [heroIndex, setHeroIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    setHeroIndex(bytes[0] % heroImages.length);
    const timer = window.setInterval(() => setWordIndex((current) => (current + 1) % words.length), 2800);
    return () => window.clearInterval(timer);
  }, [heroImages.length, words.length]);

  return (
    <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden">
      <img
        src={heroImages[heroIndex]}
        alt="A plant-based meal styled on a warm linen table"
        width={1200}
        height={1600}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-charcoal/80 via-charcoal/48 to-charcoal/15" />
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col items-start justify-end px-6 pb-20 pt-32 text-left md:justify-center md:pb-16">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-cream/70">
            Simple plant-based meals · powerful nutrition
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.96] text-cream md:text-7xl lg:text-[5.5rem]">
            Eat Beautifully.<br />
            Cook <span key={wordIndex} className="inline-block italic text-sage-soft animate-ticker-in">{words[wordIndex]}.</span>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-cream/80 md:text-lg">{section.subtitle}</p>
        </Reveal>
        <Reveal delay={360}>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row">
            <Link
              to={(c["secondary_cta_href"] as string) ?? "/free"}
              className="rounded-full bg-cream px-9 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-forest-deep transition hover:bg-white"
            >
              {c["secondary_cta_label"] ?? "Download Free Recipe Book"}
            </Link>
            <Link
              to={(c["primary_cta_href"] as string) ?? "/shop"}
              className="rounded-full border border-cream/40 px-9 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition hover:bg-cream/10"
            >
              {c["primary_cta_label"] ?? "Browse Cookbooks"}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TrustRow({ items }: { items: Array<{ icon: string; label: string }> }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-forest/10 bg-cream-warm px-6 py-7">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {items.map((it) => (
          <div key={it.label} className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/60">
            <Icon name={it.icon} className="h-4 w-4 shrink-0 text-forest" />
            <span className="truncate">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductsSection({ section, products }: { section: HomepageSection; products: PublicProduct[] }) {
  if (!products.length) return null;
  const limit = Number(section.config?.["limit"] ?? 3);
  const flagship = products.find((p) => p.slug === FLAGSHIP_SLUG);
  const rest = products.filter((p) => p.slug !== FLAGSHIP_SLUG && p.slug !== "meal-prep-system" && p.slug !== "planning-kit");
  return (
    <section className="bg-cream-warm px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeader
            eyebrow="The Shop"
            title={section.title ?? "Featured Cookbooks"}
            subtitle={section.subtitle}
            align="left"
            action={
              <Link to="/shop" className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest hover:underline">
                View all
              </Link>
            }
          />
        </Reveal>
        {flagship ? (
          <Reveal>
            <FlagshipWithCompanions product={flagship} />
          </Reveal>
        ) : null}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, limit).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <Link
                to="/shop/$slug"
                params={{ slug: p.slug }}
                className="group block overflow-hidden rounded-[1.75rem] border border-forest/10 bg-white shadow-[var(--shadow-soft)] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <MediaImage src={p.cover_image_url} alt={p.title} ratio="aspect-[4/5]" />
                <div className="p-6">
                  {p.is_bestseller ? (
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-sage">Bestseller</p>
                  ) : null}
                  <h3 className="mt-2 font-display text-2xl italic text-forest-deep">{p.title}</h3>
                  {p.subtitle ? <p className="mt-2 text-sm text-charcoal/55">{p.subtitle}</p> : null}
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-forest-deep">${p.price_display}</span>
                    {p.compare_at_cents > p.price_cents ? (
                      <span className="text-sm text-charcoal/40 line-through">${p.compare_at_display}</span>
                    ) : null}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecipesSection({
  section,
  recipes,
  variant = "latest",
}: {
  section: HomepageSection;
  recipes: Recipe[];
  variant?: "latest" | "feature";
}) {
  if (!recipes.length) return null;
  const isFeature = variant === "feature";
  const limit = isFeature ? 6 : Number(section.config?.["limit"] ?? 3);
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <SectionHeader
          eyebrow="Recipes"
          title={isFeature ? "Recipes To Cook This Week" : (section.title ?? "Fresh From The Kitchen")}
          subtitle={isFeature ? (section.subtitle ?? "Plant-forward plates, photographed and tested in our kitchen.") : section.subtitle}
          align={isFeature ? "center" : "left"}
          action={
            <Link to="/recipes" className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest hover:underline">
              All recipes
            </Link>
          }
        />
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {recipes.slice(0, limit).map((r, i) => (
          <Reveal key={r.id} delay={i * 80}>
            <EditorialCard
              to="/recipes/$slug"
              params={{ slug: r.slug }}
              image={r.hero_image_url}
              alt={r.title}
              eyebrow={r.difficulty}
              title={r.title}
              meta={
                [r.prep_minutes ? `${r.prep_minutes} min prep` : null, r.servings ? `Serves ${r.servings}` : null]
                  .filter(Boolean)
                  .join(" · ") || r.subtitle
              }
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BlogsSection({ section, posts }: { section: HomepageSection; posts: PublicPost[] }) {
  if (!posts.length) return null;
  const limit = Number(section.config?.["limit"] ?? 3);
  return (
    <section className="bg-cream-warm px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeader
            eyebrow="The Blog"
            title={section.title ?? "From The Blog"}
            subtitle={section.subtitle}
            align="left"
            action={
              <Link to="/blog" className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest hover:underline">
                Read more
              </Link>
            }
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {posts.slice(0, limit).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <EditorialCard
                to="/blog/$slug"
                params={{ slug: p.slug }}
                image={p.featured_image_url}
                alt={p.title}
                eyebrow={p.category}
                title={p.title}
                meta={p.excerpt}
                ratio="aspect-[3/2]"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose({ section, items }: { section: HomepageSection; items: Array<{ icon: string; title: string; body: string }> }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <SectionHeader eyebrow="Why us" title={section.title ?? "Why PrimeDownloads"} subtitle={section.subtitle} />
      </Reveal>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 80}>
            <div className="rounded-[1.75rem] border border-forest/10 bg-white p-8 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-cream-warm text-forest">
                <Icon name={it.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl italic text-forest-deep">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/60">{it.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ section }: { section: HomepageSection }) {
  return (
    <section className="px-6 pb-28">
      <Reveal>
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-forest px-8 py-16 text-center text-cream md:px-16">
          <h2 className="font-display text-4xl italic md:text-5xl">{section.title ?? "Join the table"}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cream/75">{section.subtitle}</p>
          <Link
            to="/free"
            className="mt-8 inline-flex rounded-full bg-cream px-9 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-forest-deep transition hover:bg-white"
          >
            Get the free recipe guide
          </Link>
        </div>
      </Reveal>
    </section>
  );
}