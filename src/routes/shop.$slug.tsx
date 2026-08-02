import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { trackEvent } from "@/lib/analytics";
import {
  getPublishedProductBySlug,
  listPublishedProducts,
  type PublicProduct,
} from "@/lib/products.functions";
import { SiteLayout } from "@/components/SiteLayout";
import peekCover from "@/assets/peek-cover.jpg.asset.json";
import peekRecipe from "@/assets/peek-recipe.jpg.asset.json";
import peekMealPlan from "@/assets/peek-meal-plan.jpg.asset.json";
import peekMealPrep from "@/assets/peek-meal-prep.jpg.asset.json";
import peekGrocery from "@/assets/peek-grocery.jpg.asset.json";
import peekSmoothies from "@/assets/peek-smoothies.jpg.asset.json";

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

function uniqueImages(product: PublicProduct): Array<{ url: string; label: string }> {
  const seen = new Set<string>();
  const images: Array<{ url: string; label: string }> = [];
  const add = (url: string | null | undefined, label: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ url, label });
  };
  add(product.cover_image_url, "Cookbook cover");
  product.gallery_urls.forEach((url, index) => add(url, `Preview ${index + 1}`));
  PREVIEWS.forEach((preview) => add(preview.url, preview.label));
  return images;
}

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }): Promise<{ product: PublicProduct; related: PublicProduct[] }> => {
    const product = await getPublishedProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    const all = await listPublishedProducts({ data: { limit: 6 } });
    const related = all.filter((p) => p.id !== product.id).slice(0, 3);
    return { product, related };
  },
  component: ProductDetail,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-sage">Product error</p>
          <h1 className="mt-2 font-display text-3xl italic text-forest-deep">We couldn't load this product</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/60">{error.message}</p>
          <Link to="/shop" className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream">Back to shop</Link>
        </div>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-sage">Not found</p>
          <h1 className="mt-2 font-display text-3xl italic text-forest-deep">This product is unavailable</h1>
          <Link to="/shop" className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream">Back to shop</Link>
        </div>
      </div>
    </SiteLayout>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product unavailable — PlantedAndSimple" },
          { name: "description", content: "This PlantedAndSimple product is currently unavailable." },
          { property: "og:title", content: "Product unavailable — PlantedAndSimple" },
          { property: "og:description", content: "This PlantedAndSimple product is currently unavailable." },
          { property: "og:type", content: "product" },
          { name: "twitter:card", content: "summary" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.product;
    const title = p.seo_title ?? `${p.title} — PlantedAndSimple`;
    const desc =
      p.seo_description ?? p.subtitle ?? p.description.slice(0, 160);
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (p.cover_image_url && p.cover_image_url.startsWith("http")) {
      meta.push({ property: "og:image", content: p.cover_image_url });
      meta.push({ name: "twitter:image", content: p.cover_image_url });
    }
    return { meta, links: [{ rel: "canonical", href: `/shop/${p.slug}` }] };
  },
});

const PREVIEWS = [
  { url: peekCover.url, label: "Cover" },
  { url: peekRecipe.url, label: "Recipe page" },
  { url: peekMealPlan.url, label: "Meal plan" },
  { url: peekMealPrep.url, label: "Meal prep" },
  { url: peekGrocery.url, label: "Grocery list" },
  { url: peekSmoothies.url, label: "Smoothies" },
];

const INCLUDED = [
  "30 high-protein plant-based recipes",
  "Full-color photography for every recipe",
  "7-day meal plan with grocery list",
  "Meal-prep timing guide",
  "Smoothie & breakfast bonus section",
  "Printable pantry essentials checklist",
];

const BENEFITS = [
  { title: "Feel energized every day", body: "Balanced macros and protein-forward meals that keep you full without crashing." },
  { title: "Cook in under 30 minutes", body: "Weeknight-friendly recipes that respect your time and your kitchen." },
  { title: "Save money on groceries", body: "One shopping list, five weekday meals, minimal waste." },
  { title: "Never wonder what's for dinner", body: "A ready-to-follow plan so healthy eating stops feeling like a chore." },
];

const FAQ = [
  { q: "Is this a physical book or digital?", a: "It's a beautifully designed PDF — instantly downloadable after checkout, readable on phone, tablet, or printable at home." },
  { q: "Do I need special ingredients?", a: "No. Every recipe uses whole, easy-to-find ingredients from your regular grocery store." },
  { q: "How much protein per meal?", a: "Every main is 20g+ of plant protein, engineered to keep you satisfied and support active bodies." },
  { q: "What if I don't love it?", a: "You're covered by our 60-day, no-questions-asked money-back guarantee. Cook the recipes — if you're not thrilled, we refund every cent." },
  { q: "Can I access it on my phone?", a: "Yes. The PDF opens on any device and looks stunning in the kitchen — no extra app needed." },
];

