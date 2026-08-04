import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "boss" | "admin";

async function getRoles(
  supabase: any,
  userId: string,
): Promise<Role[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as Role);
}

async function requireAnyAdmin(supabase: any, userId: string) {
  const roles = await getRoles(supabase, userId);
  if (!roles.includes("boss") && !roles.includes("admin"))
    throw new Error("Forbidden");
  return roles;
}

async function requireBoss(supabase: any, userId: string) {
  const roles = await getRoles(supabase, userId);
  if (!roles.includes("boss")) throw new Error("Forbidden");
}

export const adminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ userId: string; email: string | null; roles: Role[] }> => {
      const roles = await getRoles(context.supabase, context.userId);
      const email =
        (context.claims as any)?.email ??
        (context.claims as any)?.user_metadata?.email ??
        null;
      return { userId: context.userId, email, roles };
    },
  );

export type AdminReview = {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  rating: number;
  quote: string;
  stripe_session_id: string | null;
  approved: boolean;
  consent: boolean;
  created_at: string;
  photo_path: string | null;
  photo_signed_url: string | null;
};

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReview[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select(
        "id, name, location, country, rating, quote, stripe_session_id, approved, consent, created_at, photo_url",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const signed = list.map((r: any) => {
        const photo_signed_url = r.photo_url ? `/api/public/img/review-photos/${r.photo_url}` : null;
        return {
          id: r.id,
          name: r.name,
          location: r.location,
          country: r.country,
          rating: r.rating,
          quote: r.quote,
          stripe_session_id: r.stripe_session_id,
          approved: r.approved,
          consent: r.consent,
          created_at: r.created_at,
          photo_path: r.photo_url,
          photo_signed_url,
        } satisfies AdminReview;
      });
    return signed;
  });

export const adminSetReviewApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; approved: boolean }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ approved: Boolean(data.approved) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row } = await supabaseAdmin
      .from("reviews")
      .select("photo_url")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.photo_url) {
      await supabaseAdmin.storage
        .from("review-photos")
        .remove([row.photo_url]);
    }
    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReviewPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row } = await supabaseAdmin
      .from("reviews")
      .select("photo_url")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.photo_url) {
      await supabaseAdmin.storage
        .from("review-photos")
        .remove([row.photo_url]);
    }
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ photo_url: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type BuyerRow = {
  email: string;
  transaction_id: string;
  purchased_at: string;
  download_count: number;
  last_downloaded_at: string | null;
};

export const adminListBuyers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BuyerRow[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("cookbook_downloads")
      .select(
        "email, stripe_session_id, created_at, download_count, last_downloaded_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? [])
      .filter((r: any) => !!r.email)
      .map((r: any) => ({
        email: r.email as string,
        transaction_id: r.stripe_session_id as string,
        purchased_at: r.created_at as string,
        download_count: r.download_count as number,
        last_downloaded_at: r.last_downloaded_at as string | null,
      }));
  });

export type SalesStats = {
  total_sales: number;
  sales_last_7_days: number;
  sales_last_30_days: number;
  total_revenue: number;
  total_downloads: number;
  subscribers: number;
  reviews_total: number;
  reviews_pending: number;
  reviews_approved: number;
  average_rating: number | null;
  daily: { date: string; sales: number }[];
};

const UNIT_PRICE = 14.99;

export const adminSalesStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SalesStats> => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const [{ data: downloads }, { data: subs }, { data: reviews }] =
      await Promise.all([
        supabaseAdmin
          .from("cookbook_downloads")
          .select("created_at, download_count")
          .limit(10000),
        supabaseAdmin.from("subscribers").select("id", { count: "exact" }),
        supabaseAdmin.from("reviews").select("rating, approved"),
      ]);

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const rows = downloads ?? [];
    const total_sales = rows.length;
    const sales_last_7_days = rows.filter(
      (r: any) => now - new Date(r.created_at).getTime() < 7 * day,
    ).length;
    const sales_last_30_days = rows.filter(
      (r: any) => now - new Date(r.created_at).getTime() < 30 * day,
    ).length;
    const total_downloads = rows.reduce(
      (s: number, r: any) => s + (r.download_count ?? 0),
      0,
    );

    // Daily bucket for last 14 days
    const daily: { date: string; sales: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * day);
      const key = d.toISOString().slice(0, 10);
      daily.push({ date: key, sales: 0 });
    }
    const idxByDate = new Map(daily.map((d, i) => [d.date, i]));
    rows.forEach((r: any) => {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      const i = idxByDate.get(key);
      if (i !== undefined) daily[i].sales += 1;
    });

    const revs = reviews ?? [];
    const reviews_approved = revs.filter((r: any) => r.approved).length;
    const reviews_pending = revs.length - reviews_approved;
    const ratings = revs.filter((r: any) => r.approved).map((r: any) => r.rating);
    const average_rating = ratings.length
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : null;

    return {
      total_sales,
      sales_last_7_days,
      sales_last_30_days,
      total_revenue: Number((total_sales * UNIT_PRICE).toFixed(2)),
      total_downloads,
      subscribers: (subs as any)?.length ?? 0,
      reviews_total: revs.length,
      reviews_pending,
      reviews_approved,
      average_rating,
      daily,
    };
  });

// ============ Admin user management (boss only) ============

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  roles: Role[];
  created_at: string | null;
};

export const adminListAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });
    const byUser: Record<
      string,
      { roles: Role[]; created_at: string | null }
    > = {};
    (roleRows ?? []).forEach((r: any) => {
      const key = r.user_id as string;
      if (!byUser[key]) byUser[key] = { roles: [], created_at: r.created_at };
      byUser[key].roles.push(r.role as Role);
    });
    const results: AdminUserRow[] = [];
    for (const user_id of Object.keys(byUser)) {
      const { roles, created_at } = byUser[user_id];
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(user_id);
      results.push({
        user_id,
        email: u?.user?.email ?? null,
        roles,
        created_at,
      });
    }
    return results;
  });

export const adminAddAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireBoss(context.supabase, context.userId);
    const email = String(data.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Invalid email");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    // Look up user by email via admin API listing
    let userId: string | null = null;
    // Paginate a few pages in case of many users
    for (let page = 1; page <= 5 && !userId; page++) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      const found = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === email,
      );
      if (found) userId = found.id;
      if (!list?.users?.length || list.users.length < 200) break;
    }
    if (!userId)
      throw new Error(
        "No account with that email. Ask them to sign up at /auth first.",
      );
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const adminRemoveAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireBoss(context.supabase, context.userId);
    if (data.user_id === context.userId)
      throw new Error("You cannot remove your own boss role.");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    // Only remove the 'admin' role; never remove 'boss' via this endpoint.
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });