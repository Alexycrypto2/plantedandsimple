import { useEffect, useState } from "react";
import { CalendarClock, Check, ExternalLink, Loader2, Plug, RefreshCw, Send, X } from "lucide-react";
import { pinterestStatus, pinterestAuthUrl, pinterestBoards, pinterestDisconnect } from "@/lib/pinterest.functions";
import {
  listPublishablePins,
  listPinPosts,
  publishPinNow,
  schedulePinPost,
  retryPinPost,
  cancelPinPost,
  type PublishablePin,
} from "@/lib/pinterest-publish.functions";

const card = "rounded-2xl border border-forest/10 bg-white p-5 shadow-sm";
const btn = "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-50";
const btnGhost = "rounded-full border border-forest/25 px-4 py-2 text-xs font-semibold text-forest hover:bg-forest/5 disabled:opacity-50";
const input = "w-full rounded-xl border border-forest/20 bg-cream/40 px-3 py-2 text-sm outline-none focus:border-forest";

function defaultSchedule() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function PinPublisher() {
  const [status, setStatus] = useState<any>(null);
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [board, setBoard] = useState("");
  const [pins, setPins] = useState<PublishablePin[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [when, setWhen] = useState(defaultSchedule());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadPosts = () => listPinPosts().then((r: any) => setPosts(r ?? [])).catch(() => {});

  const load = () => {
    pinterestStatus()
      .then((s: any) => {
        setStatus(s);
        if (s?.connected) {
          pinterestBoards()
            .then((b: any) => {
              setBoards(b ?? []);
              if (b?.[0] && !board) setBoard(b[0].id);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    listPublishablePins().then((r: any) => setPins(r ?? [])).catch((e: any) => setMsg(e?.message ?? null));
    loadPosts();
  };
  useEffect(load, []);

  const connect = async () => {
    try {
      const res: any = await pinterestAuthUrl({ data: { origin: window.location.origin } });
      window.location.href = res.url;
    } catch (e: any) {
      setMsg(e?.message ?? "Could not start the Pinterest connection");
    }
  };

  const act = async (id: string, fn: () => Promise<any>, done: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      await fn();
      setMsg(done);
      load();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const boardName = boards.find((b) => b.id === board)?.name ?? null;
  const connected = Boolean(status?.connected);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl italic text-forest-deep">Pin Publishing</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Approve a pin, pick a board, and publish or schedule it straight to Pinterest. Every pin links through a
          tracked short link that redirects back to its recipe page with UTM tags.
        </p>
      </div>

      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-semibold text-forest-deep">
              <Plug className="h-4 w-4" /> Pinterest account
            </p>
            <p className="mt-1 text-sm text-charcoal/60">
              {connected
                ? `Connected${status?.username ? ` as @${status.username}` : ""}`
                : status?.credentials_configured === false
                  ? "Add your Pinterest app keys in Settings → Integrations first."
                  : "Not connected yet."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className={btn} onClick={connect}>
              {connected ? "Reconnect" : "Connect Pinterest"}
            </button>
            {connected && (
              <button className={btnGhost} onClick={() => pinterestDisconnect().then(load)}>
                Disconnect
              </button>
            )}
          </div>
        </div>

        {status?.redirect_uri && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
              status?.redirect_audit?.issue
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-forest/15 bg-forest/5 text-forest-deep"
            }`}
          >
            <p className="break-all font-semibold">Redirect URI: {status.redirect_uri}</p>
            <p className="mt-1">{status.redirect_audit?.issue ?? "Exact Pinterest redirect match confirmed."}</p>
          </div>
        )}

        {connected && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Board</span>
              <select className={input} value={board} onChange={(e) => setBoard(e.target.value)}>
                {boards.length === 0 && <option value="">No boards found</option>}
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">
                Schedule time
              </span>
              <input type="datetime-local" className={input} value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
          </div>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-forest-deep">Approved pins</p>
          <button className={btnGhost} onClick={load}>
            <RefreshCw className="mr-1 inline h-3 w-3" /> Refresh
          </button>
        </div>
        {pins.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/50">
            Nothing here yet — approve pins in the Approval Queue and they show up ready to publish.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pins.map((p) => (
              <article key={p.id} className="rounded-xl border border-forest/10 p-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="aspect-[2/3] w-full rounded-lg object-cover" />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center rounded-lg bg-forest/10 text-xs">
                    no image
                  </div>
                )}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-sage">
                  {p.style ?? "Pin"} · {p.target_label}
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-forest-deep">{p.title}</h3>
                <p className="mt-1 truncate font-mono text-[10px] text-charcoal/50">{p.target_path}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className={btnGhost}
                    disabled={!connected || !board || busyId === p.id}
                    onClick={() =>
                      act(p.id, () => publishPinNow({ data: { generationId: p.id, boardId: board, boardName } }), "Pin published to Pinterest.")
                    }
                  >
                    {busyId === p.id ? (
                      <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="mr-1 inline h-3 w-3" />
                    )}
                    Publish now
                  </button>
                  <button
                    className={btnGhost}
                    disabled={!connected || !board || busyId === p.id}
                    onClick={() =>
                      act(
                        p.id,
                        () =>
                          schedulePinPost({
                            data: {
                              generationId: p.id,
                              boardId: board,
                              boardName,
                              scheduledFor: new Date(when).toISOString(),
                            },
                          }),
                        "Pin scheduled.",
                      )
                    }
                  >
                    <CalendarClock className="mr-1 inline h-3 w-3" /> Schedule
                  </button>
                </div>
                {p.posted && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-forest">
                    <Check className="h-3 w-3" /> Already queued once
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={card}>
        <p className="font-semibold text-forest-deep">Publishing log</p>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/50">No pins published or scheduled yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-forest/10">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                {p.image_url && <img src={p.image_url} alt="" className="h-14 w-10 rounded-md object-cover" />}
                <div className="min-w-[180px] flex-1">
                  <p className="truncate text-sm font-semibold text-forest-deep">{p.title}</p>
                  <p className="truncate text-xs text-charcoal/50">
                    {p.board_name ?? "board"} ·{" "}
                    {p.status === "published"
                      ? `published ${new Date(p.published_at).toLocaleString()}`
                      : p.scheduled_for
                        ? `scheduled ${new Date(p.scheduled_for).toLocaleString()}`
                        : p.status}
                  </p>
                  {p.error && <p className="mt-0.5 text-xs text-red-600">{p.error}</p>}
                  <a
                    className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-forest hover:underline"
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /p/{p.slug} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <span className="rounded-full bg-forest/10 px-3 py-1 text-[10px] font-semibold text-forest">
                  {p.clicks} clicks
                </span>
                {p.status !== "published" && (
                  <div className="flex gap-2">
                    <button className={btnGhost} disabled={busyId === p.id} onClick={() => act(p.id, () => retryPinPost({ data: { id: p.id } }), "Published.")}>
                      Publish now
                    </button>
                    <button className={btnGhost} disabled={busyId === p.id} onClick={() => act(p.id, () => cancelPinPost({ data: { id: p.id } }), "Canceled.")}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}