function ProductDetail() {
  const { product: p, related } = Route.useLoaderData() as {
    product: PublicProduct;
    related: PublicProduct[];
  };
  const { openCheckout, loading } = usePaddleCheckout();
  const gallery = uniqueImages(p);
  const included = p.features.length ? p.features : INCLUDED;
  const benefits = p.benefits.length
    ? p.benefits.map((body, index) => ({ title: `Benefit ${index + 1}`, body }))
    : BENEFITS;
  const [showSticky, setShowSticky] = useState(false);
  const [activeImg, setActiveImg] = useState<string>(
    gallery[0]?.url ?? PREVIEWS[0].url,
  );

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    void trackEvent("product_view", { refId: p.id, refSlug: p.slug });
  }, [p.id, p.slug]);

  const onBuy = () => {
    if (!p.paddle_price_external_id) return;
    const ref = getStoredAffiliateRef();
    void trackEvent("checkout_start", { refId: p.id, refSlug: p.slug, metadata: { cta: "product_page", price: p.price_cents } });
    openCheckout({
      priceId: p.paddle_price_external_id,
      quantity: 1,
      customData: ref ? { productSlug: p.slug, ref } : { productSlug: p.slug },
      successUrl: `${window.location.origin}/thank-you`,
    });
  };

  const save = p.compare_at_cents > p.price_cents
    ? ((p.compare_at_cents - p.price_cents) / 100).toFixed(2)
    : null;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16">
        <nav className="mb-8 text-[11px] font-semibold uppercase tracking-[0.25em] text-charcoal/50">
          <Link to="/" className="hover:text-forest">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-forest">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal/80">{p.title}</span>
        </nav>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-forest/10 bg-sage/10">
              {activeImg ? (
                <img src={activeImg} alt={p.title} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="grid aspect-[4/5] place-items-center text-7xl">📗</div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((item, i) => (
                <button
                  key={item.url + i}
                  type="button"
                  onClick={() => setActiveImg(item.url)}
                  className={`aspect-square overflow-hidden rounded-xl border transition ${activeImg === item.url ? "border-forest ring-2 ring-forest/30" : "border-forest/10 hover:border-forest/40"}`}
                >
                  <img src={item.url} alt={item.label} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            {p.category_name && (
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">{p.category_name}</p>
            )}
            <h1 className="mt-2 font-display text-4xl italic text-forest-deep sm:text-5xl">{p.title}</h1>
            {p.subtitle && <p className="mt-4 text-lg text-charcoal/70">{p.subtitle}</p>}

            <div className="mt-6 flex items-center gap-1 text-forest">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
              <span className="ml-2 text-xs font-semibold text-charcoal/60">Loved by 15,000+ home cooks</span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-forest-deep">${p.price_display}</span>
              {save && <span className="text-lg text-charcoal/40 line-through">${p.compare_at_display}</span>}
              {save && <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-forest">🔥 Save 50% – Limited Launch Offer</span>}
            </div>

            <button
              onClick={onBuy}
              disabled={loading || !p.paddle_price_external_id}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-forest px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-cream shadow-lg transition hover:bg-forest-deep disabled:opacity-60"
            >
              {loading ? "Opening checkout…" : `Get instant access — $${p.price_display}`}
            </button>

            <ul className="mt-6 space-y-2 text-sm text-charcoal/70">
              <li>✅ Instant PDF download after checkout</li>
              <li>✅ 60-day money-back guarantee</li>
              <li>✅ Secure checkout with card, Apple Pay, and more</li>
            </ul>

            {p.description && (
              <div className="mt-8 whitespace-pre-line border-t border-forest/10 pt-6 text-charcoal/80">
                {p.description}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Everything included */}
      <section className="bg-cream-warm/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">What's inside</p>
          <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">Everything included</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {included.map((it) => (
              <div key={it} className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-white p-5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-cream">✓</span>
                <p className="text-sm text-charcoal/80">{it}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview gallery */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Recipe highlights</p>
          <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">Take a peek inside</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.map((v) => (
              <figure key={v.url} className="overflow-hidden rounded-2xl bg-cream-warm">
                <img src={v.url} alt={v.label} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                <figcaption className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/60">{v.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Key benefits</p>
          <h2 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">What this cookbook does for you</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-3xl border border-forest/10 bg-cream-warm/30 p-8">
                <h3 className="font-display text-2xl italic text-forest-deep">{b.title}</h3>
                <p className="mt-2 text-sm text-charcoal/70">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-forest p-10 text-center text-cream md:p-16">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-cream/30 text-2xl">🛡️</div>
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-cream/70">Iron-clad promise</p>
          <h2 className="mt-3 font-display text-4xl italic md:text-5xl">60-Day Money-Back Guarantee</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/80">
            Download the cookbook, cook the recipes, live with it for two months. If you don't love it, email us for a full refund. No forms, no hoops. We'd rather have your trust than your money.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream-warm/40 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Questions</p>
          <h2 className="mt-3 text-center font-display text-4xl italic text-forest-deep md:text-5xl">Frequently asked</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-forest/10 bg-white p-6 open:shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-forest-deep">
                  {f.q}
                  <span className="ml-4 text-forest transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="font-display text-3xl italic text-forest-deep md:text-4xl">You may also love</h2>
              <Link to="/shop" className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest hover:underline">All cookbooks →</Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r: PublicProduct) => (
                <Link key={r.id} to="/shop/$slug" params={{ slug: r.slug }} className="group overflow-hidden rounded-2xl border border-forest/10 bg-white transition hover:-translate-y-1 hover:shadow-card">
                  <div className="aspect-[4/5] overflow-hidden bg-cream-warm">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : <div className="grid h-full place-items-center text-5xl">📗</div>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg italic text-forest-deep">{r.title}</h3>
                    <p className="mt-2 font-display text-xl text-forest-deep">${r.price_display}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Buy */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-cream/95 px-4 py-3 backdrop-blur transition-transform ${showSticky ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm italic text-forest-deep sm:text-base">{p.title}</p>
            <p className="text-xs text-charcoal/60">
              <span className="font-bold text-forest-deep">${p.price_display}</span>
              {save && <span className="ml-2 line-through">${p.compare_at_display}</span>}
            </p>
          </div>
          <button
            onClick={onBuy}
            disabled={loading || !p.paddle_price_external_id}
            className="shrink-0 rounded-full bg-forest px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream shadow-lg transition hover:bg-forest-deep disabled:opacity-60"
          >
            {loading ? "Opening…" : "Buy Now"}
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}