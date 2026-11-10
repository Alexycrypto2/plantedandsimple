import { useMemo, useState } from "react";
import { Stethoscope, Check, X, Loader2, Wand2, Monitor, Smartphone, Sparkles, Pin } from "lucide-react";
import { auditSeo, SEO_PASS_SCORE, SEO_CATEGORY_LABELS, type SeoCategory } from "@/lib/content/seo-doctor";
import { autoFixSeo, suggestSeoField } from "@/lib/ai/seo-doctor.functions";
import { RenderedRecipeAudit } from "./RenderedRecipeAudit";

const GENERIC = new Set(["american", "mediterranean", "mexican", "thai", "indian", "italian", "asian", "middle eastern", "dinner", "lunch", "breakfast", "vegan", "high-protein", "high protein", "dessert", "snack", "side"]);
const HOLIDAYS = ["thanksgiving", "christmas", "easter", "halloween", "valentine", "new year"];

/** Picks the target keyword: holiday tags first, then the longest tag found in the title, never a bare cuisine/meal word. */
export function pickKeyword(tagsText: string, title: string): string {
  const tags = tagsText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const t = title.toLowerCase();
  const holiday = tags.find((x) => HOLIDAYS.some((h) => x.includes(h)));
  if (holiday) return holiday;
  const useful = tags.filter((x) => !GENERIC.has(x));
  const inTitle = useful.filter((x) => t.includes(x)).sort((a, b) => b.length - a.length)[0];
  // No tag matches the title: let the audit derive the keyword from the dish name itself.
  return inTitle ?? "";
}

type Fields = { title: string; seo_title: string; seo_description: string; excerpt: string; content: string; tags?: string; slug?: string; image?: string; pinterest_description?: string };
type Extra = { prepMinutes?: number; cookMinutes?: number; servings?: string; calories?: string; protein?: string; hasImage?: boolean };
type SuggestField = "seo_title" | "seo_description" | "pinterest" | "keywords";

const LIMITS: Record<string, [number, number]> = { seo_title: [30, 60], seo_description: [120, 155], pinterest: [100, 500] };

function Meter({ len, field }: { len: number; field: keyof typeof LIMITS }) {
  const [min, max] = LIMITS[field] ?? [0, 500];
  const ok = len >= min && len <= max;
  return <span className={`text-[10px] font-mono ${ok ? "text-forest" : "text-amber-700"}`}>{len}/{min}–{max}</span>;
}

