import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getPublishedProductBySlug, type PublicProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }): Promise<PublicProduct> => {
    const product = await getPublishedProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return product;
  },
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-sage">Not found</p>
        <h1 className="mt-2 font-display text-3xl italic text-forest-deep">
          This product is unavailable
        </h1>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream"
        >
          Back to shop
        </Link>
      </div>
    </div>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product unavailable — PlantedAndSimple" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData;
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

function ProductDetail() {
  const p = Route.useLoaderData() as PublicProduct;
  const { openCheckout, loading } = usePaddleCheckout();

  const onBuy = () => {
    if (!p.paddle_price_external_id) return;
    openCheckout({
      priceId: p.paddle_price_external_id,
      quantity: 1,
      customData: { productSlug: p.slug },
      successUrl: `${window.location.origin}/thank-you`,
    });
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <header className="border-b border-forest/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-bold italic text-forest">
            Planted<span className="text-sage">&amp;</span>Simple
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-charcoal/70">
            <Link to="/" className="hover:text-forest">Home</Link>
            <Link to="/shop" className="hover:text-forest">Shop</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-forest/10 bg-sage/10">
          {p.cover_image_url ? (
            <img
              src={p.cover_image_url}
              alt={p.title}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center text-7xl">📗</div>
          )}
        </div>
        <div>
          {p.category_name && (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
              {p.category_name}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl italic text-forest-deep sm:text-5xl">
            {p.title}
          </h1>
          {p.subtitle && (
            <p className="mt-3 text-lg text-charcoal/70">{p.subtitle}</p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-forest-deep">
              ${p.price_display}
            </span>
            {p.compare_at_cents > p.price_cents && (
              <span className="text-lg text-charcoal/40 line-through">
                ${p.compare_at_display}
              </span>
            )}
            {p.compare_at_cents > p.price_cents && (
              <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-forest">
                Save ${((p.compare_at_cents - p.price_cents) / 100).toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={onBuy}
            disabled={loading || !p.paddle_price_external_id}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-forest px-8 py-4 text-base font-semibold text-cream shadow-lg transition hover:bg-forest-deep disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Opening checkout…" : "Buy now — instant download"}
          </button>

          {p.description && (
            <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-charcoal/80">
              {p.description}
            </div>
          )}

          <ul className="mt-8 space-y-2 text-sm text-charcoal/70">
            <li>✅ Instant PDF download after checkout</li>
            <li>✅ 60-day money-back guarantee</li>
            <li>✅ Secure payment via Paddle</li>
          </ul>
        </div>
      </section>
    </div>
  );
}