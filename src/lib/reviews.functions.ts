import { createServerFn } from "@tanstack/react-start";

export type PublicReview = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  quote: string;
  created_at: string;
  photo_url: string | null;
};

export const listApprovedReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicReview[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, name, location, rating, quote, created_at, photo_url")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(9);
    if (error) return [];
    const rows = (data ?? []) as (Omit<PublicReview, "photo_url"> & {
      photo_url: string | null;
    })[];
    // Sign photo URLs (bucket is private).
    const signed = await Promise.all(
      rows.map(async (r) => {
        if (!r.photo_url) return { ...r, photo_url: null };
        const { data: sig } = await supabaseAdmin.storage
          .from("review-photos")
          .createSignedUrl(r.photo_url, 60 * 60 * 24 * 7);
        return { ...r, photo_url: sig?.signedUrl ?? null };
      }),
    );
    return signed;
  },
);

type SubmitInput = {
  name: string;
  location?: string;
  rating: number;
  quote: string;
  transactionId?: string;
  photoDataUrl?: string;
  consent?: boolean;
};

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => {
    const name = String(data.name ?? "").trim();
    const quote = String(data.quote ?? "").trim();
    const location = data.location
      ? String(data.location).trim().slice(0, 80)
      : null;
    const rating = Number(data.rating);
    if (name.length < 1 || name.length > 80) throw new Error("Invalid name");
    if (quote.length < 10 || quote.length > 600)
      throw new Error("Review must be 10–600 characters");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new Error("Invalid rating");
    const transactionId = data.transactionId
      ? String(data.transactionId).slice(0, 120)
      : null;
    const consent = Boolean(data.consent);
    const photoDataUrl = data.photoDataUrl
      ? String(data.photoDataUrl).slice(0, 2_500_000)
      : null;
    return { name, quote, location, rating, transactionId, consent, photoDataUrl };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Optional photo: decode data URL, upload to private bucket.
    let photoPath: string | null = null;
    if (data.photoDataUrl) {
      const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/.exec(
        data.photoDataUrl,
      );
      if (!match) throw new Error("Invalid photo format");
      const contentType = match[1];
      const ext = match[2] === "jpg" ? "jpeg" : match[2];
      const bytes = Buffer.from(match[3], "base64");
      if (bytes.byteLength > 1_500_000)
        throw new Error("Photo must be under 1.5 MB");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("review-photos")
        .upload(path, bytes, { contentType, upsert: false });
      if (upErr) throw new Error(upErr.message);
      photoPath = path;
    }

    const { error } = await supabaseAdmin.from("reviews").insert({
      name: data.name,
      location: data.location,
      rating: data.rating,
      quote: data.quote,
      stripe_session_id: data.transactionId,
      approved: false,
      consent: data.consent,
      photo_url: photoPath,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });