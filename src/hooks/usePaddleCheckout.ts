import { useCallback, useRef, useState } from "react";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment } from "@/lib/paddle";

export type CheckoutError = { title: string; message: string; code: string };

const GENERIC: CheckoutError = {
  title: "Payment couldn't start",
  message:
    "Something prevented the checkout from opening. Try again, and if the problem continues, contact support.",
  code: "checkout_open_failed",
};

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);
  // Guards against double-clicks opening two checkouts (and two transactions).
  const inFlight = useRef(false);

  const openCheckout = useCallback(
    async (options: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      customData?: Record<string, string>;
      successUrl?: string;
    }) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        if (!options.priceId) {
          setError({
            title: "This product isn't ready for sale",
            message:
              "The product is missing its price configuration. Please contact support so we can finish setting it up.",
            code: "missing_price",
          });
          return;
        }

        await initializePaddle();

        let paddlePriceId: string;
        try {
          paddlePriceId = await getPaddlePriceId(options.priceId);
        } catch {
          setError({
            title: "Payment couldn't start",
            message:
              `We couldn't load the ${getPaddleEnvironment() === "sandbox" ? "test" : "live"} price for this product. Please try again in a moment or contact support.`,
            code: "price_lookup_failed",
          });
          return;
        }

        window.Paddle.Checkout.open({
          items: [
            { priceId: paddlePriceId, quantity: options.quantity ?? 1 },
          ],
          customer: options.customerEmail
            ? { email: options.customerEmail }
            : undefined,
          customData: {
            ...(options.customData ?? {}),
            environment: getPaddleEnvironment(),
          },
          settings: {
            displayMode: "overlay",
            theme: "light",
            variant: "one-page",
            locale: "en",
            successUrl:
              options.successUrl ||
              `${window.location.origin}/thank-you`,
            allowLogout: false,
          },
        });
      } catch {
        setError(GENERIC);
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [],
  );

  return { openCheckout, loading, error, clearError: () => setError(null) };
}