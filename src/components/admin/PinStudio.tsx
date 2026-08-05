import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChefHat,
  Loader2,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  listPinSources,
  generatePinsFromSource,
  savePinPreviews,
  type PinSource,
  type PinSourceType,
} from "@/lib/ai/pin-studio.functions";

const shell = "rounded-3xl border border-forest/10 bg-white/80 p-6 shadow-[0_18px_60px_-40px_rgba(46,94,59,0.6)] backdrop-blur";
const input =
  "w-full rounded-xl border border-forest/20 bg-cream/40 px-4 py-3 text-sm outline-none transition focus:border-forest";
const label = "font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-sage";
const btn =
  "inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest-deep disabled:opacity-40";
const btnGhost =
  "inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest transition hover:bg-forest/5 disabled:opacity-40";

const SOURCES: { id: PinSourceType; label: string; blurb: string; icon: typeof ChefHat }[] = [
  { id: "recipe", label: "Recipe", blurb: "Dish-led pins from a published recipe", icon: ChefHat },
  { id: "blog", label: "Blog article", blurb: "Idea-led pins from an article", icon: Newspaper },
  { id: "product", label: "Cookbook", blurb: "Premium pins that sell the product", icon: BookOpen },
  { id: "custom", label: "Free subject", blurb: "Type anything and let AI shape it", icon: Sparkles },
];

