import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminMe,
  adminListReviews,
  adminSetReviewApproval,
  adminDeleteReview,
  adminDeleteReviewPhoto,
  adminListBuyers,
  adminSalesStats,
  adminListAdmins,
  adminAddAdminByEmail,
  adminRemoveAdmin,
  type AdminReview,
  type BuyerRow,
  type SalesStats,
  type AdminUserRow,
} from "@/lib/admin.functions";
import {
  adminListAffiliates,
  adminCreateAffiliate,
  adminUpdateAffiliate,
  adminDeleteAffiliate,
  adminListReferrals,
  adminSetReferralPaid,
  type AffiliateRow,
  type AffiliateReferral,
} from "@/lib/affiliates.functions";
import {
  adminGetPricing,
  adminUpdatePricing,
  type PublicPricing,
  type AdminUpdatePricingResult,
} from "@/lib/pricing.functions";
import {
  adminListProducts,
  adminUpsertProduct,
  adminDeleteProduct,
  adminUpsertCategory,
  adminDeleteCategory,
  listCategories,
  type AdminProduct,
  type Category,
} from "@/lib/products.functions";
import {
  adminListPosts,
  adminUpsertPost,
  adminDeletePost,
  type AdminPost,
} from "@/lib/blog.functions";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · PlantedAndSimple" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Me = { userId: string; email: string | null; roles: ("boss" | "admin")[] };
type Tab =
  | "overview"
  | "sales"
  | "products"
  | "categories"
  | "blog"
  | "reviews"
  | "buyers"
  | "pricing"
  | "affiliates"
  | "admins";

function AdminPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    adminMe()
      .then((res) => setMe(res as Me))
      .catch(() =>
        setErr(
          "You don't have access to the admin panel. Ask the boss to grant you access.",
        ),
      );
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (err) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl italic text-forest-deep">
            Access denied
          </h1>
          <p className="mt-2 text-sm text-charcoal/70">{err}</p>
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

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-charcoal/60">
        Loading…
      </div>
    );
  }

  const isBoss = me.roles.includes("boss");
  const tabs: Tab[] = isBoss
    ? [
        "overview",
        "sales",
        "products",
        "categories",
        "blog",
        "pricing",
        "reviews",
        "buyers",
        "affiliates",
        "admins",
      ]
    : ["sales"];
  const activeTab = tabs.includes(tab) ? tab : isBoss ? "overview" : "sales";

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* Floating hamburger — the only chrome on the page until the sidebar is opened */}
      <button
        onClick={() => setNavOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-full border border-forest/20 bg-white text-forest shadow-md hover:bg-forest/5"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Slide-in left sidebar */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-forest/10 bg-white shadow-xl transition-transform ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-forest/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-sage">
              PrimeDownloads
            </p>
            <p className="font-display text-lg italic text-forest-deep">
              Admin dashboard
            </p>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="grid size-8 place-items-center rounded-full text-charcoal/60 hover:bg-forest/5"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setNavOpen(false);
              }}
              className={`rounded-lg px-4 py-3 text-left text-sm font-semibold capitalize ${
                activeTab === t
                  ? "bg-forest text-cream"
                  : "text-charcoal/70 hover:bg-forest/5"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="border-t border-forest/10 p-4 text-xs">
          <p className="truncate text-charcoal/70">
            {me.email}
            <span className="ml-2 rounded-full bg-sage/20 px-2 py-0.5 font-semibold uppercase tracking-widest text-forest">
              {isBoss ? "boss" : "admin"}
            </span>
          </p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-full border border-forest/20 px-4 py-2 font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-6 pb-8 pt-20">
        {activeTab === "overview" && isBoss && <OverviewPanel />}
        {activeTab === "sales" && <SalesPanel />}
        {activeTab === "products" && isBoss && <ProductsPanel />}
        {activeTab === "categories" && isBoss && <CategoriesPanel />}
        {activeTab === "blog" && isBoss && <BlogPanel />}
        {activeTab === "reviews" && isBoss && <ReviewsPanel />}
        {activeTab === "buyers" && isBoss && <BuyersPanel />}
        {activeTab === "pricing" && isBoss && <PricingPanel />}
        {activeTab === "affiliates" && isBoss && <AffiliatesPanel />}
        {activeTab === "admins" && isBoss && <AdminsPanel meId={me.userId} />}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal/50">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl italic text-forest-deep">
        {value}
      </p>
    </div>
  );
}

function SalesPanel() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminSalesStats()
      .then(setStats)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!stats) return <p className="text-charcoal/60">Loading analytics…</p>;

  const maxSales = Math.max(1, ...stats.daily.map((d) => d.sales));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total sales" value={stats.total_sales} />
        <StatCard
          label="Revenue"
          value={`$${stats.total_revenue.toLocaleString()}`}
        />
        <StatCard label="Sales · 7 days" value={stats.sales_last_7_days} />
        <StatCard label="Sales · 30 days" value={stats.sales_last_30_days} />
        <StatCard label="Downloads" value={stats.total_downloads} />
        <StatCard label="Email subscribers" value={stats.subscribers} />
        <StatCard
          label="Reviews (approved / total)"
          value={`${stats.reviews_approved} / ${stats.reviews_total}`}
        />
        <StatCard
          label="Avg rating"
          value={
            stats.average_rating != null
              ? `${stats.average_rating.toFixed(2)} ★`
              : "—"
          }
        />
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          Last 14 days · daily sales
        </p>
        <div className="mt-4 flex h-40 items-end gap-2">
          {stats.daily.map((d) => (
            <div
              key={d.date}
              className="group flex flex-1 flex-col items-center justify-end"
              title={`${d.date}: ${d.sales} sale${d.sales === 1 ? "" : "s"}`}
            >
              <div
                className="w-full rounded-t bg-forest transition group-hover:bg-forest-deep"
                style={{ height: `${(d.sales / maxSales) * 100}%` }}
              />
              <span className="mt-1 hidden text-[10px] text-charcoal/50 sm:block">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          Quick links
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Open sales page ↗
          </a>
          <a
            href="/thank-you"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Thank-you page ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function ReviewsPanel() {
  const [rows, setRows] = useState<AdminReview[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const load = () => {
    setErr(null);
    adminListReviews()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  };

  useEffect(load, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-charcoal/60">Loading reviews…</p>;

  const filtered = rows.filter((r) =>
    filter === "all" ? true : filter === "approved" ? r.approved : !r.approved,
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
          <ReviewCard key={r.id} row={r} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  row,
  onChange,
}: {
  row: AdminReview;
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
                  data: { id: row.id, approved: false },
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
                  data: { id: row.id, approved: true },
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
              wrap(() => adminDeleteReviewPhoto({ data: { id: row.id } }))
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
            wrap(() => adminDeleteReview({ data: { id: row.id } }));
          }}
          className="ml-auto rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function BuyersPanel() {
  const [rows, setRows] = useState<BuyerRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    setErr(null);
    adminListBuyers()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-charcoal/60">Loading buyers…</p>;

  const filtered = q
    ? rows.filter((r) => r.email.toLowerCase().includes(q.toLowerCase()))
    : rows;

  const copyAll = () =>
    navigator.clipboard.writeText(filtered.map((r) => r.email).join(", "));

  const downloadCsv = () => {
    const header =
      "email,transaction_id,purchased_at,downloads,last_downloaded_at\n";
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
      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-sm">
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

function AdminsPanel({ meId }: { meId: string }) {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    setErr(null);
    adminListAdmins()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  };

  useEffect(load, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await adminAddAdminByEmail({ data: { email } });
      setMsg(`Added ${email} as admin.`);
      setEmail("");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to add admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          Invite an admin
        </p>
        <p className="mt-1 text-sm text-charcoal/60">
          They must first sign up at{" "}
          <a className="underline" href="/auth" target="_blank" rel="noreferrer">
            /auth
          </a>
          . Then enter their email below to grant admin access (sales analytics
          only).
        </p>
        <form onSubmit={onAdd} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@example.com"
            className="flex-1 rounded-full border border-forest/20 bg-white px-4 py-2 text-sm outline-none focus:border-forest"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-forest px-6 py-2 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add admin"}
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-charcoal/70">{msg}</p>}
      </div>

      {err && <p className="text-red-600">{err}</p>}
      {!rows ? (
        <p className="text-charcoal/60">Loading team…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-charcoal/60">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Since</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/5">
              {rows.map((r) => {
                const isBoss = r.roles.includes("boss");
                return (
                  <tr key={r.user_id}>
                    <td className="px-4 py-3 font-medium">
                      {r.email ?? r.user_id}
                    </td>
                    <td className="px-4 py-3">
                      {r.roles.map((role) => (
                        <span
                          key={role}
                          className={`mr-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                            role === "boss"
                              ? "bg-forest text-cream"
                              : "bg-sage/20 text-forest"
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isBoss && r.user_id !== meId && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Remove admin access for ${r.email}?`))
                              return;
                            try {
                              await adminRemoveAdmin({
                                data: { user_id: r.user_id },
                              });
                              load();
                            } catch (e) {
                              alert(
                                e instanceof Error ? e.message : "Failed",
                              );
                            }
                          }}
                          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AffiliatesPanel() {
  const [rows, setRows] = useState<AffiliateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pct, setPct] = useState(50);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setErr(null);
    adminListAffiliates()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  };
  useEffect(load, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateAffiliate({ data: { name, email, commission_pct: pct } });
      setName("");
      setEmail("");
      setPct(50);
      setCreating(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(`https://primedownloads.store/?ref=${code}`);
  };

  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-charcoal/60">Loading affiliates…</p>;

  const totalPending = rows.reduce((s, r) => s + r.commission_pending, 0);
  const totalPaid = rows.reduce((s, r) => s + r.commission_paid, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Affiliates" value={rows.length} />
        <StatCard label="Pending commission" value={`$${totalPending.toFixed(2)}`} />
        <StatCard label="Paid commission" value={`$${totalPaid.toFixed(2)}`} />
      </div>

      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          Affiliates
        </p>
        <button
          onClick={() => setCreating((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-xs font-semibold text-cream hover:bg-forest-deep"
        >
          {creating ? "Cancel" : "+ Add affiliate"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={create}
          className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-5 shadow-sm sm:grid-cols-4"
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-lg border border-forest/20 px-3 py-2 text-sm outline-none focus:border-forest sm:col-span-1"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="rounded-lg border border-forest/20 px-3 py-2 text-sm outline-none focus:border-forest sm:col-span-2"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              step="0.01"
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-20 rounded-lg border border-forest/20 px-3 py-2 text-sm outline-none focus:border-forest"
            />
            <span className="text-sm text-charcoal/60">%</span>
            <button
              type="submit"
              disabled={busy}
              className="ml-auto rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "…" : "Create"}
            </button>
          </div>
          <p className="text-xs text-charcoal/60 sm:col-span-4">
            A unique referral code and link are generated automatically. Ask the
            affiliate to sign up at <a className="underline" href="/auth">/auth</a>{" "}
            using this same email to access their dashboard at <code>/affiliate</code>.
          </p>
        </form>
      )}

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-forest/20 p-8 text-center text-charcoal/50">
            No affiliates yet.
          </p>
        )}
        {rows.map((a) => (
          <AffiliateCard
            key={a.id}
            row={a}
            open={openId === a.id}
            onToggle={() => setOpenId(openId === a.id ? null : a.id)}
            onCopy={() => copyLink(a.code)}
            onChange={load}
          />
        ))}
      </div>
    </div>
  );
}

