import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { getSiteSettings } from "@/lib/library/library.functions";
import { DEFAULT_NAV } from "@/lib/library/types";
import { usePageTracking } from "@/hooks/usePageTracking";

type NavItem = { label: string; href: string };
type FooterColumn = { title: string; links: NavItem[] };

function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data } = useSiteSettings();
  const items: NavItem[] = data?.["nav"]?.items ?? DEFAULT_NAV;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: term } });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-forest/10 bg-cream/85 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
        <Link to="/" className="truncate font-display text-2xl italic text-forest-deep">
          Planted<span className="text-sage">&amp;</span>Simple
        </Link>
        <div className="hidden justify-center gap-8 text-[11px] font-semibold uppercase tracking-[0.2em] lg:flex">
          {items.map((n) => (
            <Link
              key={n.href}
              to={n.href as any}
              activeProps={{ className: "text-forest" }}
              className="text-charcoal/70 transition-colors hover:text-forest"
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search the library"
              className="w-32 rounded-full border border-forest/15 bg-white/70 px-4 py-2 text-xs text-charcoal placeholder:text-charcoal/40 transition-all focus:w-48 focus:border-forest focus:outline-none"
            />
          </form>
          <Link
            to="/auth"
            className="hidden rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-charcoal/70 transition hover:border-forest hover:text-forest sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-forest/20 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 grid gap-1 border-t border-forest/10 pt-4 lg:hidden">
          <form onSubmit={submitSearch} className="px-1 pb-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes, cookbooks, guides"
              aria-label="Search the library"
              className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
            />
          </form>
          {items.map((n) => (
            <Link
              key={n.href}
              to={n.href as any}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/80 hover:bg-cream-warm"
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export function SiteFooter() {
  const { data } = useSiteSettings();
  const footer = data?.["footer"] ?? null;
  const columns: FooterColumn[] = footer?.columns ?? [
    { title: "Explore", links: [{ label: "The Shop", href: "/shop" }, { label: "Recipes", href: "/recipes" }, { label: "Blog", href: "/blog" }, { label: "Free Resources", href: "/free" }] },
    { title: "Community", links: [{ label: "About", href: "/about" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }, { label: "Refund", href: "/refund" }] },
  ];
  return (
    <footer className="bg-charcoal px-6 py-20 text-cream/70">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-6 font-display text-3xl italic text-cream">
              Planted<span className="text-sage">&amp;</span>Simple
            </div>
            <p className="max-w-sm text-sm leading-relaxed">
              {footer?.tagline ??
                "We believe in the power of plants and the beauty of simplicity. Our digital guides make thoughtful plant-based cooking accessible to everyone."}
            </p>
            {footer?.socials?.length ? (
              <div className="mt-6 flex gap-5 text-[10px] font-bold uppercase tracking-[0.22em]">
                {footer.socials.map((s: NavItem) => (
                  <a key={s.href} href={s.href} className="hover:text-cream" rel="noreferrer" target="_blank">
                    {s.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {columns.slice(0, 2).map((col) => (
            <div key={col.title}>
              <h5 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-cream">{col.title}</h5>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href as any} className="hover:text-cream">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-[10px] uppercase tracking-[0.25em] md:flex-row">
          <p>© {new Date().getFullYear()} PlantedAndSimple. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-cream">Privacy</Link>
            <Link to="/terms" className="hover:text-cream">Terms</Link>
            <Link to="/refund" className="hover:text-cream">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  usePageTracking();
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal antialiased">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}

export function PagePlaceholder({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-display text-5xl italic leading-tight text-forest-deep md:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-charcoal/70">
        {intro}
      </p>
      {children}
    </section>
  );
}