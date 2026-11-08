import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminCheckInternalLinks, adminFixInternalLink, adminLinkingOverview, adminSaveLinkingSettings, adminSaveTaxonomy,
  type AdminLinkRow, type LinkIssue, type LinkingSettings,
} from "@/lib/linking/linking.functions";

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const PROBLEM: Record<LinkIssue["problem"], string> = {
  not_found: "Page not found (404)", unpublished: "Points to an unpublished page", wrong_domain: "Uses a non-.com domain",
};

export function InternalLinksPanel() {
  const load = useServerFn(adminLinkingOverview);
  const saveSettings = useServerFn(adminSaveLinkingSettings);
  const [data, setData] = useState<{ settings: LinkingSettings; rows: AdminLinkRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [hubText, setHubText] = useState("");

  const refresh = async () => {
    try { const d = await load(); setData(d); setHubText(d.settings.hubs.join(", ")); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load pages"); }
  };
  useEffect(() => { void refresh(); }, []);

  const rows = useMemo(() => (data?.rows ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase())), [data, q]);

  const updateSettings = async (next: LinkingSettings) => {
    try { await saveSettings({ data: next }); toast.success(next.live ? "Linking is live on the site" : "Settings saved"); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };

  if (error) return <div className="rounded-2xl border border-destructive/30 bg-card p-6 text-sm">{error} <button className="underline" onClick={refresh}>Retry</button></div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading pages…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Automatic internal links</h2>
            <p className="text-sm text-muted-foreground">
              {data.settings.live ? "Live: related recipes, Read next links, hubs and roundups show on the site." : "Off: review the tags and matches below, then switch on."}
            </p>
          </div>
          <button
            onClick={() => updateSettings({ ...data.settings, live: !data.settings.live })}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${data.settings.live ? "border" : "bg-primary text-primary-foreground"}`}
          >
            {data.settings.live ? "Turn off" : "Go live"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="flex-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Holiday hubs (comma separated occasion tags)</span>
            <input value={hubText} onChange={(e) => setHubText(e.target.value)} placeholder="Thanksgiving, Christmas" className="mt-1 w-full rounded-lg border bg-background px-3 py-2" />
          </label>
          <button onClick={() => updateSettings({ ...data.settings, hubs: list(hubText) })} className="rounded-lg border px-4 py-2 text-sm font-semibold">Save hubs</button>
        </div>
      </div>

      <LinkChecker onFixed={refresh} />

      <div className="sticky top-16 z-10 rounded-xl border bg-card p-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${data.rows.length} pages…`} className="w-full rounded-lg bg-background px-3 py-2 text-sm" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => <PageRow key={r.type + r.id} row={r} onSaved={refresh} />)}
      </div>
    </div>
  );
}

function PageRow({ row, onSaved }: { row: AdminLinkRow; onSaved: () => void }) {
  const save = useServerFn(adminSaveTaxonomy);
  const init = row.effective;
  const [cat, setCat] = useState(init.category ?? "");
  const [occ, setOcc] = useState(init.occasions.join(", "));
  const [ing, setIng] = useState(init.main_ingredients.join(", "));
  const [diet, setDiet] = useState(init.diet_tags.join(", "));
  const [roundup, setRoundup] = useState(row.stored.roundup_tag ?? "");
  const [busy, setBusy] = useState(false);
  const autoFilled = !row.stored.category && !row.stored.occasions.length && !row.stored.main_ingredients.length && !row.stored.diet_tags.length;

  const submit = async () => {
    setBusy(true);
    try {
      await save({ data: { type: row.type, id: row.id, category: cat, occasions: list(occ), main_ingredients: list(ing), diet_tags: list(diet), roundup_tag: roundup } });
      toast.success("Tags saved"); onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); } finally { setBusy(false); }
  };
  const field = (label: string, v: string, set: (s: string) => void) => (
    <label className="text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => set(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
    </label>
  );
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {row.type} · {row.status}{autoFilled ? " · suggested tags" : ""}
          </p>
          <a href={row.href} target="_blank" rel="noreferrer" className="line-clamp-2 font-semibold hover:underline">{row.title}</a>
        </div>
        <button onClick={submit} disabled={busy} className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {field("Category", cat, setCat)}
        {field("Season / occasion", occ, setOcc)}
        {field("Main ingredient", ing, setIng)}
        {field("Diet tags", diet, setDiet)}
        {row.type === "blog" ? field("Roundup tag (auto-lists recipes)", roundup, setRoundup) : null}
      </div>
      {row.links ? (
        <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs">
          <p className="font-semibold">Recipe cards:</p>
          <ol className="ml-4 list-decimal">{row.links.recipes.map((c) => <li key={c.href}>{c.title}</li>)}</ol>
          <p className="mt-1 font-semibold">{row.type === "recipe" ? "Read next:" : "More from the journal:"}</p>
          <ol className="ml-4 list-decimal">{row.links.blogs.map((c) => <li key={c.href}>{c.title}</li>)}</ol>
          {row.links.hubs.map((h) => <p key={h.name} className="mt-1">Links to {h.name} hub{h.menu ? ` + “${h.menu.title}”` : ""}</p>)}
          {row.links.roundup ? <p className="mt-1">Roundup lists {row.links.roundup.items.length} “{row.links.roundup.tag}” recipes</p> : null}
        </div>
      ) : <p className="mt-3 text-xs text-muted-foreground">Draft — not linked anywhere until published.</p>}
    </div>
  );
}

function LinkChecker({ onFixed }: { onFixed: () => void }) {
  const check = useServerFn(adminCheckInternalLinks);
  const fix = useServerFn(adminFixInternalLink);
  const [res, setRes] = useState<{ scanned: number; links: number; issues: LinkIssue[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState<Record<string, string>>({});

  const run = async () => {
    setBusy(true);
    try { setRes(await check()); } catch (e) { toast.error(e instanceof Error ? e.message : "Check failed"); } finally { setBusy(false); }
  };
  const apply = async (i: LinkIssue, action: "remove" | "replace") => {
    const key = i.pageId + i.href;
    try {
      await fix({ data: { pageType: i.pageType, pageId: i.pageId, href: i.href, action, newHref: action === "replace" ? (replace[key] ?? i.suggestion ?? "") : undefined } });
      toast.success(action === "remove" ? "Link removed (text kept)" : "Link replaced");
      await run(); onFixed();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fix failed"); }
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Broken link check</h3>
          {res ? <p className="text-sm text-muted-foreground">Scanned {res.scanned} pages, {res.links} internal links — {res.issues.length} problem{res.issues.length === 1 ? "" : "s"}.</p> : null}
        </div>
        <button onClick={run} disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Checking…" : "Check internal links"}</button>
      </div>
      {res?.issues.length ? (
        <ul className="mt-4 space-y-3">
          {res.issues.map((i) => {
            const key = i.pageId + i.href;
            return (
              <li key={key} className="rounded-xl border p-3 text-sm">
                <p className="font-semibold">{PROBLEM[i.problem]}: <code className="break-all">{i.href}</code></p>
                <p className="text-xs text-muted-foreground">On <a href={i.pageHref} target="_blank" rel="noreferrer" className="underline">{i.pageTitle}</a></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input value={replace[key] ?? i.suggestion ?? ""} onChange={(e) => setReplace({ ...replace, [key]: e.target.value })} placeholder="/recipes/replacement-slug" className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs" />
                  <button onClick={() => apply(i, "replace")} className="rounded-md border px-3 py-1 text-xs font-semibold">Replace</button>
                  <button onClick={() => apply(i, "remove")} className="rounded-md border px-3 py-1 text-xs font-semibold text-destructive">Remove link</button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
