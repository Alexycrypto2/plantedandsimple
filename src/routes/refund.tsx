import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { LegalShell, BackLink } from "@/components/LegalShell";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
  head: () => pageHead("/refund", "Refund Policy & 60-Day Guarantee | PlantedAndSimple", "Read the 60-day money-back guarantee for the PlantedAndSimple cookbook and learn how to request a refund through Paddle."),
});

function RefundPage() {
  return (
    <LegalShell title="Refund Policy" updated="Effective July 1, 2026">
      <p>
        <strong>Plantedandsimple</strong> stands behind every cookbook we sell.
        If it isn't the right fit for you, we offer a straightforward
        money-back guarantee.
      </p>

      <h2>1. 60-day money-back guarantee</h2>
      <p>
        You may request a full refund of your purchase within{" "}
        <strong>60 days</strong> of your order date, for any reason. This
        applies to the digital cookbook and any bundled bonuses.
      </p>

      <h2>2. How to request a refund</h2>
      <p>
        Refunds are processed by our payment provider, <strong>Paddle</strong>,
        which is the Merchant of Record for every order. To request a refund:
      </p>
      <ul>
        <li>
          Visit{" "}
          <a
            href="https://paddle.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            paddle.net
          </a>{" "}
          and enter the email address you used at checkout. Paddle will send
          you a secure link to view your order and request a refund.
        </li>
        <li>
          Or email us at{" "}
          <a href="mailto:support@primedownloads.store">
            support@primedownloads.store
          </a>{" "}
          with your order email and transaction reference, and we will forward
          your request to Paddle.
        </li>
      </ul>
      <p>
        Please include your purchase email so we can locate your order.
        Refunds are typically processed back to your original payment method
        within 5–10 business days, depending on your bank or card issuer.
      </p>

      <h2>3. After a refund</h2>
      <p>
        Once a refund is issued, your license to the cookbook ends and any
        download links associated with your order will be deactivated. Please
        delete downloaded copies from your devices.
      </p>

      <h2>4. Chargebacks</h2>
      <p>
        If you believe there's an issue with a charge, contact us first — we
        will help resolve it quickly. Chargebacks filed without contacting us
        may result in access being suspended pending review.
      </p>

      <h2>5. Contact</h2>
      <p>
        Plantedandsimple —{" "}
        <a href="mailto:support@primedownloads.store">
          support@primedownloads.store
        </a>
      </p>

      <BackLink />
    </LegalShell>
  );
}