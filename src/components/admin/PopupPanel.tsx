import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PopupView } from "@/components/NewsletterPopup";
import { adminListSiteSettings, adminSaveSiteSetting } from "@/lib/library/admin.functions";
import { DEFAULT_POPUP, POPUP_SETTING_KEY, normalizePopup, type PopupConfig } from "@/lib/popup-config";

const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const label = "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground";

export function PopupPanel() {
  const list = useServerFn(adminListSiteSettings);
  const save = useServerFn(adminSaveSiteSetting);
  const [cfg, setCfg] = useState<PopupConfig>(DEFAULT_POPUP);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");
  const [show, setShow] = useState(true);

  useEffect(() => {
    list().then((rows: any[]) => {
      setCfg(normalizePopup(rows.find((r) => r.key === POPUP_SETTING_KEY)?.value));
      setLoaded(true);
    }, () => setLoaded(true));
  }, [list]);

  const set = <K extends keyof PopupConfig>(k: K, v: PopupConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const onSave = async () => {
    setBusy(true);
    try { await save({ data: { key: POPUP_SETTING_KEY, value: normalizePopup(cfg) } }); toast.success("Popup saved — live on the site now"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  };

  if (!loaded) return <p className="text-sm text-muted-foreground">Loading popup settings…</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-5 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div><h2 className="font-display text-2xl italic">Free guide popup</h2><p className="text-sm text-muted-foreground">Design, wording and when it appears.</p></div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} /> {cfg.enabled ? "On" : "Off"}</label>
        </div>

        <div>
          <p className={label}>Template</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([["split", "Modern split", "Centered card"], ["drawer", "Slide-up drawer", "From the bottom"], ["corner", "Corner card", "Doesn't block page"]] as const).map(([id, name, hint]) => (
              <button key={id} type="button" onClick={() => set("template", id)} className={`rounded-lg border p-3 text-left text-sm ${cfg.template === id ? "border-primary bg-primary/5" : "border-input"}`}>
                <span className="block font-semibold">{name}</span><span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className={label}>Small top label</p><input className={field} value={cfg.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} /></div>
          <div><p className={label}>Button text</p><input className={field} value={cfg.button} onChange={(e) => set("button", e.target.value)} /></div>
          <div className="sm:col-span-2"><p className={label}>Headline</p><input className={field} value={cfg.headline} onChange={(e) => set("headline", e.target.value)} /></div>
          <div className="sm:col-span-2"><p className={label}>Short pitch</p><textarea className={`${field} h-16 py-2`} value={cfg.body} onChange={(e) => set("body", e.target.value)} /></div>
          <div className="sm:col-span-2"><p className={label}>Checkmark perks (one per line, max 4)</p><textarea className={`${field} h-20 py-2`} value={cfg.perks.join("\n")} onChange={(e) => set("perks", e.target.value.split("\n"))} /></div>
          <div className="sm:col-span-2"><p className={label}>Small note under button</p><input className={field} value={cfg.note} onChange={(e) => set("note", e.target.value)} /></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className={label}>Show on</p>
            <select className={field} value={cfg.pages} onChange={(e) => set("pages", e.target.value as PopupConfig["pages"])}>
              <option value="recipes_blog">Recipe & blog pages</option><option value="recipes">Recipe pages only</option><option value="blog">Blog posts only</option><option value="all">Whole site</option>
            </select></div>
          <div><p className={label}>Show after (seconds, 0 = off)</p><input type="number" className={field} value={cfg.delaySeconds} onChange={(e) => set("delaySeconds", Number(e.target.value))} /></div>
          <div><p className={label}>Show after scrolling (% , 0 = off)</p><input type="number" className={field} value={cfg.scrollPercent} onChange={(e) => set("scrollPercent", Number(e.target.value))} /></div>
          <div><p className={label}>Hide after closing (days)</p><input type="number" className={field} value={cfg.dismissDays} onChange={(e) => set("dismissDays", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={cfg.exitIntent} onChange={(e) => set("exitIntent", e.target.checked)} /> Also show on computers when the visitor moves to leave the page</label>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} disabled={busy}>{busy ? "Saving…" : "Save popup"}</Button>
          <Button variant="outline" onClick={() => setCfg(DEFAULT_POPUP)}>Reset to default</Button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex gap-2">
          {(["mobile", "desktop"] as const).map((d) => <Button key={d} size="sm" variant={device === d ? "default" : "outline"} onClick={() => { setDevice(d); setShow(true); }}>{d === "mobile" ? "Phone" : "Computer"}</Button>)}
        </div>
        <div className={`relative mx-auto overflow-hidden rounded-2xl border bg-muted ${device === "mobile" ? "h-[640px] w-[340px]" : "h-[520px] w-full"}`}>
          <div className="p-4 text-xs text-muted-foreground">Recipe page preview</div>
          {show ? <PopupView cfg={normalizePopup(cfg)} preview={device} onClose={() => setShow(false)} /> : <button className="absolute inset-0 text-sm underline" onClick={() => setShow(true)}>Show popup again</button>}
        </div>
      </div>
    </div>
  );
}
