import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pinterest/publish-due")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PINTEREST_STATE_SECRET"];
        const provided = request.headers.get("x-cron-key");
        if (!secret || provided !== secret) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { publishDuePins } = await import("@/lib/pinterest-publish.server");
        const results = await publishDuePins(10);
        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});