import { createServerFn } from "@tanstack/react-start";

function checkAdmin(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (typeof password !== "string" || password.length === 0) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function requireAdmin(password: string) {
  if (!checkAdmin(password)) throw new Error("Unauthorized");
}

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

export const adminVerifyPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    return { ok: checkAdmin(data.password) };
  });

export const adminListReviews = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<AdminReview[]> => {
    requireAdmin(data.password);
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
    const signed = await Promise.all(
      list.map(async (r: any) => {
        let photo_signed_url: string | null = null;
        if (r.photo_url) {
          const { data: sig } = await supabaseAdmin.storage
            .from("review-photos")
            .createSignedUrl(r.photo_url, 60 * 60);
          photo_signed_url = sig?.signedUrl ?? null;
        }
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
      }),
    );
    return signed;
  });

export const adminSetReviewApproval = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { password: string; id: string; approved: boolean }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    requireAdmin(data.password);
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
  .inputValidator((data: { password: string; id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    requireAdmin(data.password);
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
  .inputValidator((data: { password: string; id: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    requireAdmin(data.password);
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

export const adminListBuyers = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<BuyerRow[]> => {
    requireAdmin(data.password);
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