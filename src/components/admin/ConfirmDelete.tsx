import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/** Red delete button that opens a confirmation dialog before running onConfirm. */
export function ConfirmDelete({ label, itemTitle, onConfirm }: { label: string; itemTitle: string; onConfirm: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await onConfirm(); toast.success(`"${itemTitle || "Untitled"}" deleted`); setOpen(false); }
    catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
    finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
        <Trash2 className="size-3.5" /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 p-4" onClick={() => !busy && setOpen(false)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-lg text-forest-deep">Delete this for good?</p>
            <p className="mt-2 text-sm text-charcoal/70">"{itemTitle || "Untitled"}" will be removed from the site and admin. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-xl border border-forest/15 px-4 py-2 text-xs font-semibold text-charcoal/70">Keep it</button>
              <button type="button" disabled={busy} onClick={run} className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60">{busy ? "Deleting…" : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
