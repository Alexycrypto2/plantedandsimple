import { useEffect, useState } from "react";
import { Radar, Loader2, TrendingUp, Flame, Trash2, PenLine, Search, ChefHat } from "lucide-react";
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
  discovered_at?: string | null;
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

const MOMENTUM: Record<string, string> = {
  exploding: "bg-red-100 text-red-700",
  rising: "bg-amber-100 text-amber-800",
  steady: "bg-forest/10 text-forest-deep",
  seasonal: "bg-sage/20 text-forest-deep",
};

function Score({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-forest" : value >= 60 ? "bg-sage" : "bg-charcoal/30";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-forest/10">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="font-mono text-xs text-charcoal/60">{value}</span>
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
  const [niche, setNiche] = useState("plant-based recipes, high-protein vegan, meal prep, digital cookbooks");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = () => listTopics().then((t: any) => setRows(t ?? [])).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const scan = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res: any = await scanTrends({ data: { niche } });
      await load();
      const src = (res?.sources ?? []).join(", ");
      setMsg(`Found ${res?.count ?? 0} trending topics${src ? ` from ${src} + AI analysis` : " from AI analysis"}.`);
    } catch (e: any) {
      setErr(e?.message ?? "Trend scan failed");
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...rows].sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0));

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-forest/10 bg-gradient-to-br from-forest to-forest-deep p-6 text-cream shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream/15">
            <Radar className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-3xl italic">Research Engine</h2>
            <p className="text-xs text-cream/70">
              Scans Google Trends, Pinterest, Reddit food communities and seasonality, then scores what your brand
              should write next.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded-full border border-cream/25 bg-cream/10 py-3 pl-11 pr-4 text-sm text-cream outline-none placeholder:text-cream/50 focus:border-cream/60"
              placeholder="Your niche and themes"
            />
          </div>
          <button
            onClick={scan}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-bold text-forest-deep transition hover:bg-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            {busy ? "Scanning the web…" : "Find trending topics"}
          </button>
        </div>
      </div>

      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}
      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

      {sorted.length === 0 && !busy && (
        <p className="rounded-2xl border border-dashed border-forest/20 bg-white p-8 text-center text-sm text-charcoal/50">
          No trends yet — run a scan to see what's rising in your niche.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((t) => {
          const meta = parseMeta(t.notes);
          const keywords = [meta.primary_keyword, ...(meta.secondary_keywords ?? [])].filter(Boolean).join(", ");
          return (
            <article
              key={t.id}
              className="group rounded-3xl border border-forest/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl italic leading-snug text-forest-deep">{t.topic}</h3>
                <span className="shrink-0 rounded-full bg-forest px-3 py-1 font-mono text-xs font-bold text-cream">
                  {t.ai_score ?? "—"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {meta.momentum && (
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${MOMENTUM[meta.momentum] ?? "bg-forest/10 text-forest-deep"}`}>
                    <Flame className="h-3 w-3" /> {meta.momentum}
                  </span>
                )}
                {t.category && (
                  <span className="rounded-full border border-forest/15 px-3 py-1 text-[11px] font-semibold capitalize text-charcoal/70">
                    {t.category}
                  </span>
                )}
                {t.competition && (
                  <span className="rounded-full border border-forest/15 px-3 py-1 text-[11px] font-semibold text-charcoal/70">
                    {t.competition} competition
                  </span>
                )}
              </div>

              {t.recommendation && (
                <p className="mt-3 text-sm leading-relaxed text-charcoal/75">
                  <span className="font-semibold text-forest-deep">Why it's trending: </span>
                  {t.recommendation}
                </p>
              )}
              {meta.growth && (
                <p className="mt-2 text-xs font-semibold text-forest">Search trend: {meta.growth}</p>
              )}
              {meta.competitor_gap && (
                <p className="mt-2 rounded-xl bg-sage/15 px-3 py-2 text-xs leading-relaxed text-forest-deep">
                  <span className="font-semibold">How we beat page 1: </span>
                  {meta.competitor_gap}
                </p>
              )}
              {meta.angle && <p className="mt-2 text-xs text-charcoal/60">Angle: {meta.angle}</p>}
              {keywords && <p className="mt-1 text-[11px] text-charcoal/50">Keywords: {keywords}</p>}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">Google demand</p>
                  <Score value={Number(t.search_volume ?? 0)} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">Pinterest potential</p>
                  <Score value={Number(t.pinterest_score ?? 0)} />
                </div>
              </div>

              {(meta.sources ?? []).length > 0 && (
                <p className="mt-3 text-[11px] text-charcoal/50">Signals: {meta.sources!.join(" · ")}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onWriteBlog(t.topic, keywords)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-forest to-sage px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-cream hover:opacity-90"
                >
                  <PenLine className="h-3.5 w-3.5" /> Write blog post
                </button>
                <button
                  onClick={() => onWriteRecipe(t.topic, keywords)}
                  className="flex items-center gap-2 rounded-full border border-forest/30 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest-deep hover:bg-forest/5"
                >
                  <ChefHat className="h-3.5 w-3.5" /> Create recipe
                </button>
                <button
                  onClick={async () => {
                    await deleteTopic({ data: { id: t.id } });
                    load();
                  }}
                  className="flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-charcoal/60 hover:bg-forest/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Dismiss
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
