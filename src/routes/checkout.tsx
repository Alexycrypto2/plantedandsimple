import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment } from "@/lib/paddle";
import { trackEvent } from "@/lib/analytics";

type Search = { price?: string; slug?: string; ref?: string };

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    price: typeof search.price === "string" ? search.price : undefined,
    slug: typeof search.slug === "string" ? search.slug : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Secure checkout — PlantedAndSimple" },
      { name: "description", content: "Complete your PlantedAndSimple order on a secure checkout page. Instant download after payment." },
      { property: "og:title", content: "Secure checkout — PlantedAndSimple" },
      { property: "og:description", content: "Complete your PlantedAndSimple order on a secure checkout page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Phase = "loading" | "ready" | "error";

function CheckoutPage() {
  const { price, slug, ref } = Route.useSearch();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string>("");
  const [attempt, setAttempt] = useState(0);
  const opened = useRef(false);

  useEffect(() => {
    let cancelled = false;
    opened.current = false;
    setPhase("loading");
    setMessage("");

    async function run() {
      if (!price) {
        setPhase("error");
        setMessage("This product isn't ready for sale yet — its price hasn't been configured.");
        return;
      }
      try {
        await initializePaddle();
      } catch {
        if (cancelled) return;
        setPhase("error");
        setMessage("We couldn't load the secure payment window. Check your connection or disable any ad-blocker, then try again.");
        return;
      }

      let paddlePriceId: string;
      try {
        paddlePriceId = await getPaddlePriceId(price);
      } catch (err) {
        if (cancelled) return;
        setPhase("error");
        setMessage(
          err instanceof Error && err.message
            ? err.message
            : "We couldn't load the price for this product. Please try again shortly.",
        );
        return;
      }
      if (cancelled || opened.current) return;
      opened.current = true;

      try {
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customData: {
            environment: getPaddleEnvironment(),
            ...(slug ? { productSlug: slug } : {}),
            ...(ref ? { ref } : {}),
          },
          settings: {
            displayMode: "inline",
            frameTarget: "paddle-checkout-frame",
            frameInitialHeight: 480,
            frameStyle: "width:100%; min-width:312px; background-color:transparent; border:none;",
            theme: "light",
            locale: "en",
            successUrl: `${window.location.origin}/thank-you`,
            allowLogout: false,
          },
        });
        setPhase("ready");
        void trackEvent("checkout_start", { refSlug: slug ?? null, metadata: { price, surface: "checkout_page" } });
      } catch (err) {
        if (cancelled) return;
        console.error("[checkout] Paddle.Checkout.open failed", err);
        setPhase("error");
        setMessage(`The payment window didn't open. ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [price, slug, ref, attempt]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-sage">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl italic text-forest-deep">Complete your order</h1>
        <p className="mt-3 text-sm text-charcoal/60">
          Payments are processed securely by our payment provider. Your download unlocks instantly after payment.
        </p>

        {phase === "error" ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-display text-2xl italic text-red-900">Payment couldn't start</h2>
            <p className="mt-2 text-sm text-red-900/80">{message}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: slug ? "/shop/$slug" : "/shop", params: slug ? { slug } : undefined })}
                className="rounded-full border border-forest/20 px-6 py-3 text-sm font-semibold text-forest hover:bg-forest/5"
              >
                Back to product
              </button>
              <Link
                to="/contact"
                className="rounded-full px-4 py-3 text-sm font-semibold text-charcoal/60 underline underline-offset-4 hover:text-forest"
              >
                Contact support
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-forest/10 bg-white p-4 shadow-sm sm:p-6">
            {phase === "loading" && (
              <div className="grid place-items-center gap-3 py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
                <p className="text-sm text-charcoal/60">Opening secure checkout…</p>
              </div>
            )}
            <div id="paddle-checkout-frame" className={phase === "loading" ? "hidden" : ""} />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-charcoal/50">
          60-day money-back guarantee · Instant digital delivery ·{" "}
          <Link to="/refund" className="underline underline-offset-2 hover:text-forest">Refund policy</Link>
        </p>
      </section>
    </SiteLayout>
  );
}
