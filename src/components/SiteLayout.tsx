import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/recipes", label: "Recipe Library" },
  { to: "/blog", label: "Blog" },
  { to: "/free", label: "Free Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 border-b border-forest/10 bg-cream/85 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
        <Link to="/" className="truncate font-display text-2xl italic text-forest-deep">
          Planted<span className="text-sage">&amp;</span>Simple
        </Link>
        <div className="hidden justify-center gap-8 text-[11px] font-semibold uppercase tracking-[0.2em] lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to as any}
              activeProps={{ className: "text-forest" }}
              className="text-charcoal/70 transition-colors hover:text-forest"
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
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
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to as any}
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
  return (
    <footer className="bg-charcoal px-6 py-20 text-cream/70">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-6 font-display text-3xl italic text-cream">
              Planted<span className="text-sage">&amp;</span>Simple
            </div>
            <p className="max-w-sm text-sm leading-relaxed">
              We believe in the power of plants and the beauty of simplicity. Our digital guides make thoughtful plant-based cooking accessible to everyone.
            </p>
          </div>
          <div>
            <h5 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-cream">Explore</h5>
            <ul className="space-y-3 text-sm">
              <li><Link to="/shop" className="hover:text-cream">The Shop</Link></li>
              <li><Link to="/recipes" className="hover:text-cream">Recipe Library</Link></li>
              <li><Link to="/blog" className="hover:text-cream">The Journal</Link></li>
              <li><Link to="/free" className="hover:text-cream">Free Resources</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-cream">Community</h5>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-cream">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-cream">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-cream">Privacy</Link></li>
              <li><Link to="/refund" className="hover:text-cream">Refund</Link></li>
            </ul>
          </div>
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