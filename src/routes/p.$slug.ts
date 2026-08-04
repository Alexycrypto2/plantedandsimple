import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = String(params.slug || "");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await (supabaseAdmin as any)
          .from("pinterest_posts")
          .select("destination_url,slug,generation_id")
          .eq("slug", slug)
          .maybeSingle();

        const target = data?.destination_url ?? "https://primedownloads.store/recipes";

        if (data) {
          try {
            await (supabaseAdmin as any).rpc("increment_pin_click", { _slug: slug });
            await (supabaseAdmin as any).from("analytics_events").insert({
              kind: "pinterest_click",
              ref_id: data.generation_id,
              ref_slug: slug,
              metadata: { destination: target },
            });
          } catch {
            /* tracking must never block the redirect */
          }
        }

        return new Response(null, {
          status: 302,
          headers: { Location: target, "Cache-Control": "no-store" },
        });
      },
    },
  },
});