import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { csvCell } from "@/lib/csv";
import {
  adminAddSubscriber,
  adminListSubscribers,
  adminUpdateSubscriber,
  type SubscriberRow,
} from "@/lib/subscribers.functions";

const SOURCE_LABEL: Record<string, string> = {
  homepage_inline: "Homepage",
  free_guide: "Free cookbook",
  newsletter_popup: "Popup",
  admin_added: "Added by admin",
};
const label = (s: string) => SOURCE_LABEL[s] ?? s.replace(/_/g, " ");

export function SubscribersPanel() {
  const list = useServerFn(adminListSubscribers);
  const update = useServerFn(adminUpdateSubscriber);
  const add = useServerFn(adminAddSubscriber);
  const [rows, setRows] = useState<SubscriberRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState<"active" | "unsubscribed" | "buyers" | "all">("active");
  const [newEmail, setNewEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const load = () =>
    list()
      .then((r) => setRows(r))
      .catch((e) => setErr(e?.message ?? "Couldn't load"));
  useEffect(() => {
    load();
  }, []);

  const sources = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.source))), [rows]);
  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        if (q && !r.email.includes(q.toLowerCase())) return false;
        if (source !== "all" && r.source !== source) return false;
        if (status === "active" && r.unsubscribed_at) return false;
        if (status === "unsubscribed" && !r.unsubscribed_at) return false;
        if (status === "buyers" && !r.is_buyer) return false;
        return true;
      }),
    [rows, q, source, status],
  );
  const active = (rows ?? []).filter((r) => !r.unsubscribed_at).length;
  const week = (rows ?? []).filter((r) => Date.now() - new Date(r.subscribed_at).getTime() < 7 * 864e5).length;
  const buyers = (rows ?? []).filter((r) => r.is_buyer).length;

  const act = async (id: string, action: "unsubscribe" | "resubscribe" | "delete" | "sync") => {
    if (action === "delete" && !confirm("Delete this email permanently?")) return;
    try {
      const r = await update({ data: { id, action } });
      if (action === "sync") setNote(r.ok ? "Sent to your email tool." : "No email tool connected yet — add one in Settings.");
      load();
    } catch (e: any) {
      setNote(e?.message ?? "Something failed");
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(filtered.map((r) => r.email).join(", "));
    setNote(`Copied ${filtered.length} emails.`);
  };
  const downloadCsv = () => {
    const header = "email,source,subscribed_at,status,buyer\n";
    const body = filtered
      .map((r) =>
        [r.email, label(r.source), r.subscribed_at, r.unsubscribed_at ? "unsubscribed" : "active", r.is_buyer ? "yes" : "no"]
          .map(csvCell)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const addOne = async () => {
    if (!newEmail) return;
    try {
      await add({ data: { email: newEmail } });
      setNewEmail("");
      setNote("Added.");
      load();
    } catch (e: any) {
      setNote(e?.message ?? "Couldn't add");
    }
  };

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading email list…</p>;

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-forest text-cream" : "border border-forest/20 text-charcoal/70 hover:bg-forest/5"}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total", rows.length],
          ["Active", active],
          ["New this week", week],
          ["Also buyers", buyers],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border border-forest/10 bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-charcoal/60">{k}</p>
            <p className="mt-1 text-2xl font-semibold text-forest">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["active", "buyers", "unsubscribed", "all"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={chip(status === s)}>
            {s === "buyers" ? "Buyers" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-forest/20" />
        <button onClick={() => setSource("all")} className={chip(source === "all")}>All sources</button>
        {sources.map((s) => (
          <button key={s} onClick={() => setSource(s)} className={chip(source === s)}>{label(s)}</button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email…"
          className="w-full max-w-xs rounded-full border border-forest/20 bg-card px-4 py-2 text-sm outline-none focus:border-forest"
        />
        <p className="text-sm text-charcoal/60">{filtered.length} shown</p>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Add email"
            className="w-40 rounded-full border border-forest/20 bg-card px-3 py-2 text-xs outline-none focus:border-forest"
          />
          <button onClick={addOne} className={chip(false)}>Add</button>
          <button onClick={copyAll} className={chip(false)}>Copy emails</button>
          <button onClick={downloadCsv} className={chip(true)}>Download CSV</button>
        </div>
      </div>
      {note && <p className="text-xs text-forest">{note}</p>}

      <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-forest/5 text-left text-xs uppercase tracking-wider text-charcoal/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined from</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/5">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-forest/5">
                <td className="px-4 py-3 font-medium text-charcoal">
                  {r.email}
                  {r.is_buyer && <span className="ml-2 rounded-full bg-sage/30 px-2 py-0.5 text-[10px] font-semibold text-forest">Buyer</span>}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{label(r.source)}</td>
                <td className="px-4 py-3 text-charcoal/70">{new Date(r.subscribed_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-charcoal/70">{r.unsubscribed_at ? "Unsubscribed" : "Active"}</td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3 text-xs font-semibold">
                  <a href={`mailto:${r.email}`} className="text-forest hover:underline">Email</a>
                  <button onClick={() => act(r.id, "sync")} className="text-forest hover:underline">Sync</button>
                  <button
                    onClick={() => act(r.id, r.unsubscribed_at ? "resubscribe" : "unsubscribe")}
                    className="text-charcoal/70 hover:underline"
                  >
                    {r.unsubscribed_at ? "Resubscribe" : "Unsubscribe"}
                  </button>
                  <button onClick={() => act(r.id, "delete")} className="text-destructive hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/60">No emails match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal/60">
        Tip: paste a MailerLite key or a webhook link in Settings and every new signup is copied there automatically.
      </p>
    </div>
  );
}
