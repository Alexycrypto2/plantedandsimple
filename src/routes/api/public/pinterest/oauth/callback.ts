import { createFileRoute } from "@tanstack/react-router";

function html(title: string, body: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font-family:system-ui;background:#FAF8F3;color:#2b2b2b;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h1 style="color:#2E5E3B">${title}</h1><p>${body}</p><p><a href="/admin" style="color:#2E5E3B">Back to admin</a></p></div></body>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/pinterest/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        if (error) return html("Pinterest connection failed", error);
        if (!code || !state) return html("Pinterest connection failed", "Missing code or state.");

        const { verifyState } = await import("@/lib/crypto.server");
        const parsed = verifyState<{ uid: string; origin: string }>(state);
        if (!parsed?.uid) return html("Pinterest connection failed", "Invalid or expired state.");

        try {
          const { exchangeCode, pinterestRedirectUri, saveAccount } = await import("@/lib/pinterest.server");
          const redirectUri = pinterestRedirectUri(parsed.origin || url.origin);
          const tokens = await exchangeCode(code, redirectUri);
          const { username } = await saveAccount(parsed.uid, tokens);
          return html(
            "Pinterest connected",
            `Your account${username ? ` @${username}` : ""} is now linked to PrimeDownloads.`,
          );
        } catch (e: any) {
          return html("Pinterest connection failed", String(e?.message ?? e).slice(0, 300));
        }
      },
    },
  },
});