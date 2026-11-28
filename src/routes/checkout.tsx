import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment, redirectOnPaddleComplete } from "@/lib/paddle";
import { trackEvent } from "@/lib/analytics";
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { listPublishedProducts } from '@/lib/products.functions';
import { preparePackageCheckout } from '@/lib/payments.functions';
import { PACKAGES, type PackageId } from '@/lib/bundle-offers';
import { CheckoutOrder } from '@/components/site/CheckoutOrder';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, LockKeyhole } from 'lucide-react';

const checkoutCatalog = queryOptions({ queryKey: ['checkout-catalog'], queryFn: () => listPublishedProducts({ data: {} }) });

type Search = { price?: string; slug?: string; ref?: string };

export const Route = createFileRoute("/checkout")({
  loader: ({ context }) => context.queryClient.ensureQueryData(checkoutCatalog),
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
  const { data: catalog } = useSuspenseQuery(checkoutCatalog);
  const base = PACKAGES.find(p => p.priceId === price || p.slug === slug);
  const [selected, setSelected] = useState<PackageId[]>(base ? [base.id] : []);
  const [recovery, setRecovery] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const recoveryShown = useRef(false);
  const prices: Partial<Record<PackageId, number>> = {};
  for (const p of PACKAGES) { const row = catalog.find(row => row.slug === p.slug); if (row) prices[p.id] = row.price_cents; }
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string>("");
  const [attempt, setAttempt] = useState(0);
  const opened = useRef(false);

  useEffect(() => {
    const leaving = (event: MouseEvent) => {
      if (event.clientY > 8 || event.relatedTarget || recoveryShown.current || !base) return;
      recoveryShown.current = true; setRecoveryOpen(true);
    };
    document.addEventListener('mouseout', leaving);
    return () => document.removeEventListener('mouseout', leaving);
  }, [base]);

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
        if (base && selected.length) {
          const quote = await preparePackageCheckout({ data: { products: selected, recovery, environment: getPaddleEnvironment() } });
          paddlePriceId = quote.priceId;
        } else paddlePriceId = await getPaddlePriceId(price);
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
        window.Paddle.Checkout.close();
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customData: {
            environment: getPaddleEnvironment(),
            ...(slug ? { productSlug: selected.length > 1 ? 'bundle' : slug } : {}),
            ...(ref ? { ref } : {}),
          },
          settings: {
            displayMode: "inline",
            frameTarget: "paddle-checkout-frame",  // Paddle matches on class name
            frameInitialHeight: 480,
            frameStyle: "width:100%; min-width:312px; background-color:transparent; border:none;",
            theme: "light",
            locale: "en",
            successUrl: `${window.location.origin}/thank-you`,
            allowLogout: false,
          },
          eventCallback: redirectOnPaddleComplete,
        });
        setPhase("ready");
        void trackEvent("checkout_start", { refSlug: slug ?? null, metadata: { price, surface: "checkout_page" } });
      } catch (err) {
        if (cancelled) return;
        console.error("[checkout] Paddle.Checkout.open failed", err);
        setPhase("error");
        setMessage("The payment window didn't open. Please try again, or contact support if it keeps happening.");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [price, slug, ref, attempt, selected, recovery]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-sage">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl italic text-forest-deep">Complete your order</h1>
        <p className="mt-3 text-sm text-charcoal/60">
          Payments are processed securely by our payment provider. Your download unlocks instantly after payment.
        </p>

        {base && <CheckoutOrder selected={selected} prices={prices} onChange={setSelected} recovery={recovery} />}
        {recoveryOpen && <div role="dialog" aria-label="Complete bundle offer" className="mt-5 rounded-lg border border-border bg-muted p-5">
          <h2 className="font-display text-2xl text-foreground">Before you go</h2>
          <p className="mt-2 text-muted-foreground">Take an extra $3 off the complete bundle — all three packages for $27.99 before applicable tax.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => { setRecovery(true); setSelected(['cookbook', 'prep', 'kit']); setRecoveryOpen(false); }}>Apply $3 bundle offer</Button><Button variant="ghost" onClick={() => setRecoveryOpen(false)}>No thanks</Button></div>
        </div>}

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
          <div className="mt-8 border-t border-border pt-5">
            {phase === "loading" && (
              <div className="grid place-items-center gap-3 py-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
                <p className="text-sm text-charcoal/60">Opening secure checkout…</p>
              </div>
            )}
            <div className="paddle-checkout-frame" />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-charcoal/50">
          60-day money-back guarantee · Instant digital delivery ·{" "}
          <Link to="/refund" className="underline underline-offset-2 hover:text-forest">Refund policy</Link>
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="size-4" />60-day guarantee</span><span className="flex items-center gap-2"><Download className="size-4" />Instant digital delivery</span><span className="flex items-center gap-2"><LockKeyhole className="size-4" />Secure payment</span></div>
        {base && <div className="mt-6 text-center"><Button variant="ghost" onClick={() => { recoveryShown.current = true; setRecoveryOpen(true); }}>Continue shopping</Button></div>}
      </section>
    </SiteLayout>
  );
}
