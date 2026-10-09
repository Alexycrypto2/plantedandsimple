import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAnyAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss" || r.role === "admin")) throw new Error("Forbidden");
}

export type SubscriberRow = {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  is_buyer: boolean;
};

export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriberRow[]> => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const all: any[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await supabaseAdmin
        .from("subscribers")
        .select("id, email, source, subscribed_at, unsubscribed_at, stripe_session_id")
        .order("subscribed_at", { ascending: false })
        .range(from, from + 999);
      if (error) throw new Error("Couldn't load the email list.");
      all.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
    }
    const { data: buyers } = await supabaseAdmin.from("cookbook_downloads").select("email").limit(10000);
    const buyerSet = new Set((buyers ?? []).map((b: any) => String(b.email ?? "").toLowerCase()));
    return all.map((r) => ({
      id: r.id,
      email: r.email,
      source: r.source ?? "unknown",
      subscribed_at: r.subscribed_at,
      unsubscribed_at: r.unsubscribed_at,
      is_buyer: !!r.stripe_session_id || buyerSet.has(String(r.email).toLowerCase()),
    }));
  });

export const adminUpdateSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["unsubscribe", "resubscribe", "delete", "sync"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("subscribers").delete().eq("id", data.id);
      if (error) throw new Error("Couldn't delete.");
      return { ok: true };
    }
    if (data.action === "sync") {
      const { data: row } = await supabaseAdmin.from("subscribers").select("email, source").eq("id", data.id).maybeSingle();
      if (!row) throw new Error("Not found");
      const { syncSubscriber } = await import("./email-sync.server");
      const r = await syncSubscriber(row.email, row.source);
      return { ok: r.mailerlite || r.webhook };
    }
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ unsubscribed_at: data.action === "unsubscribe" ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error("Couldn't update.");
    return { ok: true };
  });

export const adminAddSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().toLowerCase().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert({ email: data.email, source: "admin_added", unsubscribed_at: null } as any, { onConflict: "email" });
    if (error) throw new Error("Couldn't add.");
    const { syncSubscriber } = await import("./email-sync.server");
    await syncSubscriber(data.email, "admin_added");
    return { ok: true };
  });
