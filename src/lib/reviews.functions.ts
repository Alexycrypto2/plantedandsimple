import { createServerFn } from "@tanstack/react-start";

export type PublicReview = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  quote: string;
  created_at: string;
};

export const listApprovedReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicReview[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, name, location, rating, quote, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(9);
    if (error) return [];
    return (data ?? []) as PublicReview[];
  },
);

type SubmitInput = {
  name: string;
  location?: string;
  rating: number;
  quote: string;
  transactionId?: string;
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
    return { name, quote, location, rating, transactionId };
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("reviews").insert({
      name: data.name,
      location: data.location,
      rating: data.rating,
      quote: data.quote,
      stripe_session_id: data.transactionId,
      approved: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });