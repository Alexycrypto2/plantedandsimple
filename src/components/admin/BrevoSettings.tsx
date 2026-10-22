import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, KeyRound, Loader2, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminListSettings, adminSaveSetting, adminTestBrevo, type SettingRow } from "@/lib/settings.functions";
import { sendStudioEmail } from "@/lib/email-studio.functions";

export function BrevoSettings() {
  const list = useServerFn(adminListSettings);
  const save = useServerFn(adminSaveSetting);
  const test = useServerFn(adminTestBrevo);
  const send = useServerFn(sendStudioEmail);
  const [setting, setSetting] = useState<SettingRow>();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const load = async () => {
    const rows = await list();
    setSetting(rows.find((row) => row.key === "BREVO_DIRECT_API_KEY"));
  };
  useEffect(() => { load().catch(() => setResult({ ok: false, text: "Couldn't read the saved email settings." })); }, []);
  const run = async (action: string, fn: () => Promise<void>) => {
    setBusy(action);
    setResult(undefined);
    try { await fn(); }
    catch (e) { setResult({ ok: false, text: e instanceof Error ? e.message : "The request failed. Try again." }); }
    finally { setBusy(undefined); }
  };
  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-label="Brevo email connection">
      <div className="flex items-start gap-3">
        <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="font-display text-2xl text-primary">Brevo · Email delivery</h3>
          <p className="mt-1 text-sm text-muted-foreground">{setting ? (setting.source === "missing" ? "No key configured" : `Key configured · ${setting.masked} · ${setting.source === "panel" ? "saved here" : "project secret"}`) : "Checking saved settings…"}</p>
        </div>
      </div>
      <label htmlFor="brevo-key" className="mt-5 block text-sm font-semibold">Brevo API key</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input id="brevo-key" type="password" autoComplete="new-password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter a new or replacement API key" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <Button disabled={Boolean(busy) || !key.trim()} onClick={() => run("save", async () => {
          await save({ data: { key: "BREVO_DIRECT_API_KEY", value: key.trim() } });
          setKey("");
          await load();
          setResult({ ok: true, text: "Brevo key saved securely. Test the connection next." });
        })}>{busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save key</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" disabled={Boolean(busy) || !setting || setting.source === "missing"} onClick={() => run("test", async () => {
          const response = await test();
          setResult({ ok: response.ok, text: response.detail });
        })}>{busy === "test" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Test connection</Button>
        <Button variant="outline" disabled={Boolean(busy) || !setting || setting.source === "missing"} onClick={() => run("send", async () => {
          const response = await send({ data: { mode: "test", subject: "Your Brevo connection is working", body: "This is a test email from Planted & Simple.\n\nYour email delivery connection is working.\n\nHappy cooking,\nThe Planted & Simple Team" } });
          setResult({ ok: true, text: `Test email sent to ${response.to}.` });
        })}>{busy === "send" ? <Loader2 className="animate-spin" /> : <Mail />} Send me a test email</Button>
        {setting?.source === "panel" && <Button variant="ghost" disabled={Boolean(busy)} onClick={() => {
          if (!window.confirm("Remove the key saved here? If a project secret exists, it will become active again.")) return;
          void run("remove", async () => {
            await save({ data: { key: "BREVO_DIRECT_API_KEY", value: "" } });
            await load();
            setResult({ ok: true, text: "Panel key removed. Any configured project secret is now the fallback." });
          });
        }}><KeyRound /> Remove panel key</Button>}
      </div>
      {result && <p role="status" className={`mt-4 text-sm ${result.ok ? "text-primary" : "text-destructive"}`}>{result.text}</p>}
    </section>
  );
}