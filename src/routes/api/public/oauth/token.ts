import { createFileRoute } from "@tanstack/react-router";
import { json, pkceS256, preflight, sign, verify } from "@/lib/mcp-server/oauth";

const ACCESS_TTL = 60 * 60 * 24; // 1 day
const REFRESH_TTL = 60 * 60 * 24 * 90; // 90 days

async function readForm(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return ((await request.json().catch(() => ({}))) ?? {}) as Record<string, string>;
  return Object.fromEntries(new URLSearchParams(await request.text())) as Record<string, string>;
}
const bad = (error: string, error_description?: string) => json({ error, error_description }, 400);

async function issue(sub: string, client: string) {
  return json({
    access_token: await sign("access", { sub, c: client }, ACCESS_TTL),
    refresh_token: await sign("refresh", { sub, c: client }, REFRESH_TTL),
    token_type: "Bearer", expires_in: ACCESS_TTL, scope: "mcp",
  });
}

export const Route = createFileRoute("/api/public/oauth/token")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const f = await readForm(request);
        if (f.grant_type === "authorization_code") {
          const code = await verify("code", f.code);
          if (!code) return bad("invalid_grant", "Code is invalid or expired");
          if (code.c !== f.client_id || code.r !== f.redirect_uri) return bad("invalid_grant", "Client or redirect mismatch");
          if (!f.code_verifier || (await pkceS256(f.code_verifier)) !== code.ch) return bad("invalid_grant", "PKCE verification failed");
          return issue(code.sub, code.c);
        }
        if (f.grant_type === "refresh_token") {
          const r = await verify("refresh", f.refresh_token);
          if (!r || (f.client_id && f.client_id !== r.c)) return bad("invalid_grant");
          return issue(r.sub, r.c);
        }
        return bad("unsupported_grant_type");
      },
    },
  },
});
