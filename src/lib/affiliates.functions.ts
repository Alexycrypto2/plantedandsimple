import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Affiliate = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  code: string;
  commission_pct: number;
  disabled: boolean;
  created_at: string;
};

export type AffiliateRow = Affiliate & {
  clicks: number;
  sales: number;
  revenue: number;
  commission_total: number;
  commission_pending: number;
  commission_paid: number;
};

export type AffiliateReferral = {
  id: string;
  affiliate_id: string;
  transaction_id: string;
  sale_amount: number;
  commission_amount: number;
  status: "pending" | "paid";
  product: string | null;
  purchased_at: string;
  paid_at: string | null;
};

async function isBoss(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PRIME-${s}`;
}

function aggregate(
  affiliates: any[],
  clicksByCode: Map<string, number>,
  refsByAff: Map<string, any[]>,
): AffiliateRow[] {
  return affiliates.map((a: any) => {
    const refs = refsByAff.get(a.id) ?? [];
    const revenue = refs.reduce((s, r) => s + Number(r.sale_amount), 0);
    const commission_total = refs.reduce((s, r) => s + Number(r.commission_amount), 0);
    const commission_paid = refs
      .filter((r) => r.status === "paid")
      .reduce((s, r) => s + Number(r.commission_amount), 0);
    return {
      ...a,
      commission_pct: Number(a.commission_pct),
      clicks: clicksByCode.get(a.code) ?? 0,
      sales: refs.length,
      revenue: Number(revenue.toFixed(2)),
      commission_total: Number(commission_total.toFixed(2)),
      commission_paid: Number(commission_paid.toFixed(2)),
      commission_pending: Number((commission_total - commission_paid).toFixed(2)),
    } as AffiliateRow;
  });
}

export const adminListAffiliates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AffiliateRow[]> => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: affs }, { data: clicks }, { data: refs }] = await Promise.all([
      supabaseAdmin.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("affiliate_clicks").select("code"),
      supabaseAdmin.from("affiliate_referrals").select("*"),
    ]);
    const clicksByCode = new Map<string, number>();
    (clicks ?? []).forEach((c: any) => clicksByCode.set(c.code, (clicksByCode.get(c.code) ?? 0) + 1));
    const refsByAff = new Map<string, any[]>();
    (refs ?? []).forEach((r: any) => {
      const arr = refsByAff.get(r.affiliate_id) ?? [];
      arr.push(r);
      refsByAff.set(r.affiliate_id, arr);
    });
    return aggregate(affs ?? [], clicksByCode, refsByAff);
  });

export const adminCreateAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; email: string; commission_pct?: number }) => d)
  .handler(async ({ data, context }): Promise<Affiliate> => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const pct = data.commission_pct ?? 50;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Invalid name or email");
    // Try up to 5 times to avoid code collision.
    let lastErr: any;
    for (let i = 0; i < 5; i++) {
      const code = genCode();
      const { data: row, error } = await supabaseAdmin
        .from("affiliates")
        .insert({ name, email, code, commission_pct: pct })
        .select("*")
        .single();
      if (!error) return { ...(row as any), commission_pct: Number((row as any).commission_pct) };
      lastErr = error;
      if (!/duplicate.*code/i.test(error.message)) break;
    }
    throw new Error(lastErr?.message ?? "Failed to create affiliate");
  });

export const adminUpdateAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    name?: string;
    email?: string;
    commission_pct?: number;
    disabled?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.email !== undefined) patch.email = data.email.trim().toLowerCase();
    if (data.commission_pct !== undefined) patch.commission_pct = data.commission_pct;
    if (data.disabled !== undefined) patch.disabled = data.disabled;
    const { error } = await supabaseAdmin.from("affiliates").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("affiliates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { affiliate_id: string }) => d)
  .handler(async ({ data, context }): Promise<AffiliateReferral[]> => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("*")
      .eq("affiliate_id", data.affiliate_id)
      .order("purchased_at", { ascending: false });
    return (rows ?? []).map((r: any) => ({
      ...r,
      sale_amount: Number(r.sale_amount),
      commission_amount: Number(r.commission_amount),
    })) as AffiliateReferral[];
  });

export const adminSetReferralPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; paid: boolean }) => d)
  .handler(async ({ data, context }) => {
    await isBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("affiliate_referrals")
      .update({
        status: data.paid ? "paid" : "pending",
        paid_at: data.paid ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Affiliate self-serve
export const affiliateMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AffiliateRow | null> => {
    const email = ((context.claims as any)?.email ?? "").toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .or(`user_id.eq.${context.userId},email.eq.${email}`)
      .maybeSingle();
    if (!aff) return null;
    // Link user_id if missing.
    if (!aff.user_id) {
      await supabaseAdmin
        .from("affiliates")
        .update({ user_id: context.userId })
        .eq("id", aff.id);
    }
    const [{ count: clickCount }, { data: refs }] = await Promise.all([
      supabaseAdmin
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("code", aff.code),
      supabaseAdmin.from("affiliate_referrals").select("*").eq("affiliate_id", aff.id),
    ]);
    const clicksByCode = new Map([[aff.code, clickCount ?? 0]]);
    const refsByAff = new Map([[aff.id, refs ?? []]]);
    return aggregate([aff], clicksByCode, refsByAff)[0];
  });

// Public click tracking (no auth)
export const trackAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const code = String(data.code ?? "").trim().toUpperCase();
    if (!code || code.length > 32) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only log if code exists.
    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("id, disabled")
      .eq("code", code)
      .maybeSingle();
    if (!aff || aff.disabled) return { ok: false as const };
    await supabaseAdmin.from("affiliate_clicks").insert({ code });
    return { ok: true as const };
  });