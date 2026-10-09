import { Link } from "@tanstack/react-router";
import { EditorialCard } from "@/components/site/primitives";
import type { PublicProduct } from "@/lib/products.functions";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import prepCover from "@/assets/prep-system-cover.jpg";
import planningKitPhoto from "@/assets/planning-kit-lifestyle.jpg";

export const FLAGSHIP_SLUG = "high-protein-cookbook";

/** Real mockup/lifestyle photography per product, overriding PDF page screenshots. */
export const PRODUCT_VISUALS: Record<string, string> = {
  [FLAGSHIP_SLUG]: cookbookMockup,
  "meal-prep-system": prepCover,
  "planning-kit": planningKitPhoto,
};

export function productImage(p: Pick<PublicProduct, "slug" | "cover_image_url">) {
  return PRODUCT_VISUALS[p.slug] ?? p.cover_image_url;
}

/** Companion products (upsell + downsell) that always sit beneath a main product. */
export const COMPANIONS = [
  { to: "/prep", image: prepCover, eyebrow: "Upgrade · Interactive app", title: "Meal Prep & Kitchen System", meta: "$27 · was $54" },
  { to: "/planning-kit", image: planningKitPhoto, eyebrow: "Printable · 12 pages", title: "Weekly Meal Planning Kit", meta: "$4.99 · was $14.99" },
] as const;

export function FlagshipWithCompanions({ product }: { product: PublicProduct }) {
  return (
    <div className="rounded-[2rem] border border-forest/10 bg-white p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="group grid items-center gap-6 md:grid-cols-2"
      >
        <div className="overflow-hidden rounded-2xl bg-sage/10">
          <img
            src={productImage(product)}
            alt={`${product.title} cookbook`}
            width={1280}
            height={1600}
            className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        <div className="px-1 pb-2">
          <p className="inline-block rounded-full bg-forest px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-cream">
            📌 Bestseller · Main cookbook
          </p>
          <h3 className="mt-4 font-display text-3xl italic leading-tight text-forest-deep sm:text-4xl">{product.title}</h3>
          {product.subtitle ? <p className="mt-3 text-charcoal/65">{product.subtitle}</p> : null}
          <ul className="mt-5 space-y-2 text-sm text-charcoal/75">
            <li>✓ 30 high-protein recipes, 20g+ protein each</li>
            <li>✓ 7-day meal plan & grocery list</li>
            <li>✓ Instant download · 60-day guarantee</li>
          </ul>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-forest-deep">${product.price_display}</span>
            {product.compare_at_cents > product.price_cents ? (
              <span className="text-sm text-charcoal/40 line-through">${product.compare_at_display}</span>
            ) : null}
          </p>
          <span className="mt-5 inline-block rounded-full bg-forest px-7 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream transition group-hover:bg-forest-deep">
            Get the cookbook →
          </span>
        </div>
      </Link>

      <div className="mt-8 border-t border-forest/10 pt-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-sage">Goes perfectly with</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-6">
          {COMPANIONS.map((c) => (
            <EditorialCard key={c.to} to={c.to} image={c.image} alt={c.title} eyebrow={c.eyebrow} title={c.title} meta={c.meta} />
          ))}
        </div>
      </div>
    </div>
  );
}
