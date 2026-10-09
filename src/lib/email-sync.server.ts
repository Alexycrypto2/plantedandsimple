import { getConfig } from "./settings.server";

/** Pushes one subscriber to the configured external list(s). Never throws. */
export async function syncSubscriber(email: string, source: string): Promise<{ mailerlite: boolean; webhook: boolean }> {
  const result = { mailerlite: false, webhook: false };
  const [mlKey, mlGroup, hook] = await Promise.all([
    getConfig("MAILERLITE_API_KEY"),
    getConfig("MAILERLITE_GROUP_ID"),
    getConfig("EMAIL_SYNC_WEBHOOK_URL"),
  ]);
  if (mlKey) {
    try {
      const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: { Authorization: `Bearer ${mlKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, fields: { source }, ...(mlGroup ? { groups: [mlGroup] } : {}) }),
      });
      result.mailerlite = res.ok;
      if (!res.ok) console.error("[email-sync] MailerLite", res.status);
    } catch (e) {
      console.error("[email-sync] MailerLite failed", e);
    }
  }
  if (hook && /^https:\/\//i.test(hook)) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, subscribed_at: new Date().toISOString(), site: "plantedandsimple" }),
      });
      result.webhook = res.ok;
    } catch (e) {
      console.error("[email-sync] webhook failed", e);
    }
  }
  return result;
}
