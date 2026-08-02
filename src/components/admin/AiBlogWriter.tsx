import { useState } from "react";
import { Sparkles, X, Globe, HelpCircle, TrendingUp, ListChecks, Image as ImageIcon, Search, Wand2, Target, Loader2 } from "lucide-react";
import {
  generateStudioBlog,
  researchTopic,
  suggestTitles,
  getGenerationDraft,
  TONES,
} from "@/lib/ai/blog-studio.functions";

export type AiBlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  featured_image_url: string;
  seo_title: string;
  seo_description: string;
};

const INCLUDED = [
  { icon: Globe, label: "Competitor research" },
  { icon: ListChecks, label: "Table of Contents" },
  { icon: HelpCircle, label: "FAQ schema (5–6 Q&As)" },
  { icon: ImageIcon, label: "Auto-placed AI images" },
  { icon: TrendingUp, label: "Recipe card + product link" },
  { icon: Search, label: "SEO title, meta & schema" },
];

export function AiBlogWriterModal({
  open,
  onClose,
  onDraft,
  categories = [],
}: {
  open: boolean;
  onClose: () => void;
  onDraft: (draft: AiBlogDraft) => void;
  categories?: string[];
}) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<string>("Editorial");
  const [wordCount, setWordCount] = useState(1500);
  const [imageCount, setImageCount] = useState(6);
  const [titles, setTitles] = useState<string[]>([]);
  const [busy, setBusy] = useState<null | "titles" | "generate">(null);
  const [stage, setStage] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const doTitles = async () => {
    setBusy("titles");
    setErr(null);
    try {
      setTitles(await suggestTitles({ data: { topic, keywords } }));
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  const doGenerate = async () => {
    setBusy("generate");
    setErr(null);
    try {
      setStage("Researching the topic and top-ranking angles…");
      let research: unknown = null;
      try {
        research = await researchTopic({ data: { topic, primaryKeyword: keywords.split(",")[0]?.trim() || undefined } });
      } catch {
        research = null;
      }
      setStage(`Writing a ~${wordCount}-word article and shooting ${imageCount} photos…`);
      const res: any = await generateStudioBlog({
        data: {
          topic,
          category: category || undefined,
          primaryKeyword: keywords.split(",")[0]?.trim() || undefined,
          secondaryKeywords: keywords || undefined,
          tone,
          wordCount,
          imageCount,
          research,
          includeRecipe: true,
          includeFaq: true,
          includeToc: true,
          includeInternalLinks: true,
          includeProduct: true,
          includeCta: true,
        },
      });
      setStage("Loading the draft into your editor…");
      const draft = await getGenerationDraft({ data: { id: res.id } });
      onDraft(draft as AiBlogDraft);
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Generation failed");
    } finally {
      setBusy(null);
      setStage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl duration-300 animate-in fade-in slide-in-from-bottom-4 sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest text-cream">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="font-display text-3xl italic text-forest-deep">AI Blog Writer</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-charcoal/50 hover:bg-forest/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-center text-sm leading-relaxed text-charcoal/70">
          Generate a professional, SEO-optimized blog post with FAQ schema, Table of Contents, competitor research and
          auto-placed AI photography — all in your brand voice.
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl bg-forest/5 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
          <div>
            <p className="text-sm font-semibold text-forest-deep">Brand Voice: Active</p>
            <p className="mt-0.5 text-xs text-charcoal/60">
              Warm, editorial & expert · PlantedAndSimple palette · Learned brand rules applied automatically
            </p>
          </div>
        </div>

        {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-forest-deep">What should the blog post be about? *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g., 10 high-protein vegan breakfast bowls, how to meal-prep plant-based lunches for a week…"
              className="mt-2 w-full rounded-2xl border-2 border-forest/40 bg-white px-4 py-3 text-sm outline-none focus:border-forest"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-forest-deep">Category</label>
              <input
                list="ai-blog-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or type category"
                className="mt-2 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 text-sm outline-none focus:border-forest"
              />
              <datalist id="ai-blog-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-semibold text-forest-deep">Target keywords</label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., vegan protein breakfast, tofu scramble"
                className="mt-2 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 text-sm outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-forest-deep">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    tone === t ? "bg-forest text-cream" : "border border-forest/20 text-charcoal/70 hover:bg-forest/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-forest-deep">
                <Target className="h-4 w-4" /> Target word count
              </span>
              <span className="font-semibold text-forest">{wordCount} words</span>
            </div>
            <input
              type="range"
              min={800}
              max={3000}
              step={100}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="mt-3 w-full accent-forest"
            />
            <div className="mt-1 flex justify-between text-[11px] text-charcoal/50">
              <span>800 (Quick)</span>
              <span>1500 (Standard)</span>
              <span>2500 (In-depth)</span>
              <span>3000</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-forest-deep">
                <ImageIcon className="h-4 w-4" /> AI images (auto-placed)
              </span>
              <span className="font-semibold text-forest">{imageCount}</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              className="mt-3 w-full accent-forest"
            />
            <p className="mt-1 text-[11px] text-charcoal/50">
              The AI decides where photos genuinely help and writes a unique brief + alt text for each.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-semibold text-forest-deep">What's included:</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map(({ icon: Icon, label }) => (
                <p key={label} className="flex items-center gap-2 text-xs text-charcoal/70">
                  <Icon className="h-4 w-4 text-forest/70" /> {label}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-forest-deep">
                <Target className="h-4 w-4" /> AI title ideas
              </p>
              <button
                onClick={doTitles}
                disabled={!topic.trim() || busy !== null}
                className="rounded-full border border-forest/25 px-4 py-2 text-xs font-semibold text-forest hover:bg-forest/5 disabled:opacity-40"
              >
                {busy === "titles" ? "Thinking…" : "Generate title ideas"}
              </button>
            </div>
            {titles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {titles.map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => setTopic(t)}
                      className="w-full rounded-xl bg-cream px-3 py-2 text-left text-sm text-charcoal hover:bg-forest/10"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={doGenerate}
            disabled={!topic.trim() || busy !== null}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-forest px-6 py-4 text-sm font-bold text-cream transition hover:bg-forest-deep disabled:opacity-50"
          >
            {busy === "generate" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
            {busy === "generate" ? "Generating…" : "Generate blog post"}
          </button>
          {stage && <p className="text-center text-xs text-charcoal/60">{stage}</p>}
        </div>
      </div>
    </div>
  );
}
