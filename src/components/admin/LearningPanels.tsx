import { useEffect, useState } from "react";
import {
  learningOverview,
  listInsights,
  recomputeLearning,
  generateDailyBriefing,
  listRecommendations,
  setRecommendationStatus,
  listExperiments,
  upsertExperiment,
  evaluateExperiment,
  setExperimentStatus,
  suggestExperiments,
  listBrandRules,
  upsertBrandRule,
  deleteBrandRule,
  listBrandChecks,
  type InsightRow,
  type RecommendationRow,
  type ExperimentRow,
  type BrandRuleRow,
} from "@/lib/learning/learning.functions";

const card = "rounded-2xl border border-forest/10 bg-white p-5 shadow-sm";
const input =
  "w-full rounded-xl border border-forest/20 bg-cream/40 px-4 py-3 text-sm outline-none focus:border-forest";
const btn =
  "rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-50";
const btnGhost =
  "rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest hover:bg-forest/5 disabled:opacity-50";

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl italic text-forest-deep">{title}</h2>
      {sub && <p className="mt-1 text-sm text-charcoal/60">{sub}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={card}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-charcoal/50">{label}</p>
      <p className="mt-2 font-display text-3xl italic text-forest-deep">{value}</p>
    </div>
  );
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg] as const;
}

/* ------------------------------ Intelligence ------------------------------- */

