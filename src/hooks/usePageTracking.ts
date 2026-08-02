import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackEvent, currentChannel } from "@/lib/analytics";

/** Logs one page_view per navigation, plus a pinterest_click when the visit came from a pin. */
export function usePageTracking() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const channel = currentChannel();
    const slug = pathname.split("/").filter(Boolean).pop() ?? "home";
    void trackEvent("page_view", { refSlug: slug, metadata: { channel } });
    if (channel === "pinterest" && !sessionStorage.getItem("ps_pin_click")) {
      sessionStorage.setItem("ps_pin_click", "1");
      void trackEvent("pinterest_click", { refSlug: slug });
    }
  }, [pathname]);
}
