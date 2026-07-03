import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  adminVerifyPassword,
  adminListReviews,
  adminSetReviewApproval,
  adminDeleteReview,
  adminDeleteReviewPhoto,
  adminListBuyers,
  type AdminReview,
  type BuyerRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin · PlantedAndSimple" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const STORAGE_KEY = "ps_admin_password";

function AdminPage() {
  const [password, setPassword] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<"reviews" | "buyers">("reviews");

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    adminVerifyPassword({ data: { password: stored } })
      .then((res) => {
        if (res.ok) {
          setPassword(stored);
          setAuthed(true);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setChecking(false));
  }, []);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await adminVerifyPassword({ data: { password } });
      if (res.ok) {
        sessionStorage.setItem(STORAGE_KEY, password);
        setAuthed(true);
      } else {
        setLoginError("Incorrect password.");
      }
    } catch {
      setLoginError("Could not verify. Try again.");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-charcoal/60">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-2xl border border-forest/10 bg-white p-8 shadow-lg"
        >
          <h1 className="font-display text-2xl italic text-forest-deep">
            Admin access
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Enter the admin password to continue.
          </p>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-5 w-full rounded-lg border border-forest/20 bg-white px-3 py-2 outline-none focus:border-forest"
            placeholder="Password"
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <header className="border-b border-forest/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
              PlantedAndSimple
            </p>
            <h1 className="font-display text-2xl italic text-forest-deep">
              Admin dashboard
            </h1>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-6">
          {(["reviews", "buyers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold capitalize ${
                tab === t
                  ? "border-forest text-forest"
                  : "border-transparent text-charcoal/50 hover:text-charcoal"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "reviews" ? (
          <ReviewsPanel password={password} />
        ) : (
          <BuyersPanel password={password} />
        )}
      </main>
    </div>
  );
}

function ReviewsPanel({ password }: { password: string }) {
  const [rows, setRows] = useState<AdminReview[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">(
    "pending",
  );

  const load = () => {
    setErr(null);
    adminListReviews({ data: { password } })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  };

  useEffect(load, [password]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-charcoal/60">Loading reviews…</p>;

  const filtered = rows.filter((r) =>
    filter === "all"
      ? true
      : filter === "approved"
        ? r.approved
        : !r.approved,
  );

  const counts = {
    pending: rows.filter((r) => !r.approved).length,
    approved: rows.filter((r) => r.approved).length,
    all: rows.length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              filter === f
                ? "bg-forest text-cream"
                : "border border-forest/20 text-charcoal/70 hover:bg-forest/5"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-charcoal/60">No reviews in this view.</p>
      )}

      <div className="grid gap-4">
        {filtered.map((r) => (
          <ReviewCard key={r.id} row={r} password={password} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  row,
  password,
  onChange,
}: {
  row: AdminReview;
  password: string;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChange();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {row.photo_signed_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={row.photo_signed_url}
            alt={`Photo from ${row.name}`}
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-forest/20"
          />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-sage/15 text-lg text-forest">
            {row.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-charcoal">{row.name}</p>
            {(row.country || row.location) && (
              <p className="text-xs text-charcoal/50">
                · {row.country || row.location}
              </p>
            )}
            <span className="text-forest">
              {"★".repeat(row.rating)}
              <span className="text-charcoal/20">
                {"★".repeat(5 - row.rating)}
              </span>
            </span>
            {row.approved ? (
              <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest">
                Approved
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                Pending
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal/85">
            {row.quote}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
            {new Date(row.created_at).toLocaleString()} · txn{" "}
            {row.stripe_session_id ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-forest/10 pt-4">
        {row.approved ? (
          <button
            disabled={busy}
            onClick={() =>
              wrap(() =>
                adminSetReviewApproval({
                  data: { password, id: row.id, approved: false },
                }),
              )
            }
            className="rounded-full border border-amber-500 px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Unapprove
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() =>
              wrap(() =>
                adminSetReviewApproval({
                  data: { password, id: row.id, approved: true },
                }),
              )
            }
            className="rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-cream hover:bg-forest-deep disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {row.photo_path && (
          <button
            disabled={busy}
            onClick={() =>
              wrap(() =>
                adminDeleteReviewPhoto({ data: { password, id: row.id } }),
              )
            }
            className="rounded-full border border-forest/20 px-4 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-forest/5 disabled:opacity-50"
          >
            Remove photo
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => {
            if (!confirm("Delete this review permanently?")) return;
            wrap(() => adminDeleteReview({ data: { password, id: row.id } }));
          }}
          className="ml-auto rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function BuyersPanel({ password }: { password: string }) {
  const [rows, setRows] = useState<BuyerRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    setErr(null);
    adminListBuyers({ data: { password } })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [password]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-charcoal/60">Loading buyers…</p>;

  const filtered = q
    ? rows.filter((r) => r.email.toLowerCase().includes(q.toLowerCase()))
    : rows;

  const copyAll = () => {
    navigator.clipboard.writeText(filtered.map((r) => r.email).join(", "));
  };

  const downloadCsv = () => {
    const header = "email,transaction_id,purchased_at,downloads,last_downloaded_at\n";
    const body = filtered
      .map((r) =>
        [
          r.email,
          r.transaction_id,
          r.purchased_at,
          r.download_count,
          r.last_downloaded_at ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buyers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email…"
          className="w-full max-w-xs rounded-full border border-forest/20 bg-white px-4 py-2 text-sm outline-none focus:border-forest"
        />
        <p className="text-sm text-charcoal/60">
          {filtered.length} buyer{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="ml-auto flex gap-2">
          <button
            onClick={copyAll}
            className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Copy emails
          </button>
          <button
            onClick={downloadCsv}
            className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream hover:bg-forest-deep"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-charcoal/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Downloads</th>
              <th className="px-4 py-3">Last download</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/5">
            {filtered.map((r) => (
              <tr key={r.transaction_id} className="hover:bg-forest/5">
                <td className="px-4 py-3 font-medium text-charcoal">
                  {r.email}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {new Date(r.purchased_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {r.download_count}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {r.last_downloaded_at
                    ? new Date(r.last_downloaded_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${r.email}?subject=${encodeURIComponent(
                      "About your PlantedAndSimple cookbook",
                    )}`}
                    className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-cream hover:bg-forest-deep"
                  >
                    Email
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-charcoal/50"
                >
                  No buyers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}