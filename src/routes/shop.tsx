import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { listPublishedProducts, listCategories, type PublicProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  loader: async () => {
    const [products, categories] = await Promise.all([
      listPublishedProducts({ data: {} }),
      listCategories(),
    ]);
    return { products, categories };
  },
  head: () => ({
    meta: [
      { title: "Shop — Premium Plant-Based Cookbooks & Meal Plans | PlantedAndSimple" },
      {
        name: "description",
        content:
          "Browse premium digital cookbooks, meal plans, and recipe guides — instant PDF downloads made for healthy plant-based living.",
      },
      { property: "og:title", content: "Shop — PlantedAndSimple" },
      {
        property: "og:description",
        content: "Premium plant-based cookbooks, meal plans and recipe guides. Instant download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
});

function ShopPage() {
  const { products, categories } = Route.useLoaderData();
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc">("new");

  let filtered: PublicProduct[] = cat
    ? products.filter((p) => p.category_slug === cat)
    : products;

  filtered = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return a.price_cents - b.price_cents;
    if (sort === "price_desc") return b.price_cents - a.price_cents;
    return 0;
  });

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <header className="border-b border-forest/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-bold italic text-forest">
            Planted<span className="text-sage">&amp;</span>Simple
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-charcoal/70">
            <Link to="/" className="hover:text-forest">Home</Link>
            <Link to="/shop" className="text-forest">Shop</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          The Shop
        </p>
        <h1 className="mt-2 font-display text-4xl italic text-forest-deep sm:text-5xl">
          Premium plant-based digital products
        </h1>
        <p className="mt-3 max-w-2xl text-charcoal/70">
          Cookbooks, meal plans, and recipe guides — designed to make healthy eating simple. Instant PDF download after checkout.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
              !cat
                ? "border-forest bg-forest text-cream"
                : "border-forest/20 bg-white text-charcoal/70 hover:border-forest/40"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.slug)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                cat === c.slug
                  ? "border-forest bg-forest text-cream"
                  : "border-forest/20 bg-white text-charcoal/70 hover:border-forest/40"
              }`}
            >
              {c.name}
            </button>
          ))}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-full border border-forest/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-charcoal/70"
            >
              <option value="new">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-forest/10 bg-white p-12 text-center">
            <p className="font-display text-xl italic text-forest-deep">
              New products coming soon.
            </p>
            <p className="mt-2 text-sm text-charcoal/60">
              We're cooking up more premium guides. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ p }: { p: PublicProduct }) {
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-sage/10">
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-5xl">📗</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {p.category_name && (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-sage">
            {p.category_name}
          </p>
        )}
        <h3 className="mt-1 font-display text-lg italic text-forest-deep">{p.title}</h3>
        {p.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-charcoal/60">{p.subtitle}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-4">
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
          <span className="text-xs font-semibold text-forest group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}