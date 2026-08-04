import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = new Set(["ai-images", "media"]);

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
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "Content-Type": data.type || "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});