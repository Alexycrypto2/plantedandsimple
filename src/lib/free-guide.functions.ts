import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import freeCookbookAsset from "@/assets/free-cookbook.pdf.asset.json";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  name: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
});

export const subscribeFreeGuide = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; download_url: string; email_queued: boolean }> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error: subscriberError } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: data.email, source: data.source ?? "free_guide" } as any,
        { onConflict: "email", ignoreDuplicates: false },
      );
    if (subscriberError) throw new Error("We couldn't save your email. Please try again.");

    // Log the download for analytics.
    const { error: downloadError } = await (supabaseAdmin as any)
      .from("free_guide_downloads")
      .insert({ email: data.email });
    if (downloadError) throw new Error("We couldn't prepare your free cookbook. Please try again.");

    let email_queued = false;
    try {
      const { enqueueFreeCookbookEmail } = await import("@/lib/email/free-cookbook.server");
      const emailResult = await enqueueFreeCookbookEmail(data.email);
      email_queued = emailResult.queued;
    } catch {
      // The download must remain available even if the email provider is temporarily unavailable.
    }

    try {
      const { syncSubscriber } = await import("@/lib/email-sync.server");
      await syncSubscriber(data.email, data.source ?? "free_guide");
    } catch {
      // List sync is best-effort; the subscriber is already saved.
    }

    return { ok: true, download_url: freeCookbookAsset.url, email_queued };
  });