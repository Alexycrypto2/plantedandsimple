import { createFileRoute } from "@tanstack/react-router";
import { CORS, json, preflight, publicOrigin, verify } from "@/lib/mcp-server/oauth";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Accepts the static MCP_SECRET_KEY (desktop bridges) or an OAuth token whose user is still a boss. */
async function authorized(request: Request) {
  const secret = process.env["MCP_SECRET_KEY"];
  if (!secret || secret.length < 24) return false;
  const h = request.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return false;
  if (safeEqual(token, secret)) return true;
  const claims = await verify("access", token);
  if (!claims?.sub) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", claims.sub).eq("role", "boss").maybeSingle();
  return !!data;
}

const unauthorized = (request: Request) =>
  json({ error: "unauthorized" }, 401, {
    "WWW-Authenticate": `Bearer resource_metadata="${publicOrigin(request)}/.well-known/oauth-protected-resource/api/public/mcp"`,
  });

export const Route = createFileRoute("/api/public/mcp")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => ((await authorized(request)) ? new Response("Method Not Allowed", { status: 405, headers: { ...CORS, Allow: "POST" } }) : unauthorized(request)),
      DELETE: async () => new Response(null, { status: 405, headers: CORS }),
      POST: async ({ request }) => {
        if (!(await authorized(request))) return unauthorized(request);
        let body: any;
        try { body = await request.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
        const { handleRpc } = await import("@/lib/mcp-server/rpc.server");
        if (Array.isArray(body)) {
          const out = (await Promise.all(body.slice(0, 20).map(handleRpc))).filter(Boolean);
          return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
        }
        const out = await handleRpc(body);
        return out ? json(out) : new Response(null, { status: 202, headers: CORS });
      },
    },
  },
});
