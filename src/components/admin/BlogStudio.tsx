import { useState } from "react";
import {
  researchTopic,
  generateStudioBlog,
  TONES,
  READING_LEVELS,
  CONTENT_GOALS,
  type Research,
} from "@/lib/ai/blog-studio.functions";
import { generatePinSet, generatePinPreviewPack, savePinPreviews, PIN_STYLES } from "@/lib/ai/pin-studio.functions";

const card = "rounded-2xl border border-forest/10 bg-white p-5 shadow-sm";
const input =
  "w-full rounded-xl border border-forest/20 bg-cream/40 px-4 py-3 text-sm outline-none focus:border-forest";
const label = "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage";
const btn =
  "rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-50";
const btnGhost =
  "rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest hover:bg-forest/5 disabled:opacity-50";

function Field({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <label className="block space-y-1.5">
      <span className={label}>{title}</span>
      {children}
    </label>
  );
}

function Toggle({
  on,
  set,
  children,
}: {
  on: boolean;
  set: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        on ? "bg-forest text-cream" : "border border-forest/20 text-charcoal/60 hover:bg-forest/5"
      }`}
    >
      {on ? "✓ " : ""}
      {children}
    </button>
  );
}

function Meter({ title, value }: { title: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold text-charcoal/60">
        <span>{title}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest/10">
        <div className="h-full rounded-full bg-forest" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------- Blog Studio ------------------------------- */

export function BlogStudioPanel() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [audience, setAudience] = useState("Busy home cooks eating more plants");
  const [tone, setTone] = useState<string>("Editorial");
  const [wordCount, setWordCount] = useState(1600);
  const [readingLevel, setReadingLevel] = useState<string>("Standard");
  const [goal, setGoal] = useState<string>("SEO Ranking");

  const [includeRecipe, setIncludeRecipe] = useState(true);
  const [includeFaq, setIncludeFaq] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeInternalLinks, setIncludeInternalLinks] = useState(true);
  const [includeProduct, setIncludeProduct] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);

  const [research, setResearch] = useState<Research | null>(null);
  const [result, setResult] = useState<any>(null);

  const doResearch = async () => {
    setBusy("research");
    setMsg(null);
    try {
      const r = await researchTopic({ data: { topic, primaryKeyword, audience } });
      setResearch(r);
      if (!primaryKeyword && r.long_tail_keywords[0]) setPrimaryKeyword(r.long_tail_keywords[0]);
      if (!secondaryKeywords) setSecondaryKeywords(r.semantic_keywords.slice(0, 6).join(", "));
      setWordCount(Math.min(3500, Math.max(800, Math.round(r.suggested_word_count / 100) * 100)));
      setStep(2);
    } catch (e: any) {
      setMsg(e?.message ?? "Research failed");
    } finally {
      setBusy(null);
    }
  };

  const doGenerate = async () => {
    setBusy("generate");
    setMsg(null);
    try {
      const res = await generateStudioBlog({
        data: {
          topic,
          category: category || undefined,
          primaryKeyword: primaryKeyword || undefined,
          secondaryKeywords: secondaryKeywords || undefined,
          audience,
          tone,
          wordCount,
          readingLevel,
          goal,
          includeRecipe,
          includeFaq,
          includeToc,
          includeInternalLinks,
          includeProduct,
          includeCta,
          imageCount: null,
          research,
        },
      });
      setResult(res);
      setStep(3);
    } catch (e: any) {
      setMsg(e?.message ?? "Generation failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl italic text-forest-deep">AI Content Studio</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Research → configure → generate a full editorial article with matching photography. Everything lands in the
          Approval Queue.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          [1, "Research"],
          [2, "Configure"],
          [3, "Result"],
        ].map(([n, t]) => (
          <button
            key={n as number}
            onClick={() => setStep(n as 1 | 2 | 3)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              step === n ? "bg-forest text-cream" : "border border-forest/20 text-forest"
            }`}
          >
            {n as number}. {t as string}
          </button>
        ))}
      </div>

      {msg && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</p>}

      {step === 1 && (
        <section className={card}>
          <h3 className="font-semibold text-forest-deep">Topic research</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field title="Blog topic">
              <input className={input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="High-protein vegan breakfast bowls" />
            </Field>
            <Field title="Primary keyword (optional)">
              <input className={input} value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} placeholder="vegan protein breakfast" />
            </Field>
            <Field title="Target audience">
              <input className={input} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
            <Field title="Category">
              <input className={input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Breakfast" />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={btn} disabled={!topic.trim() || busy === "research"} onClick={doResearch}>
              {busy === "research" ? "Researching…" : "Run AI research"}
            </button>
            <button className={btnGhost} disabled={!topic.trim()} onClick={() => setStep(2)}>
              Skip research →
            </button>
          </div>

          {research && (
            <div className="mt-6 space-y-4 rounded-2xl bg-cream/60 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Meter title="Difficulty" value={research.difficulty} />
                <Meter title="Popularity" value={research.popularity} />
                <div>
                  <p className={label}>Seasonality</p>
                  <p className="mt-1 text-sm">{research.seasonality}</p>
                </div>
              </div>
              <div>
                <p className={label}>Search intent</p>
                <p className="mt-1 text-sm">{research.search_intent}</p>
              </div>
              <div>
                <p className={label}>Recommended angle</p>
                <p className="mt-1 text-sm">{research.recommended_angle}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={label}>Competitor headings</p>
                  <ul className="mt-1 list-disc pl-4 text-sm text-charcoal/70">
                    {research.competitor_headings.slice(0, 8).map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
                <div>
                  <p className={label}>People also ask</p>
                  <ul className="mt-1 list-disc pl-4 text-sm text-charcoal/70">
                    {research.people_also_ask.slice(0, 8).map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <p className={label}>Long-tail keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {research.long_tail_keywords.map((k) => (
                    <button key={k} onClick={() => setPrimaryKeyword(k)} className="rounded-full bg-white px-3 py-1 text-xs text-forest hover:bg-forest/10">
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className={card}>
          <h3 className="font-semibold text-forest-deep">Article configuration</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field title="Blog topic">
              <input className={input} value={topic} onChange={(e) => setTopic(e.target.value)} />
            </Field>
            <Field title="Category">
              <input className={input} value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field title="Primary keyword">
              <input className={input} value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} />
            </Field>
            <Field title="Secondary keywords (comma separated)">
              <input className={input} value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} />
            </Field>
            <Field title="Target audience">
              <input className={input} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
            <Field title="Tone">
              <select className={input} value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field title="Reading level">
              <select className={input} value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)}>
                {READING_LEVELS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field title="Content goal">
              <select className={input} value={goal} onChange={(e) => setGoal(e.target.value)}>
                {CONTENT_GOALS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-charcoal/70">
                <span>Word count</span>
                <span>{wordCount}</span>
              </div>
              <input type="range" min={800} max={3500} step={100} value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="mt-2 w-full accent-forest" />
            </div>
            <div className="rounded-xl bg-forest/5 p-4">
              <p className="text-xs font-semibold text-charcoal/70">Photography: automatic</p>
              <p className="mt-1 text-[11px] text-charcoal/50">
                The AI rates how much each section would gain from a photo and only shoots the ones that earn it — plus
                the hero, recipe and Pinterest shots.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Toggle on={includeRecipe} set={setIncludeRecipe}>Recipe card</Toggle>
            <Toggle on={includeFaq} set={setIncludeFaq}>FAQ</Toggle>
            <Toggle on={includeToc} set={setIncludeToc}>Table of contents</Toggle>
            <Toggle on={includeInternalLinks} set={setIncludeInternalLinks}>Internal links</Toggle>
            <Toggle on={includeProduct} set={setIncludeProduct}>Related product</Toggle>
            <Toggle on={includeCta} set={setIncludeCta}>Closing CTA</Toggle>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className={btn} disabled={!topic.trim() || busy === "generate"} onClick={doGenerate}>
              {busy === "generate" ? "Writing & photographing…" : "Generate article"}
            </button>
            <button className={btnGhost} onClick={() => setStep(1)}>← Back to research</button>
          </div>
          {busy === "generate" && (
            <p className="mt-3 text-xs text-charcoal/50">
              This takes a minute — the article, SEO pack, schema, Pinterest pins and only the photos the article actually needs are generated in one pass, then the editor scores the draft.
            </p>
          )}
        </section>
      )}

      {step === 3 && (
        <section className={card}>
          {!result ? (
            <p className="text-sm text-charcoal/60">Nothing generated yet.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start gap-4">
                {result.hero_url && <img src={result.hero_url} alt={result.title} className="h-32 w-48 rounded-xl object-cover" />}
                <div className="min-w-[200px] flex-1">
                  <p className={label}>Sent to Approval Queue</p>
                  <h3 className="mt-1 font-display text-2xl italic text-forest-deep">{result.title}</h3>
                  <p className="mt-1 font-mono text-xs text-charcoal/50">/{result.slug} · {result.images_generated} images</p>
                  <div className="mt-3 grid max-w-sm gap-2">
                    <Meter title="Clarity" value={result.quality?.clarity ?? 0} />
                    <Meter title="SEO coverage" value={result.quality?.seo ?? 0} />
                    <Meter title="Originality" value={result.quality?.originality ?? 0} />
                    <Meter title="Readability" value={result.quality?.readability ?? 0} />
                    <Meter title="Overall" value={result.quality?.overall ?? 0} />
                  </div>
                </div>
              </div>
              {result.quality && (
                <div className={`rounded-2xl p-4 ${result.blocked ? "bg-amber-50" : "bg-forest/5"}`}>
                  <p className="text-sm font-semibold text-forest-deep">
                    Editor's verdict — {result.quality.overall}/100 {result.blocked ? "(held for rewrite)" : "(approved)"}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/60">{result.quality.verdict}</p>
                  {result.quality.problems?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-charcoal/70">
                      {result.quality.problems.slice(0, 6).map((p: any, i: number) => (
                        <li key={i}><strong>{p.area}:</strong> {p.issue} — {p.fix}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div>
                <p className={label}>Planned Pinterest pins</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {(result.pins ?? []).map((p: any, i: number) => (
                    <div key={i} className="rounded-xl border border-forest/10 p-3">
                      {p.image_url && <img src={p.image_url} alt={p.alt} className="mb-2 w-full rounded-lg object-cover" />}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sage">{p.style}</p>
                      <p className="mt-1 text-sm font-semibold">{p.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-charcoal/60">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button className={btnGhost} onClick={() => { setResult(null); setStep(1); }}>Start a new article</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------------------------- Pinterest Studio ---------------------------- */

export function PinterestStudioPanel() {
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(3);
  const [link, setLink] = useState("");
  const [styles, setStyles] = useState<string[]>(["Minimal Editorial", "Food Magazine", "Lifestyle"]);
  const [withImages, setWithImages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pins, setPins] = useState<any[]>([]);

  const toggleStyle = (s: string) =>
    setStyles((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s].slice(0, 5)));

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res: any = await generatePinSet({ data: { subject, count, link: link || undefined, styles, withImages } });
      setPins(res.pins ?? []);
      setMsg(`${res.pins?.length ?? 0} pins sent to the Approval Queue.`);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to generate pins");
    } finally {
      setBusy(false);
    }
  };

  const [pack, setPack] = useState<any[] | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [packBusy, setPackBusy] = useState(false);

  const runPack = async () => {
    setPackBusy(true);
    setMsg(null);
    setPack(null);
    setPicked([]);
    try {
      const res: any = await generatePinPreviewPack({ data: { subject, link: link || undefined } });
      setPack(res.pins ?? []);
      setPicked((res.pins ?? []).map((_: any, i: number) => i));
    } catch (e: any) {
      setMsg(e?.message ?? "Preview pack failed");
    } finally {
      setPackBusy(false);
    }
  };

  const savePack = async () => {
    if (!pack) return;
    setPackBusy(true);
    try {
      const chosen = pack.filter((_, i) => picked.includes(i));
      const res: any = await savePinPreviews({ data: { subject, link: link || null, pins: chosen } });
      setMsg(`${res.saved} pins sent to the Approval Queue.`);
      setPack(null);
    } catch (e: any) {
      setMsg(e?.message ?? "Could not save pins");
    } finally {
      setPackBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl italic text-forest-deep">Pinterest Studio</h2>
        <p className="mt-1 text-sm text-charcoal/60">Generate vertical 2:3 pins with unique designs, copy and hashtags.</p>
      </div>
      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-forest-deep">One-click preview pack</h3>
            <p className="mt-1 text-xs text-charcoal/60">
              Five pin variants — different style and hook each — rendered for review. Nothing is saved until you pick.
            </p>
          </div>
          <button className={btn} disabled={!subject.trim() || packBusy} onClick={runPack}>
            {packBusy ? "Designing 5 pins…" : "Preview 5 pin variants"}
          </button>
        </div>
        {packBusy && !pack && (
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-xl bg-forest/10"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}
        {pack && (
          <div className="mt-5 space-y-4 duration-500 animate-in fade-in">
            <div className="grid gap-3 sm:grid-cols-5">
              {pack.map((p: any, i: number) => {
                const on = picked.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => setPicked((c) => (on ? c.filter((x) => x !== i) : [...c, i]))}
                    className={`overflow-hidden rounded-xl border-2 p-2 text-left transition ${on ? "border-forest bg-forest/5" : "border-transparent bg-cream/40 opacity-70 hover:opacity-100"}`}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.alt} className="aspect-[2/3] w-full rounded-lg object-cover" />
                    ) : (
                      <div className="grid aspect-[2/3] w-full place-items-center rounded-lg bg-forest/10 text-[10px]">no image</div>
                    )}
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-sage">{p.style}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-forest-deep">{p.overlay_text}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-charcoal/60">{p.why_it_works}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <button className={btn} disabled={!picked.length || packBusy} onClick={savePack}>
                Send {picked.length} pin{picked.length === 1 ? "" : "s"} to approvals
              </button>
              <button className={btnGhost} onClick={() => setPack(null)}>Discard pack</button>
            </div>
          </div>
        )}
      </section>

      <section className={card}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Subject">
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Smoky tofu buddha bowl" />
          </Field>
          <Field title="Destination link (optional)">
            <input className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://primedownloads.store/blog/…" />
          </Field>
        </div>
        <div className="mt-4">
          <p className={label}>Pin styles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PIN_STYLES.map((s) => (
              <Toggle key={s} on={styles.includes(s)} set={() => toggleStyle(s)}>{s}</Toggle>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-xs font-semibold text-charcoal/70">
              <span>Number of pins</span>
              <span>{count}</span>
            </div>
            <input type="range" min={1} max={5} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-2 w-full accent-forest" />
          </div>
          <div className="flex items-end">
            <Toggle on={withImages} set={setWithImages}>Generate pin images</Toggle>
          </div>
        </div>
        <button className={`${btn} mt-6`} disabled={!subject.trim() || busy} onClick={run}>
          {busy ? "Designing pins…" : "Generate pins"}
        </button>
      </section>

      {pins.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {pins.map((p) => (
            <article key={p.id} className={card}>
              {p.image_url && <img src={p.image_url} alt={p.alt} className="mb-3 w-full rounded-xl object-cover" />}
              <p className="text-[10px] font-bold uppercase tracking-widest text-sage">{p.style}</p>
              <h3 className="mt-1 text-sm font-semibold text-forest-deep">{p.title}</h3>
              <p className="mt-1 text-xs text-charcoal/60">{p.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
