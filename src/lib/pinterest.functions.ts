import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PinterestStatus = {
  connected: boolean;
  username: string | null;
  expires_at: string | null;
  scopes: string | null;
  redirect_uri: string;
  credentials_configured: boolean;
  redirect_audit: {
    registered_uri: string | null;
    exact_match: boolean | null;
    issue: string | null;
  };
};

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss")) throw new Error("Forbidden");
}

export const pinterestStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PinterestStatus> => {
    await requireBoss(context.supabase, context.userId);
    const { pinterestRedirectUri } = await import("./pinterest.server");
    const { getConfig } = await import("./settings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("pinterest_accounts")
      .select("username, expires_at, scopes")
      .eq("user_id", context.userId)
      .maybeSingle();
    const id = await getConfig("PINTEREST_CLIENT_ID");
    const secret = await getConfig("PINTEREST_CLIENT_SECRET");
    const redirectUri = await pinterestRedirectUri();
    const registeredUri = await getConfig("PINTEREST_REGISTERED_REDIRECT_URI");
    const exactMatch = registeredUri ? registeredUri === redirectUri : null;
    let issue: string | null = null;
    if (!registeredUri) issue = "Paste the callback URL currently saved in your Pinterest app below to run the exact comparison.";
    else if (!exactMatch) {
      const configuredHost = new URL(redirectUri).host;
      const registeredHost = (() => {
        try { return new URL(registeredUri).host; } catch { return "invalid URL"; }
      })();
      issue = configuredHost !== registeredHost
        ? `Domain mismatch: this app sends ${configuredHost}, but Pinterest is configured for ${registeredHost}.`
        : "The values differ by path, protocol, capitalization, query text, or a trailing slash.";
    }
    return {
      connected: Boolean(data),
      username: data?.username ?? null,
      expires_at: data?.expires_at ?? null,
      scopes: data?.scopes ?? null,
      redirect_uri: redirectUri,
      credentials_configured: Boolean(id && secret),
      redirect_audit: { registered_uri: registeredUri, exact_match: exactMatch, issue },
    };
  });

export const pinterestAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: string }) => ({ origin: String(d.origin || "") }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { pinterestCredentials, pinterestRedirectUri, persistOAuthState, PINTEREST_SCOPES, PINTEREST_STATE_COOKIE, pinLog } =
      await import("./pinterest.server");
    const { signState } = await import("./crypto.server");
    const { setCookie } = await import("@tanstack/react-start/server");
    const { clientId } = await pinterestCredentials();
    const redirectUri = await pinterestRedirectUri();
    const nonce = crypto.randomUUID();
    const state = signState({ uid: context.userId, origin: data.origin, n: nonce });
    pinLog("authorize:state-created", { created: Boolean(state), stateLength: state.length });
    await persistOAuthState(state, context.userId, redirectUri);

    // Second factor: the same nonce in a first-party cookie, so a callback cannot be
    // replayed or opened directly without the session that started the flow.
    setCookie(PINTEREST_STATE_COOKIE, nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    pinLog("authorize:cookie-set", { persisted: true, host: "www.primedownloads.store", maxAgeSeconds: 15 * 60 });

    const url = new URL("https://www.pinterest.com/oauth/");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", PINTEREST_SCOPES);
    url.searchParams.set("state", state);
    pinLog("authorize:generated", { redirectUri, clientIdTail: clientId.slice(-4), stateLength: state.length, statePersisted: true });
    return { url: url.toString(), redirect_uri: redirectUri };
  });

export const pinterestDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("pinterest_accounts").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const pinterestBoards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { getAccessToken, pinterestFetch } = await import("./pinterest.server");
    const token = await getAccessToken(context.userId);
    if (!token) return [] as { id: string; name: string }[];
    const res = await pinterestFetch(token, "/boards?page_size=50");
    return ((res?.items ?? []) as any[]).map((b) => ({ id: b.id, name: b.name }));
  });