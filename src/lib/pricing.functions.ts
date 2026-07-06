import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

export type PublicPricing = {
  price_cents: number;
  compare_at_cents: number;
  currency: string;
  price_display: string; // e.g. "14.99"
  compare_at_display: string; // e.g. "29.99"
};

const PRICE_EXTERNAL_ID = "high_protein_cookbook_onetime";

function toDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

async function readPricingRow() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("price_cents, compare_at_cents, currency")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data ?? {
    price_cents: 1499,
    compare_at_cents: 2999,
    currency: "USD",
  };
  return {
    price_cents: row.price_cents,
    compare_at_cents: row.compare_at_cents,
    currency: row.currency,
    price_display: toDisplay(row.price_cents),
    compare_at_display: toDisplay(row.compare_at_cents),
  } satisfies PublicPricing;
}

export const getPublicPricing = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPricing> => {
    try {
      return await readPricingRow();
    } catch {
      return {
        price_cents: 1499,
        compare_at_cents: 2999,
        currency: "USD",
        price_display: "14.99",
        compare_at_display: "29.99",
      };
    }
  },
);

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

export const adminGetPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicPricing> => {
    await requireBoss(context.supabase, context.userId);
    return readPricingRow();
  });

async function updatePaddlePriceAmount(
  env: PaddleEnv,
  amountCents: number,
  currency: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const lookup = await gatewayFetch(
      env,
      `/prices?external_id=${encodeURIComponent(PRICE_EXTERNAL_ID)}`,
    );
    if (!lookup.ok) return { ok: false, error: `lookup ${lookup.status}` };
    const j = await lookup.json();
    const priceId = j?.data?.[0]?.id as string | undefined;
    if (!priceId) return { ok: false, error: "Paddle price not found" };
    const patch = await gatewayFetch(env, `/prices/${priceId}`, {
      method: "PATCH",
      body: JSON.stringify({
        unit_price: { amount: String(amountCents), currency_code: currency },
      }),
    });
    if (!patch.ok) {
      const t = await patch.text();
      return { ok: false, error: `patch ${patch.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export type AdminUpdatePricingResult = {
  pricing: PublicPricing;
  paddle_sandbox: { ok: boolean; error?: string };
  paddle_live: { ok: boolean; error?: string };
};

export const adminUpdatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      price_cents: number;
      compare_at_cents: number;
      currency?: string;
    }) => {
      const price_cents = Math.round(Number(data.price_cents));
      const compare_at_cents = Math.round(Number(data.compare_at_cents));
      if (!Number.isFinite(price_cents) || price_cents < 70)
        throw new Error("Price must be at least $0.70");
      if (!Number.isFinite(compare_at_cents) || compare_at_cents < price_cents)
        throw new Error("Compare-at price must be greater than or equal to price");
      const currency = (data.currency ?? "USD").toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid currency");
      return { price_cents, compare_at_cents, currency };
    },
  )
  .handler(async ({ data, context }): Promise<AdminUpdatePricingResult> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("pricing_settings")
      .upsert(
        {
          id: true,
          price_cents: data.price_cents,
          compare_at_cents: data.compare_at_cents,
          currency: data.currency,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);

    // Sync to Paddle in both environments (best-effort — never blocks the save).
    const [sandbox, live] = await Promise.all([
      process.env.PADDLE_SANDBOX_API_KEY
        ? updatePaddlePriceAmount("sandbox", data.price_cents, data.currency)
        : Promise.resolve({ ok: false, error: "sandbox key not configured" }),
      process.env.PADDLE_LIVE_API_KEY
        ? updatePaddlePriceAmount("live", data.price_cents, data.currency)
        : Promise.resolve({ ok: false, error: "live key not configured" }),
    ]);

    return {
      pricing: {
        price_cents: data.price_cents,
        compare_at_cents: data.compare_at_cents,
        currency: data.currency,
        price_display: toDisplay(data.price_cents),
        compare_at_display: toDisplay(data.compare_at_cents),
      },
      paddle_sandbox: sandbox,
      paddle_live: live,
    };
  });