function AffiliateCard({
  row,
  open,
  onToggle,
  onCopy,
  onChange,
}: {
  row: AffiliateRow;
  open: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [pct, setPct] = useState(row.commission_pct);
  const [busy, setBusy] = useState(false);
  const [refs, setRefs] = useState<AffiliateReferral[] | null>(null);

  useEffect(() => {
    if (open && refs === null) {
      adminListReferrals({ data: { affiliate_id: row.id } })
        .then(setRefs)
        .catch(() => setRefs([]));
    }
  }, [open, row.id, refs]);

  const wrap = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChange();
      setRefs(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const link = `https://primedownloads.store/?ref=${row.code}`;

  return (
    <div className="rounded-2xl border border-forest/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-charcoal">{row.name}</p>
            <span className="text-xs text-charcoal/50">{row.email}</span>
            <span className="rounded-full bg-forest/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-forest">
              {row.code}
            </span>
            {row.disabled && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                Disabled
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[10px] text-charcoal/50 truncate">{link}</p>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          <Metric label="Clicks" value={row.clicks} />
          <Metric label="Sales" value={row.sales} />
          <Metric label="Revenue" value={`$${row.revenue.toFixed(0)}`} />
          <Metric label="Comm" value={`$${row.commission_total.toFixed(0)}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCopy}
            className="rounded-full border border-forest/20 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            Copy link
          </button>
          <button
            onClick={onToggle}
            className="rounded-full border border-forest/20 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
          >
            {open ? "Close" : "View"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-forest/10 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-forest/20 px-3 py-1.5 text-sm" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-forest/20 px-3 py-1.5 text-sm" />
                <input type="number" min={1} max={100} step="0.01" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-20 rounded-lg border border-forest/20 px-3 py-1.5 text-sm" />
                <span className="text-sm text-charcoal/60">%</span>
                <button
                  disabled={busy}
                  onClick={() =>
                    wrap(async () => {
                      await adminUpdateAffiliate({
                        data: { id: row.id, name, email, commission_pct: pct },
                      });
                      setEditing(false);
                    })
                  }
                  className="rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-cream hover:bg-forest-deep"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-forest/20 px-4 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-charcoal/70">
                  Commission: <span className="font-semibold">{row.commission_pct}%</span>
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-forest/20 px-4 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
                >
                  Edit
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    wrap(() =>
                      adminUpdateAffiliate({
                        data: { id: row.id, disabled: !row.disabled },
                      }),
                    )
                  }
                  className="rounded-full border border-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                >
                  {row.disabled ? "Enable" : "Disable"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (!confirm(`Delete affiliate ${row.name}? Referrals will also be removed.`)) return;
                    wrap(() => adminDeleteAffiliate({ data: { id: row.id } }));
                  }}
                  className="ml-auto rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
              Referrals
            </p>
            {refs === null ? (
              <p className="mt-2 text-sm text-charcoal/60">Loading…</p>
            ) : refs.length === 0 ? (
              <p className="mt-2 text-sm text-charcoal/60">No referrals yet.</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-lg border border-forest/10">
                <table className="w-full text-sm">
                  <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-charcoal/60">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Sale</th>
                      <th className="px-3 py-2">Commission</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest/5">
                    {refs.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-charcoal/70">
                          {new Date(r.purchased_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-charcoal/70">{r.product ?? "—"}</td>
                        <td className="px-3 py-2">${r.sale_amount.toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold">${r.commission_amount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          {r.status === "paid" ? (
                            <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest">
                              Paid
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() =>
                              wrap(() =>
                                adminSetReferralPaid({
                                  data: { id: r.id, paid: r.status !== "paid" },
                                }),
                              )
                            }
                            className="rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-charcoal/70 hover:bg-forest/5"
                          >
                            {r.status === "paid" ? "Mark pending" : "Mark paid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-charcoal/50">{label}</p>
      <p className="font-semibold text-forest-deep">{value}</p>
    </div>
  );
}

function PricingPanel() {
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [compareInput, setCompareInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<AdminUpdatePricingResult | null>(null);

  const load = () => {
    adminGetPricing()
      .then((p) => {
        setPricing(p);
        setPriceInput(p.price_display);
        setCompareInput(p.compare_at_display);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  };

  useEffect(load, []);

  const save = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    setSyncInfo(null);
    try {
      const price_cents = Math.round(parseFloat(priceInput) * 100);
      const compare_at_cents = Math.round(parseFloat(compareInput) * 100);
      const res = await adminUpdatePricing({
        data: {
          price_cents,
          compare_at_cents,
          currency: pricing?.currency ?? "USD",
        },
      });
      setPricing(res.pricing);
      setSyncInfo(res);
      setMsg("Pricing updated. The sales page now shows the new price.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (err && !pricing)
    return <p className="text-red-600">{err}</p>;
  if (!pricing)
    return <p className="text-charcoal/60">Loading pricing…</p>;

  const priceNum = parseFloat(priceInput) || 0;
  const compareNum = parseFloat(compareInput) || 0;
  const discountPct =
    compareNum > priceNum && compareNum > 0
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl italic text-forest-deep">
          Pricing
        </h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Edit the sale price and the crossed-out compare-at price. Changes
          apply to the sales page immediately and sync to the Paddle checkout.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal/60">
              Sale price ({pricing.currency})
            </span>
            <input
              type="number"
              step="0.01"
              min="0.70"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-forest/20 bg-cream/40 px-4 py-2 text-lg font-semibold text-forest-deep focus:border-forest focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal/60">
              Compare-at (crossed-out)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-forest/20 bg-cream/40 px-4 py-2 text-lg font-semibold text-charcoal/60 focus:border-forest focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex items-baseline gap-3 text-charcoal/70">
          <span className="text-sm">Preview:</span>
          <span className="font-mono text-sm line-through">
            ${compareInput || "0.00"}
          </span>
          <span className="font-display text-2xl text-forest-deep">
            ${priceInput || "0.00"}
          </span>
          {discountPct > 0 && (
            <span className="rounded-full bg-sage/20 px-2 py-0.5 text-xs font-semibold text-forest">
              Save {discountPct}%
            </span>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save & sync to Paddle"}
        </button>

        {msg && <p className="mt-3 text-sm text-forest">{msg}</p>}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        {syncInfo && (
          <div className="mt-4 space-y-1 rounded-lg bg-cream/50 p-3 text-xs text-charcoal/70">
            <p>
              <strong>Paddle test:</strong>{" "}
              {syncInfo.paddle_sandbox.ok
                ? "✓ synced"
                : `⚠ ${syncInfo.paddle_sandbox.error}`}
            </p>
            <p>
              <strong>Paddle live:</strong>{" "}
              {syncInfo.paddle_live.ok
                ? "✓ synced"
                : `⚠ ${syncInfo.paddle_live.error}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PRODUCTS PANEL ============

type ProductDraft = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category_id: string | null;
  cover_image_url: string;
  pdf_asset_url: string;
  price_cents: number;
  compare_at_cents: number;
  currency: string;
  paddle_price_external_id: string;
  is_featured: boolean;
  is_bestseller: boolean;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
};

const emptyDraft: ProductDraft = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  category_id: null,
  cover_image_url: "",
  pdf_asset_url: "",
  price_cents: 1499,
  compare_at_cents: 2999,
  currency: "USD",
  paddle_price_external_id: "",
  is_featured: false,
  is_bestseller: false,
  status: "draft",
  seo_title: "",
  seo_description: "",
};

function ProductsPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () =>
    Promise.all([adminListProducts(), listCategories()])
      .then(([p, c]) => {
        setProducts(p as AdminProduct[]);
        setCategories(c as Category[]);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));

  useEffect(() => {
    reload();
  }, []);

  const startEdit = (p?: AdminProduct) => {
    setErr(null);
    if (!p) return setEditing({ ...emptyDraft });
    setEditing({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? "",
      description: p.description ?? "",
      category_id: p.category_id,
      cover_image_url: p.cover_image_url ?? "",
      pdf_asset_url: p.pdf_asset_url ?? "",
      price_cents: p.price_cents,
      compare_at_cents: p.compare_at_cents,
      currency: p.currency,
      paddle_price_external_id: p.paddle_price_external_id ?? "",
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      status: p.status,
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setErr(null);
    try {
      await adminUpsertProduct({
        data: {
          id: editing.id,
          slug: editing.slug.trim(),
          title: editing.title.trim(),
          subtitle: editing.subtitle || null,
          description: editing.description,
          category_id: editing.category_id,
          cover_image_url: editing.cover_image_url || null,
          pdf_asset_url: editing.pdf_asset_url || null,
          price_cents: editing.price_cents,
          compare_at_cents: editing.compare_at_cents,
          currency: editing.currency,
          paddle_price_external_id:
            editing.paddle_price_external_id || null,
          is_featured: editing.is_featured,
          is_bestseller: editing.is_bestseller,
          status: editing.status,
          seo_title: editing.seo_title || null,
          seo_description: editing.seo_description || null,
        },
      });
      setEditing(null);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await adminDeleteProduct({ data: { id } });
    await reload();
  };

  if (editing) {
    const f = editing;
    const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
      setEditing({ ...f, [k]: v });
    return (
      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl italic text-forest-deep">
            {f.id ? "Edit product" : "New product"}
          </h2>
          <button
            onClick={() => setEditing(null)}
            className="text-sm text-charcoal/60 hover:text-forest"
          >
            ← Back
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={f.slug}
              onChange={(e) =>
                set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={f.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Category">
            <select
              value={f.category_id ?? ""}
              onChange={(e) =>
                set("category_id", e.target.value || null)
              }
              className={fieldClass}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cover image URL">
            <input
              value={f.cover_image_url}
              onChange={(e) => set("cover_image_url", e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="PDF asset URL">
            <input
              value={f.pdf_asset_url}
              onChange={(e) => set("pdf_asset_url", e.target.value)}
              placeholder="/__l5e/assets-v1/…/file.pdf"
              className={fieldClass}
            />
          </Field>
          <Field label="Price (cents)">
            <input
              type="number"
              value={f.price_cents}
              onChange={(e) => set("price_cents", Number(e.target.value))}
              className={fieldClass}
            />
          </Field>
          <Field label="Compare-at (cents)">
            <input
              type="number"
              value={f.compare_at_cents}
              onChange={(e) =>
                set("compare_at_cents", Number(e.target.value))
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Currency">
            <input
              value={f.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
              className={fieldClass}
            />
          </Field>
          <Field label="Paddle price external_id">
            <input
              value={f.paddle_price_external_id}
              onChange={(e) =>
                set("paddle_price_external_id", e.target.value)
              }
              placeholder="e.g. my_new_product_onetime"
              className={fieldClass}
            />
          </Field>
          <Field label="Status">
            <select
              value={f.status}
              onChange={(e) => set("status", e.target.value as any)}
              className={fieldClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <div className="flex items-center gap-6 pt-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
                className="size-4 accent-forest"
              />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.is_bestseller}
                onChange={(e) => set("is_bestseller", e.target.checked)}
                className="size-4 accent-forest"
              />
              Bestseller
            </label>
          </div>
        </div>

        <Field label="Description" className="mt-4">
          <textarea
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            className={fieldClass}
          />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="SEO title">
            <input
              value={f.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="SEO description">
            <input
              value={f.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
          {f.id && (
            <button
              onClick={() => remove(f.id!)}
              className="rounded-full border border-red-300 px-6 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl italic text-forest-deep">
          Products
        </h2>
        <button
          onClick={() => startEdit()}
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep"
        >
          + New product
        </button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-xs uppercase tracking-widest text-charcoal/60">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-charcoal/60">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-forest/5">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-forest-deep">{p.title}</p>
                    <p className="text-xs text-charcoal/50">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === "published"
                          ? "bg-sage/20 text-forest"
                          : "bg-charcoal/10 text-charcoal/60"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">${p.price_display}</td>
                  <td className="px-4 py-3">{p.category_name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs font-semibold text-forest hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-forest/15 bg-white px-3 py-2 text-sm outline-none focus:border-forest";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-charcoal/60">
        {label}
      </span>
      {children}
    </label>
  );
}

// ============ CATEGORIES PANEL ============

function CategoriesPanel() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = () =>
    listCategories()
      .then((c) => setCats(c as Category[]))
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setErr(null);
    try {
      await adminUpsertCategory({
        data: {
          slug: slug.trim(),
          name: name.trim(),
          description: desc || null,
          sort_order: cats.length + 1,
        },
      });
      setName("");
      setSlug("");
      setDesc("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await adminDeleteCategory({ data: { id } });
    await load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl italic text-forest-deep">
        Categories
      </h2>
      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
          <input
            placeholder="Slug (lowercase-with-dashes)"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
            }
            className={fieldClass}
          />
          <input
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={fieldClass}
          />
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button
          onClick={add}
          className="mt-4 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep"
        >
          + Add category
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-cream/60 text-left text-xs uppercase tracking-widest text-charcoal/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-forest/5">
                <td className="px-4 py-3 font-semibold text-forest-deep">
                  {c.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-charcoal/60">
                  {c.slug}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {c.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}