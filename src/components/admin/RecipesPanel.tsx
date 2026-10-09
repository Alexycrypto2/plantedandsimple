import { useEffect, useState } from "react";
import { ChefHat, Plus, Trash2, Save, X, Link2, Sparkles, Wand2 } from "lucide-react";
import {
  adminListEntity, adminSaveEntity, adminDeleteEntity,
  adminGetLinks, adminSetLinks, adminLinkableItems,
} from "@/lib/library/admin.functions";
import { generateStudioRecipe } from "@/lib/ai/recipe-studio.functions";
import { EmptyState, PanelCard, SkeletonList } from "./AdminShell";
import { SeoDoctor } from "./SeoDoctor";
import { recipeToHtml } from "@/lib/content/seo-doctor";
import { btnCls, inputCls } from "./LibraryPanel";

type Recipe = any;

const DIFFICULTY = ["easy", "medium", "advanced"];
const STATUS = ["draft", "scheduled", "published"];

const blank = () => ({
  slug: "", title: "", subtitle: "", description: "",
  ingredientsText: "", instructionsText: "", nutritionText: "", tipsText: "",
  prep_minutes: 10, cook_minutes: 20, servings: "4", difficulty: "easy",
  tagsText: "", pinterest_description: "", seo_title: "", seo_description: "",
  status: "draft", is_featured: false,
});

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const toText = (v: any): string =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.label ? `${x.label}: ${x.value}` : JSON.stringify(x))).join("\n") : "";

/* ---------------------------- AI recipe creator ---------------------------- */

const STAGES = [
  "Reading your brief…",
  "Developing the recipe…",
  "Balancing quantities & timings…",
  "Calculating nutrition…",
  "Shooting the food photography…",
  "Writing SEO & Pinterest copy…",
];

