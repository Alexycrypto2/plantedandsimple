import { useState } from "react";
import { Camera, Plus, Sparkles, X } from "lucide-react";
import { generateStudioImage } from "@/lib/ai/image-studio.functions";
import { adminAddMediaByUrl, adminUploadMedia } from "@/lib/library/admin.functions";
import { PanelCard } from "./AdminShell";
import { btnCls } from "./LibraryPanel";

const toB64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(f);
});

/** Optional photo per cooking step (index-aligned with the steps list). */
export function StepPhotosCard({ title, steps, images, onChange }: {
  title: string;
  steps: string[];
  images: (string | null)[];
  onChange: (next: (string | null)[]) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const setAt = (i: number, url: string | null) => {
    const next = steps.map((_, k) => images[k] ?? null);
    next[i] = url;
    onChange(next);
  };
  const generate = async (i: number) => {
    setBusy(i); setErr(null);
    try {
      const subject = `Real home-kitchen photo of this cooking moment for ${title}: ${steps[i]} 45-degree close-up of the pan or board, hands optional`;
      const g: any = await generateStudioImage({ data: { preset: "instagram_square", subject: subject.slice(0, 400), title: `${title} step ${i + 1}` } });
      const row: any = await adminAddMediaByUrl({ data: { url: g.preview_url, alt: `${title} step ${i + 1}`, title: `${title} step ${i + 1}`, tags: ["recipe", "step"] } });
      setAt(i, row.public_url ?? g.preview_url);
    } catch (e: any) { setErr(e?.message ?? "Photo failed"); } finally { setBusy(null); }
  };
  const upload = async (i: number, f?: File) => {
    if (!f) return;
    setBusy(i); setErr(null);
    try {
      const row: any = await adminUploadMedia({ data: { fileName: f.name, contentType: f.type as any, base64: await toB64(f), alt: `${title} step ${i + 1}`, tags: ["recipe", "step"] } });
      setAt(i, row.public_url);
    } catch (e: any) { setErr(e?.message ?? "Upload failed"); } finally { setBusy(null); }
  };

  return (
    <PanelCard title="Step-by-step photos" icon={Camera}>
      <p className="mb-3 text-[11px] text-charcoal/55">Optional. Add photos to the 2–3 steps where readers most need to see what it should look like. Saved with “Save recipe”.</p>
      {!steps.length ? <p className="text-xs text-charcoal/50">Add steps first.</p> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-forest/10 p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-forest/5">
                {images[i] ? <img src={images[i]!} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[11px] text-charcoal/40">{busy === i ? "Working… (30–60s)" : "No photo"}</div>}
                {images[i] && <button type="button" aria-label="Remove photo" onClick={() => setAt(i, null)} className="absolute right-1 top-1 rounded-full bg-white/90 p-1"><X className="size-3" /></button>}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] text-charcoal/70"><b>{i + 1}.</b> {s}</p>
              <div className="mt-1.5 flex gap-1">
                <button type="button" disabled={busy !== null} onClick={() => generate(i)} className={`${btnCls} !px-2 !py-1.5 text-[11px]`}><Sparkles className="size-3" /> AI</button>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-forest/15 px-2 py-1.5 text-[11px] font-semibold text-charcoal/70">
                  <Plus className="size-3" /> Upload
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(i, e.target.files?.[0])} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </PanelCard>
  );
}