export function PinterestStudioPanel() {
  const [type, setType] = useState<PinSourceType>("recipe");
  const [sources, setSources] = useState<Record<string, PinSource[]>>({});
  const [loadingSources, setLoadingSources] = useState(true);
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [angle, setAngle] = useState("");
  const [count, setCount] = useState(5);

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pack, setPack] = useState<any[] | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [heading, setHeading] = useState("");

  const loadSources = () => {
    setLoadingSources(true);
    listPinSources()
      .then((r: any) => setSources(r ?? {}))
      .catch((e: any) => setErr(e?.message ?? "Could not load your content"))
      .finally(() => setLoadingSources(false));
  };
  useEffect(loadSources, []);

  const list = useMemo(() => {
    const rows = sources[type] ?? [];
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows;
  }, [sources, type, query]);

  const selected = (sources[type] ?? []).find((s) => s.id === pickedId) ?? null;
  const ready = type === "custom" ? subject.trim().length > 3 : Boolean(pickedId);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    setPack(null);
    setPicked([]);
    try {
      const res: any = await generatePinsFromSource({
        data: { type, id: pickedId ?? undefined, subject, count, angle: angle || undefined },
      });
      setPack(res.pins ?? []);
      setPicked((res.pins ?? []).map((_: any, i: number) => i));
      setLink(res.link ?? null);
      setHeading(res.subject ?? subject);
    } catch (e: any) {
      setErr(e?.message ?? "Pin generation failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!pack) return;
    setSaving(true);
    setErr(null);
    try {
      const chosen = pack.filter((_, i) => picked.includes(i));
      const res: any = await savePinPreviews({ data: { subject: heading, link, pins: chosen } });
      setMsg(`${res.saved} pin${res.saved === 1 ? "" : "s"} sent to the Approval Queue — approve them in Pinterest → Publishing.`);
      setPack(null);
    } catch (e: any) {
      setErr(e?.message ?? "Could not save pins");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-forest/10 bg-gradient-to-br from-forest-deep via-forest to-sage p-8 text-cream">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cream/10 blur-2xl" />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cream/70">Pinterest Studio</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl italic leading-tight">
          Turn any recipe, article or cookbook into a pin set that looks art-directed.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-cream/80">
          Pick the content, and the studio reads it end to end — ingredients, timings, benefits — then chooses the
          layouts that suit that content type instead of spamming every style.
        </p>
      </header>

      {err && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
      {msg && <p className="rounded-2xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={shell}>
        <p className={label}>Step 1 · What are we pinning?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            const on = type === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setType(s.id);
                  setPickedId(null);
                  setQuery("");
                }}
                className={`group rounded-2xl border p-4 text-left transition ${
                  on
                    ? "border-forest bg-forest text-cream shadow-lg"
                    : "border-forest/15 bg-cream/40 text-forest-deep hover:-translate-y-0.5 hover:border-forest/40"
                }`}
              >
                <Icon className={`h-5 w-5 ${on ? "text-cream" : "text-sage"}`} />
                <p className="mt-3 text-sm font-semibold">{s.label}</p>
                <p className={`mt-1 text-xs ${on ? "text-cream/75" : "text-charcoal/55"}`}>{s.blurb}</p>
              </button>
            );
          })}
        </div>

        {type !== "custom" ? (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={label}>Step 2 · Choose the piece</p>
              <button className={btnGhost} onClick={loadSources}>
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
              <input
                className={`${input} pl-11`}
                placeholder={`Search your ${type === "product" ? "cookbooks" : type === "blog" ? "articles" : "recipes"}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {loadingSources && <p className="py-6 text-center text-sm text-charcoal/50">Loading your library…</p>}
              {!loadingSources && list.length === 0 && (
                <p className="py-6 text-center text-sm text-charcoal/50">Nothing here yet — create content first.</p>
              )}
              {list.map((s) => {
                const on = pickedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setPickedId(s.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      on ? "border-forest bg-forest/5" : "border-transparent bg-cream/40 hover:border-forest/25"
                    }`}
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest/10 text-sage">
                        <ChefHat className="h-4 w-4" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-forest-deep">{s.title}</span>
                      <span className="block truncate text-xs text-charcoal/55">{s.summary ?? s.url}</span>
                    </span>
                    {on && <Check className="h-4 w-4 shrink-0 text-forest" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-1.5">
            <p className={label}>Step 2 · Subject</p>
            <input
              className={input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="High-protein smoky tofu buddha bowl"
            />
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className={label}>Optional angle</p>
            <input
              className={input}
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="Lean into 20-minute weeknight dinners"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold text-charcoal/70">
              <span>Pin variants</span>
              <span className="text-forest">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-3 w-full accent-forest"
            />
            <p className="mt-1 text-[11px] text-charcoal/50">
              The AI picks a different layout and hook for each variant.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className={btn} disabled={!ready || busy} onClick={run}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {busy ? "Art-directing your pins…" : `Design ${count} pin${count === 1 ? "" : "s"}`}
          </button>
          {selected && <span className="text-xs text-charcoal/55">Linking to {selected.url}</span>}
        </div>
      </section>

      {busy && !pack && (
        <section className={shell}>
          <p className={label}>Rendering</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-2xl bg-forest/10"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {pack && (
        <section className={`${shell} duration-500 animate-in fade-in`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={label}>Step 3 · Review</p>
              <h3 className="mt-1 font-display text-xl italic text-forest-deep">{heading}</h3>
            </div>
            <p className="text-xs text-charcoal/55">Nothing is saved until you send it to approvals.</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {pack.map((p: any, i: number) => {
              const on = picked.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => setPicked((c) => (on ? c.filter((x) => x !== i) : [...c, i]))}
                  className={`overflow-hidden rounded-2xl border-2 p-2 text-left transition ${
                    on ? "border-forest bg-forest/5" : "border-transparent bg-cream/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.alt} className="aspect-[2/3] w-full rounded-xl object-cover" />
                    ) : (
                      <div className="grid aspect-[2/3] w-full place-items-center rounded-xl bg-forest/10 text-[10px] text-charcoal/50">
                        image failed
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                      {p.style}
                    </span>
                    {on && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-forest text-cream">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-forest-deep">{p.overlay_text}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] text-charcoal/60">{p.why_it_works}</p>
                  <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-wider text-sage">
                    {p.primary_keyword}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className={btn} disabled={!picked.length || saving} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Send {picked.length} pin{picked.length === 1 ? "" : "s"} to approvals
            </button>
            <button className={btnGhost} onClick={() => setPack(null)}>
              Discard
            </button>
          </div>
        </section>
      )}
    </div>
  );
}