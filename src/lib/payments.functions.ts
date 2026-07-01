import { createServerFn } from "@tanstack/react-start";
import {
  gatewayFetch,
  type PaddleEnv,
} from "@/lib/paddle.server";

/**
 * Resolve a human-readable price ID (e.g. "high_protein_cookbook_onetime")
 * to a Paddle internal price ID (pri_...). Required by Paddle.Checkout.open().
 */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) {
      throw new Error("Invalid priceId");
    }
    return data;
  })
  .handler(async ({ data }): Promise<string> => {
    const res = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const json = await res.json();
    if (!json?.data?.length) throw new Error("Price not found");
    return json.data[0].id as string;
  });

type VerifyResult =
  | { paid: true; email: string | null }
  | { paid: false; reason: string };

/**
 * Verify a Paddle transaction is completed/paid before releasing content.
 * Also captures the buyer email into `subscribers` for future marketing.
 */
export const verifyCookbookPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { transactionId: string; environment: PaddleEnv }) => {
      if (!/^[a-zA-Z0-9_]+$/.test(data.transactionId)) {
        throw new Error("Invalid transactionId");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<VerifyResult> => {
    try {
      const res = await gatewayFetch(
        data.environment,
        `/transactions/${encodeURIComponent(data.transactionId)}?include=customer`,
      );
      if (!res.ok) {
        return {
          paid: false,
          reason: `Could not verify transaction (${res.status})`,
        };
      }
      const json = await res.json();
      const status = json?.data?.status as string | undefined;
      // Paddle status values: draft, ready, billed, paid, completed, canceled, past_due
      if (status !== "completed" && status !== "paid" && status !== "billed") {
        return {
          paid: false,
          reason: `Payment status is "${status ?? "unknown"}".`,
        };
      }

      const email: string | null =
        json?.data?.customer?.email ?? null;

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
                stripe_session_id: data.transactionId,
              },
              { onConflict: "email", ignoreDuplicates: true },
            );
          await supabaseAdmin.from("cookbook_downloads").upsert(
            {
              stripe_session_id: data.transactionId,
              email,
            },
            {
              onConflict: "stripe_session_id",
              ignoreDuplicates: true,
            },
          );
        } catch {
          // Non-fatal — the order is still valid.
        }
      }

      return { paid: true, email };
    } catch (error) {
      return {
        paid: false,
        reason:
          error instanceof Error ? error.message : "Verification failed",
      };
    }
  });