import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { draftEmailWithAi, sendStudioEmail } from "@/lib/email-studio.functions";

const GOALS = ["Recipe Highlight", "Cookbook Promo", "Weekly Nutrition Tip", "Subscriber Welcome", "General Update"];

export function EmailStudio() {
  const draft = useServerFn(draftEmailWithAi);
  const send = useServerFn(sendStudioEmail);
  const [summary, setSummary] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (kind: string, fn: () => Promise<void>) => {
    setBusy(kind);
    try { await fn(); } catch (e) { toast.error((e as Error).message || "Something went wrong"); } finally { setBusy(null); }
  };

  const onDraft = () => run("draft", async () => {
    const out = await draft({ data: { summary, goal } });
    setSubject(out.subject); setPreview(out.preview); setBody(out.body);
    toast.success("Draft ready — edit anything below.");
  });
  const onTest = () => run("test", async () => {
    const r = await send({ data: { subject, body, mode: "test" } });
    toast.success(`Test sent to ${r.to}`);
  });
  const onBroadcast = () => {
    if (!confirm("Send this email to every active subscriber now?")) return;
    run("broadcast", async () => {
      const r = await send({ data: { subject, body, mode: "broadcast" } });
      toast.success(`Sent to ${r.sent} subscribers${r.failed ? ` (${r.failed} failed)` : ""}`);
    });
  };
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  const input = "w-full rounded-lg border border-forest/20 bg-background px-3 py-2 text-sm";
  return (
    <section className="mb-8 rounded-2xl border border-forest/15 bg-cream-warm p-5">
      <h3 className="font-display text-2xl text-forest-deep">AI Email Studio</h3>
      <p className="mt-1 text-sm text-charcoal/70">Describe what you want to say in one sentence. AI writes it, you edit, then test or send.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_200px_auto]">
        <input className={input} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. Tell everyone about our new 20-minute tofu stir fry recipe" />
        <select className={input} value={goal} onChange={(e) => setGoal(e.target.value)}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select>
        <button onClick={onDraft} disabled={!!busy || summary.trim().length < 3} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === "draft" ? "Writing…" : "Draft with AI"}</button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-forest-deep">Subject<input className={input + " mt-1"} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
          <label className="block text-xs font-semibold text-forest-deep">Preview text<input className={input + " mt-1"} value={preview} onChange={(e) => setPreview(e.target.value)} /></label>
          <label className="block text-xs font-semibold text-forest-deep">Email body<textarea className={input + " mt-1 min-h-[280px] font-sans"} value={body} onChange={(e) => setBody(e.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            <button onClick={onTest} disabled={!!busy || !subject || !body} className="rounded-lg border border-forest px-3 py-2 text-sm text-forest disabled:opacity-50">{busy === "test" ? "Sending…" : "Send test to me"}</button>
            <button onClick={onBroadcast} disabled={!!busy || !subject || !body} className="rounded-lg bg-forest-deep px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === "broadcast" ? "Sending…" : "Send to all subscribers"}</button>
            <button onClick={() => copy(subject)} disabled={!subject} className="rounded-lg border border-forest/20 px-3 py-2 text-sm">Copy subject</button>
            <button onClick={() => copy(body)} disabled={!body} className="rounded-lg border border-forest/20 px-3 py-2 text-sm">Copy body</button>
          </div>
        </div>
        <div className="rounded-2xl border border-forest/15 bg-background p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Inbox preview</p>
          <div className="mt-2 border-b border-forest/10 pb-3">
            <p className="text-sm font-semibold text-forest-deep">Planted & Simple</p>
            <p className="text-sm font-medium">{subject || "Your subject line"}</p>
            <p className="truncate text-xs text-charcoal/60">{preview || "Preview text shows here"}</p>
          </div>
          <div className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-charcoal">{body || "Your email will appear here."}</div>
        </div>
      </div>
    </section>
  );
}
