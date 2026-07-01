import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import cookbookAsset from "@/assets/cookbook.pdf.asset.json";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";
import { verifyCookbookPayment } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/thank-you")({
  component: ThankYou,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id:
      typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thank you — Download your cookbook · PlantedAndSimple" },
      {
        name: "description",
        content:
          "Thanks for your order! Download your copy of 30 High-Protein Plant-Based Meals.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/thank-you" }],
  }),
});

type State =
  | { status: "checking" }
  | { status: "paid"; email: string | null }
  | { status: "unpaid"; reason: string }
  | { status: "no_session" };

function ThankYou() {
  const { session_id: sessionId } = Route.useSearch();
  const [state, setState] = useState<State>(
    sessionId ? { status: "checking" } : { status: "no_session" },
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyCookbookPayment({
          data: { sessionId, environment: getStripeEnvironment() },
        });
        if (cancelled) return;
        if (res.paid) {
          setState({ status: "paid", email: res.email });
        } else {
          setState({ status: "unpaid", reason: res.reason });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "unpaid",
          reason:
            err instanceof Error ? err.message : "Could not verify payment.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <a
          href="/"
          className="font-display text-2xl font-bold italic text-forest"
        >
          Planted<span className="text-sage">&amp;</span>Simple
        </a>
      </nav>

      <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
        <div className="rounded-[2.5rem] bg-white p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-forest/10 md:p-14">
          {state.status === "checking" && <CheckingView />}
          {state.status === "paid" && <PaidView email={state.email} />}
          {state.status === "unpaid" && <UnpaidView reason={state.reason} />}
          {state.status === "no_session" && <NoSessionView />}
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mx-auto grid size-14 place-items-center">
      <div className="size-10 animate-spin rounded-full border-4 border-sage/30 border-t-forest" />
    </div>
  );
}

function CheckingView() {
  return (
    <>
      <Spinner />
      <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
        Verifying payment
      </p>
      <h1 className="mt-3 font-display text-3xl italic text-forest-deep sm:text-4xl">
        Confirming your order…
      </h1>
      <p className="mx-auto mt-4 max-w-md text-charcoal/70">
        This only takes a second. Please don't close the tab.
      </p>
    </>
  );
}

function PaidView({ email }: { email: string | null }) {
  return (
    <>
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage/20 text-forest">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 fill-none stroke-forest stroke-[2.5]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5 9-11" />
        </svg>
      </div>
      <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
        Payment confirmed
      </p>
      <h1 className="mt-3 font-display text-4xl italic text-forest-deep sm:text-5xl">
        Thank you!
      </h1>
      <p className="mx-auto mt-4 max-w-md text-charcoal/70">
        Your copy of{" "}
        <strong className="text-charcoal">
          30 High-Protein Plant-Based Meals
        </strong>{" "}
        is ready.
        {email && (
          <>
            {" "}A receipt has been sent to{" "}
            <strong className="text-charcoal">{email}</strong>.
          </>
        )}
      </p>

      <img
        src={cookbookMockup}
        alt="Cookbook cover"
        width={800}
        height={1000}
        loading="lazy"
        className="mx-auto mt-10 w-48 rounded-2xl shadow-xl ring-1 ring-forest/10"
      />

      <a
        href={cookbookAsset.url}
        download
        className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-forest px-10 py-5 text-lg font-bold text-cream shadow-xl transition-all hover:-translate-y-0.5 hover:bg-forest-deep"
      >
        ⬇ Download Cookbook (PDF)
      </a>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-charcoal/50">
        Lifetime access · Save the file to your device
      </p>

      <div className="mt-12 rounded-2xl border border-sage/20 bg-cream/60 p-6 text-left">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          What's next
        </p>
        <ul className="mt-3 space-y-2 text-sm text-charcoal/75">
          <li>· Save the PDF to your phone, tablet, or Kindle.</li>
          <li>· Print any recipe you'd like to keep in the kitchen.</li>
          <li>
            · Pin your favorite recipes on{" "}
            <a
              href="https://pinterest.com"
              className="font-semibold text-forest underline underline-offset-4"
            >
              Pinterest
            </a>
            .
          </li>
        </ul>
      </div>

      <a
        href="/"
        className="mt-10 inline-block font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/50 hover:text-forest"
      >
        ← Back to home
      </a>
    </>
  );
}

function UnpaidView({ reason }: { reason: string }) {
  return (
    <>
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-red-700">
        !
      </div>
      <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-red-600">
        Payment not confirmed
      </p>
      <h1 className="mt-3 font-display text-3xl italic text-forest-deep sm:text-4xl">
        We couldn't verify your payment.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-charcoal/70">{reason}</p>
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-forest px-8 py-4 font-semibold text-cream shadow-lg hover:bg-forest-deep"
      >
        Back to checkout
      </a>
    </>
  );
}

function NoSessionView() {
  return (
    <>
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-cream-warm text-forest">
        🔒
      </div>
      <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
        Access restricted
      </p>
      <h1 className="mt-3 font-display text-3xl italic text-forest-deep sm:text-4xl">
        Purchase required
      </h1>
      <p className="mx-auto mt-4 max-w-md text-charcoal/70">
        The cookbook download is only available after purchase. Head back to
        the sales page to get your copy.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-forest px-8 py-4 font-semibold text-cream shadow-lg hover:bg-forest-deep"
      >
        Get the Cookbook — $9.99
      </a>
    </>
  );
}
