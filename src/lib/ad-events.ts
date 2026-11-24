/** Ad conversion events for Google Analytics and the Pinterest tag (both loaded in __root). */
type Fn = (...a: unknown[]) => void;
const w = () => (typeof window === "undefined" ? null : (window as unknown as { gtag?: Fn; pintrk?: Fn }));

/** Free cookbook signup. */
export function trackLeadConversion(source: string) {
  const g = w();
  if (!g) return;
  g.gtag?.("event", "generate_lead", { lead_source: source });
  g.pintrk?.("track", "lead", { lead_type: "free_cookbook" });
}

/** Verified purchase; fires once per transaction even if the thank-you page is reloaded. */
export function trackPurchaseConversion(transactionId: string, product: string) {
  const g = w();
  if (!g || transactionId.startsWith("demo")) return;
  const key = `ps-conv-${transactionId}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { /* ignore */ }
  g.gtag?.("event", "purchase", { transaction_id: transactionId, currency: "USD", items: [{ item_id: product }] });
  g.pintrk?.("track", "checkout", { event_id: transactionId, order_quantity: 1, currency: "USD" });
}
