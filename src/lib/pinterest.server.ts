import { createHash } from "node:crypto";
import { decrypt, encrypt } from "./crypto.server";

export const PINTEREST_SCOPES = "boards:read,boards:write,pins:read,pins:write,user_accounts:read";
export const PINTEREST_API = "https://api.pinterest.com/v5";
export const PINTEREST_STATE_COOKIE = "pin_oauth_state";
export const DEFAULT_PINTEREST_REDIRECT_URI =
  "https://primedownloads.store/api/public/pinterest/oauth/callback";

/**
 * The redirect URI must be byte-identical in the authorize request, on the Pinterest
 * app config, and in the token exchange. So it is ONE canonical value, overridable in
 * Settings → Integrations, never derived from the browser origin.
 */
export async function pinterestRedirectUri(): Promise<string> {
  const configured = process.env["PINTEREST_REDIRECT_URI"]?.trim();
  if (configured && configured !== DEFAULT_PINTEREST_REDIRECT_URI) {
    pinLog("configuration:redirect-rejected", { configured, required: DEFAULT_PINTEREST_REDIRECT_URI });
  }
  return DEFAULT_PINTEREST_REDIRECT_URI;
}

export function pinLog(step: string, fields: Record<string, unknown> = {}) {
  console.log(`[pinterest-oauth] ${step} ${JSON.stringify(fields)}`);
}

export async function pinterestCredentials() {
  const clientId = process.env["PINTEREST_CLIENT_ID"]?.trim();
  const clientSecret = process.env["PINTEREST_CLIENT_SECRET"]?.trim();
  if (!clientId || !clientSecret) throw new Error("Pinterest app credentials are not configured");
  if (clientId !== "1595595") throw new Error("Pinterest App ID must be 1595595");
  return { clientId, clientSecret };
}

export type OAuthDiagnosticStep = {
  step: string;
  ok: boolean;
  at: string;
  detail?: string;
  status?: number;
};

async function updateOAuthAttempt(
  stateHash: string,
  update: { status?: string; failure_code?: string | null; step?: Omit<OAuthDiagnosticStep, "at"> },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("pinterest_oauth_states")
    .select("diagnostics")
    .eq("state_hash", stateHash)
    .maybeSingle();
  const diagnostics = Array.isArray(data?.diagnostics) ? data.diagnostics : [];
  if (update.step) diagnostics.push({ ...update.step, at: new Date().toISOString() });
  await (supabaseAdmin as any)
    .from("pinterest_oauth_states")
    .update({
      diagnostics: diagnostics.slice(-20),
      ...(update.status ? { status: update.status } : {}),
      ...(update.failure_code !== undefined ? { failure_code: update.failure_code } : {}),
    })
    .eq("state_hash", stateHash);
}

export async function recordOAuthStep(
  state: string,
  update: { status?: string; failure_code?: string | null; step: Omit<OAuthDiagnosticStep, "at"> },
) {
  await updateOAuthAttempt(pinterestStateHash(state), update);
}

function sanitizePinterestResponse(text: string): string {
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    for (const key of ["access_token", "refresh_token", "client_secret"]) {
      if (key in value) value[key] = "[redacted]";
    }
    return JSON.stringify(value).slice(0, 600);
  } catch {
    return text.replace(/(access_token|refresh_token|client_secret)["'=:\s]+[^\s,"'}]+/gi, "$1=[redacted]").slice(0, 600);
  }
}

async function tokenRequest(body: URLSearchParams, state?: string) {
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
  pinLog("token-exchange:response", {
    status: res.status,
    ok: res.ok,
    response: sanitizePinterestResponse(text),
  });
  if (state) {
    await recordOAuthStep(state, {
      status: res.ok ? "token_exchanged" : "failed",
      failure_code: res.ok ? null : "token_exchange_failed",
      step: {
        step: "token_exchange",
        ok: res.ok,
        status: res.status,
        detail: res.ok ? "Pinterest accepted the authorization code." : sanitizePinterestResponse(text),
      },
    });
  }
  if (!res.ok) throw new Error(`Pinterest token ${res.status}: ${sanitizePinterestResponse(text)}`);
  return JSON.parse(text) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    scope?: string;
  };
}

