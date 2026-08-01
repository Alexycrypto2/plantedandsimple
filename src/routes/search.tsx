import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { MediaImage } from "@/components/site/primitives";
import { searchLibrary } from "@/lib/library/library.functions";
import type { SearchHit } from "@/lib/library/types";

const ROUTE_FOR: Record<string, string> = {
  recipe: "/recipes/$slug",
  blog: "/blog/$slug",
  product: "/shop/$slug",
  collection: "/collections/$slug",
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }): Promise<SearchHit[]> => (deps.q ? searchLibrary({ data: { q: deps.q } }) : []),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search — PlantedAndSimple" },
      { name: "description", content: "Search recipes, cookbooks, guides and journal articles across the PlantedAndSimple library." },
      { property: "og:title", content: "Search — PlantedAndSimple" },
      { property: "og:description", content: "Find recipes, cookbooks and guides in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SearchPage() {
  const hits = Route.useLoaderData() as SearchHit[];
  const { q } = Route.useSearch();

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">Search</p>
        <h1 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">
          {q ? `Results for “${q}”` : "Search the library"}
        </h1>

        {q && !hits.length ? (
          <p className="mt-8 text-charcoal/60">Nothing matched that yet. Try a broader word like “protein” or “breakfast”.</p>
        ) : null}

        <div className="mt-10 grid gap-4">
          {hits.map((h) => (
            <Link
              key={`${h.type}-${h.id}`}
              to={ROUTE_FOR[h.type] as any}
              params={{ slug: h.slug } as any}
              className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 rounded-[1.5rem] border border-forest/10 bg-white p-4 transition hover:shadow-[var(--shadow-card)]"
            >
              <MediaImage src={h.image_url} alt={h.title} ratio="aspect-square" className="w-20 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sage">{h.type}</p>
                <h2 className="truncate font-display text-2xl italic text-forest-deep">{h.title}</h2>
                {h.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-charcoal/60">{h.excerpt}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}