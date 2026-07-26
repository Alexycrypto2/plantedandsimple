import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  name: z.string().trim().max(120).optional(),
});

export const subscribeFreeGuide = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; download_url: string }> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    // Upsert into subscribers (source=free_guide). Ignore conflicts.
    await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: data.email, source: "free_guide" } as any,
        { onConflict: "email", ignoreDuplicates: false },
      );
    // Log the download for analytics.
    await (supabaseAdmin as any)
      .from("free_guide_downloads")
      .insert({ email: data.email });

    // Return the cookbook asset URL as the free-guide download for now.
    // Replace this with a dedicated free-guide PDF once uploaded.
    const download_url =
      "https://obxftbsvorxtpeyodbcs.supabase.co/storage/v1/object/public/free/plant-based-starter-guide.pdf";
    return { ok: true, download_url };
  });