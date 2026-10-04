import * as React from "react";
import { render } from "react-email";
import { template } from "@/lib/email-templates/free-cookbook";
import freeCookbookAsset from "@/assets/free-cookbook.pdf.asset.json";

const SITE_NAME = "PlantedAndSimple";
const SENDER_DOMAIN = "notify.primedownloads.store";
const FROM_DOMAIN = "notify.primedownloads.store";

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enqueueFreeCookbookEmail(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const normalizedEmail = email.trim().toLowerCase();
  const { data: suppressed, error: suppressionError } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressionError) throw new Error("We couldn't verify email delivery status. Please try again.");
  if (suppressed) return { queued: false, reason: "suppressed" as const };

  const idempotencyKey = `free-cookbook-${normalizedEmail}`;
  const { data: sentBefore } = await supabaseAdmin
    .from("email_send_log")
    .select("id")
    .eq("template_name", "free-cookbook")
    .eq("recipient_email", normalizedEmail)
    .in("status", ["pending", "sent", "delivered"])
    .limit(1)
    .maybeSingle();
  if (sentBefore) return { queued: false, reason: "already_queued" as const };

  const { data: existingToken } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingToken?.used_at) return { queued: false, reason: "suppressed" as const };

  let unsubscribeToken = existingToken?.token ?? randomToken();
  if (!existingToken) {
    const { error: tokenError } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (tokenError) throw new Error("We couldn't prepare your confirmation email. Please try again.");
    const { data: storedToken } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();
    unsubscribeToken = storedToken?.token ?? unsubscribeToken;
  }

  const cookbookPageUrl = "https://plantedandsimple.lovable.app/free-cookbook";
  const element = React.createElement(template.component, { downloadUrl: cookbookPageUrl });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const messageId = crypto.randomUUID();
  // This template uses a fixed subject. Keeping it as a string also avoids
  // narrowing a `satisfies TemplateEntry` literal through an impossible branch.
  const subject: string = template.subject;

  const { error: logError } = await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: "free-cookbook",
    recipient_email: normalizedEmail,
    status: "pending",
  });
  if (logError) throw new Error("We couldn't queue your confirmation email. Please try again.");

  const { error: enqueueError } = await (supabaseAdmin as any).rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: normalizedEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: "free-cookbook",
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqueueError) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "free-cookbook",
      recipient_email: normalizedEmail,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    throw new Error("Your guide is ready, but the email could not be queued. Use the download page now.");
  }
  return { queued: true as const };
}