export function IntelligencePanel() {
  const [msg, setMsg] = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof learningOverview>> | null>(null);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [recs, setRecs] = useState<RecommendationRow[]>([]);
  const [briefing, setBriefing] = useState<{ headline: string; summary: string } | null>(null);
  const [dimension, setDimension] = useState("all");

  const refresh = async () => {
    const [s, i, r] = await Promise.all([learningOverview(), listInsights(), listRecommendations()]);
    setStats(s);
    setInsights(i);
    setRecs(r);
  };

  useEffect(() => {
    refresh().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const run = async (key: string, fn: () => Promise<any>, done: string) => {
    setBusy(key);
    try {
      await fn();
      await refresh();
      setMsg(done);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const dimensions = ["all", ...Array.from(new Set(insights.map((i) => i.dimension)))];
  const shown = insights.filter((i) => dimension === "all" || i.dimension === dimension).slice(0, 40);
  const today = new Date().toISOString().slice(0, 10);
  const todaysRecs = recs.filter((r) => r.for_date === today);

  return (
    <div className="space-y-6">
      <Heading
        title="AI memory & intelligence"
        sub="Everything the business has learned, and why the AI recommends what it recommends."
      />
      {msg && <p className="rounded-xl bg-sage/15 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Signals learned" value={stats?.signals ?? "—"} />
        <Stat label="Active patterns" value={stats?.insights ?? "—"} />
        <Stat label="Running tests" value={stats?.running_experiments ?? "—"} />
        <Stat label="New recommendations" value={stats?.new_recommendations ?? "—"} />
        <Stat label="Brand score" value={stats?.brand_score != null ? `${stats.brand_score}` : "—"} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className={btn}
          disabled={busy !== null}
          onClick={() => run("learn", () => recomputeLearning({ data: { windowDays: 90 } }), "Memory refreshed from the last 90 days.")}
        >
          {busy === "learn" ? "Learning…" : "Learn from the last 90 days"}
        </button>
        <button
          className={btn}
          disabled={busy !== null}
          onClick={() =>
            run("brief", async () => {
              const res = await generateDailyBriefing();
              setBriefing({ headline: res.headline, summary: res.summary });
            }, "Morning briefing ready.")
          }
        >
          {busy === "brief" ? "Thinking…" : "Generate morning briefing"}
        </button>
      </div>

      {briefing && (
        <div className={card}>
          <p className="font-display text-xl italic text-forest-deep">{briefing.headline}</p>
          <p className="mt-2 text-sm text-charcoal/70">{briefing.summary}</p>
        </div>
      )}

      <div className={card}>
        <h3 className="font-display text-lg italic text-forest-deep">
          Today&apos;s recommendations {todaysRecs.length ? `(${todaysRecs.length})` : ""}
        </h3>
        {!recs.length && <p className="mt-2 text-sm text-charcoal/60">No recommendations yet — generate a briefing.</p>}
        <div className="mt-4 space-y-3">
          {recs.slice(0, 12).map((r) => (
            <div key={r.id} className="rounded-xl border border-forest/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-forest/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-forest">
                  {r.kind}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
                  P{r.priority} · {r.for_date} · {r.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-charcoal">{r.title}</p>
              <p className="mt-1 text-sm text-charcoal/70">
                <span className="font-semibold text-forest">Why: </span>
                {r.reasoning}
              </p>
              {r.action?.instruction && (
                <p className="mt-1 text-sm text-charcoal/60">
                  <span className="font-semibold">Do: </span>
                  {r.action.instruction}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  className={btnGhost}
                  disabled={busy !== null}
                  onClick={() => run("r" + r.id, () => setRecommendationStatus({ data: { id: r.id, status: "accepted" } }), "Accepted.")}
                >
                  Accept
                </button>
                <button
                  className={btnGhost}
                  disabled={busy !== null}
                  onClick={() => run("d" + r.id, () => setRecommendationStatus({ data: { id: r.id, status: "dismissed" } }), "Dismissed.")}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg italic text-forest-deep">What the AI has learned</h3>
          <select className="rounded-full border border-forest/20 px-3 py-1.5 text-xs" value={dimension} onChange={(e) => setDimension(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        {!insights.length && (
          <p className="mt-2 text-sm text-charcoal/60">
            No patterns yet. Run “Learn from the last 90 days” once traffic and sales data exist.
          </p>
        )}
        <div className="mt-4 space-y-2">
          {shown.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-forest/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal">
                  {i.dimension.replace(/_/g, " ")}: {i.dimension_value}
                </p>
                <p className="text-xs text-charcoal/60">{i.summary}</p>
              </div>
              <div className="text-right">
                <p className={`font-display text-xl italic ${i.lift_pct >= 0 ? "text-forest-deep" : "text-red-600"}`}>
                  {i.lift_pct > 0 ? "+" : ""}
                  {i.lift_pct}%
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
                  n={i.sample_size} · conf {i.confidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Experiments -------------------------------- */

const DIMENSIONS = [
  "pin_style",
  "image_style",
  "blog_format",
  "headline_style",
  "cta_style",
  "publish_dow",
  "publish_hour",
];

export function ExperimentsPanel() {
  const [msg, setMsg] = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [rows, setRows] = useState<ExperimentRow[]>([]);
  const [name, setName] = useState("");
  const [dimension, setDimension] = useState(DIMENSIONS[0]);
  const [hypothesis, setHypothesis] = useState("");
  const [variants, setVariants] = useState("");

  const refresh = () => listExperiments().then(setRows);
  useEffect(() => {
    refresh().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const run = async (key: string, fn: () => Promise<any>, done: string) => {
    setBusy(key);
    try {
      await fn();
      await refresh();
      setMsg(done);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Heading
        title="Experiment mode"
        sub="The studio deliberately varies these while the engine measures which approach wins."
      />
      {msg && <p className="rounded-xl bg-sage/15 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <div className={card}>
        <h3 className="font-display text-lg italic text-forest-deep">New experiment</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Name — e.g. Pin layout test" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={input} value={dimension} onChange={(e) => setDimension(e.target.value)}>
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input className={input} placeholder="Variants, comma separated" value={variants} onChange={(e) => setVariants(e.target.value)} />
          <input className={input} placeholder="Hypothesis" value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className={btn}
            disabled={busy !== null || !name.trim()}
            onClick={() =>
              run("create", async () => {
                await upsertExperiment({
                  data: {
                    name,
                    dimension,
                    hypothesis,
                    variants: variants.split(",").map((v) => v.trim()).filter(Boolean),
                  },
                });
                setName("");
                setVariants("");
                setHypothesis("");
              }, "Experiment started.")
            }
          >
            Start experiment
          </button>
          <button
            className={btnGhost}
            disabled={busy !== null}
            onClick={() => run("suggest", () => suggestExperiments(), "The AI proposed new experiments.")}
          >
            {busy === "suggest" ? "Thinking…" : "Let the AI propose experiments"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {!rows.length && <p className="text-sm text-charcoal/60">No experiments yet.</p>}
        {rows.map((e) => (
          <div key={e.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-charcoal">{e.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/40">
                  {e.dimension.replace(/_/g, " ")} · {e.status}
                  {e.winner ? ` · winner: ${e.winner}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button className={btnGhost} disabled={busy !== null} onClick={() => run("ev" + e.id, () => evaluateExperiment({ data: { id: e.id } }), "Evaluated against measured results.")}>
                  Evaluate
                </button>
                <button
                  className={btnGhost}
                  disabled={busy !== null}
                  onClick={() =>
                    run("st" + e.id, () => setExperimentStatus({ data: { id: e.id, status: e.status === "running" ? "paused" : "running" } }), "Updated.")
                  }
                >
                  {e.status === "running" ? "Pause" : "Resume"}
                </button>
                <button className={btnGhost} disabled={busy !== null} onClick={() => run("rt" + e.id, () => setExperimentStatus({ data: { id: e.id, status: "retired" } }), "Retired.")}>
                  Retire
                </button>
              </div>
            </div>
            {e.hypothesis && <p className="mt-2 text-sm text-charcoal/70">{e.hypothesis}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(e.variants ?? []).map((v: any, idx: number) => (
                <span key={idx} className="rounded-full bg-forest/10 px-3 py-1 text-xs text-forest">
                  {typeof v === "string" ? v : v?.name}
                </span>
              ))}
            </div>
            {Array.isArray(e.results?.scored) && (
              <div className="mt-3 space-y-1 text-xs text-charcoal/60">
                {e.results.scored.map((s: any) => (
                  <p key={s.variant}>
                    {s.variant}: {s.weighted_lift > 0 ? "+" : ""}
                    {s.weighted_lift}% (n={s.samples})
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Brand ----------------------------------- */

const RULE_CATEGORIES = ["voice", "typography", "image", "pinterest", "cta", "homepage", "editorial"];

export function BrandPanel() {
  const [msg, setMsg] = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [rules, setRules] = useState<BrandRuleRow[]>([]);
  const [checks, setChecks] = useState<Awaited<ReturnType<typeof listBrandChecks>>>([]);
  const [category, setCategory] = useState(RULE_CATEGORIES[0]);
  const [rule, setRule] = useState("");
  const [weight, setWeight] = useState(3);

  const refresh = async () => {
    const [r, c] = await Promise.all([listBrandRules(), listBrandChecks()]);
    setRules(r);
    setChecks(c);
  };
  useEffect(() => {
    refresh().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const run = async (key: string, fn: () => Promise<any>, done: string) => {
    setBusy(key);
    try {
      await fn();
      await refresh();
      setMsg(done);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Heading title="Brand consistency" sub="Every generated asset is written and audited against these rules." />
      {msg && <p className="rounded-xl bg-sage/15 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <div className={card}>
        <h3 className="font-display text-lg italic text-forest-deep">Add a brand rule</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_120px]">
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {RULE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input className={input} placeholder="The rule the AI must always follow" value={rule} onChange={(e) => setRule(e.target.value)} />
          <select className={input} value={weight} onChange={(e) => setWeight(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((w) => (
              <option key={w} value={w}>
                Weight {w}
              </option>
            ))}
          </select>
        </div>
        <button
          className={`${btn} mt-4`}
          disabled={busy !== null || !rule.trim()}
          onClick={() =>
            run("add", async () => {
              await upsertBrandRule({ data: { category, rule, weight } });
              setRule("");
            }, "Rule saved.")
          }
        >
          Save rule
        </button>
      </div>

      <div className={card}>
        <h3 className="font-display text-lg italic text-forest-deep">Live brand rules</h3>
        <div className="mt-4 space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-forest/10 px-4 py-3">
              <div className="min-w-0">
                <span className="rounded-full bg-forest/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-forest">{r.category}</span>
                <p className="mt-1 text-sm text-charcoal/80">{r.rule}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={btnGhost}
                  disabled={busy !== null}
                  onClick={() => run("t" + r.id, () => upsertBrandRule({ data: { id: r.id, category: r.category, rule: r.rule, weight: r.weight, active: !r.active } }), "Updated.")}
                >
                  {r.active ? "Active" : "Paused"}
                </button>
                <button className={btnGhost} disabled={busy !== null} onClick={() => run("x" + r.id, () => deleteBrandRule({ data: { id: r.id } }), "Removed.")}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className="font-display text-lg italic text-forest-deep">Recent brand audits</h3>
        {!checks.length && <p className="mt-2 text-sm text-charcoal/60">No audits yet — run a brand check from the Approval Queue.</p>}
        <div className="mt-4 space-y-2">
          {checks.map((c) => (
            <div key={c.id} className="rounded-xl border border-forest/10 px-4 py-3">
              <p className="text-sm font-semibold text-charcoal">
                Score {c.score} · {new Date(c.checked_at).toLocaleString()}
              </p>
              {c.notes && <p className="text-xs text-charcoal/60">{c.notes}</p>}
              {(c.issues ?? []).map((i, idx) => (
                <p key={idx} className="mt-1 text-xs text-charcoal/70">
                  <span className="font-semibold">{i.area}:</span> {i.problem} — <em>{i.fix}</em>
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
