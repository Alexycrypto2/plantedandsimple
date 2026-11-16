import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { approveMcpClient, describeMcpClient } from "@/lib/mcp-server/oauth.functions";
import { Button } from "@/components/ui/button";

const KEY = "mcp_oauth_request";
type Req = { client_id: string; redirect_uri: string; code_challenge: string; code_challenge_method: string; state?: string };

export const Route = createFileRoute("/oauth/authorize")({
  head: () => ({ meta: [
    { title: "Connect Claude · PlantedAndSimple" },
    { name: "description", content: "Approve a Claude connection to manage PlantedAndSimple content." },
    { property: "og:title", content: "Connect Claude · PlantedAndSimple" },
    { property: "og:description", content: "Approve a Claude connection to manage PlantedAndSimple content." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AuthorizePage,
});

function AuthorizePage() {
  const [req, setReq] = useState<Req | null>(null);
  const [client, setClient] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    let r: Req | null = null;
    if (q.get("client_id")) {
      r = { client_id: q.get("client_id")!, redirect_uri: q.get("redirect_uri") ?? "", code_challenge: q.get("code_challenge") ?? "", code_challenge_method: q.get("code_challenge_method") ?? "S256", state: q.get("state") ?? undefined };
      sessionStorage.setItem(KEY, JSON.stringify(r));
    } else {
      try { r = JSON.parse(sessionStorage.getItem(KEY) ?? "null"); } catch { r = null; }
    }
    setReq(r);
    if (r) describeMcpClient({ data: { client_id: r.client_id } }).then((c) => setClient(c?.name ?? null)).catch(() => setClient(null));
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const decide = async (approve: boolean) => {
    if (!req || busy) return;
    setBusy(true); setErr(null);
    try {
      const out = await approveMcpClient({ data: { ...req, code_challenge_method: "S256", approve } });
      sessionStorage.removeItem(KEY);
      window.location.href = out.redirect;
    } catch (e: any) { setErr(e?.message ?? "Could not complete the connection"); setBusy(false); }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">PlantedAndSimple</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Connect {client ?? "Claude"}</h1>
        {!req ? (
          <p className="mt-4 text-muted-foreground">This page opens from Claude when you add the connector. Start again from Claude.</p>
        ) : req.code_challenge_method !== "S256" || !req.code_challenge ? (
          <p className="mt-4 text-destructive">This request is missing its security check. Start again from Claude.</p>
        ) : email === undefined ? (
          <p className="mt-4 text-muted-foreground">Checking your sign-in…</p>
        ) : email === null ? (
          <>
            <p className="mt-4 text-muted-foreground">Sign in with your admin account to approve this connection.</p>
            <Button asChild className="mt-6 w-full"><Link to="/auth" search={{ next: "/oauth/authorize" }}>Sign in</Link></Button>
          </>
        ) : (
          <>
            <p className="mt-4 text-muted-foreground">Signed in as <strong className="text-foreground">{email}</strong>. Claude will be able to read, draft and edit your recipes and blog posts. Every edit saves a rollback copy first.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>Deny</Button>
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>{busy ? "Connecting…" : "Approve"}</Button>
            </div>
          </>
        )}
        {err ? <p className="mt-4 text-sm text-destructive">{err}</p> : null}
      </div>
    </main>
  );
}
