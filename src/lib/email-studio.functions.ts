import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAnyAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss" || r.role === "admin")) throw new Error("Forbidden");
}

const DraftSchema = z.object({
  subject: z.string(),
  preview: z.string(),
  body: z.string(),
});

export const draftEmailWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { summary: string; goal: string }) =>
    z.object({ summary: z.string().trim().min(3).max(1500), goal: z.string().max(60) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { textModel } = await import("@/lib/ai/gateway.server");
    const model = await textModel("email_studio");
    const { output } = await generateText({
      model,
      output: Output.object({ schema: DraftSchema }),
      prompt: `Write a friendly newsletter email for Planted & Simple, a plant-based high-protein cookbook brand (website https://plantedandsimple.com).
Goal: ${data.goal}.
What the owner wants to say: ${data.summary}
Rules: warm, short paragraphs, plain American English, no invented facts, statistics, testimonials or discounts unless the owner mentioned them. Do not use a first-name placeholder (start with "Hey there,"). Sign off "Happy cooking,\nThe Planted & Simple Team".
Products you may mention only if relevant: the 30 High-Protein Plant-Based Meals cookbook ($14.99) at https://plantedandsimple.com/shop, the free 12-recipe guide at https://plantedandsimple.com/free-cookbook, recipes at https://plantedandsimple.com/recipes.
Return: subject (under 60 characters), preview (under 90 characters), body as plain text with blank lines between paragraphs and full URLs written out.`,
    });
    return output;
  });

const SendSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(20000),
  mode: z.enum(["test", "broadcast"]),
});

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function emailBodyToHtml(body: string) {
  const paras = body.split(/\n\s*\n/).map((p) => {
    const html = esc(p).replace(/\n/g, "<br/>").replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2f5d3a">$1</a>');
    return `<p style="margin:0 0 16px;line-height:1.6">${html}</p>`;
  });
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#2b2b2b;background:#fbf8f1">${paras.join("")}<p style="font-size:12px;color:#888;margin-top:24px">You're receiving this because you joined Planted &amp; Simple. Reply "unsubscribe" to stop these emails.</p></div>`;
}

export const sendStudioEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SendSchema>) => SendSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAnyAdmin(context.supabase, context.userId);
    const { brevoSendEmail, brevoConfigured } = await import("@/lib/brevo.server");
    if (!(await brevoConfigured())) throw new Error("Email sending isn't set up yet.");
    const html = emailBodyToHtml(data.body);
    if (data.mode === "test") {
      const to = (context.claims as any)?.email as string | undefined;
      if (!to) throw new Error("Your account has no email address.");
      const ok = await brevoSendEmail({ to, subject: `[TEST] ${data.subject}`, html, text: data.body, tags: ["studio-test"] });
      if (!ok) throw new Error("The test email couldn't be sent.");
      return { sent: 1, failed: 0, to };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("subscribers").select("email").is("unsubscribed_at", null).limit(1000);
    if (error) throw new Error("Couldn't load the email list.");
    const emails = Array.from(new Set((rows ?? []).map((r: any) => String(r.email).toLowerCase()).filter(Boolean)));
    let sent = 0, failed = 0;
    for (const to of emails) {
      const ok = await brevoSendEmail({ to, subject: data.subject, html, text: data.body, tags: ["studio-broadcast"] });
      ok ? sent++ : failed++;
    }
    return { sent, failed, to: null };
  });
