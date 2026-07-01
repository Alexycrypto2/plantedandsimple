import { createFileRoute } from "@tanstack/react-router";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";
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
        const transactionId = url.searchParams.get("session_id");
        const envParam = url.searchParams.get("env");
        const environment: PaddleEnv =
          envParam === "live" ? "live" : "sandbox";

        if (!transactionId || !/^[a-zA-Z0-9_]+$/.test(transactionId)) {
          return json(
            { error: "Missing or invalid transaction id" },
            { status: 400 },
          );
        }

        // 1. Verify the transaction with Paddle on every request — the
        //    source of truth is Paddle, not a local cache. Blocks direct
        //    access without a real, paid Paddle checkout transaction.
        let email: string | null = null;
        try {
          const txRes = await gatewayFetch(
            environment,
            `/transactions/${encodeURIComponent(transactionId)}`,
          );
          if (!txRes.ok) {
            return json(
              { error: `Payment verification failed (${txRes.status}).` },
              { status: 403 },
            );
          }
          const txJson = await txRes.json();
          const status = txJson?.data?.status as string | undefined;
          if (
            status !== "completed" &&
            status !== "paid" &&
            status !== "billed"
          ) {
            return json(
              { error: "Payment not completed. Access denied." },
              { status: 402 },
            );
          }
          const customerId: string | undefined = txJson?.data?.customer_id;
          if (customerId) {
            const cRes = await gatewayFetch(
              environment,
              `/customers/${encodeURIComponent(customerId)}`,
            );
            if (cRes.ok) {
              const cJson = await cRes.json();
              email = cJson?.data?.email ?? null;
            }
          }
        } catch (error) {
          return json(
            {
              error: `Payment verification failed: ${
                error instanceof Error ? error.message : "unknown error"
              }`,
            },
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
          .eq("stripe_session_id", transactionId)
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
            .eq("stripe_session_id", transactionId);
        } else {
          await supabaseAdmin.from("cookbook_downloads").insert({
            stripe_session_id: transactionId,
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
                stripe_session_id: transactionId,
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
