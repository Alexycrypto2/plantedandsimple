import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Save, Sparkles, Unplug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listGenerations,
  setGenerationStatus,
  deleteGeneration,
  approveCampaignAssets,
  publishBlogGeneration,
  type Generation,
  type GenerationKind,
  type GenerationStatus,
} from "@/lib/ai/approval.functions";
import { scheduleGeneration, generatePinsForBlog } from "@/lib/ai/pin-studio.functions";
import { generateStudioImage, type ImagePreset } from "@/lib/ai/image-studio.functions";
import { suggestTopics, listTopics } from "@/lib/ai/topics.functions";
import { runAssistantCommand, ASSISTANT_COMMANDS, type AssistantCommand } from "@/lib/ai/assistant.functions";
import { adminListSettings, adminSaveSetting, aiDiagnostics, aiModelManager, listGeminiModels, type SettingRow } from "@/lib/settings.functions";
import {
  pinterestStatus,
  pinterestAuthUrl,
  pinterestDisconnect,
  pinterestBoards,
  type PinterestStatus,
} from "@/lib/pinterest.functions";
import { publishPinNow, schedulePinPost } from "@/lib/pinterest-publish.functions";

const card = "rounded-2xl border border-forest/10 bg-white p-5 shadow-sm";
const input =
  "w-full rounded-xl border border-forest/20 bg-cream/40 px-4 py-3 text-sm outline-none focus:border-forest";
const btn =
  "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-50";
const btnGhost =
  "rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest hover:bg-forest/5";

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl italic text-forest-deep">{title}</h2>
      {sub && <p className="mt-1 text-sm text-charcoal/60">{sub}</p>}
    </div>
  );
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg] as const;
}

/* ---------------------------------- AI Studio --------------------------------- */

export function AiStudioPanel() {
  const [msg, setMsg] = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const [preset, setPreset] = useState<ImagePreset>("pinterest_pin");
  const [subject, setSubject] = useState("");
  const [lastImage, setLastImage] = useState<string | null>(null);

  const [seed, setSeed] = useState("plant-based recipes, high-protein vegan, meal prep");
  const [topics, setTopics] = useState<any[]>([]);

  const loadTopics = () => listTopics().then((t: any) => setTopics(t ?? [])).catch(() => {});
  useEffect(() => {
    loadTopics();
  }, []);

  const run = async (id: string, fn: () => Promise<any>, done: string) => {
    setBusy(id);
    try {
      await fn();
      setMsg(done);
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Heading title="AI Studio" sub="Everything you generate lands in the Approval Queue — nothing goes live automatically." />
      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={card}>
        <h3 className="font-semibold text-forest-deep">Image studio</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
          <select className={input} value={preset} onChange={(e) => setPreset(e.target.value as ImagePreset)}>
            <option value="pinterest_pin">Pinterest pin (1000x1500)</option>
            <option value="blog_hero">Blog hero (1200x630)</option>
            <option value="instagram_square">Instagram square</option>
            <option value="facebook_image">Facebook link image</option>
            <option value="cookbook_promo">Cookbook promo</option>
          </select>
          <input className={input} placeholder="Subject, e.g. smoky tofu buddha bowl" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <button
          className={`${btn} mt-4`}
          disabled={busy === "image" || !subject.trim()}
          onClick={() =>
            run(
              "image",
              async () => {
                const res: any = await generateStudioImage({ data: { preset, subject } });
                setLastImage(res?.preview_url ?? null);
              },
              "Image sent to the Approval Queue.",
            )
          }
        >
          {busy === "image" ? "Rendering…" : "Generate image"}
        </button>
        {lastImage && <img src={lastImage} alt="Latest AI generation" className="mt-4 max-h-80 rounded-xl" />}
      </section>

      <section className={card}>
        <h3 className="font-semibold text-forest-deep">Trending topics</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input className={input} value={seed} onChange={(e) => setSeed(e.target.value)} />
          <button
            className={btn}
            disabled={busy === "topics"}
            onClick={() => run("topics", async () => { await suggestTopics({ data: { seed } }); await loadTopics(); }, "New topics scored.")}
          >
            {busy === "topics" ? "Researching…" : "Find topics"}
          </button>
        </div>
        <ul className="mt-4 divide-y divide-forest/10">
          {topics.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex-1 text-sm font-medium">{t.topic}</span>
              <span className="font-mono text-xs text-sage">score {t.ai_score ?? "—"}</span>
              <button className={btnGhost} onClick={() => setSubject(t.topic)}>Use as image subject</button>
            </li>
          ))}
          {topics.length === 0 && <li className="py-3 text-sm text-charcoal/50">No topics yet.</li>}
        </ul>
      </section>
    </div>
  );
}

