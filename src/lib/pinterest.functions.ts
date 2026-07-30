import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PinterestStatus = {
  connected: boolean;
  username: string | null;
  expires_at: string | null;
  scopes: string | null;
  redirect_uri: string;
  credentials_configured: boolean;
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
    return {
      connected: Boolean(data),
      username: data?.username ?? null,
      expires_at: data?.expires_at ?? null,
      scopes: data?.scopes ?? null,
      redirect_uri: pinterestRedirectUri("https://primedownloads.store"),
      credentials_configured: Boolean(id && secret),
    };
  });

export const pinterestAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: string }) => ({ origin: String(d.origin || "") }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { pinterestCredentials, pinterestRedirectUri, PINTEREST_SCOPES } = await import("./pinterest.server");
    const { signState } = await import("./crypto.server");
    const { clientId } = await pinterestCredentials();
    const redirectUri = pinterestRedirectUri(data.origin);
    const state = signState({ uid: context.userId, origin: data.origin });
    const url = new URL("https://www.pinterest.com/oauth/");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", PINTEREST_SCOPES);
    url.searchParams.set("state", state);
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