import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => pageHead("/contact", "Contact PlantedAndSimple | Cookbook & Order Support", "Contact PlantedAndSimple with questions about our digital cookbooks, plant-based recipes, meal planning tools or your order."),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-sage">Say hello</p>
        <h1 className="mt-3 font-display text-5xl italic text-forest-deep md:text-6xl">Contact</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-charcoal/70">
          Questions about a cookbook, an order, or a recipe? Send us a note — we reply within one business day.
        </p>
        {sent ? (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-forest/20 bg-cream-warm p-8">
            <p className="font-display text-2xl italic text-forest-deep">Message received.</p>
            <p className="mt-2 text-sm text-charcoal/70">Thanks — we'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mx-auto mt-12 grid max-w-xl gap-4 text-left">
            <input required placeholder="Your name" className="rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            <input required type="email" placeholder="Email address" className="rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            <textarea required rows={6} placeholder="Your message" className="rounded-3xl border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            <button className="justify-self-start rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">
              Send message
            </button>
          </form>
        )}
        <p className="mt-10 text-sm text-charcoal/60">
          Or email us at <a href="mailto:hello@primedownloads.store" className="text-forest underline">hello@primedownloads.store</a>
        </p>
      </section>
    </SiteLayout>
  );
}