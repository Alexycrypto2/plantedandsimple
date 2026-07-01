import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="font-display text-2xl font-bold italic text-forest"
        >
          Planted<span className="text-sage">&amp;</span>Simple
        </Link>
        <Link
          to="/"
          className="font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/60 hover:text-forest"
        >
          ← Home
        </Link>
      </nav>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
          {updated}
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-forest-deep sm:text-5xl">
          {title}
        </h1>
        <div className="prose prose-neutral mt-10 max-w-none text-charcoal/85 [&_a]:font-semibold [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-display [&_h2]:italic [&_h2]:text-forest-deep [&_h2]:mt-10 [&_h2]:text-2xl [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2">
          {children}
        </div>
      </main>
    </div>
  );
}

export function BackLink() {
  return (
    <p className="mt-12">
      <Link
        to="/"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/50 hover:text-forest"
      >
        ← Back to home
      </Link>
    </p>
  );
}