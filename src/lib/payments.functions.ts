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
        `/transactions/${encodeURIComponent(data.transactionId)}`,
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

      // Transactions don't inline the customer — fetch it if we have an ID.
      const customerId: string | undefined = json?.data?.customer_id;
      let email: string | null = null;
      if (customerId) {
        try {
          const cRes = await gatewayFetch(
            data.environment,
            `/customers/${encodeURIComponent(customerId)}`,
          );
          if (cRes.ok) {
            const cJson = await cRes.json();
            email = cJson?.data?.email ?? null;
          }
        } catch {
          // Non-fatal.
        }
      }

      if (email) {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: order } = await supabaseAdmin
            .from("cookbook_downloads")
            .select("id")
            .eq("stripe_session_id", data.transactionId)
            .maybeSingle();

          if (!order) {
            return {
              paid: false,
              reason:
                "Payment is confirmed, but your secure download is still being prepared. Please wait a moment and refresh this page.",
            };
          }

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
          await supabaseAdmin
            .from("cookbook_downloads")
            .update({ email })
            .eq("stripe_session_id", data.transactionId);
        } catch {
          // Non-fatal — the order is still valid.
        }
      } else {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: order } = await supabaseAdmin
            .from("cookbook_downloads")
            .select("id")
            .eq("stripe_session_id", data.transactionId)
            .maybeSingle();

          if (!order) {
            return {
              paid: false,
              reason:
                "Payment is confirmed, but your secure download is still being prepared. Please wait a moment and refresh this page.",
            };
          }
        } catch {
          return {
            paid: false,
            reason:
              "Payment is confirmed, but your secure download is still being prepared. Please wait a moment and refresh this page.",
          };
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