export function pinterestStateHash(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export async function persistOAuthState(state: string, userId: string, redirectUri: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stateHash = pinterestStateHash(state);
  const { error } = await (supabaseAdmin as any).from("pinterest_oauth_states").insert({
    state_hash: stateHash,
    user_id: userId,
    redirect_uri: redirectUri,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: "authorization_generated",
    diagnostics: [
      { step: "state_created", ok: true, at: new Date().toISOString(), detail: "Secure one-time state created." },
      { step: "state_persisted", ok: true, at: new Date().toISOString(), detail: "State saved server-side for 15 minutes." },
      { step: "redirect_generated", ok: true, at: new Date().toISOString(), detail: redirectUri },
    ],
  });
  pinLog("authorize:state-persisted", { persisted: !error, stateHashTail: stateHash.slice(-8) });
  if (error) throw new Error(`Could not persist Pinterest OAuth state: ${error.message}`);
}

export async function consumeOAuthState(state: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const stateHash = pinterestStateHash(state);
  const { data, error } = await (supabaseAdmin as any)
    .from("pinterest_oauth_states")
    .select("user_id, redirect_uri, expires_at, consumed_at")
    .eq("state_hash", stateHash)
    .maybeSingle();
  const valid = Boolean(
    !error &&
      data &&
      !data.consumed_at &&
      new Date(data.expires_at).getTime() > Date.now(),
  );
  pinLog("callback:state-storage-check", {
    found: Boolean(data),
    expired: data ? new Date(data.expires_at).getTime() <= Date.now() : null,
    alreadyConsumed: Boolean(data?.consumed_at),
    valid,
    stateHashTail: stateHash.slice(-8),
  });
  if (!valid) {
    if (data) {
      await updateOAuthAttempt(stateHash, {
        status: "failed",
        failure_code: data.consumed_at ? "state_already_used" : "state_expired",
        step: { step: "state_validation", ok: false, detail: data.consumed_at ? "State was already used." : "State expired." },
      });
    }
    return null;
  }
  const consumedAt = new Date().toISOString();
  const { data: consumed, error: consumeError } = await (supabaseAdmin as any)
    .from("pinterest_oauth_states")
    .update({ consumed_at: consumedAt })
    .eq("state_hash", stateHash)
    .is("consumed_at", null)
    .select("redirect_uri")
    .maybeSingle();
  if (consumeError || !consumed) return null;
  await updateOAuthAttempt(stateHash, {
    status: "state_validated",
    failure_code: null,
    step: { step: "state_validation", ok: true, detail: "Returned state matched the stored one-time state." },
  });
  return { redirectUri: consumed.redirect_uri as string, userId: data.user_id as string };
}

export async function exchangeCode(code: string, redirectUri: string, state?: string) {
  pinLog("token-exchange:start", { redirectUri, codeLength: code.length });
  try {
    const tokens = await tokenRequest(
      new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      state,
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

export async function saveAccount(userId: string, tokens: Awaited<ReturnType<typeof exchangeCode>>, state?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let username: string | null = null;
  let pinterestUserId: string | null = null;
  let accountName: string | null = null;
  let profileStatus: "loaded" | "failed" = "loaded";
  try {
    const me = await pinterestFetch(tokens.access_token, "/user_account");
    username = me?.username ?? null;
    pinterestUserId = me?.id ?? null;
    accountName = me?.business_name ?? me?.first_name ?? null;
  } catch (error) {
    profileStatus = "failed";
    pinLog("account-profile:failed", { error: String(error instanceof Error ? error.message : error).slice(0, 300) });
  }
  const row = {
    user_id: userId,
    pinterest_user_id: pinterestUserId,
    username,
    access_token_ciphertext: encrypt(tokens.access_token),
    refresh_token_ciphertext: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    token_type: tokens.token_type ?? "bearer",
    expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    refresh_expires_at: tokens.refresh_token_expires_in
      ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString()
      : null,
    scopes: tokens.scope ?? PINTEREST_SCOPES,
    account_name: accountName,
    connection_status: "connected",
    last_error: null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await (supabaseAdmin as any)
    .from("pinterest_accounts")
    .upsert(row, { onConflict: "user_id" });
  pinLog("database-save:result", { ok: !error, profileStatus, hasUsername: Boolean(username), error: error?.message ?? null });
  if (state) {
    await recordOAuthStep(state, {
      status: error ? "failed" : "completed",
      failure_code: error ? "database_save_failed" : null,
      step: { step: "database_save", ok: !error, detail: error ? error.message : "Encrypted connection credentials saved." },
    });
    if (!error) {
      await recordOAuthStep(state, {
        status: "completed",
        failure_code: null,
        step: { step: "oauth_completed", ok: true, detail: username ? `Connected as @${username}.` : "Pinterest account connected." },
      });
    }
  }
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
    let tokens: Awaited<ReturnType<typeof refreshToken>>;
    try {
      tokens = await refreshToken(decrypt(data.refresh_token_ciphertext));
    } catch (error) {
      await (supabaseAdmin as any).from("pinterest_accounts").update({
        connection_status: "reconnect_required",
        last_error: "Pinterest authorization expired or was revoked.",
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
      throw new Error("Pinterest needs to be reconnected.");
    }
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
        refresh_expires_at: tokens.refresh_token_expires_in
          ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString()
          : data.refresh_expires_at,
        token_type: tokens.token_type ?? data.token_type ?? "bearer",
        connection_status: "connected",
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return tokens.access_token;
  }
  return decrypt(data.access_token_ciphertext);
}