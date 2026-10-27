// Brevo (email provider) — server-only. Never throws; callers fall back to the built-in queue.
const API = "https://api.brevo.com/v3";

// Admin-panel key (encrypted in settings) wins; project secret is the fallback.
// The saved-settings lookup is capped at 2s so a paused database never blocks Brevo.
async function key(): Promise<string | null> {
  const { getConfig } = await import("./settings.server");
  const fromSettings = await Promise.race([
    getConfig("BREVO_DIRECT_API_KEY").catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), 2000)),
  ]);
  return fromSettings ?? process.env.BREVO_DIRECT_API_KEY ?? null;
}

export async function brevoConfigured() {
  return Boolean(await key());
}

/** Read-only account check used by the admin "Test connection" button. */
export async function brevoTestConnection(): Promise<{ ok: boolean; detail: string }> {
  const apiKey = await key();
  if (!apiKey) return { ok: false, detail: "No Brevo key saved yet." };
  try {
    const res = await fetch(`${API}/account`, { headers: { "api-key": apiKey, Accept: "application/json" } });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, detail: `Brevo said ${res.status}: ${body?.message ?? "rejected the key"}` };
    return { ok: true, detail: `Connected to ${body?.companyName || body?.email || "your Brevo account"}` };
  } catch (e: any) {
    return { ok: false, detail: e?.message ?? "Could not reach Brevo" };
  }
}

export async function brevoSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}): Promise<boolean> {
  const apiKey = await key();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${API}/smtp/email`, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Planted & Simple", email: process.env.BREVO_SENDER_EMAIL || "support@plantedandsimple.com" },
        replyTo: { email: "support@plantedandsimple.com" },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        ...(opts.text ? { textContent: opts.text } : {}),
        ...(opts.tags ? { tags: opts.tags } : {}),
      }),
    });
    if (!res.ok) console.error("[brevo] send failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[brevo] send error", e);
    return false;
  }
}

export async function brevoAddContact(
  email: string,
  list: "free" | "buyer",
  attributes: Record<string, string> = {},
): Promise<boolean> {
  const apiKey = await key();
  const listId = Number(list === "free" ? process.env.BREVO_FREE_LIST_ID : process.env.BREVO_BUYER_LIST_ID);
  if (!apiKey || !listId) return false;
  try {
    const res = await fetch(`${API}/contacts`, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true, attributes }),
    });
    if (!res.ok) console.error("[brevo] contact failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[brevo] contact error", e);
    return false;
  }
}