function AiRecipeModal({ onClose, onDone, initialIdea = "" }: { onClose: () => void; onDone: () => void; initialIdea?: string }) {
  const [brief, setBrief] = useState({
    idea: initialIdea, cuisine: "", diet: "plant-based / vegan", mealType: "Dinner",
    difficulty: "easy", servings: "4", maxMinutes: 45, withImages: true,
  });
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6500);
    return () => clearInterval(id);
  }, [busy]);

  const go = async () => {
    if (!brief.idea.trim()) return;
    setBusy(true); setError(null); setStage(0);
    try {
      const res: any = await generateStudioRecipe({ data: brief });
      setResult(res);
      onDone();
    } catch (e: any) {
      setError(e?.message ?? "Generation failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/50 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-white/60 bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[var(--ws-accent)]">
              <Sparkles className="size-3" /> AI recipe developer
            </p>
            <h3 className="mt-1 font-display text-2xl italic text-forest-deep">Let the AI cook it for you</h3>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full text-charcoal/40 hover:bg-forest/5">
            <X className="size-4" />
          </button>
        </div>

        {result ? (
          <div className="mt-5 space-y-4">
            {result.hero_url && <img src={result.hero_url} alt={result.title} className="w-full rounded-2xl duration-500 animate-in fade-in" />}
            <div className="rounded-2xl border border-forest/10 bg-cream-warm/50 p-4">
              <p className="font-display text-xl italic text-forest-deep">{result.title}</p>
              <p className="mt-1 text-xs text-charcoal/60">
                Saved as a draft recipe with {result.images} photo{result.images === 1 ? "" : "s"}. Open it to review, then publish.
              </p>
            </div>
            <button onClick={onClose} className={btnCls}>Done</button>
          </div>
        ) : busy ? (
          <div className="mt-8 space-y-3 pb-4">
            {STAGES.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 transition-all duration-500 ${i <= stage ? "opacity-100" : "opacity-30"}`}>
                <span className={`size-2 rounded-full ${i < stage ? "bg-[var(--ws-accent)]" : i === stage ? "animate-live bg-[var(--ws-accent)]" : "bg-charcoal/20"}`} />
                <span className="text-sm text-charcoal/70">{s}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-charcoal/40">This takes 1–2 minutes when photos are on. Keep this window open.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <textarea
              className={inputCls} rows={2}
              placeholder="What should we cook? e.g. high-protein smoky tofu noodle bowl"
              value={brief.idea}
              onChange={(e) => setBrief({ ...brief, idea: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder="Cuisine (optional)" value={brief.cuisine} onChange={(e) => setBrief({ ...brief, cuisine: e.target.value })} />
              <input className={inputCls} placeholder="Diet" value={brief.diet} onChange={(e) => setBrief({ ...brief, diet: e.target.value })} />
              <select className={inputCls} value={brief.mealType} onChange={(e) => setBrief({ ...brief, mealType: e.target.value })}>
                {["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Drink"].map((m) => <option key={m}>{m}</option>)}
              </select>
              <select className={inputCls} value={brief.difficulty} onChange={(e) => setBrief({ ...brief, difficulty: e.target.value })}>
                {DIFFICULTY.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input className={inputCls} placeholder="Servings" value={brief.servings} onChange={(e) => setBrief({ ...brief, servings: e.target.value })} />
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal/60">
                Max total minutes
                <input className={inputCls} type="number" value={brief.maxMinutes} onChange={(e) => setBrief({ ...brief, maxMinutes: Number(e.target.value) })} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input type="checkbox" checked={brief.withImages} onChange={(e) => setBrief({ ...brief, withImages: e.target.checked })} />
              Shoot the photos too (hero, ingredients flat-lay, step shots)
            </label>
            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <button onClick={go} disabled={!brief.idea.trim()} className={btnCls}>
              <Wand2 className="size-3.5" /> Create the recipe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecipesSection() {
  const [rows, setRows] = useState<Recipe[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(blank());
  const [links, setLinks] = useState<{ type: string; id: string }[]>([]);
  const [linkable, setLinkable] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSeed, setAiSeed] = useState("");

  // A topic handed over from the Research Engine opens the AI recipe writer pre-filled.
  useEffect(() => {
    const raw = sessionStorage.getItem("ps_ai_recipe_seed");
    if (!raw) return;
    sessionStorage.removeItem("ps_ai_recipe_seed");
    try {
      const seed = JSON.parse(raw);
      setAiSeed([seed.topic, seed.keywords].filter(Boolean).join(" — ").slice(0, 240));
      setAiOpen(true);
    } catch { /* ignore malformed handoff */ }
  }, []);

  const load = () => adminListEntity({ data: { entity: "recipes" } }).then((r) => setRows(r as Recipe[]));
  useEffect(() => { load(); adminLinkableItems().then(setLinkable).catch(() => {}); }, []);

  const openNew = () => { setForm(blank()); setLinks([]); setEditing("new"); };

  const openEdit = async (r: Recipe) => {
    setForm({
      slug: r.slug ?? "", title: r.title ?? "", subtitle: r.subtitle ?? "", description: r.description ?? "",
      ingredientsText: toText(r.ingredients), instructionsText: toText(r.instructions),
      nutritionText: toText(r.nutrition), tipsText: toText(r.tips),
      prep_minutes: r.prep_minutes ?? 0, cook_minutes: r.cook_minutes ?? 0,
      servings: r.servings ?? "", difficulty: r.difficulty ?? "easy",
      tagsText: (r.tags ?? []).join(", "), pinterest_description: r.pinterest_description ?? "",
      seo_title: r.seo_title ?? "", seo_description: r.seo_description ?? "",
      status: r.status ?? "draft", is_featured: !!r.is_featured,
    });
    setEditing(r.id);
    const l = await adminGetLinks({ data: { contentType: "recipe", contentId: r.id } });
    setLinks((l as any).relations ?? []);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const values = {
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description,
        ingredients: lines(form.ingredientsText),
        instructions: lines(form.instructionsText),
        nutrition: lines(form.nutritionText).map((l) => {
          const [label, ...rest] = l.split(":");
          return { label: (label ?? "").trim(), value: rest.join(":").trim() };
        }),
        tips: lines(form.tipsText),
        prep_minutes: Number(form.prep_minutes) || 0,
        cook_minutes: Number(form.cook_minutes) || 0,
        servings: form.servings,
        difficulty: form.difficulty,
        tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        pinterest_description: form.pinterest_description || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        status: form.status,
        is_featured: form.is_featured,
      };
      const row: any = await adminSaveEntity({
        data: { entity: "recipes", id: editing === "new" ? null : editing, values },
      });
      if (row?.id) await adminSetLinks({ data: { contentType: "recipe", contentId: row.id, relations: links } });
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  const toggleLink = (type: string, id: string) => {
    setLinks((prev) =>
      prev.some((l) => l.type === type && l.id === id)
        ? prev.filter((l) => !(l.type === type && l.id === id))
        : [...prev, { type, id }],
    );
  };

  if (editing) {
    return (
      <div className="space-y-5 duration-300 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl italic text-forest-deep">
            {editing === "new" ? "New recipe" : "Edit recipe"}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 px-4 py-2.5 text-xs font-semibold text-charcoal/70 hover:bg-forest/5">
              <X className="size-3.5" /> Cancel
            </button>
            <button onClick={save} disabled={busy} className={btnCls}><Save className="size-3.5" /> {busy ? "Saving…" : "Save recipe"}</button>
          </div>
        </div>

        <PanelCard title="Essentials" icon={ChefHat}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Recipe title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className={inputCls} placeholder="slug (auto)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <input className={inputCls} type="number" placeholder="Prep min" value={form.prep_minutes} onChange={(e) => setForm({ ...form, prep_minutes: Number(e.target.value) })} />
            <input className={inputCls} type="number" placeholder="Cook min" value={form.cook_minutes} onChange={(e) => setForm({ ...form, cook_minutes: Number(e.target.value) })} />
            <input className={inputCls} placeholder="Servings" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} />
            <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {DIFFICULTY.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </PanelCard>

        <PanelCard title="The method">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-charcoal/60">
              Ingredients — one per line
              <textarea className={`${inputCls} mt-1.5`} rows={8} value={form.ingredientsText} onChange={(e) => setForm({ ...form, ingredientsText: e.target.value })} />
            </label>
            <label className="text-xs font-semibold text-charcoal/60">
              Instructions — one step per line
              <textarea className={`${inputCls} mt-1.5`} rows={8} value={form.instructionsText} onChange={(e) => setForm({ ...form, instructionsText: e.target.value })} />
            </label>
            <label className="text-xs font-semibold text-charcoal/60">
              Nutrition — “Calories: 420” per line
              <textarea className={`${inputCls} mt-1.5`} rows={5} value={form.nutritionText} onChange={(e) => setForm({ ...form, nutritionText: e.target.value })} />
            </label>
            <label className="text-xs font-semibold text-charcoal/60">
              Tips — one per line
              <textarea className={`${inputCls} mt-1.5`} rows={5} value={form.tipsText} onChange={(e) => setForm({ ...form, tipsText: e.target.value })} />
            </label>
          </div>
        </PanelCard>

        <PanelCard title="Connections" icon={Link2}>
          <p className="mb-3 text-xs text-charcoal/55">
            Linked items update everywhere automatically — blog pages, product pages and related content.
          </p>
          {!linkable ? <SkeletonList rows={2} /> : (
            <div className="space-y-4">
              {(["blog", "product", "recipe"] as const).map((t) => (
                <div key={t}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/40">{t}s</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(linkable[t] ?? []).slice(0, 40).map((it: any) => {
                      const on = links.some((l) => l.type === t && l.id === it.id);
                      return (
                        <button
                          key={it.id}
                          onClick={() => toggleLink(t, it.id)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                            on ? "border-forest bg-forest text-cream" : "border-forest/15 text-charcoal/60 hover:bg-forest/5"
                          }`}
                        >
                          {it.title}
                        </button>
                      );
                    })}
                    {(linkable[t] ?? []).length === 0 && <span className="text-xs text-charcoal/40">None yet</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title="SEO & publishing">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Meta title" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            <input className={inputCls} placeholder="Tags, comma separated" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Meta description" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Pinterest description" value={form.pinterest_description} onChange={(e) => setForm({ ...form, pinterest_description: e.target.value })} />
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              Feature on homepage
            </label>
          </div>
        <SeoDoctor
            kind="recipe"
            value={{
              title: form.title,
              seo_title: form.seo_title,
              seo_description: form.seo_description,
              excerpt: form.description,
              tags: form.tagsText,
              content: recipeToHtml({
                description: form.description,
                ingredients: lines(form.ingredientsText),
                instructions: lines(form.instructionsText),
                nutrition: lines(form.nutritionText),
                tips: lines(form.tipsText),
              }),
            }}
            onApply={(p) => setForm({
              ...form,
              seo_title: p.seo_title ?? form.seo_title,
              seo_description: p.seo_description ?? form.seo_description,
              description: p.excerpt ?? form.description,
            })}
          />
        </PanelCard>
      </div>
    );
  }

  return (
    <>
    {aiOpen && <AiRecipeModal initialIdea={aiSeed} onClose={() => { setAiOpen(false); setAiSeed(""); }} onDone={load} />}
    <PanelCard
      title="Recipe CMS"
      icon={ChefHat}
      action={
        <div className="flex gap-2">
          <button onClick={() => setAiOpen(true)} className={btnCls}><Sparkles className="size-3.5" /> Create with AI</button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 px-4 py-2.5 text-xs font-semibold text-forest hover:bg-forest/5"><Plus className="size-3.5" /> Blank</button>
        </div>
      }
    >
      {!rows ? <SkeletonList rows={4} /> : rows.length === 0 ? (
        <EmptyState title="No recipes yet" hint="Describe a dish and the AI develops the full recipe, nutrition and photography for you." action={<button onClick={() => setAiOpen(true)} className={btnCls}><Sparkles className="size-3.5" /> Create with AI</button>} />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="group flex items-center gap-3 rounded-xl border border-forest/8 bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal">{r.title}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-charcoal/40">
                  {r.status} · {(r.prep_minutes ?? 0) + (r.cook_minutes ?? 0)} min · {r.difficulty ?? "easy"}
                </p>
              </div>
              <button onClick={() => openEdit(r)} className="rounded-full border border-forest/15 px-3 py-1.5 text-[11px] font-semibold text-forest hover:bg-forest/5">Edit</button>
              <button
                onClick={async () => { await adminDeleteEntity({ data: { entity: "recipes", id: r.id } }); load(); }}
                className="grid size-8 place-items-center rounded-full text-charcoal/40 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete recipe"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
    </>
  );
}