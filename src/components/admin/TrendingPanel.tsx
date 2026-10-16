import { useEffect, useMemo, useState } from "react";
import {
  Radar, Loader2, TrendingUp, Flame, Trash2, PenLine, Search, ChefHat, Copy, Check, ChevronDown, Target, ShoppingBag, CheckCircle2,
} from "lucide-react";
import { scanTrends, listTopics, deleteTopic } from "@/lib/ai/topics.functions";

type Row = {
  id: string;
  topic: string;
  category: string | null;
  ai_score: number | null;
  trend_score: number | null;
  pinterest_score: number | null;
  search_volume: number | null;
  competition: string | null;
  recommendation: string | null;
  notes: string | null;
};

type Meta = {
  momentum?: string;
  sources?: string[];
  angle?: string;
  seasonality?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  competitor_gap?: string;
  growth?: string;
  rankability?: number;
  buyer_intent?: number;
  intent?: string;
  missing_h2s?: string[];
  offer?: string;
  cluster?: string;
  real_query?: boolean;
};

function parseMeta(notes: string | null): Meta {
  if (!notes) return {};
  try {
    const v = JSON.parse(notes);
    return typeof v === "object" && v ? v : {};
  } catch {
    return { angle: notes };
  }
}

const PRESETS = [
  { label: "High-protein dinners", niche: "high protein vegan dinner, easy high protein vegan meals" },
  { label: "Meal prep", niche: "vegan meal prep, high protein vegan meal prep" },
  { label: "20-minute meals", niche: "20 minute vegan meals, quick plant based dinner" },
  { label: "Breakfast", niche: "high protein vegan breakfast, vegan breakfast meal prep" },
  { label: "Budget", niche: "cheap vegan meals, budget plant based meal plan" },
  { label: "Seasonal", niche: "fall vegan recipes, holiday plant based recipes" },
];

