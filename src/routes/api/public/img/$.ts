import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = new Set(["ai-images", "media", "review-photos"]);

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = String((params as any)._splat ?? "");
        const [bucket, ...rest] = splat.split("/");
        const path = rest.join("/");
        if (!bucket || !path || !ALLOWED.has(bucket) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (bucket === "review-photos") {
          const { data: review, error: reviewError } = await supabaseAdmin.from("reviews")
            .select("id").eq("photo_url", path).eq("approved", true).eq("consent", true)
            .limit(1).maybeSingle();
          if (reviewError || !review) return new Response("Not found", { status: 404 });
        }
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "Content-Type": data.type || "image/png",
            "Cache-Control": bucket === "review-photos" ? "no-store" : "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            ...(data.type === "application/pdf" ? { "Content-Disposition": "attachment" } : {}),
          },
        });
      },
    },
  },
});