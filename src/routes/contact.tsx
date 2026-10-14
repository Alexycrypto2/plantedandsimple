import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { sendContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => pageHead("/contact", "Contact PlantedAndSimple | Cookbook & Order Support", "Contact PlantedAndSimple with questions about our digital cookbooks, plant-based recipes, meal planning tools or your order."),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = useServerFn(sendContactMessage);
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
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true); setErr(null);
              try {
                await send({ data: { name: String(f.get("name")), email: String(f.get("email")), message: String(f.get("message")) } });
                setSent(true);
              } catch (ex) {
                setErr(ex instanceof Error ? ex.message : "Something went wrong.");
              } finally { setBusy(false); }
            }}
            className="mx-auto mt-12 grid max-w-xl gap-4 text-left"
          >
            <input name="name" required maxLength={100} placeholder="Your name" className="rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            <input name="email" required maxLength={255} type="email" placeholder="Email address" className="rounded-full border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            <textarea name="message" required maxLength={5000} rows={6} placeholder="Your message" className="rounded-3xl border border-forest/15 bg-white px-6 py-4 text-sm focus:border-forest focus:outline-none" />
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            <button disabled={busy} className="justify-self-start rounded-full bg-forest px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep disabled:opacity-60">
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
        <p className="mt-10 text-sm text-charcoal/60">
          Or email us at <a href="mailto:support@plantedandsimple.com" className="text-forest underline">support@plantedandsimple.com</a>
        </p>
      </section>
    </SiteLayout>
  );
}