const OFFER: Record<string, string> = {
  free_guide: "Free 12-recipe guide",
  cookbook: "$14.99 Cookbook",
  meal_prep: "$27 Meal Prep System",
  planning_kit: "$4.99 Planning Kit",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "quick", label: "Quick wins" },
  { id: "buyer", label: "Buyer intent" },
  { id: "pinterest", label: "Pinterest-first" },
  { id: "recipe", label: "Recipes" },
  { id: "blog", label: "Blogs" },
] as const;

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-forest" : value >= 50 ? "bg-sage" : "bg-charcoal/30";
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-charcoal/50">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/10">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function TrendingPanel({
  onWriteBlog,
  onWriteRecipe,
}: {
  onWriteBlog: (topic: string, keywords: string) => void;
  onWriteRecipe: (topic: string, keywords: string) => void;
}) {
  const [niche, setNiche] = useState(PRESETS[0]!.niche);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [cluster, setCluster] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => listTopics().then((t: any) => setRows(t ?? [])).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const scan = async (n = niche) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res: any = await scanTrends({ data: { niche: n } });
      await load();
      const src = (res?.sources ?? []).join(", ");
      setMsg(`Found ${res?.count ?? 0} opportunities${src ? ` using ${src}` : ""}.`);
    } catch (e: any) {
      setErr(e?.message ?? "Research scan failed");
    } finally {
      setBusy(false);
    }
  };

  const items = useMemo(
    () => rows.map((r) => ({ r, m: parseMeta(r.notes) })).sort((a, b) => (b.r.ai_score ?? 0) - (a.r.ai_score ?? 0)),
    [rows],
  );
  const clusters = useMemo(
    () => Array.from(new Set(items.map((i) => i.m.cluster).filter(Boolean))) as string[],
    [items],
  );
  const shown = items.filter(({ r, m }) => {
    if (cluster && m.cluster !== cluster) return false;
    if (filter === "quick") return (m.rankability ?? 0) >= 60;
    if (filter === "buyer") return (m.buyer_intent ?? 0) >= 60;
    if (filter === "pinterest") return (r.pinterest_score ?? 0) >= 70;
    if (filter === "recipe") return r.category === "recipe";
    if (filter === "blog") return r.category !== "recipe";
    return true;
  });

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-forest to-forest-deep p-6 text-cream shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream/15">
            <Radar className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl italic sm:text-3xl">Research Engine</h2>
            <p className="text-xs text-cream/70">
              Real Google searches + Pinterest, Reddit and trends — scored for what a young site can actually rank and sell.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              disabled={busy}
              onClick={() => {
                setNiche(p.niche);
                scan(p.niche);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                niche === p.niche ? "border-cream bg-cream text-forest-deep" : "border-cream/30 text-cream hover:bg-cream/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded-full border border-cream/25 bg-cream/10 py-3 pl-11 pr-4 text-sm text-cream outline-none placeholder:text-cream/50 focus:border-cream/60"
              placeholder="Seed keywords, comma separated"
            />
          </div>
          <button
            onClick={() => scan()}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-bold text-forest-deep hover:bg-cream/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            {busy ? "Researching…" : "Find opportunities"}
          </button>
        </div>
      </div>

      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}
      {err && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</p>}

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                  filter === f.id ? "bg-forest text-cream" : "border border-forest/15 text-charcoal/70 hover:bg-forest/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {clusters.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCluster("")}
                className={`rounded-full px-3 py-1 text-[11px] ${!cluster ? "bg-sage/30 text-forest-deep" : "text-charcoal/60"}`}
              >
                All groups
              </button>
              {clusters.map((c) => (
                <button
                  key={c}
                  onClick={() => setCluster(c)}
                  className={`rounded-full px-3 py-1 text-[11px] ${cluster === c ? "bg-sage/30 text-forest-deep" : "text-charcoal/60 hover:bg-sage/10"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && !busy && (
        <p className="rounded-2xl border border-dashed border-forest/20 bg-white p-8 text-center text-sm text-charcoal/50">
          Pick a quick scan above to find keywords you can rank for.
        </p>
      )}
      {items.length > 0 && shown.length === 0 && (
        <p className="text-sm text-charcoal/50">Nothing matches this filter yet.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map(({ r: t, m }) => {
          const keywords = [m.primary_keyword, ...(m.secondary_keywords ?? [])].filter(Boolean).join(", ");
          const isOpen = open === t.id;
          const rank = m.rankability ?? 0;
          return (
            <article key={t.id} className="flex flex-col rounded-3xl border border-forest/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg italic leading-snug text-forest-deep">{t.topic}</h3>
                  {m.primary_keyword && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-charcoal/60">
                      <Target className="h-3 w-3" /> {m.primary_keyword}
                      {m.real_query && (
                        <span className="ml-1 flex items-center gap-0.5 font-semibold text-forest">
                          <CheckCircle2 className="h-3 w-3" /> real search
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-forest px-3 py-1 font-mono text-xs font-bold text-cream">
                  {t.ai_score ?? "—"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {rank >= 60 && (
                  <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest-deep">Quick win</span>
                )}
                {m.momentum && (
                  <span className="flex items-center gap-1 rounded-full bg-sage/20 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-forest-deep">
                    <Flame className="h-3 w-3" /> {m.momentum}
                  </span>
                )}
                {t.category && (
                  <span className="rounded-full border border-forest/15 px-2.5 py-0.5 text-[11px] capitalize text-charcoal/70">{t.category}</span>
                )}
                {m.intent && (
                  <span className="rounded-full border border-forest/15 px-2.5 py-0.5 text-[11px] capitalize text-charcoal/70">{m.intent} intent</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Bar label="Rankability" value={rank} />
                <Bar label="Buyer intent" value={m.buyer_intent ?? 0} />
                <Bar label="Google demand" value={Number(t.search_volume ?? 0)} />
                <Bar label="Pinterest" value={Number(t.pinterest_score ?? 0)} />
              </div>

              {m.offer && OFFER[m.offer] && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-forest-deep">
                  <ShoppingBag className="h-3.5 w-3.5" /> Attach: <span className="font-semibold">{OFFER[m.offer]}</span>
                </p>
              )}

              <button
                onClick={() => setOpen(isOpen ? null : t.id)}
                className="mt-3 flex items-center gap-1 self-start text-xs font-semibold text-forest"
              >
                {isOpen ? "Hide details" : "Content blueprint"}
                <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2 rounded-2xl bg-cream p-3 text-xs leading-relaxed text-charcoal/75">
                  {t.recommendation && (
                    <p><span className="font-semibold text-forest-deep">Why now: </span>{t.recommendation}</p>
                  )}
                  {m.growth && <p><span className="font-semibold text-forest-deep">Trend: </span>{m.growth}</p>}
                  {m.competitor_gap && (
                    <p><span className="font-semibold text-forest-deep">How we beat page 1: </span>{m.competitor_gap}</p>
                  )}
                  {(m.missing_h2s ?? []).length > 0 && (
                    <div>
                      <p className="font-semibold text-forest-deep">Headings competitors miss:</p>
                      <ul className="ml-4 list-disc">
                        {m.missing_h2s!.map((h) => <li key={h}>{h}</li>)}
                      </ul>
                    </div>
                  )}
                  {m.angle && <p><span className="font-semibold text-forest-deep">Angle: </span>{m.angle}</p>}
                  {keywords && <p><span className="font-semibold text-forest-deep">Keywords: </span>{keywords}</p>}
                  {(m.sources ?? []).length > 0 && <p className="text-charcoal/50">Signals: {m.sources!.join(" · ")}</p>}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <button
                  onClick={() => onWriteBlog(t.topic, keywords)}
                  className="flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-bold text-cream hover:opacity-90"
                >
                  <PenLine className="h-3.5 w-3.5" /> Write blog
                </button>
                <button
                  onClick={() => onWriteRecipe(t.topic, keywords)}
                  className="flex items-center gap-1.5 rounded-full border border-forest/30 px-4 py-2 text-xs font-bold text-forest-deep hover:bg-forest/5"
                >
                  <ChefHat className="h-3.5 w-3.5" /> Create recipe
                </button>
                {keywords && (
                  <button
                    onClick={() => copy(t.id, keywords)}
                    className="flex items-center gap-1.5 rounded-full border border-forest/15 px-3 py-2 text-xs text-charcoal/70 hover:bg-forest/5"
                  >
                    {copied === t.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === t.id ? "Copied" : "Keywords"}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await deleteTopic({ data: { id: t.id } });
                    load();
                  }}
                  aria-label="Dismiss"
                  className="ml-auto rounded-full p-2 text-charcoal/40 hover:bg-forest/5 hover:text-charcoal/70"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
