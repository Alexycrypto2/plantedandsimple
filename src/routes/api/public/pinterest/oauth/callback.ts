import { createFileRoute } from "@tanstack/react-router";

function html(title: string, body: string, detail?: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font-family:system-ui;background:#FAF8F3;color:#2b2b2b;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div style="max-width:520px;padding:24px"><h1 style="color:#2E5E3B">${title}</h1><p>${body}</p>${
      detail
        ? `<p style="font:12px ui-monospace,monospace;color:#7a7a7a;background:#fff;border-radius:12px;padding:12px;text-align:left">${detail}</p>`
        : ""
    }<p><a href="/admin" style="color:#2E5E3B">Back to admin</a></p></div></body>`,
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

        const {
          exchangeCode,
          pinterestRedirectUri,
          saveAccount,
          pinLog,
          PINTEREST_STATE_COOKIE,
        } = await import("@/lib/pinterest.server");

        pinLog("callback:received", {
          host: url.host,
          hasCode: Boolean(code),
          hasState: Boolean(state),
          error,
          params: [...url.searchParams.keys()],
        });

        if (error) {
          return html("Pinterest connection failed", "Pinterest rejected the authorization.", error);
        }
        if (!code && !state) {
          pinLog("callback:direct-access");
          return html(
            "Nothing to connect here",
            "This page only works at the end of a Pinterest sign-in. Start from Admin → Pinterest → Connect Pinterest.",
          );
        }
        if (!state) return html("Pinterest connection failed", "Pinterest did not return the state value.", "step: missing_state");
        if (!code) return html("Pinterest connection failed", "Pinterest did not return an authorization code.", "step: missing_code");

        const { verifyState } = await import("@/lib/crypto.server");
        const parsed = verifyState<{ uid: string; origin: string; n?: string }>(state);
        if (!parsed?.uid) {
          pinLog("callback:invalid-state", { stateLength: state.length });
          return html(
            "Pinterest connection failed",
            "That sign-in link is invalid or older than 15 minutes. Click Connect Pinterest again.",
            "step: invalid_state",
          );
        }

        // Cookie must match the nonce baked into the signed state.
        const cookieNonce =
          request.headers
            .get("cookie")
            ?.split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${PINTEREST_STATE_COOKIE}=`))
            ?.split("=")[1] ?? null;
        if (parsed.n && cookieNonce && cookieNonce !== parsed.n) {
          pinLog("callback:nonce-mismatch", {});
          return html(
            "Pinterest connection failed",
            "This sign-in did not start in this browser. Please try connecting again.",
            "step: state_cookie_mismatch",
          );
        }
        pinLog("callback:state-verified", { uid: parsed.uid, cookiePresent: Boolean(cookieNonce) });

        try {
          const redirectUri = await pinterestRedirectUri();
          const tokens = await exchangeCode(code, redirectUri);
          let username: string | null = null;
          try {
            username = (await saveAccount(parsed.uid, tokens)).username;
          } catch (dbErr: any) {
            pinLog("callback:db-save-failed", { error: String(dbErr?.message ?? dbErr).slice(0, 300) });
            return html(
              "Pinterest connection failed",
              "We got your Pinterest token but could not save it.",
              `step: database_save — ${String(dbErr?.message ?? dbErr).slice(0, 240)}`,
            );
          }
          pinLog("callback:connected", { uid: parsed.uid, username });
          return html(
            "Pinterest connected",
            `Your account${username ? ` @${username}` : ""} is now linked to PrimeDownloads.`,
          );
        } catch (e: any) {
          return html(
            "Pinterest connection failed",
            "Pinterest would not exchange the authorization code.",
            `step: token_exchange — ${String(e?.message ?? e).slice(0, 280)}`,
          );
        }
      },
    },
  },
});