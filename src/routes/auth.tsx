import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · PlantedAndSimple" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function safeNext(next: string | undefined): string {
  if (!next) return "/admin";
  try {
    // Only accept same-origin relative paths.
    if (next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    /* ignore */
  }
  return "/admin";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const dest = safeNext(next);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: dest });
    });
  }, [dest, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo("If an account exists for that email, a password-reset link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setInfo(
          "Account created. If email verification is required, check your inbox before signing in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: dest });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) {
        setErr(
          result.error instanceof Error
            ? result.error.message
            : "Google sign-in failed",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-12 font-sans text-charcoal">
      <div className="w-full max-w-md rounded-2xl border border-forest/10 bg-white p-8 shadow-lg">
        <a
          href="/"
          className="font-display text-2xl font-bold italic text-forest"
        >
          Planted<span className="text-sage">&amp;</span>Simple
        </a>
        <h1 className="mt-4 font-display text-2xl italic text-forest-deep">
          {mode === "signin" ? "Sign in to admin" : "Create your admin account"}
        </h1>
        <p className="mt-1 text-sm text-charcoal/60">
          {mode === "signin"
            ? "Use your email and password, or continue with Google."
            : "Sign up with email and password, or continue with Google."}
        </p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-forest/20 bg-white px-6 py-3 text-sm font-semibold text-charcoal shadow-sm hover:bg-forest/5 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-charcoal/40">
          <span className="h-px flex-1 bg-forest/10" />
          or
          <span className="h-px flex-1 bg-forest/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-charcoal/70">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 outline-none focus:border-forest"
            />
          </label>
          {mode !== "reset" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-charcoal/70">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-forest/20 bg-white px-3 py-2 outline-none focus:border-forest"
              />
            </label>
          ) : null}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {info && <p className="text-sm text-forest">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        {mode === "signin" ? (
          <button
            type="button"
            onClick={() => {
              setErr(null);
              setInfo(null);
              setMode("reset");
            }}
            className="mt-4 w-full text-center text-xs font-semibold text-forest hover:underline"
          >
            Forgot password?
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setErr(null);
            setInfo(null);
            setMode(mode === "signin" || mode === "reset" ? "signup" : "signin");
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-charcoal/60 hover:text-forest"
        >
          {mode === "signin" || mode === "reset"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}