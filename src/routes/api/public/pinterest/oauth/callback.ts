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
          consumeOAuthState,
          pinterestStateHash,
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
            "Pinterest connection failed",
            "Pinterest OAuth session is missing or expired. Please start the connection again from Admin.",
          );
        }
        if (!state) return html("Pinterest connection failed", "Pinterest did not return the security state. Please start again.", "step: missing_state");
        const { recordOAuthStep } = await import("@/lib/pinterest.server");
        await recordOAuthStep(state, {
          status: code ? "callback_received" : "failed",
          failure_code: code ? null : "missing_code",
          step: { step: "callback_received", ok: Boolean(code), detail: code ? "Callback received code and state." : "Callback received state but no authorization code." },
        });
        if (!code) return html("Pinterest connection failed", "Pinterest did not return an authorization code.", "step: missing_code");

        const storedState = await consumeOAuthState(state);
        if (!storedState) {
          pinLog("callback:invalid-state", { stateLength: state.length });
          return html(
            "Pinterest connection failed",
            "The authorization state was not found, expired, or was already used. Start a fresh connection from Admin.",
            "step: stored_state_validation",
          );
        }

        // The cookie is a useful browser-origin diagnostic. Durable one-time state above
        // remains authoritative so www/apex browser redirects cannot silently lose OAuth.
        const cookieNonce =
          request.headers
            .get("cookie")
            ?.split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${PINTEREST_STATE_COOKIE}=`))
            ?.split("=")[1] ?? null;
        const cookieMatches = cookieNonce ? cookieNonce === pinterestStateHash(state) : null;
        pinLog("callback:cookie-check", { cookiePresent: Boolean(cookieNonce), cookieMatches });
        pinLog("callback:state-verified", {
          uid: storedState.userId,
          storedStateMatched: true,
          cookiePresent: Boolean(cookieNonce),
        });

        try {
          const redirectUri = storedState.redirectUri;
          const canonicalRedirectUri = await pinterestRedirectUri();
          if (redirectUri !== canonicalRedirectUri) {
            pinLog("callback:redirect-uri-mismatch", { stored: redirectUri, canonical: canonicalRedirectUri });
            return html(
              "Pinterest connection failed",
              "The callback URL changed after this connection started. Start a fresh connection.",
              "step: redirect_uri_consistency",
            );
          }
          const tokens = await exchangeCode(code, redirectUri, state);
          let username: string | null = null;
          try {
            username = (await saveAccount(storedState.userId, tokens, state)).username;
          } catch (dbErr: any) {
            pinLog("callback:db-save-failed", { error: String(dbErr?.message ?? dbErr).slice(0, 300) });
            return html(
              "Pinterest connection failed",
              "We got your Pinterest token but could not save it.",
              `step: database_save — ${String(dbErr?.message ?? dbErr).slice(0, 240)}`,
            );
          }
          pinLog("callback:connected", { uid: storedState.userId, username, finalConnectionStatus: "connected" });
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