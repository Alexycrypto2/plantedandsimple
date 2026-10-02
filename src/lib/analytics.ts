/**
 * Client-side analytics tracker.
 * Writes into public.analytics_events (anon insert is allowed) so the admin
 * Analytics dashboard, the learning engine and AI recommendations all read
 * from one connected source of truth.
 */
import { supabase } from "@/integrations/supabase/client";

export type TrackKind =
  | "page_view"
  | "recipe_view"
  | "product_view"
  | "blog_view"
  | "cta_click"
  | "internal_link_click"
  | "homepage_click"
  | "checkout_start"
  | "pinterest_click"
  | "download"
  | "free_cookbook_view"
  | "free_cookbook_download"
  | "free_cookbook_signup"
  | "upsell_click";

const SESSION_KEY = "ps_session_id";
const CHANNEL_KEY = "ps_channel";

export function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** pinterest / affiliate / search / direct — sticky for the whole session. */
export function currentChannel(): string {
  if (typeof window === "undefined") return "direct";
  const url = new URL(window.location.href);
  const utm = url.searchParams.get("utm_source");
  const ref = document.referrer || "";
  let channel = window.sessionStorage.getItem(CHANNEL_KEY) ?? "";
  const detected =
    utm?.toLowerCase() ||
    (/pinterest\./i.test(ref) ? "pinterest" : "") ||
    (url.searchParams.get("ref") ? "affiliate" : "") ||
    (/google\.|bing\.|duckduckgo\./i.test(ref) ? "search" : "") ||
    (ref ? "referral" : "direct");
  if (detected && detected !== "direct") channel = detected;
  if (!channel) channel = detected || "direct";
  window.sessionStorage.setItem(CHANNEL_KEY, channel);
  return channel;
}

export async function trackEvent(
  kind: TrackKind,
  opts: { refId?: string | null; refSlug?: string | null; metadata?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  try {
    await supabase.from("analytics_events").insert({
      kind,
      ref_id: opts.refId ?? null,
      ref_slug: opts.refSlug ?? null,
      session_id: sessionId(),
      metadata: {
        path: window.location.pathname,
        channel: currentChannel(),
        ...(opts.metadata ?? {}),
      },
    });
  } catch {
    /* analytics must never break the page */
  }
}
