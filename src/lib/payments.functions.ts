import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BUNDLE_OFFERS, PACKAGES, RECOVERY_PRICE, packageTotal, type PackageId } from './bundle-offers';
import {
  gatewayFetch,
  type PaddleEnv,
} from "@/lib/paddle.server";

/**
 * Resolve a human-readable price ID (e.g. "high_protein_cookbook_onetime")
 * to a Paddle internal price ID (pri_...). Required by Paddle.Checkout.open().
 */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ priceId: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(120), environment: z.enum(["live", "sandbox"]) }).parse(data))
  .handler(async ({ data }): Promise<string> => {
    // Only published catalog prices or the app's three built-in offers may be resolved.
    const builtIn = [...PACKAGES.map(p => p.priceId), ...BUNDLE_OFFERS.map(p => p.priceId), RECOVERY_PRICE];
    if (!builtIn.includes(data.priceId)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: product, error } = await supabaseAdmin.from("products").select("id").eq("status", "published").eq("paddle_price_external_id", data.priceId).limit(1).maybeSingle();
      if (error || !product) throw new Error("Price not available");
    }
    const res = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const json = await res.json();
    if (!json?.data?.length) throw new Error("Price not found");
    return json.data[0].id as string;
  });

type PaidProduct = "cookbook" | "prep" | "kit" | "bundle";

type VerifyResult =
  | { paid: true; email: string | null; product: PaidProduct; products: PackageId[] }
  | { paid: false; reason: string };

/**
 * When a purchase is not recorded under cookbook_downloads it may be a
 * Meal Prep System sale — the payments webhook records those in
 * prep_purchases instead.
 */
async function isPrepPurchase(transactionId: string): Promise<boolean> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data } = await supabaseAdmin
    .from("prep_purchases")
    .select("id")
    .eq("transaction_id", transactionId)
    .maybeSingle();
  return Boolean(data);
}

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

      const { purchasedProducts } = await import('./purchased-products.server');
      const products = await purchasedProducts(json.data, data.environment);
      if (!products.length) return { paid: false, reason: 'This order does not contain a recognized package.' };
      if (products.length > 1) return { paid: true, email: await customerEmail(json.data?.customer_id, data.environment), product: 'bundle', products };

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

      // Paddle is the source of truth for which product was bought, so a
      // paused or slow database never blocks a paying customer.
      const slug = json?.data?.custom_data?.productSlug as string | undefined;
      if (products.includes('kit')) {
        return { paid: true, email, product: "kit", products };
      }
      if (products.includes('prep')) {
        return { paid: true, email, product: "prep", products };
      }

      // Older checkouts may lack a slug — fall back to the recorded purchase table.
      if (!slug) {
        try {
          if (await isPrepPurchase(data.transactionId)) {
            return { paid: true, email, product: "prep", products: ['prep'] };
          }
        } catch {
          // Database unavailable — treat as the cookbook (the default offer).
        }
      }

      // Best-effort bookkeeping; never blocks the download.
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
          await supabaseAdmin
            .from("cookbook_downloads")
            .update({ email })
            .eq("stripe_session_id", data.transactionId);
        } catch {
          // Non-fatal.
        }
      }

      return { paid: true, email, product: "cookbook", products };
    } catch (error) {
      return {
        paid: false,
        reason:
          error instanceof Error ? error.message : "Verification failed",
      };
    }
  });

async function customerEmail(id: string | undefined, environment: PaddleEnv): Promise<string | null> {
  if (!id) return null;
  try {
    const res = await gatewayFetch(environment, `/customers/${encodeURIComponent(id)}`);
    return res.ok ? (await res.json()).data?.email ?? null : null;
  } catch { return null; }
}

export const preparePackageCheckout = createServerFn({ method: 'POST' })
  .inputValidator(input => z.object({ products: z.array(z.enum(['cookbook', 'prep', 'kit'])).min(1).max(3), recovery: z.boolean().default(false), environment: z.enum(['live', 'sandbox']) }).parse(input))
  .handler(async ({ data }) => {
    if (new Set(data.products).size !== data.products.length) throw new Error('Choose each product once.');
    const { listPublishedProducts } = await import('./products.functions');
    const catalog = await listPublishedProducts({ data: {} });
    const prices: Partial<Record<PackageId, number>> = {};
    for (const id of data.products) {
      const definition = PACKAGES.find(p => p.id === id);
      const row = catalog.find(p => p.slug === definition?.slug);
      if (!row || row.currency.toUpperCase() !== 'USD') throw new Error('This package is not available.');
      prices[id] = row.price_cents;
    }
    const quote = packageTotal(data.products, prices, data.recovery);
    if (!quote.priceId || (data.products.length > 1 && quote.savings <= 0)) throw new Error('This bundle offer needs a price update. Choose individual products or contact support.');
    const res = await gatewayFetch(data.environment, `/prices?external_id=${encodeURIComponent(quote.priceId)}`);
    if (!res.ok) throw new Error('Payment provider is temporarily unavailable.');
    const price = (await res.json()).data?.[0];
    if (!price || Number(price.unit_price?.amount) !== quote.total || price.unit_price?.currency_code !== 'USD') throw new Error('Checkout pricing is being updated. Please try again shortly.');
    return { priceId: String(price.id), total: quote.total, products: data.products };
  });