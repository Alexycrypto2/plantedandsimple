// Brevo (email provider) — server-only. Never throws; callers fall back to the built-in queue.
const API = "https://api.brevo.com/v3";

function key() {
  return process.env.BREVO_DIRECT_API_KEY ?? null;
}

export function brevoConfigured() {
  return Boolean(key());
}

export async function brevoSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}): Promise<boolean> {
  const apiKey = key();
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
  const apiKey = key();
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
