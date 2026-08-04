import { useEffect, useState } from "react";
import { Check, ChefHat, FileText, Image as ImageIcon, Loader2, Mail, Megaphone, Rocket, Share2 } from "lucide-react";
import {
  generateCampaignFromRecipe,
  listCampaigns,
  listRecipeOptions,
} from "@/lib/ai/campaign.functions";

const card = "rounded-2xl border border-forest/10 bg-white p-5 shadow-sm";
const btn = "rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-50";

const STEPS = [
  { icon: ChefHat, label: "Reading the recipe" },
  { icon: FileText, label: "Writing the editorial article + photos" },
  { icon: Share2, label: "Designing 5 Pinterest pins" },
  { icon: Mail, label: "Drafting the launch email" },
  { icon: Megaphone, label: "Writing the cookbook promo" },
  { icon: Check, label: "Linking every asset in the library" },
];

export function CampaignPanel() {
  const [recipes, setRecipes] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [recipeId, setRecipeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [past, setPast] = useState<any[]>([]);

  const refresh = () => listCampaigns().then((r: any) => setPast(r ?? [])).catch(() => {});
  useEffect(() => {
    listRecipeOptions()
      .then((r: any) => {
        setRecipes(r ?? []);
        if (r?.[0]) setRecipeId(r[0].id);
      })
      .catch(() => {});
    refresh();
  }, []);

  const run = async () => {
    if (!recipeId) return;
    setBusy(true);
    setMsg(null);
    setResult(null);
    setStep(0);
    const tick = setInterval(() => setStep((v) => (v < 4 ? v + 1 : v)), 15000);
    try {
      const res: any = await generateCampaignFromRecipe({ data: { recipeId } });
      setStep(5);
      setResult(res);
      setMsg(`${res.assets} connected assets created and linked to “${res.recipe.title}”.`);
      refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Campaign failed");
    } finally {
      clearInterval(tick);
      setBusy(false);
      setStep(-1);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl italic text-forest-deep">Campaign Center</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          One recipe in — article, Pinterest set, email and product promo out, all linked back to the recipe in your
          content graph.
        </p>
      </div>

      {msg && <p className="rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest-deep">{msg}</p>}

      <section className={card}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Source recipe</span>
            <select
              className="w-full rounded-xl border border-forest/20 bg-cream/40 px-4 py-3 text-sm outline-none focus:border-forest"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.status === "published" ? "" : `· ${r.status}`}
                </option>
              ))}
            </select>
          </label>
          <button className={btn} disabled={!recipeId || busy} onClick={run}>
            {busy ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Rocket className="mr-2 inline h-4 w-4" />}
            {busy ? "Building campaign…" : "Generate full campaign"}
          </button>
        </div>

        {busy && (
          <ol className="mt-6 space-y-2.5">
            {STEPS.map((s, i) => {
              const done = i < step;
              const now = i === step;
              const Icon = s.icon;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-500 ${
                    now ? "bg-forest/10 font-semibold text-forest-deep" : done ? "text-charcoal/50" : "text-charcoal/30"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full border ${
                      done ? "border-forest bg-forest text-cream" : now ? "border-forest text-forest" : "border-charcoal/20"
                    }`}
                  >
                    {now ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  {s.label}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {result && (
        <section className={`${card} duration-500 animate-in fade-in slide-in-from-bottom-2`}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Campaign</p>
          <h3 className="mt-1 font-display text-2xl italic text-forest-deep">{result.name}</h3>
          <p className="mt-1 text-sm text-charcoal/60">{result.angle}</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-forest/10 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage">
                <FileText className="h-3.5 w-3.5" /> Article
              </p>
              <p className="mt-2 font-semibold text-forest-deep">{result.blog.title}</p>
              <p className="mt-1 font-mono text-xs text-charcoal/50">
                /{result.blog.slug} · {result.blog.images_generated} photos · quality {result.blog.quality.overall}/100
                {result.blog.blocked ? " · held for rewrite" : ""}
              </p>
            </div>
            <div className="rounded-xl border border-forest/10 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage">
                <Mail className="h-3.5 w-3.5" /> Email draft
              </p>
              <p className="mt-2 font-semibold text-forest-deep">{result.email?.subject ?? "—"}</p>
              <p className="mt-1 text-xs text-charcoal/50">{result.email?.preview_text}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage">
              <ImageIcon className="h-3.5 w-3.5" /> Pinterest set
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-5">
              {result.pins.map((p: any, i: number) => (
                <div key={i} className="rounded-xl border border-forest/10 p-2">
                  {p.image_url && <img src={p.image_url} alt={p.alt} className="aspect-[2/3] w-full rounded-lg object-cover" />}
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-sage">{p.style}</p>
                  <p className="line-clamp-2 text-xs font-semibold text-forest-deep">{p.overlay_text}</p>
                </div>
              ))}
            </div>
          </div>

          {result.promo && (
            <div className="mt-4 rounded-xl bg-forest/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sage">
                <Megaphone className="h-3.5 w-3.5" /> Product promo
              </p>
              <p className="mt-2 font-semibold text-forest-deep">{result.promo.headline}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-charcoal/50">
            Linked in the graph: {result.graph.linked} relations · {result.graph.touched} items refreshed. Everything is
            waiting in the Approval Queue.
          </p>
        </section>
      )}

      {past.length > 0 && (
        <section className={card}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Recent campaigns</p>
          <ul className="mt-3 divide-y divide-forest/10">
            {past.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                {c.preview_url && <img src={c.preview_url} alt="" className="h-12 w-16 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-deep">{c.title}</p>
                  <p className="truncate text-xs text-charcoal/50">{c.topic}</p>
                </div>
                <span className="rounded-full bg-forest/10 px-3 py-1 text-[10px] font-semibold text-forest">
                  {c.quality_score ?? "—"}/100
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
