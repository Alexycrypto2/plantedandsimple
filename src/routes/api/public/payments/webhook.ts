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
import { template as prepTemplate } from "@/lib/email-templates/prep-access";

const SITE_NAME = "PlantedAndSimple";
const SENDER_DOMAIN = "notify.primedownloads.store";
const FROM_DOMAIN = "notify.primedownloads.store";
const PUBLIC_ORIGIN = "https://primedownloads.store";

type SupabaseAdminClient = any;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Resolve product slug from Paddle custom data (camelCase or snake_case). */
function productSlugOf(tx: any): string | undefined {
  const slug = tx?.customData?.productSlug ?? tx?.custom_data?.productSlug;
  return typeof slug === "string" && slug ? slug : undefined;
}

/** Affiliate attribution — records the referral exactly once per transaction. */
async function attributeAffiliate(
  supabase: SupabaseAdminClient,
  tx: any,
  transactionId: string,
  product: string,
) {
  try {
    const refCode: string | undefined = tx.customData?.ref ?? tx.custom_data?.ref;
    if (!refCode) return;
    const code = String(refCode).trim().toUpperCase();
    const { data: aff } = await supabase
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
      await supabase.from("affiliate_referrals").upsert(
        {
          affiliate_id: aff.id,
          transaction_id: transactionId,
          sale_amount: sale,
          commission_amount: commission,
          product,
          status: "pending",
        },
        { onConflict: "transaction_id", ignoreDuplicates: true },
      );
    }
  } catch (err) {
    console.error("Affiliate attribution failed", err);
  }
}

/** Suppression + unsubscribe guard. Returns null when the email must not be sent. */
async function emailGuard(
  supabase: SupabaseAdminClient,
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.toLowerCase();
  const { data: suppressed } = await supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressed) {
    console.log("Confirmation email suppressed for recipient");
    return null;
  }

  const { data: existingToken } = await supabase
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingToken?.token && !existingToken.used_at) {
    return existingToken.token;
  }
  if (!existingToken) {
    const fresh = generateToken();
    await supabase
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: fresh, email: normalizedEmail },
        { onConflict: "email", ignoreDuplicates: true },
      );
    const { data: stored } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();
    return stored?.token ?? fresh;
  }
  // Token used and email already suppressed by unsubscribe.
  return null;
}

async function queueEmail(
  supabase: SupabaseAdminClient,
  opts: {
    email: string;
    unsubscribeToken: string;
    templateName: string;
    element: React.ReactElement;
    idempotencyKey: string;
    subjectData: Record<string, any>;
  },
): Promise<boolean> {
  const { email, unsubscribeToken, templateName, element, idempotencyKey, subjectData } =
    opts;
  const template =
    templateName === "prep-access" ? prepTemplate : cookbookTemplate;
  const html = await render(element);
  const text = await render(element, { plainText: true });

  const messageId = crypto.randomUUID();
  const rawSubject = template.subject as
    | string
    | ((data: Record<string, any>) => string);
  const subject =
    typeof rawSubject === "function" ? rawSubject(subjectData) : rawSubject;

  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: email,
    status: "pending",
  });

  const { error: enqueueError } = await (supabase as any).rpc("enqueue_email", {
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
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("Failed to enqueue confirmation email", enqueueError);
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: email,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return false;
  }
  return true;
}

/** Prep System purchase flow — records the sale and sends the access email. */
async function handlePrepPurchase(
  supabase: SupabaseAdminClient,
  tx: any,
  transactionId: string,
  email: string | null,
  environment: PaddleEnv,
): Promise<Response> {
  // Idempotency — the unique constraint on transaction_id makes this insert
  // succeed exactly once per purchase; ignored duplicates return no rows.
  const { data: inserted } = await supabase
    .from("prep_purchases")
    .insert({
      transaction_id: transactionId,
      email,
      environment,
    })
    .select("id");

  if (!inserted || inserted.length === 0) {
    return Response.json({ ok: true, already_sent: true });
  }

  if (email) {
    await supabase.from("subscribers").upsert(
      {
        email: email.toLowerCase(),
        source: "prep_system_purchase",
        stripe_session_id: transactionId,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
  }

  await attributeAffiliate(supabase, tx, transactionId, "prep-system");

  if (!email) {
    console.warn("Prep purchase without email", { transactionId });
    return Response.json({ ok: true, skipped: "no_email" });
  }

  const unsubscribeToken = await emailGuard(supabase, email);
  if (!unsubscribeToken) {
    return Response.json({ ok: true, suppressed: true });
  }

  const accessUrl = `${PUBLIC_ORIGIN}/auth?next=/prep-app`;
  const element = React.createElement(prepTemplate.component, {
    accessUrl,
    orderId: transactionId,
  });
  const ok = await queueEmail(supabase, {
    email,
    unsubscribeToken,
    templateName: "prep-access",
    element,
    idempotencyKey: `prep-access-${transactionId}`,
    subjectData: { accessUrl, orderId: transactionId },
  });

  return Response.json(ok ? { ok: true, queued: true } : { error: "enqueue_failed" }, {
    status: ok ? 200 : 500,
  });
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

        // Route by product: the Meal Prep System records a prep purchase
        // instead of a cookbook download.
        // Planning Kit downloads are verified live against Paddle; nothing to record.
        if (productSlugOf(tx) === "planning-kit") {
          return Response.json({ ok: true, product: "planning-kit" });
        }
        if (productSlugOf(tx) === "meal-prep-system") {
          return handlePrepPurchase(
            supabaseAdmin,
            tx,
            transactionId,
            email,
            environment,
          );
        }

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
          console.warn(
            "No email on Paddle transaction, download gate created without email",
            {
              transactionId,
            },
          );
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

        await attributeAffiliate(supabaseAdmin, tx, transactionId, "cookbook");

        const unsubscribeToken = await emailGuard(supabaseAdmin, email);
        if (!unsubscribeToken) {
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
        const ok = await queueEmail(supabaseAdmin, {
          email,
          unsubscribeToken,
          templateName: "cookbook-download",
          element,
          idempotencyKey: `cookbook-download-${transactionId}`,
          subjectData: { downloadUrl, orderId: transactionId },
        });

        if (!ok) {
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
