import { createServerFn } from "@tanstack/react-start";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult =
  | { clientSecret: string }
  | { error: string };

export const createCookbookCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      priceId: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) {
        throw new Error("Invalid priceId");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({
        lookup_keys: [data.priceId],
      });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];

      const productId =
        typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        payment_intent_data: { description: product.name },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type VerifyResult =
  | { paid: true; email: string | null }
  | { paid: false; reason: string };

export const verifyCookbookPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { sessionId: string; environment: StripeEnv }) => {
      if (!/^[a-zA-Z0-9_]+$/.test(data.sessionId)) {
        throw new Error("Invalid sessionId");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<VerifyResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);

      if (session.payment_status !== "paid") {
        return { paid: false, reason: "Payment not completed yet." };
      }

      const email = session.customer_details?.email ?? null;

      // Capture the buyer's email so we can email them about future
      // products. Idempotent — safe if the page is refreshed.
      if (email) {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          await supabaseAdmin
            .from("subscribers")
            .upsert(
              {
                email: email.toLowerCase(),
                source: "cookbook_purchase",
                stripe_session_id: data.sessionId,
              },
              { onConflict: "email", ignoreDuplicates: true },
            );
          await supabaseAdmin.from("cookbook_downloads").upsert(
            {
              stripe_session_id: data.sessionId,
              email,
            },
            { onConflict: "stripe_session_id", ignoreDuplicates: true },
          );
        } catch {
          // Non-fatal — the order is still valid.
        }
      }

      return { paid: true, email };
    } catch (error) {
      return { paid: false, reason: getStripeErrorMessage(error) };
    }
  });
