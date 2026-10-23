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
    // Saving to the database is best-effort: if it's paused or slow, the
    // visitor still gets the PDF and Brevo still receives the contact.
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin
        .from("subscribers")
        .upsert(
          { email: data.email, source: data.source ?? "free_guide" } as any,
          { onConflict: "email", ignoreDuplicates: false },
        );
      await (supabaseAdmin as any)
        .from("free_guide_downloads")
        .insert({ email: data.email });
    } catch {
      // Database unavailable — continue with delivery.
    }

    let email_queued = false;
    try {
      const { enqueueFreeCookbookEmail } = await import("@/lib/email/free-cookbook.server");
      const emailResult = await enqueueFreeCookbookEmail(data.email);
      email_queued = emailResult.queued;
    } catch {
      // The download must remain available even if the email provider is temporarily unavailable.
    }

    // Brevo runs independently so a database outage never stops list signups.
    try {
      const { brevoAddContact } = await import("@/lib/brevo.server");
      await brevoAddContact(data.email, "free", { SOURCE: data.source ?? "free_guide" });
    } catch {
      // Best-effort.
    }
    try {
      const { syncSubscriber } = await import("@/lib/email-sync.server");
      await syncSubscriber(data.email, data.source ?? "free_guide");
    } catch {
      // Best-effort.
    }

    return { ok: true, download_url: freeCookbookAsset.url, email_queued };
  });