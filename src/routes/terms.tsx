import { createFileRoute } from "@tanstack/react-router";
import { LegalShell, BackLink } from "@/components/LegalShell";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions · PlantedAndSimple" },
      {
        name: "description",
        content:
          "Terms governing your use of PlantedAndSimple and purchase of the digital cookbook.",
      },
      { property: "og:title", content: "Terms & Conditions · PlantedAndSimple" },
      {
        property: "og:description",
        content:
          "Seller identity, acceptance, product license, Paddle as Merchant of Record, and suspension rights.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="Effective July 1, 2026">
      <h2>1. Who we are</h2>
      <p>
        These Terms & Conditions ("Terms") are a binding agreement between you
        and <strong>Plantedandsimple</strong> ("we", "us", "our"), the seller
        of the digital cookbook and related content available at this website
        (the "Service"). By accessing or using the Service, or purchasing our
        products, you agree to these Terms. If you do not agree, do not use
        the Service.
      </p>

      <h2>2. The product</h2>
      <p>
        The Service provides a downloadable digital cookbook —{" "}
        <em>30 High-Protein Plant-Based Meals</em> — together with optional
        bonus guides. Access is delivered electronically as a PDF file after
        a successful purchase.
      </p>

      <h2>3. Eligibility and accounts</h2>
      <p>
        You must be of legal age to enter into a binding contract in your
        jurisdiction. You are responsible for providing accurate purchase
        information and for keeping any download links or credentials
        confidential.
      </p>

      <h2>4. Payments — Paddle as Merchant of Record</h2>
      <p>
        Our order process is conducted by our online reseller Paddle.com.
        <strong> Paddle.com is the Merchant of Record for all our orders.</strong>{" "}
        Paddle provides all customer service inquiries and handles returns.
        Payment, billing, tax, cancellation, and refund mechanics are governed
        by Paddle's{" "}
        <a
          href="https://www.paddle.com/legal/checkout-buyer-terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buyer Terms
        </a>
        . Prices shown at checkout may include applicable taxes based on your
        location.
      </p>

      <h2>5. License to use the cookbook</h2>
      <p>
        On successful payment, we grant you a limited, non-exclusive,
        non-transferable, revocable license to download and use the cookbook
        for your personal, non-commercial use. You may print copies for your
        personal kitchen use. You may not resell, redistribute, sublicense,
        publicly post, or share the file, and you may not remove any
        copyright or attribution notices.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        All content, recipes, photography, text, design, and branding remain
        the property of Plantedandsimple or its licensors and are protected
        by copyright and other intellectual property laws.
      </p>

      <h2>7. Acceptable use</h2>
      <ul>
        <li>No unlawful, fraudulent, or abusive use of the Service.</li>
        <li>
          No probing, scanning, scraping, or attempting to compromise the
          security of the Service.
        </li>
        <li>No infringement of intellectual property or privacy rights.</li>
        <li>No use of automated systems to abuse download endpoints.</li>
      </ul>

      <h2>8. Refunds</h2>
      <p>
        We offer a 30-day money-back guarantee on the cookbook. See our{" "}
        <a href="/refund">Refund Policy</a> for how to request a refund.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The cookbook is provided for general informational purposes only and is
        not medical, nutritional, or dietary advice. Consult a qualified
        professional before making significant changes to your diet. The
        Service is provided "as is" without warranties of any kind, express or
        implied, to the fullest extent permitted by law.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, our total aggregate liability
        arising out of or in connection with the Service or these Terms shall
        not exceed the amount you paid us for the product in the twelve
        months preceding the claim. We are not liable for indirect,
        incidental, special, consequential, or exemplary damages, including
        loss of profits, data, or goodwill.
      </p>

      <h2>11. Suspension and termination</h2>
      <p>
        We may suspend or terminate your access to the Service — including
        revoking download links — for material breach of these Terms,
        non-payment or chargeback, suspected fraud or security risk, or
        repeated or serious policy violations. On termination, the license in
        Section 5 ends immediately.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes take
        effect when posted on this page with a new effective date. Your
        continued use of the Service after changes take effect constitutes
        acceptance.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable at the seller's
        place of business. Disputes shall be resolved in the competent courts
        of that jurisdiction, without prejudice to any mandatory consumer
        rights available to you under local law.
      </p>

      <h2>14. Contact</h2>
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