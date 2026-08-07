import { decrypt, encrypt } from "./crypto.server";
import { getConfig } from "./settings.server";

export const PINTEREST_SCOPES = "boards:read,pins:read,pins:write,user_accounts:read";
export const PINTEREST_API = "https://api.pinterest.com/v5";
export const PINTEREST_STATE_COOKIE = "pin_oauth_state";
export const DEFAULT_PINTEREST_REDIRECT_URI =
  "https://primedownloads.store";

/**
 * The redirect URI must be byte-identical in the authorize request, on the Pinterest
 * app config, and in the token exchange. So it is ONE canonical value, overridable in
 * Settings → Integrations, never derived from the browser origin.
 */
export async function pinterestRedirectUri(): Promise<string> {
  const configured = (await getConfig("PINTEREST_REDIRECT_URI"))?.trim();
  // Pinterest compares this byte-for-byte. Preserve a configured trailing slash
  // instead of silently changing the value the editor copied from Pinterest.
  return configured || DEFAULT_PINTEREST_REDIRECT_URI;
}

export function pinLog(step: string, fields: Record<string, unknown> = {}) {
  console.log(`[pinterest-oauth] ${step} ${JSON.stringify(fields)}`);
}

export async function pinterestCredentials() {
  const clientId = await getConfig("PINTEREST_CLIENT_ID");
  const clientSecret = await getConfig("PINTEREST_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Pinterest app credentials are not configured");
  return { clientId, clientSecret };
}

async function tokenRequest(body: URLSearchParams) {
  const { clientId, clientSecret } = await pinterestCredentials();
  const res = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Pinterest token ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
}

export async function exchangeCode(code: string, redirectUri: string) {
  pinLog("token-exchange:start", { redirectUri, codeLength: code.length });
  try {
    const tokens = await tokenRequest(
      new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    );
    pinLog("token-exchange:ok", {
      hasRefresh: Boolean(tokens.refresh_token),
      expiresIn: tokens.expires_in ?? null,
      scope: tokens.scope ?? null,
    });
    return tokens;
  } catch (e: any) {
    pinLog("token-exchange:failed", { error: String(e?.message ?? e).slice(0, 400), redirectUri });
    throw e;
  }
}

export async function refreshToken(refresh: string) {
  return tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }));
}

export async function saveAccount(userId: string, tokens: Awaited<ReturnType<typeof exchangeCode>>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let username: string | null = null;
  let pinterestUserId: string | null = null;
  try {
    const me = await pinterestFetch(tokens.access_token, "/user_account");
    username = me?.username ?? null;
    pinterestUserId = me?.id ?? null;
  } catch {
    /* profile fetch is best-effort */
  }
  const row = {
    user_id: userId,
    pinterest_user_id: pinterestUserId,
    username,
    access_token_ciphertext: encrypt(tokens.access_token),
    refresh_token_ciphertext: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    scopes: tokens.scope ?? PINTEREST_SCOPES,
    updated_at: new Date().toISOString(),
  };
  const { error } = await (supabaseAdmin as any)
    .from("pinterest_accounts")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return { username };
}

export async function pinterestFetch(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`${PINTEREST_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Pinterest ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

/** Returns a valid access token for the connected account, refreshing when close to expiry. */
export async function getAccessToken(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("pinterest_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const needsRefresh = expiresAt && expiresAt - Date.now() < 5 * 60 * 1000;
  if (needsRefresh && data.refresh_token_ciphertext) {
    const tokens = await refreshToken(decrypt(data.refresh_token_ciphertext));
    await (supabaseAdmin as any)
      .from("pinterest_accounts")
      .update({
        access_token_ciphertext: encrypt(tokens.access_token),
        ...(tokens.refresh_token
          ? { refresh_token_ciphertext: encrypt(tokens.refresh_token) }
          : {}),
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return tokens.access_token;
  }
  return decrypt(data.access_token_ciphertext);
}