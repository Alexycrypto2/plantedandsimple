/**
 * Stateless OAuth 2.1 (PKCE + dynamic client registration) for the MCP endpoint.
 * Clients, codes and tokens are HMAC-signed with MCP_SECRET_KEY, so no database table is needed
 * and rotating the secret revokes every Claude connection at once. Server-only.
 */
const enc = new TextEncoder();
const b64u = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64u = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

function secret() {
  const s = process.env["MCP_SECRET_KEY"];
  if (!s || s.length < 24) throw new Error("MCP_SECRET_KEY is not configured");
  return s;
}
async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export type Kind = "client" | "code" | "access" | "refresh";
export async function sign(kind: Kind, payload: Record<string, unknown>, ttlSec?: number) {
  const body = b64u(enc.encode(JSON.stringify({ ...payload, k: kind, ...(ttlSec ? { exp: Math.floor(Date.now() / 1000) + ttlSec } : {}) })));
  return `${body}.${await hmac(body)}`;
}
export async function verify(kind: Kind, token: string | null | undefined): Promise<Record<string, any> | null> {
  if (!token || token.length > 8000) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!safeEqual(sig, await hmac(body))) return null;
    const p = JSON.parse(fromB64u(body));
    if (p.k !== kind) return null;
    if (p.exp && p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}

export async function pkceS256(verifier: string) {
  return b64u(await crypto.subtle.digest("SHA-256", enc.encode(verifier)));
}

/** Claude web/desktop callbacks plus loopback redirects for local MCP clients. */
export function allowedRedirect(uri: string) {
  try {
    const u = new URL(uri);
    if (u.protocol === "https:" && ["claude.ai", "claude.com"].includes(u.hostname)) return true;
    if (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)) return true;
    return false;
  } catch { return false; }
}

/** Public origin as seen by the client (honours the custom-domain proxy headers). */
export function publicOrigin(request: Request) {
  const u = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? u.host;
  const proto = request.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  return `${host.startsWith("localhost") ? proto : "https"}://${host}`;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Accept",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};
export const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { ...CORS, "Cache-Control": "no-store", ...extra } });
export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function resourceMetadata(origin: string) {
  return { resource: `${origin}/api/public/mcp`, authorization_servers: [origin], bearer_methods_supported: ["header"], resource_name: "Planted Protein Pages" };
}
export function serverMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/public/oauth/token`,
    registration_endpoint: `${origin}/api/public/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
  };
}
