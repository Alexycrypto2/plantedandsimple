import { createFileRoute } from "@tanstack/react-router";

/** Constant-time compare so the token can't be guessed by timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function authorized(request: Request) {
  const secret = process.env["MCP_SECRET_KEY"];
  if (!secret || secret.length < 24) return false;
  const h = request.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  return !!token && safeEqual(token, secret);
}

const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });

export const Route = createFileRoute("/api/public/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => (authorized(request) ? new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } }) : unauthorized()),
      DELETE: async () => new Response(null, { status: 405 }),
      POST: async ({ request }) => {
        if (!authorized(request)) return unauthorized();
        let body: any;
        try { body = await request.json(); } catch { return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 }); }
        const { handleRpc } = await import("@/lib/mcp-server/rpc.server");
        if (Array.isArray(body)) {
          const out = (await Promise.all(body.slice(0, 20).map(handleRpc))).filter(Boolean);
          return out.length ? Response.json(out) : new Response(null, { status: 202 });
        }
        const out = await handleRpc(body);
        return out ? Response.json(out) : new Response(null, { status: 202 });
      },
    },
  },
});
