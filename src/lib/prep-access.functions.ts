import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Meal Prep System access rules (pure, unit-tested):
 * - admins/boss can always open it
 * - an admin-revoked member is blocked even if they paid
 * - an active member row (manual gift) grants access
 * - otherwise a verified purchase for that email grants access
 */
export function decidePrepAccess(input: {
  isAdmin: boolean;
  memberStatus: "active" | "revoked" | null;
  hasPurchase: boolean;
}): boolean {
  if (input.isAdmin) return true;
  if (input.memberStatus === "revoked") return false;
  if (input.memberStatus === "active") return true;
  return input.hasPurchase;
}

async function rolesOf(supabase: any, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role);
}

async function requireAdmin(supabase: any, userId: string) {
  const roles = await rolesOf(supabase, userId);
  if (!roles.includes("boss") && !roles.includes("admin")) throw new Error("Forbidden");
}

function emailOf(claims: any): string | null {
  const e = claims?.email ?? claims?.user_metadata?.email ?? null;
  return e ? String(e).trim().toLowerCase() : null;
}

export const getPrepAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = emailOf(context.claims);
    const roles = await rolesOf(context.supabase, context.userId);
    const isAdmin = roles.includes("boss") || roles.includes("admin");
    if (!email) return { allowed: isAdmin, email: null as string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: member }, { data: purchase }] = await Promise.all([
      supabaseAdmin.from("prep_members").select("id,status").eq("email", email).maybeSingle(),
      supabaseAdmin.from("prep_purchases").select("id").ilike("email", email).limit(1).maybeSingle(),
    ]);
    const allowed = decidePrepAccess({
      isAdmin,
      memberStatus: (member?.status as "active" | "revoked" | undefined) ?? null,
      hasPurchase: !!purchase,
    });
    if (allowed && !isAdmin) {
      if (member) await supabaseAdmin.from("prep_members").update({ last_seen_at: new Date().toISOString() }).eq("id", member.id);
      else await supabaseAdmin.from("prep_members").insert({ email, status: "active", source: "purchase", last_seen_at: new Date().toISOString() });
    }
    return { allowed, email };
  });

export type PrepMemberRow = {
  email: string;
  status: "active" | "revoked" | "paid";
  source: string;
  note: string | null;
  purchasedAt: string | null;
  transactionId: string | null;
  environment: string | null;
  lastSeenAt: string | null;
};

export const listPrepMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: members }, { data: purchases }, { count: plans }] = await Promise.all([
      supabaseAdmin.from("prep_members").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("prep_purchases").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("prep_meal_plans").select("id", { count: "exact", head: true }),
    ]);
    const rows = new Map<string, PrepMemberRow>();
    for (const p of purchases ?? []) {
      const email = (p.email ?? "").toLowerCase();
      if (!email || rows.has(email)) continue;
      rows.set(email, { email, status: "paid", source: "purchase", note: null, purchasedAt: p.created_at, transactionId: p.transaction_id, environment: p.environment, lastSeenAt: null });
    }
    for (const m of members ?? []) {
      const prev = rows.get(m.email);
      rows.set(m.email, {
        email: m.email,
        status: m.status as "active" | "revoked",
        source: prev ? "purchase" : m.source,
        note: m.note,
        purchasedAt: prev?.purchasedAt ?? null,
        transactionId: prev?.transactionId ?? null,
        environment: prev?.environment ?? null,
        lastSeenAt: m.last_seen_at,
      });
    }
    const list = [...rows.values()];
    return {
      members: list,
      stats: {
        total: list.length,
        paid: list.filter((r) => r.transactionId).length,
        gifted: list.filter((r) => !r.transactionId && r.status === "active").length,
        revoked: list.filter((r) => r.status === "revoked").length,
        plans: plans ?? 0,
      },
    };
  });

const EmailInput = z.object({ email: z.string().trim().toLowerCase().email().max(255), note: z.string().max(300).optional() });

export const grantPrepAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("prep_members").upsert(
      { email: data.email, status: "active", source: "manual", note: data.note ?? null, granted_by: context.userId },
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPrepMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().toLowerCase().email(), status: z.enum(["active", "revoked"]) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("prep_members").upsert(
      { email: data.email, status: data.status, granted_by: context.userId },
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
