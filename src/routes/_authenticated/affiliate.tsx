import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { affiliateMe, type AffiliateRow } from "@/lib/affiliates.functions";

export const Route = createFileRoute("/_authenticated/affiliate")({
  component: AffiliatePage,
  head: () => ({
    meta: [
      { title: "Affiliate dashboard · PrimeDownloads" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function AffiliatePage() {
  const [row, setRow] = useState<AffiliateRow | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    affiliateMe().then(setRow).catch(() => setRow(null));
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/auth";
  };

  if (row === undefined)
    return <div className="grid min-h-screen place-items-center bg-cream text-charcoal/60">Loading…</div>;

  if (!row) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl italic text-forest-deep">No affiliate account</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            This email is not registered as an affiliate. Please contact the site owner.
          </p>
          <button
            onClick={logout}
            className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const link = `https://primedownloads.store/?ref=${row.code}`;
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <header className="border-b border-forest/10 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
              PrimeDownloads
            </p>
            <h1 className="font-display text-2xl italic text-forest-deep">
              Affiliate dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-charcoal/60">{row.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-forest/20 px-4 py-2 font-semibold text-charcoal/70 hover:bg-forest/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {row.disabled && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Your affiliate account is currently disabled.
          </div>
        )}

        <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
            Your referral link
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg bg-forest/5 px-4 py-3 text-sm text-forest-deep">
              {link}
            </code>
            <button
              onClick={copy}
              className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream hover:bg-forest-deep"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
          <p className="mt-3 text-xs text-charcoal/60">
            Code: <span className="font-mono font-semibold">{row.code}</span> · Commission: {row.commission_pct}%
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Clicks" value={row.clicks} />
          <Stat label="Sales" value={row.sales} />
          <Stat label="Revenue generated" value={`$${row.revenue.toFixed(2)}`} />
          <Stat label="Commission earned" value={`$${row.commission_total.toFixed(2)}`} />
          <Stat label="Pending commission" value={`$${row.commission_pending.toFixed(2)}`} />
          <Stat label="Paid commission" value={`$${row.commission_paid.toFixed(2)}`} />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal/50">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl italic text-forest-deep">{value}</p>
    </div>
  );
}