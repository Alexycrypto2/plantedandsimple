export const SITE_URL = "https://www.plantedandsimple.store";
export const SITE_NAME = "PlantedAndSimple";

export function pageUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
}

export function plainDescription(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function pageHead(path: string, title: string, description: string, type = "website") {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: pageUrl(path) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: pageUrl(path) }],
  };
}

export function jsonLd(data: Record<string, unknown>) {
  return { type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function breadcrumbs(section: string, sectionPath: string, title: string, path: string) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: pageUrl("/") },
      { "@type": "ListItem", position: 2, name: section, item: pageUrl(sectionPath) },
      { "@type": "ListItem", position: 3, name: title, item: pageUrl(path) },
    ],
  });
}

export function productSchema(product: {
  title: string; description: string; slug: string; cover_image_url: string | null;
  price_cents: number; currency: string; paddle_price_external_id: string | null;
}) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: plainDescription(product.description),
    url: pageUrl(`/shop/${encodeURIComponent(product.slug)}`),
    image: product.cover_image_url?.startsWith("https://") ? product.cover_image_url : undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: product.paddle_price_external_id ? {
      "@type": "Offer",
      url: pageUrl(`/shop/${encodeURIComponent(product.slug)}`),
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: product.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
    } : undefined,
  });
}