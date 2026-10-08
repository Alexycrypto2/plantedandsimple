import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChefHat, Users, Gift, ShieldOff, CalendarDays, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { MetricCard, PanelCard } from "@/components/admin/AdminShell";
import { listPrepMembers, grantPrepAccess, setPrepMemberStatus } from "@/lib/prep-access.functions";

export function MealPrepPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listPrepMembers);
  const grant = useServerFn(grantPrepAccess);
  const setStatus = useServerFn(setPrepMemberStatus);
  const q = useQuery({ queryKey: ["admin-prep-members"], queryFn: () => list() });
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-prep-members"] });

  const grantM = useMutation({
    mutationFn: () => grant({ data: { email, note: note || undefined } }),
    onSuccess: () => { toast.success(`Access given to ${email}`); setEmail(""); setNote(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const statusM = useMutation({
    mutationFn: (v: { email: string; status: "active" | "revoked" }) => setStatus({ data: v }),
    onSuccess: (_d, v) => { toast.success(v.status === "revoked" ? "Access removed" : "Access restored"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = q.data?.stats;
  const rows = (q.data?.members ?? []).filter((r) => r.email.includes(search.trim().toLowerCase()));
  const memberLink = typeof window !== "undefined" ? `${window.location.origin}/auth?next=/prep-app` : "/auth?next=/prep-app";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Members" value={s?.total ?? 0} icon={Users} hint="Everyone with a record" />
        <MetricCard label="Paid" value={s?.paid ?? 0} icon={ChefHat} hint="Bought for $27" />
        <MetricCard label="Gifted" value={s?.gifted ?? 0} icon={Gift} hint="Given free by an admin" />
        <MetricCard label="Weekly plans made" value={s?.plans ?? 0} icon={CalendarDays} hint={`${s?.revoked ?? 0} access removed`} />
      </div>

      <PanelCard
        title="Give free access"
        icon={Gift}
        action={
          <a href="/prep-app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-forest/20 px-3 py-1.5 text-xs font-semibold text-forest-deep hover:bg-forest/5">
            Open the system <ExternalLink className="size-3" />
          </a>
        }
      >
        <p className="mb-3 text-sm text-charcoal/65">
          For influencers, testers or a customer whose payment email is different. They sign in with this email at{" "}
          <button className="underline" onClick={() => { navigator.clipboard?.writeText(memberLink); toast.success("Member sign-in link copied"); }}>
            the member sign-in link
          </button>.
        </p>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => { e.preventDefault(); if (email) grantM.mutate(); }}
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" className="rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="rounded-xl border border-forest/15 bg-white/80 px-3 py-2 text-sm" />
          <button disabled={grantM.isPending} className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60">
            {grantM.isPending ? "Saving…" : "Give access"}
          </button>
        </form>
      </PanelCard>

      <PanelCard
        title="Members"
        icon={Users}
        action={
          <label className="flex items-center gap-2 rounded-full border border-forest/15 bg-white/70 px-3 py-1.5">
            <Search className="size-3.5 text-charcoal/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email" className="w-32 bg-transparent text-xs outline-none sm:w-44" />
          </label>
        }
      >
        {q.isLoading ? (
          <p className="text-sm text-charcoal/55">Loading members…</p>
        ) : q.error ? (
          <p className="text-sm text-red-700">{(q.error as Error).message}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-charcoal/55">No members yet. Paid buyers appear here automatically after checkout.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-charcoal/45">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">How</th>
                  <th className="py-2 pr-3">Joined</th>
                  <th className="py-2 pr-3">Last opened</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const revoked = r.status === "revoked";
                  return (
                    <tr key={r.email} className="border-t border-forest/10">
                      <td className="py-2.5 pr-3 font-medium text-forest-deep">
                        {r.email}
                        {r.note && <span className="block text-[11px] font-normal text-charcoal/50">{r.note}</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-charcoal/70">
                        {r.transactionId ? `Paid${r.environment === "sandbox" ? " (test)" : ""}` : "Gifted"}
                      </td>
                      <td className="py-2.5 pr-3 text-charcoal/60">{r.purchasedAt ? new Date(r.purchasedAt).toLocaleDateString() : "—"}</td>
                      <td className="py-2.5 pr-3 text-charcoal/60">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString() : "Not yet"}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${revoked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                          {revoked ? "Removed" : "Active"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => statusM.mutate({ email: r.email, status: revoked ? "active" : "revoked" })}
                          className="inline-flex items-center gap-1 rounded-full border border-forest/15 px-3 py-1 text-xs font-semibold text-charcoal/75 hover:bg-forest/5"
                        >
                          {revoked ? "Restore" : <><ShieldOff className="size-3" /> Remove</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </div>
  );
}
