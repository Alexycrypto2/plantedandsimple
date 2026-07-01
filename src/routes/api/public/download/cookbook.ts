import { createFileRoute } from "@tanstack/react-router";
import {
  createStripeClient,
  getStripeErrorMessage,
  type StripeEnv,
} from "@/lib/stripe.server";
import cookbookAsset from "@/assets/cookbook.pdf.asset.json";

// Server-side origin for the CDN URL (relative paths won't resolve in the
// Worker fetch). We build an absolute URL from the incoming request host.
function buildAssetUrl(request: Request): string {
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}${cookbookAsset.url}`;
}

// Anti-abuse: hard cap re-downloads per session so a shared/leaked
// session_id can't be used to seed a warez copy indefinitely.
const MAX_DOWNLOADS_PER_SESSION = 10;

export const Route = createFileRoute("/api/public/download/cookbook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get("session_id");
        const envParam = url.searchParams.get("env");
        const environment: StripeEnv =
          envParam === "live" ? "live" : "sandbox";

        if (!sessionId || !/^[a-zA-Z0-9_]+$/.test(sessionId)) {
          return json(
            { error: "Missing or invalid session_id" },
            { status: 400 },
          );
        }

        // 1. Verify the session with Stripe on every request — the source
        //    of truth is Stripe, not a local cache. This blocks direct
        //    access without a paid, real Stripe checkout session.
        let email: string | null = null;
        try {
          const stripe = createStripeClient(environment);
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status !== "paid") {
            return json(
              { error: "Payment not completed. Access denied." },
              { status: 402 },
            );
          }
          email = session.customer_details?.email ?? null;
        } catch (error) {
          return json(
            { error: `Stripe verification failed: ${getStripeErrorMessage(error)}` },
            { status: 403 },
          );
        }

        // 2. Track downloads and enforce a per-session cap.
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data: existing } = await supabaseAdmin
          .from("cookbook_downloads")
          .select("download_count")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        const nextCount = (existing?.download_count ?? 0) + 1;
        if (nextCount > MAX_DOWNLOADS_PER_SESSION) {
          return json(
            {
              error:
                "Download limit reached for this order. Please contact support if you need help.",
            },
            { status: 429 },
          );
        }

        if (existing) {
          await supabaseAdmin
            .from("cookbook_downloads")
            .update({
              download_count: nextCount,
              last_downloaded_at: new Date().toISOString(),
              email,
            })
            .eq("stripe_session_id", sessionId);
        } else {
          await supabaseAdmin.from("cookbook_downloads").insert({
            stripe_session_id: sessionId,
            email,
            download_count: 1,
            last_downloaded_at: new Date().toISOString(),
          });
        }

        // 3. Also capture the email into subscribers (idempotent).
        if (email) {
          await supabaseAdmin
            .from("subscribers")
            .upsert(
              {
                email: email.toLowerCase(),
                source: "cookbook_purchase",
                stripe_session_id: sessionId,
              },
              { onConflict: "email", ignoreDuplicates: true },
            );
        }

        // 4. Stream the PDF back from the CDN behind our gate.
        const assetUrl = buildAssetUrl(request);
        const pdfRes = await fetch(assetUrl);
        if (!pdfRes.ok || !pdfRes.body) {
          return json(
            { error: "Cookbook file is temporarily unavailable." },
            { status: 502 },
          );
        }

        return new Response(pdfRes.body, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="30-High-Protein-Plant-Based-Meals.pdf"',
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});

function json(body: unknown, init: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}