export function SeoDoctor({ value, onApply, kind = "blog", extra }: { value: Fields; onApply: (patch: Partial<Fields>) => void; kind?: "blog" | "recipe"; extra?: Extra }) {
  const [keyword, setKeyword] = useState(() => pickKeyword(value.tags ?? "", value.title));
  const [secondaryText, setSecondaryText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<"none" | "mobile" | "desktop" | "pinterest">("none");
  const [tab, setTab] = useState<SeoCategory | "all">("all");
  const [suggesting, setSuggesting] = useState<SuggestField | null>(null);
  const [options, setOptions] = useState<{ field: SuggestField; items: string[] } | null>(null);

  const secondary = useMemo(() => secondaryText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3), [secondaryText]);
  const report = useMemo(
    () => auditSeo({
      title: value.title, seoTitle: value.seo_title, seoDescription: value.seo_description, html: value.content, keyword, secondary, kind, slug: value.slug,
      extra: kind === "recipe" ? { ...extra, hasImage: !!value.image || !!extra?.hasImage, pinterestDescription: value.pinterest_description } : undefined,
    }),
    [value, keyword, secondary, kind, extra],
  );
  const pass = report.score >= SEO_PASS_SCORE;
  const cats = (Object.keys(SEO_CATEGORY_LABELS) as SeoCategory[]).filter((c) => report.categoryScores[c] >= 0);
  const shown = (tab === "all" ? report.checks : report.checks.filter((c) => c.category === tab)).slice().sort((a, b) => Number(a.pass) - Number(b.pass) || b.weight - a.weight);
  const failing = report.checks.filter((c) => !c.pass).length;

  const fix = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r: any = await autoFixSeo({ data: { title: value.title, seoTitle: value.seo_title, seoDescription: value.seo_description, excerpt: value.excerpt, html: value.content, keyword: keyword || undefined, kind } });
      onApply(kind === "recipe"
        ? { seo_title: r.seoTitle, seo_description: r.seoDescription, excerpt: r.excerpt }
        : { seo_title: r.seoTitle, seo_description: r.seoDescription, excerpt: r.excerpt, content: r.html });
      setMsg(`Editorial suggestions applied. ${(r.changes ?? []).slice(0, 4).join(" · ")} Your title, web address${kind === "recipe" ? ", ingredients and steps" : ", facts and links"} are left unchanged on purpose — fix any remaining red items by hand. Save and recheck the page separately.`);
    } catch (e: any) {
      setErr(e?.message ?? "Auto-fix failed");
    } finally {
      setBusy(false);
    }
  };

  const suggest = async (field: SuggestField) => {
    setSuggesting(field); setErr(null); setOptions(null);
    try {
      const summary = `${value.excerpt}\n${value.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000)}`;
      const r = await suggestSeoField({ data: { field, title: value.title, keyword, summary, kind } });
      setOptions({ field, items: r.options });
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't get suggestions");
    } finally {
      setSuggesting(null);
    }
  };

  const pick = (field: SuggestField, text: string) => {
    if (field === "seo_title") onApply({ seo_title: text });
    else if (field === "seo_description") onApply({ seo_description: text });
    else if (field === "pinterest") onApply({ pinterest_description: text });
    else setSecondaryText((s) => [...s.split(",").map((x) => x.trim()).filter(Boolean), text].slice(0, 3).join(", "));
    if (field !== "keywords") setOptions(null);
  };

  const SuggestBtn = ({ field, label }: { field: SuggestField; label: string }) => (
    <button type="button" onClick={() => suggest(field)} disabled={!!suggesting} className="flex items-center gap-1 rounded-full border border-forest/20 bg-white px-3 py-1.5 text-[11px] font-semibold text-forest-deep disabled:opacity-50">
      {suggesting === field ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {label}
    </button>
  );

  const chip = (active: boolean) => `rounded-full border px-3 py-1.5 text-[11px] font-semibold ${active ? "border-forest bg-forest text-cream" : "border-forest/20 bg-white text-forest-deep"}`;

  return (
    <div className="mt-6 rounded-2xl border border-forest/10 bg-cream-warm/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-14 w-14 place-items-center rounded-full font-mono text-lg font-bold ${pass ? "bg-forest text-cream" : "bg-amber-100 text-amber-800"}`}>{report.score}</span>
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-forest-deep"><Stethoscope className="h-4 w-4" /> SEO Doctor Pro</p>
            <p className="text-xs text-charcoal/60">Editorial score · {pass ? "Few editorial suggestions remaining" : `${failing} editorial suggestions`} · {report.words} words · {report.readMinutes} min read</p>
          </div>
        </div>
        <button type="button" onClick={fix} disabled={busy || pass} className="flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-bold text-cream disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Auto-fix weak spots
        </button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">This score reflects local editorial heuristics, not Google requirements. Character lengths, word counts and keyword density are suggestions, not ranking rules. No score guarantees rankings, indexing or rich results.</p>
      {kind === "recipe" && <RenderedRecipeAudit slug={value.slug} />}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="text-[11px] font-semibold text-charcoal/70">Main keyword
          <input className="input mt-1 w-full text-xs" placeholder="e.g. vegan lentil loaf" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </label>
        <label className="text-[11px] font-semibold text-charcoal/70">Supporting phrases (up to 3, comma separated)
          <input className="input mt-1 w-full text-xs" placeholder="e.g. thanksgiving main, high protein" value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-forest/10 bg-white/70 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-charcoal/60">AI writer — pick your favourite</p>
        <div className="flex flex-wrap gap-2">
          <SuggestBtn field="seo_title" label="3 SEO titles" />
          <SuggestBtn field="seo_description" label="3 meta descriptions" />
          {kind === "recipe" && <SuggestBtn field="pinterest" label="3 Pinterest texts" />}
          <SuggestBtn field="keywords" label="Supporting phrases" />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-charcoal/60">
          <span>SEO title <Meter len={value.seo_title.length} field="seo_title" /></span>
          <span>Meta <Meter len={value.seo_description.length} field="seo_description" /></span>
          {kind === "recipe" && <span>Pinterest <Meter len={(value.pinterest_description ?? "").length} field="pinterest" /></span>}
        </div>
        {options && (
          <ul className="mt-3 space-y-2">
            {options.items.map((o) => (
              <li key={o}>
                <button type="button" onClick={() => pick(options.field, o)} className="w-full rounded-lg border border-forest/15 bg-cream-warm/40 p-2 text-left text-xs text-charcoal hover:border-forest">
                  {o} {options.field in LIMITS && <Meter len={o.length} field={options.field as keyof typeof LIMITS} />}
                </button>
              </li>
            ))}
            <li><button type="button" onClick={() => setOptions(null)} className="text-[11px] text-charcoal/50 underline">Dismiss</button></li>
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={chip(tab === "all")} onClick={() => setTab("all")}>All · {report.score}</button>
        {cats.map((c) => (
          <button key={c} type="button" className={chip(tab === c)} onClick={() => setTab(c)}>
            {SEO_CATEGORY_LABELS[c]} · {report.categoryScores[c]}
          </button>
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {shown.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-xs">
            {c.pass ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />}
            <span className={c.pass ? "text-charcoal/60" : "text-charcoal"}>{c.label}{!c.pass && <span className="block text-charcoal/50">{c.fix}</span>}</span>
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 rounded-xl bg-forest/10 px-3 py-2 text-xs text-forest-deep">{msg}</p>}
      {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setView(view === "mobile" ? "none" : "mobile")} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${view === "mobile" ? "border-forest bg-forest/10" : "border-forest/20"}`}><Smartphone className="h-3.5 w-3.5" /> Mobile preview</button>
        <button type="button" onClick={() => setView(view === "desktop" ? "none" : "desktop")} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${view === "desktop" ? "border-forest bg-forest/10" : "border-forest/20"}`}><Monitor className="h-3.5 w-3.5" /> Desktop preview</button>
        <button type="button" onClick={() => setView(view === "pinterest" ? "none" : "pinterest")} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${view === "pinterest" ? "border-forest bg-forest/10" : "border-forest/20"}`}><Pin className="h-3.5 w-3.5" /> Pinterest preview</button>
      </div>
      {view === "pinterest" && (
        <div className="mt-4 w-56 overflow-hidden rounded-2xl border border-forest/15 bg-white shadow-sm">
          {value.image ? <img src={value.image} alt="" className="aspect-[2/3] w-full object-cover" /> : <div className="grid aspect-[2/3] place-items-center bg-cream-warm text-xs text-charcoal/50">No main photo yet</div>}
          <div className="p-3">
            <p className="mb-2 text-[11px] text-muted-foreground">Illustrative preview · not a Rich Pin eligibility check</p>
            <p className="line-clamp-2 text-sm font-semibold text-charcoal">{value.seo_title || value.title}</p>
            <p className="mt-1 line-clamp-3 text-[11px] text-charcoal/60">{value.pinterest_description || value.seo_description}</p>
            <p className="mt-2 text-[10px] text-charcoal/40">plantedandsimple.com</p>
          </div>
        </div>
      )}
      {(view === "mobile" || view === "desktop") && (
        <div className="mt-4 overflow-x-auto">
          <div className={`mx-auto max-h-[70vh] overflow-y-auto rounded-2xl border border-forest/15 bg-white p-5 shadow-sm ${view === "mobile" ? "w-[390px]" : "w-full max-w-3xl"}`}>
            <p className="mb-2 text-xs text-muted-foreground">Illustrative preview · Google may show a different result or no rich result</p>
            <div className="mb-4 flex gap-3 rounded-xl border border-forest/10 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-charcoal/60">plantedandsimple.com › {kind === "recipe" ? "recipes" : "blog"}{value.slug ? ` › ${value.slug}` : ""}</p>
                <p className="truncate text-base text-blue-700">{value.seo_title || value.title}</p>
                {kind === "recipe" && (extra?.prepMinutes || extra?.cookMinutes) ? (
                  <p className="text-[11px] text-charcoal/60">{(extra.prepMinutes ?? 0) + (extra.cookMinutes ?? 0)} min{extra.calories ? ` · ${extra.calories} cal` : ""}{extra.protein ? ` · ${extra.protein}g protein` : ""}</p>
                ) : null}
                <p className="line-clamp-2 text-xs text-charcoal/70">{value.seo_description}</p>
              </div>
              {value.image && <img src={value.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
            </div>
            <h1 className="font-display text-3xl italic text-forest-deep">{value.title}</h1>
            <article className="prose prose-sm mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: value.content }} />
          </div>
        </div>
      )}
    </div>
  );
}
