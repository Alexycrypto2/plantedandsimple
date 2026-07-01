import { useCallback, useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCheckout = useCallback(
    async (options: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      customData?: Record<string, string>;
      successUrl?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(options.priceId);

        window.Paddle.Checkout.open({
          items: [
            { priceId: paddlePriceId, quantity: options.quantity ?? 1 },
          ],
          customer: options.customerEmail
            ? { email: options.customerEmail }
            : undefined,
          customData: options.customData,
          settings: {
            displayMode: "overlay",
            theme: "light",
            variant: "one-page",
            successUrl:
              options.successUrl ||
              `${window.location.origin}/thank-you`,
            allowLogout: false,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { openCheckout, loading, error };
}