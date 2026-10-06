import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password · PlantedAndSimple" },
      { name: "description", content: "Set a new password for your PlantedAndSimple account." },
      { property: "og:title", content: "Reset password · PlantedAndSimple" },
      { property: "og:description", content: "Set a new password for your PlantedAndSimple account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const hasRecoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !hasRecoveryLink || !data.session) {
        setError("This password-reset link is invalid or has expired. Request a new one from the sign-in page.");
      } else {
        setReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    window.history.replaceState({}, document.title, "/reset-password");
    window.setTimeout(() => navigate({ to: "/admin", replace: true }), 1200);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 py-12 text-charcoal">
      <section className="w-full max-w-md rounded-2xl border border-forest/10 bg-white p-8 shadow-lg">
        <a href="/" className="font-display text-2xl font-bold italic text-forest">
          Planted<span className="text-sage">&amp;</span>Simple
        </a>
        <h1 className="mt-5 font-display text-3xl italic text-forest-deep">Choose a new password</h1>
        {ready && !success ? (
          <form onSubmit={savePassword} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-charcoal/70">New password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-forest/20 bg-white px-3 py-3 outline-none focus:border-forest"
              />
            </label>
            {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : null}
        {success ? <p className="mt-5 text-sm text-forest">Password updated. Opening your admin dashboard…</p> : null}
        {!ready && !success ? <p role="alert" className="mt-5 text-sm text-red-600">{error ?? "Checking your reset link…"}</p> : null}
        {error && !ready ? (
          <a href="/auth" className="mt-5 inline-block text-sm font-semibold text-forest hover:underline">
            Return to sign in
          </a>
        ) : null}
      </section>
    </main>
  );
}