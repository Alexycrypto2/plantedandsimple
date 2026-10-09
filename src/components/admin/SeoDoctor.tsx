import { useMemo, useState } from "react";
import { Stethoscope, Check, X, Loader2, Wand2, Monitor, Smartphone } from "lucide-react";
import { auditSeo, SEO_PASS_SCORE } from "@/lib/content/seo-doctor";
import { autoFixSeo } from "@/lib/ai/seo-doctor.functions";

type Fields = { title: string; seo_title: string; seo_description: string; excerpt: string; content: string; tags?: string };

export function SeoDoctor({ value, onApply, kind = "blog" }: { value: Fields; onApply: (patch: Partial<Fields>) => void; kind?: "blog" | "recipe" }) {
  const [keyword, setKeyword] = useState(() => (value.tags ?? "").split(",")[0]?.trim() ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<"none" | "mobile" | "desktop">("none");

  const report = useMemo(
    () => auditSeo({ title: value.title, seoTitle: value.seo_title, seoDescription: value.seo_description, html: value.content, keyword, kind }),
    [value.title, value.seo_title, value.seo_description, value.content, keyword, kind],
  );
  const pass = report.score >= SEO_PASS_SCORE;

  const fix = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r: any = await autoFixSeo({ data: { title: value.title, seoTitle: value.seo_title, seoDescription: value.seo_description, excerpt: value.excerpt, html: value.content, keyword: keyword || undefined, kind } });
      onApply(kind === "recipe"
        ? { seo_title: r.seoTitle, seo_description: r.seoDescription, excerpt: r.excerpt }
        : { seo_title: r.seoTitle, seo_description: r.seoDescription, excerpt: r.excerpt, content: r.html });
      setMsg(`Score ${r.before} → ${r.after}. ${(r.changes ?? []).slice(0, 4).join(" · ")}`);
    } catch (e: any) {
      setErr(e?.message ?? "Auto-fix failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-forest/10 bg-cream-warm/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-14 w-14 place-items-center rounded-full font-mono text-lg font-bold ${pass ? "bg-forest text-cream" : "bg-amber-100 text-amber-800"}`}>{report.score}</span>
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-forest-deep"><Stethoscope className="h-4 w-4" /> SEO Doctor</p>
            <p className="text-xs text-charcoal/60">{pass ? "Ready to rank — safe to publish." : `Aim for ${SEO_PASS_SCORE}+ before publishing.`} · {report.words} words</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input className="input w-48 text-xs" placeholder="Target keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <button type="button" onClick={fix} disabled={busy || pass} className="flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-bold text-cream disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Auto-fix weak spots
          </button>
        </div>
      </div>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {report.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-xs">
            {c.pass ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />}
            <span className={c.pass ? "text-charcoal/60" : "text-charcoal"}>{c.label}{!c.pass && <span className="block text-charcoal/50">{c.fix}</span>}</span>
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 rounded-xl bg-forest/10 px-3 py-2 text-xs text-forest-deep">{msg}</p>}
      {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setView(view === "mobile" ? "none" : "mobile")} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${view === "mobile" ? "border-forest bg-forest/10" : "border-forest/20"}`}><Smartphone className="h-3.5 w-3.5" /> Mobile preview</button>
        <button type="button" onClick={() => setView(view === "desktop" ? "none" : "desktop")} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${view === "desktop" ? "border-forest bg-forest/10" : "border-forest/20"}`}><Monitor className="h-3.5 w-3.5" /> Desktop preview</button>
      </div>
      {view !== "none" && (
        <div className="mt-4 overflow-x-auto">
          <div className={`mx-auto max-h-[70vh] overflow-y-auto rounded-2xl border border-forest/15 bg-white p-5 shadow-sm ${view === "mobile" ? "w-[390px]" : "w-full max-w-3xl"}`}>
            <div className="mb-4 rounded-xl border border-forest/10 p-3">
              <p className="truncate text-sm text-blue-700">{value.seo_title || value.title}</p>
              <p className="text-[11px] text-green-700">plantedandsimple.store › {kind === "recipe" ? "recipes" : "blog"}</p>
              <p className="line-clamp-2 text-xs text-charcoal/70">{value.seo_description}</p>
            </div>
            <h1 className="font-display text-3xl italic text-forest-deep">{value.title}</h1>
            <article className="prose prose-sm mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: value.content }} />
          </div>
        </div>
      )}
    </div>
  );
}
