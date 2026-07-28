import * as React from "react";
import { render } from "react-email";
import { createFileRoute } from "@tanstack/react-router";
import {
  verifyWebhook,
  gatewayFetch,
  EventName,
  type PaddleEnv,
} from "@/lib/paddle.server";
import { template as cookbookTemplate } from "@/lib/email-templates/cookbook-download";

const SITE_NAME = "PlantedAndSimple";
const SENDER_DOMAIN = "notify.primedownloads.store";
const FROM_DOMAIN = "notify.primedownloads.store";
const PUBLIC_ORIGIN = "https://primedownloads.store";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const environment: PaddleEnv =
          url.searchParams.get("env") === "live" ? "live" : "sandbox";

        let event: any;
        try {
          event = await verifyWebhook(request, environment);
        } catch (err) {
          console.error("Paddle webhook signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        if (event?.eventType !== EventName.TransactionCompleted) {
          return Response.json({ ok: true, ignored: event?.eventType });
        }

        const tx = event.data ?? {};
        const transactionId: string | undefined = tx.id;
        if (!transactionId) {
          return Response.json({ ok: true, skipped: "no_tx_id" });
        }

        // Resolve buyer email. Paddle transaction may not embed it — look up
        // the customer if needed.
        let email: string | null =
          tx.customer?.email ?? tx.details?.customer?.email ?? null;
        const customerId: string | undefined = tx.customerId ?? tx.customer_id;
        if (!email && customerId) {
          try {
            const cRes = await gatewayFetch(
              environment,
              `/customers/${encodeURIComponent(customerId)}`,
            );
            if (cRes.ok) {
              const cJson: any = await cRes.json();
              email = cJson?.data?.email ?? null;
            }
          } catch (err) {
            console.error("Paddle customer lookup failed", err);
          }
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Idempotency — only send the confirmation email once per transaction.
        const { data: existing } = await supabaseAdmin
          .from("cookbook_downloads")
          .select("id, confirmation_email_sent_at")
          .eq("stripe_session_id", transactionId)
          .maybeSingle();

        if (existing?.confirmation_email_sent_at) {
          return Response.json({ ok: true, already_sent: true });
        }

        if (existing) {
          await supabaseAdmin
            .from("cookbook_downloads")
            .update({ email })
            .eq("stripe_session_id", transactionId);
        } else {
          await supabaseAdmin.from("cookbook_downloads").insert({
            stripe_session_id: transactionId,
            email,
            download_count: 0,
          });
        }

        if (!email) {
          console.warn("No email on Paddle transaction, download gate created without email", {
            transactionId,
          });
          return Response.json({ ok: true, skipped: "no_email" });
        }

        // Capture the email for future promotions.
        await supabaseAdmin
          .from("subscribers")
          .upsert(
            {
              email: email.toLowerCase(),
              source: "cookbook_purchase",
              stripe_session_id: transactionId,
            },
            { onConflict: "email", ignoreDuplicates: true },
          );

        // Affiliate attribution.
        try {
          const refCode: string | undefined =
            tx.customData?.ref ?? tx.custom_data?.ref;
          if (refCode) {
            const code = String(refCode).trim().toUpperCase();
            const { data: aff } = await supabaseAdmin
              .from("affiliates")
              .select("id, commission_pct, disabled")
              .eq("code", code)
              .maybeSingle();
            if (aff && !aff.disabled) {
              // Paddle totals in lowest denomination.
              const totalRaw =
                tx.details?.totals?.total ??
                tx.details?.totals?.grand_total ??
                tx.details?.totals?.subtotal ??
                0;
              const sale = Number(totalRaw) / 100;
              const commission = Number(
                (sale * (Number(aff.commission_pct) / 100)).toFixed(2),
              );
              await supabaseAdmin.from("affiliate_referrals").upsert(
                {
                  affiliate_id: aff.id,
                  transaction_id: transactionId,
                  sale_amount: sale,
                  commission_amount: commission,
                  product: "cookbook",
                  status: "pending",
                },
                { onConflict: "transaction_id", ignoreDuplicates: true },
              );
            }
          }
        } catch (err) {
          console.error("Affiliate attribution failed", err);
        }

        // Check suppression list before sending.
        const normalizedEmail = email.toLowerCase();
        const { data: suppressed } = await supabaseAdmin
          .from("suppressed_emails")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (suppressed) {
          console.log("Confirmation email suppressed for recipient");
          return Response.json({ ok: true, suppressed: true });
        }

        // Ensure an unsubscribe token exists (reuse if present).
        const { data: existingToken } = await supabaseAdmin
          .from("email_unsubscribe_tokens")
          .select("token, used_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        let unsubscribeToken: string;
        if (existingToken?.token && !existingToken.used_at) {
          unsubscribeToken = existingToken.token;
        } else if (!existingToken) {
          unsubscribeToken = generateToken();
          await supabaseAdmin
            .from("email_unsubscribe_tokens")
            .upsert(
              { token: unsubscribeToken, email: normalizedEmail },
              { onConflict: "email", ignoreDuplicates: true },
            );
          const { data: stored } = await supabaseAdmin
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", normalizedEmail)
            .maybeSingle();
          unsubscribeToken = stored?.token ?? unsubscribeToken;
        } else {
          // Token used and email already suppressed by unsubscribe.
          return Response.json({ ok: true, suppressed: true });
        }

        // Build the secure download page URL — the /thank-you page re-verifies
        // with Paddle and unlocks the gated /api/public/download/cookbook route.
        const downloadUrl = `${PUBLIC_ORIGIN}/thank-you?_ptxn=${encodeURIComponent(
          transactionId,
        )}`;

        const element = React.createElement(cookbookTemplate.component, {
          downloadUrl,
          orderId: transactionId,
        });
        const html = await render(element);
        const text = await render(element, { plainText: true });

        const messageId = crypto.randomUUID();
        const rawSubject = cookbookTemplate.subject as
          | string
          | ((data: Record<string, any>) => string);
        const subject =
          typeof rawSubject === "function"
            ? rawSubject({ downloadUrl, orderId: transactionId })
            : rawSubject;

        await supabaseAdmin.from("email_send_log").insert({
          message_id: messageId,
          template_name: "cookbook-download",
          recipient_email: email,
          status: "pending",
        });

        const { error: enqueueError } = await (supabaseAdmin as any).rpc(
          "enqueue_email",
          {
            queue_name: "transactional_emails",
            payload: {
              message_id: messageId,
              to: email,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: "transactional",
              label: "cookbook-download",
              idempotency_key: `cookbook-download-${transactionId}`,
              unsubscribe_token: unsubscribeToken,
              queued_at: new Date().toISOString(),
            },
          },
        );

        if (enqueueError) {
          console.error("Failed to enqueue confirmation email", enqueueError);
          await supabaseAdmin.from("email_send_log").insert({
            message_id: messageId,
            template_name: "cookbook-download",
            recipient_email: email,
            status: "failed",
            error_message: "Failed to enqueue email",
          });
          return Response.json({ error: "enqueue_failed" }, { status: 500 });
        }

        await supabaseAdmin
          .from("cookbook_downloads")
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq("stripe_session_id", transactionId);

        return Response.json({ ok: true, queued: true });
      },
    },
  },
});