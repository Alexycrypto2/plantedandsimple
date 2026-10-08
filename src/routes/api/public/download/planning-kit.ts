import { createFileRoute } from "@tanstack/react-router";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";
import kitAsset from "@/assets/planning-kit.pdf.asset.json";

// Gated download for the $4.99 Weekly Meal Planning Kit. Every request is
// re-verified against Paddle: the transaction must be paid AND tagged with
// productSlug "planning-kit" so other purchases can't unlock it.
export const Route = createFileRoute("/api/public/download/planning-kit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tx = url.searchParams.get("session_id") ?? url.searchParams.get("_ptxn");
        const environment: PaddleEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";
        if (!tx || !/^[a-zA-Z0-9_]+$/.test(tx)) return json({ error: "Missing or invalid transaction id" }, 400);

        try {
          const res = await gatewayFetch(environment, `/transactions/${encodeURIComponent(tx)}`);
          if (!res.ok) return json({ error: `Payment verification failed (${res.status}).` }, 403);
          const body: any = await res.json();
          const status = body?.data?.status;
          if (status !== "completed" && status !== "paid" && status !== "billed") {
            return json({ error: "Payment not completed. Access denied." }, 402);
          }
          if (body?.data?.custom_data?.productSlug !== "planning-kit") {
            return json({ error: "This order does not include the Planning Kit." }, 403);
          }
        } catch (e) {
          return json({ error: `Payment verification failed: ${e instanceof Error ? e.message : "unknown"}` }, 403);
        }

        const u = new URL(request.url);
        const pdf = await fetch(`${u.protocol}//${u.host}${kitAsset.url}`);
        if (!pdf.ok || !pdf.body) return json({ error: "File temporarily unavailable." }, 502);
        return new Response(pdf.body, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="Plant-and-Simple-Weekly-Meal-Planning-Kit.pdf"',
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
