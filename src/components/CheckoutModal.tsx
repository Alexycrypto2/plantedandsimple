import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCookbookCheckout } from "@/lib/payments.functions";
import { useCallback } from "react";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  priceId: string;
}

export function CheckoutModal({ open, onClose, priceId }: CheckoutModalProps) {
  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const result = await createCookbookCheckout({
      data: {
        priceId,
        returnUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No client secret");
    return result.clientSecret;
  }, [priceId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-forest-deep/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-2xl rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-cream text-forest ring-1 ring-forest/10 transition hover:bg-cream-warm"
        >
          ✕
        </button>
        <div className="p-2 sm:p-4">
          <EmbeddedCheckoutProvider
            stripe={getStripe()}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
