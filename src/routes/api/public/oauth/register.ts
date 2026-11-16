import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { allowedRedirect, json, preflight, sign } from "@/lib/mcp-server/oauth";

const Body = z.object({ redirect_uris: z.array(z.string().url().max(500)).min(1).max(5), client_name: z.string().max(120).optional() }).passthrough();

/** RFC 7591 dynamic client registration; the client_id itself carries the signed redirect list. */
export const Route = createFileRoute("/api/public/oauth/register")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "invalid_client_metadata" }, 400);
        const uris = parsed.data.redirect_uris;
        if (!uris.every(allowedRedirect)) return json({ error: "invalid_redirect_uri", error_description: "Only Claude callback or localhost redirects are allowed" }, 400);
        const name = parsed.data.client_name ?? "MCP client";
        const client_id = await sign("client", { r: uris, n: name });
        return json({ client_id, client_name: name, redirect_uris: uris, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", client_id_issued_at: Math.floor(Date.now() / 1000) }, 201);
      },
    },
  },
});