/* --------------------------------- Assistant --------------------------------- */

type ChatEntry = { role: "you" | "assistant"; text: string; preview?: any };

export function AssistantPanel() {
  const [command, setCommand] = useState<AssistantCommand>("blog");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<ChatEntry[]>([]);

  const active = ASSISTANT_COMMANDS.find((c) => c.id === command)!;

  const send = async () => {
    if (!value.trim()) return;
    const input = value.trim();
    setLog((l) => [...l, { role: "you", text: `${active.label.split(" ")[0]} ${input}` }]);
    setValue("");
    setBusy(true);
    try {
      const res: any = await runAssistantCommand({ data: { command, input } });
      setLog((l) => [...l, { role: "assistant", text: res.message, preview: res.preview }]);
    } catch (e: any) {
      setLog((l) => [...l, { role: "assistant", text: e?.message ?? "Something went wrong" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Heading title="AI Assistant" sub="Command-based content generation. Every result is queued for your approval." />
      <section className={card}>
        <div className="flex flex-wrap gap-2">
          {ASSISTANT_COMMANDS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCommand(c.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                command === c.id ? "bg-forest text-cream" : "border border-forest/20 text-forest hover:bg-forest/5"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto">
          {log.length === 0 && (
            <p className="text-sm text-charcoal/50">
              Pick a command and describe what you need — for example “{active.placeholder}”.
            </p>
          )}
          {log.map((entry, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm ${
                entry.role === "you" ? "bg-forest/10 text-forest-deep" : "bg-cream/70 text-charcoal"
              }`}
            >
              <p className="font-semibold">{entry.role === "you" ? "You" : "Assistant"}</p>
              <p className="mt-1">{entry.text}</p>
              {entry.preview && (
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-[11px] text-charcoal/70">
                  {JSON.stringify(entry.preview, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            className={input}
            placeholder={active.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className={btn} disabled={busy || !value.trim()} onClick={send}>
            {busy ? "Working…" : "Run"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------ Approval queue -------------------------------- */

const KINDS: (GenerationKind | "all")[] = ["all", "campaign", "blog", "image", "pinterest_pin", "product_promo", "product_desc", "email", "social"];
const STATUSES: (GenerationStatus | "all")[] = ["pending", "approved", "rejected", "published", "all"];

export function ApprovalQueuePanel() {
  const [kind, setKind] = useState<GenerationKind | "all">("all");
  const [status, setStatus] = useState<GenerationStatus | "all">("pending");
  const [rows, setRows] = useState<Generation[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useToast();
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const [board, setBoard] = useState("");

  const load = () =>
    listGenerations({ data: { kind, status } })
      .then((r) => setRows(r))
      .catch((e: any) => setMsg(e?.message ?? "Failed to load"));

  useEffect(() => {
    pinterestBoards()
      .then((b: any) => { setBoards(b ?? []); if (b?.[0]) setBoard(b[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, status]);

  const act = async (fn: () => Promise<any>, done: string) => {
    try {
      await fn();
      setMsg(done);
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong");
    }
  };

  return (
    <div className="space-y-5">
      <Heading title="Approval Queue" sub="Nothing AI-generated goes live until you approve it here." />
      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${kind === k ? "bg-forest text-cream" : "border border-forest/20 text-forest"}`}>
            {k.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-sage text-white" : "border border-forest/20 text-forest"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className={`${card} flex flex-wrap items-center gap-3`}>
        <span className="text-sm font-semibold text-forest-deep">Pinterest board</span>
        {boards.length ? (
          <select className={`${input} max-w-xs py-2`} value={board} onChange={(e) => setBoard(e.target.value)}>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        ) : (
          <span className="text-xs text-charcoal/60">Connect Pinterest in Settings to post pins directly.</span>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((g) => (
          <article key={g.id} className={card}>
            <div className="flex flex-wrap items-start gap-3">
              {(g.payload?.image_url || g.preview_url) && (
                <img
                  src={g.payload?.image_url || g.preview_url!}
                  alt={g.title}
                  className={g.kind === "pinterest_pin" ? "aspect-[2/3] w-28 rounded-xl object-cover" : "h-24 w-24 rounded-xl object-cover"}
                />
              )}
              <div className="min-w-[200px] flex-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-sage">
                  {g.kind.replace("_", " ")} · {g.status}
                </p>
                <h3 className="mt-1 font-semibold text-forest-deep">{g.title}</h3>
                <p className="text-xs text-charcoal/50">
                  {new Date(g.created_at).toLocaleString()}
                  {g.seo_score != null && ` · SEO ${g.seo_score}`}
                  {g.quality_score != null && ` · Quality ${g.quality_score}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={btnGhost} onClick={() => setOpen(open === g.id ? null : g.id)}>
                {open === g.id ? "Hide" : "Preview"}
              </button>
              {g.status !== "approved" && (
                <button className={btnGhost} onClick={() => act(() => setGenerationStatus({ data: { id: g.id, status: "approved" } }), "Approved.")}>
                  Approve
                </button>
              )}
              {g.kind === "pinterest_pin" && g.status !== "published" && g.status !== "rejected" && (
                <button
                  className={btn}
                  disabled={!board}
                  onClick={() => act(async () => {
                    if (g.status !== "approved") await setGenerationStatus({ data: { id: g.id, status: "approved" } });
                    await publishPinNow({ data: { generationId: g.id, boardId: board, boardName: boards.find((b) => b.id === board)?.name ?? null } });
                  }, "Posted to Pinterest.")}
                >
                  Approve & post to Pinterest
                </button>
              )}
              {g.status !== "rejected" && (
                <button className={btnGhost} onClick={() => act(() => setGenerationStatus({ data: { id: g.id, status: "rejected" } }), "Rejected.")}>
                  Reject
                </button>
              )}
              {g.kind === "blog" && g.status === "approved" && (
                <>
                  <button className={btnGhost} onClick={() => act(() => publishBlogGeneration({ data: { id: g.id, asStatus: "draft" } }), "Saved as blog draft.")}>
                    Send to blog drafts
                  </button>
                  <button className={btnGhost} onClick={() => act(() => publishBlogGeneration({ data: { id: g.id, asStatus: "published" } }), "Published.")}>
                    Publish now
                  </button>
                </>
              )}
              {g.kind === "blog" && (
                <button className={btnGhost} onClick={() => act(() => generatePinsForBlog({ data: { generationId: g.id } }), "Pinterest pins generated.")}>
                  Generate 3 pins
                </button>
              )}
              {g.kind === "campaign" && g.status !== "approved" && (
                <button
                  className={btn}
                  onClick={() => act(
                    () => approveCampaignAssets({ data: { id: g.id } }),
                    "Website, Pinterest, and email assets approved.",
                  )}
                >
                  Approve full campaign
                </button>
              )}
              <label className="flex items-center gap-2 text-xs text-charcoal/60">
                Schedule
                <input
                  type="datetime-local"
                  defaultValue={g.scheduled_for ? g.scheduled_for.slice(0, 16) : ""}
                  onChange={(e) =>
                    act(async () => {
                      const value = e.target.value || null;
                      if (g.kind === "pinterest_pin" && value) {
                        if (!board) throw new Error("Pick a Pinterest board first.");
                        if (g.status !== "approved") await setGenerationStatus({ data: { id: g.id, status: "approved" } });
                        await schedulePinPost({
                          data: {
                            generationId: g.id,
                            boardId: board,
                            boardName: boards.find((b) => b.id === board)?.name ?? null,
                            scheduledFor: new Date(value).toISOString(),
                          },
                        });
                      } else {
                        await scheduleGeneration({ data: { id: g.id, scheduledFor: value } });
                      }
                    }, g.kind === "pinterest_pin" ? "Pin scheduled — it will post automatically at that time." : "Schedule updated.")
                  }
                  className="rounded-lg border border-forest/20 bg-cream/40 px-2 py-1"
                />
              </label>
              <button className={btnGhost} onClick={() => act(() => deleteGeneration({ data: { id: g.id } }), "Deleted.")}>
                Delete
              </button>
              <button
                className={btnGhost}
                onClick={() =>
                  act(async () => {
                    const { brandCheckGeneration } = await import("@/lib/learning/learning.functions");
                    const res: any = await brandCheckGeneration({ data: { generationId: g.id } });
                    setMsg(`Brand score ${res.score}/100${res.notes ? ` — ${res.notes}` : ""}`);
                  }, "Brand check complete.")
                }
              >
                Brand check
              </button>
            </div>
            {open === g.id && g.kind === "pinterest_pin" && (
              <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr]">
                {g.preview_url ? (
                  <img src={g.preview_url} alt="" className="aspect-[2/3] w-full rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center rounded-2xl bg-forest/5 text-xs text-charcoal/40">No image</div>
                )}
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">Overlay text</p>
                    <p className="mt-1 font-display text-xl italic text-forest-deep">{g.payload?.overlay_text ?? "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">Description</p>
                    <p className="mt-1 text-charcoal/70 leading-relaxed">{g.payload?.description ?? "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">Style</p>
                      <p className="mt-1 font-semibold text-forest-deep">{g.payload?.style ?? "—"}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">Keyword</p>
                      <p className="mt-1 font-semibold text-forest-deep">{g.payload?.primary_keyword ?? "—"}</p>
                    </div>
                  </div>
                  {g.payload?.link && (
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">Destination link</p>
                      <p className="mt-1 truncate text-xs text-forest underline">{g.payload.link}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {open === g.id && g.kind !== "pinterest_pin" && (
              g.kind === "campaign" ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { lane: "Website", items: [g.payload?.blog?.title, g.payload?.promo?.headline].filter(Boolean) },
                    { lane: "Pinterest", items: (g.payload?.pins ?? []).map((pin: any) => pin.title) },
                    { lane: "Email", items: [g.payload?.email?.subject].filter(Boolean) },
                  ].map((group) => (
                    <section key={group.lane} className="rounded-xl border border-forest/10 bg-cream/50 p-4">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sage">{group.lane}</p>
                      <ul className="mt-2 space-y-2 text-xs text-charcoal/70">
                        {group.items.map((item: string) => <li key={item}>• {item}</li>)}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-cream/70 p-4 font-mono text-[11px] text-charcoal/70">
                  {JSON.stringify(g.payload, null, 2)}
                </pre>
              )
            )}
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-charcoal/50">Nothing here yet.</p>}
      </div>
    </div>
  );
}

/* -------------------------------- Integrations -------------------------------- */

export function IntegrationsPanel() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<PinterestStatus | null>(null);
  const [msg, setMsg] = useToast();
  const [busy, setBusy] = useState(false);
  const [diag, setDiag] = useState<any>(null);
  const [diagBusy, setDiagBusy] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [quickKey, setQuickKey] = useState("");
  const [models, setModels] = useState<Array<{ id: string; name: string; image: boolean }>>([]);
  const [manager, setManager] = useState<any>(null);

  const runDiagnostics = async () => {
    setDiagBusy(true);
    setDiag(null);
    try {
      setDiag(await aiDiagnostics());
    } catch (e: any) {
      setMsg(e?.message ?? "Diagnostics failed");
    } finally {
      setDiagBusy(false);
    }
  };

  const load = () => {
    adminListSettings().then(setSettings).catch(() => {});
    pinterestStatus().then(setStatus).catch(() => {});
    listGeminiModels().then(setModels).catch(() => setModels([]));
    aiModelManager().then(setManager).catch(() => setManager(null));
  };
  useEffect(load, []);

  const save = async (key: string) => {
    setBusy(true);
    try {
      await adminSaveSetting({ data: { key, value: values[key] ?? "" } });
      setValues((v) => ({ ...v, [key]: "" }));
      setMsg("Saved.");
      load();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    try {
      const res: any = await pinterestAuthUrl({ data: { origin: window.location.origin } });
      window.location.href = res.url;
    } catch (e: any) {
      setMsg(e?.message ?? "Could not start Pinterest connection");
    }
  };

  return (
    <div className="space-y-6">
      <Heading title="AI API Configuration" sub="Choose which AI powers your publishing studio. Your keys are encrypted before storage." />
      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">AI provider status</p>
            <h3 className="mt-1 font-semibold text-forest-deep">Live provider health</h3>
            <p className="mt-1 text-sm text-charcoal/60">
              Runs one real text request and one real image request, and shows exactly which provider, key and model
              answered.
            </p>
          </div>
          <Button onClick={runDiagnostics} disabled={diagBusy} className="rounded-full">
            {diagBusy ? <Loader2 className="animate-spin" /> : <RefreshCw />} {diagBusy ? "Testing" : "Recheck"}
          </Button>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-forest/10 bg-cream/50 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-forest/10 text-forest"><Sparkles className="h-4 w-4" /></span>
             <div><p className="text-[10px] uppercase tracking-widest text-charcoal/45">Primary provider</p><p className="text-sm font-semibold text-forest-deep">Google Gemini</p></div>
           </div>
           <span className="rounded-full bg-forest/10 px-3 py-1 text-[10px] font-bold uppercase text-forest">Fallback chain ready</span>
        </div>
        {diag && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-cream/60 p-3">
              <dt className="text-xs font-semibold uppercase tracking-widest text-sage">Text</dt>
              <dd className="mt-1 text-sm text-forest-deep">
                {diag.text_provider} · {diag.text_model}
              </dd>
              <dd className={`mt-1 text-xs ${diag.text?.ok ? "text-forest" : "text-red-600"}`}>
                {diag.text?.ok ? `OK — “${diag.text.detail}”` : diag.text?.detail}
              </dd>
            </div>
            <div className="rounded-xl bg-cream/60 p-3">
              <dt className="text-xs font-semibold uppercase tracking-widest text-sage">Images</dt>
              <dd className="mt-1 text-sm text-forest-deep">
                {diag.image_provider} · {diag.image_model}
              </dd>
              <dd className={`mt-1 text-xs ${diag.image?.ok ? "text-forest" : "text-red-600"}`}>
                {diag.image?.ok ? `OK — ${diag.image.detail}` : diag.image?.detail}
              </dd>
            </div>
            <div className="rounded-xl bg-cream/60 p-3 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-widest text-sage">Keys</dt>
              <dd className="mt-1 text-xs text-charcoal/70">
                Gemini key: {diag.gemini_key_present ? `present (${diag.gemini_key_source})` : "missing"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-forest/20 bg-forest/5 p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
           <div><h3 className="text-sm font-semibold text-forest-deep">Gemini is the primary AI provider.</h3><p className="mt-1 text-xs leading-relaxed text-charcoal/60">Image requests try your selected Gemini model first, then the configured fallback chain. The exact provider, model, status and error are recorded.</p></div>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-sage" /><h3 className="font-semibold text-forest-deep">Prime AI Model Manager</h3></div>
        <p className="mt-1 text-xs text-charcoal/55">Automatic mode chooses the text model by workload and budget. Image generation uses a live image-capable model available to your Gemini key.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1"><span className="text-xs font-semibold text-forest-deep">AI mode</span><select className={input} value={values.AI_MODE ?? manager?.mode ?? "automatic"} onChange={(e) => setValues((v) => ({ ...v, AI_MODE: e.target.value }))}><option value="automatic">Automatic</option><option value="manual">Manual</option></select><Button className="mt-2 rounded-xl" disabled={busy} onClick={() => save("AI_MODE")}><Save /> Save</Button></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-forest-deep">AI budget mode</span><select className={input} value={values.AI_BUDGET_MODE ?? manager?.budget ?? "automatic"} onChange={(e) => setValues((v) => ({ ...v, AI_BUDGET_MODE: e.target.value }))}><option value="automatic">⚡ Automatic</option><option value="economy">🟢 Economy</option><option value="balanced">🔵 Balanced</option><option value="quality">🟣 Quality</option></select><Button className="mt-2 rounded-xl" disabled={busy} onClick={() => save("AI_BUDGET_MODE")}><Save /> Save</Button></label>
        </div>
        {manager && <div className="mt-5 grid gap-3 sm:grid-cols-3">{manager.alternatives.map((item: any) => <div key={item.label} className="rounded-xl border border-forest/10 bg-cream/50 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-sage">{item.label}</p><p className="mt-1 text-sm font-semibold text-forest-deep">{item.model}</p><p className="mt-1 text-xs text-charcoal/55">{item.use}</p></div>)}</div>}
        {manager && <div className="mt-4 rounded-xl bg-forest/5 p-4"><p className="text-xs font-bold uppercase tracking-widest text-sage">✨ Prime recommendation</p><p className="mt-1 text-sm font-semibold text-forest-deep">{manager.recommendations.blog}</p><p className="mt-1 text-xs text-charcoal/60">Selected for the current {manager.budget} budget. PrimeDownloads routes blogs, recipes, SEO, Pinterest copy and campaigns independently.</p></div>}
      </section>

      <section className={card}>
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-sage" /><h3 className="font-semibold text-forest-deep">Quick add: Gemini key</h3></div>
           <p className="mt-1 text-xs text-charcoal/50">Paste a Google AI Studio API key, then choose from the models that this exact key can access.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input className={input} type="password" value={quickKey} onChange={(e) => setQuickKey(e.target.value)} placeholder="Paste Gemini API key" />
          <Button className="h-auto rounded-xl px-5" disabled={busy || !quickKey.trim()} onClick={async () => { setValues((v) => ({ ...v, GEMINI_API_KEY: quickKey })); setBusy(true); try { await adminSaveSetting({ data: { key: "GEMINI_API_KEY", value: quickKey } }); setQuickKey(""); setMsg("Gemini saved and activated."); load(); await runDiagnostics(); } catch (e: any) { setMsg(e?.message ?? "Could not activate key"); } finally { setBusy(false); } }}><Save /> Save &amp; activate</Button>
        </div>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-forest-deep">Pinterest</h3>
        <p className="mt-2 text-sm text-charcoal/70">
          Status:{" "}
          <strong>
            {status?.connected ? `Connected${status.username ? ` as @${status.username}` : ""}` : "Not connected"}
          </strong>
        </p>
        {status?.expires_at && (
          <p className="text-xs text-charcoal/50">Token valid until {new Date(status.expires_at).toLocaleString()}</p>
        )}
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-sage">Redirect URI</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg bg-cream/70 px-3 py-2 font-mono text-xs">{status?.redirect_uri}</code>
            <button
              className={btnGhost}
              onClick={() => {
                navigator.clipboard.writeText(status?.redirect_uri ?? "");
                setMsg("Redirect URI copied.");
              }}
            >
              Copy
            </button>
          </div>
            <p className="mt-1 text-xs text-charcoal/50">Add this exact URL to your Pinterest app. Use the apex domain, full callback path, and no trailing slash.</p>
          <div className={`mt-4 rounded-xl border p-4 ${
            status?.redirect_audit?.exact_match === true
              ? "border-forest/20 bg-forest/5"
              : status?.redirect_audit?.exact_match === false
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-sage">Automatic mismatch check</p>
            <p className={`mt-2 text-sm font-semibold ${status?.redirect_audit?.exact_match === false ? "text-red-700" : "text-forest-deep"}`}>
              {status?.redirect_audit?.exact_match === true
                ? "Exact match — Pinterest and PrimeDownloads use the same callback."
                : status?.redirect_audit?.exact_match === false
                  ? "Mismatch found"
                  : "Pinterest value needed"}
            </p>
            {status?.redirect_audit?.issue && <p className="mt-1 text-xs text-charcoal/70">{status.redirect_audit.issue}</p>}
            {status?.redirect_audit?.exact_match === false && (
              <p className="mt-2 break-all rounded-lg bg-white/70 p-2 font-mono text-xs text-red-700">
                Change the Redirect URI in Pinterest to: {status.redirect_uri}
              </p>
            )}
            <p className="mt-2 text-[11px] text-charcoal/50">
              Pinterest does not provide developer-app settings through its API, so save the value shown in your Pinterest app in the field below once; checks after that are automatic.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={connect} disabled={!status?.credentials_configured}>
            <Zap />
            {status?.connected ? "Reconnect" : "Connect Pinterest"}
          </Button>
          {status?.connected && (
            <button
              className={btnGhost}
              onClick={async () => {
                await pinterestDisconnect();
                setMsg("Disconnected.");
                load();
              }}
            >
              Disconnect
            </button>
          )}
        </div>
        {!status?.credentials_configured && (
          <p className="mt-2 text-xs text-red-600">Add your Pinterest App ID and Secret below first.</p>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-sage" /><h3 className="font-semibold text-forest-deep">Provider details</h3></div>
        <div className="mt-4 space-y-4">
           {settings.filter((s) => s.key.startsWith("GEMINI_") || s.key === "MAGIC_HOUR_API_KEY" || s.key === "PIXAZO_API_KEY").map((s) => {
             const modelField = s.key === "GEMINI_TEXT_MODEL" || s.key === "GEMINI_IMAGE_MODEL";
             const choices = models.filter((model) => s.key === "GEMINI_IMAGE_MODEL" ? model.image : !model.image);
             return (
            <div key={s.key} className="rounded-xl border border-forest/10 bg-cream/30 p-4">
              <label className="text-sm font-semibold text-forest-deep">{s.label}</label>
              <p className="text-xs text-charcoal/50">
                {s.hint} · {s.source === "missing" ? "not set" : `current: ${s.masked} (${s.source === "panel" ? "saved here" : "project secret"})`}
              </p>
               <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                 {modelField ? (
                   <select className={input} value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}>
                     <option value="">Choose a model available to this key</option>
                     {choices.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.id}</option>)}
                   </select>
                 ) : (
                   <input className={input} type={showKeys[s.key] ? "text" : "password"} placeholder="Enter new value" value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                 )}
                 {!modelField && <Button variant="outline" size="icon" aria-label={showKeys[s.key] ? "Hide value" : "Show value"} onClick={() => setShowKeys((v) => ({ ...v, [s.key]: !v[s.key] }))}>{showKeys[s.key] ? <EyeOff /> : <Eye />}</Button>}
                <Button className="h-auto rounded-xl" disabled={busy} onClick={() => save(s.key)}><Save /> Save</Button>
              </div>
            </div>
           )})}
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2"><Unplug className="h-4 w-4 text-sage" /><h3 className="font-semibold text-forest-deep">Pinterest app credentials</h3></div>
        <div className="mt-4 space-y-4">
          {settings.filter((s) => s.key.startsWith("PINTEREST_")).map((s) => (
            <div key={s.key} className="rounded-xl border border-forest/10 bg-cream/30 p-4">
              <label className="text-sm font-semibold text-forest-deep">{s.label}</label>
              <p className="text-xs text-charcoal/50">{s.hint} · {s.source === "missing" ? "not set" : `current: ${s.masked}`}</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input className={input} type="password" value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} placeholder="Enter a replacement value" /><Button className="h-auto rounded-xl" disabled={busy} onClick={() => save(s.key)}><Save /> Save</Button></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}