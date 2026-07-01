import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Notice · PlantedAndSimple" },
      {
        name: "description",
        content:
          "How Plantedandsimple collects, uses, shares, and protects your personal data.",
      },
      { property: "og:title", content: "Privacy Notice · PlantedAndSimple" },
      {
        property: "og:description",
        content:
          "Data categories, purposes, retention, user rights, and subprocessors including Paddle as Merchant of Record.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Notice" updated="Effective July 1, 2026">
      <p>
        This Privacy Notice describes how <strong>Plantedandsimple</strong> ("we",
        "us", "our") collects, uses, shares, and protects personal data when you
        visit our website or purchase our digital cookbook. Plantedandsimple is
        the data controller for the personal data described below.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Contact and account data</strong> — name, email address you
          provide at checkout or in support requests.
        </li>
        <li>
          <strong>Purchase data</strong> — order confirmation, product purchased,
          transaction identifier. Payment card details are collected and
          processed by Paddle, not by us.
        </li>
        <li>
          <strong>Usage and device data</strong> — IP address, browser type,
          device identifiers, pages viewed, referring URL, and similar telemetry
          generated when you use the site.
        </li>
        <li>
          <strong>Support communications</strong> — messages you send us and our
          replies.
        </li>
      </ul>

      <h2>2. Purposes and legal basis</h2>
      <ul>
        <li>
          Providing the cookbook and download access — <em>performance of a
          contract</em>.
        </li>
        <li>
          Fraud prevention, security, and abuse monitoring — <em>legitimate
          interests</em>.
        </li>
        <li>
          Sending purchase confirmations and service notices — <em>performance of
          a contract</em>.
        </li>
        <li>
          Sending optional marketing about future products —{" "}
          <em>consent</em>, which you can withdraw at any time.
        </li>
        <li>
          Complying with tax, accounting, and other legal obligations —{" "}
          <em>legal obligation</em>.
        </li>
      </ul>

      <h2>3. How we share data</h2>
      <ul>
        <li>
          <strong>Paddle.com Market Ltd. (Merchant of Record)</strong> — handles
          checkout, payment processing, invoicing, tax compliance, refunds, and
          related customer service. See Paddle's{" "}
          <a
            href="https://www.paddle.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Notice
          </a>
          .
        </li>
        <li>
          <strong>Service providers</strong> — hosting, database, email delivery,
          and analytics vendors acting on our instructions as processors.
        </li>
        <li>
          <strong>Professional advisers and authorities</strong> — where required
          by law or to establish, exercise, or defend legal claims.
        </li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>4. International transfers</h2>
      <p>
        Our service providers may process data outside your country of
        residence, including the United States and the EEA. Where required, we
        rely on appropriate safeguards such as Standard Contractual Clauses.
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep personal data only as long as needed for the purposes above:
        purchase and tax records for the period required by law (typically 6–10
        years), marketing contacts until you unsubscribe, and support
        correspondence for up to 3 years. When no longer needed, data is
        deleted or anonymised.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct,
        delete, restrict, or object to processing of your personal data, to
        data portability, and to withdraw consent. To exercise these rights,
        email <a href="mailto:support@primedownloads.store">support@primedownloads.store</a>.
        You also have the right to lodge a complaint with your local data
        protection authority.
      </p>

      <h2>7. Security</h2>
      <p>
        We use appropriate technical and organisational measures — including
        encryption in transit, access controls, and audit logging — to protect
        personal data against unauthorised access, loss, or alteration.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use strictly necessary cookies to operate checkout and the download
        flow. If we introduce analytics or marketing cookies, we will request
        your consent first.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this notice from time to time. Material changes will be
        posted on this page with a new effective date.
      </p>

      <h2>10. Contact</h2>
      <p>
        Plantedandsimple — <a href="mailto:support@primedownloads.store">support@primedownloads.store</a>
      </p>

      <BackLink />
    </LegalShell>
  );
}

function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="font-display text-2xl font-bold italic text-forest"
        >
          Planted<span className="text-sage">&amp;</span>Simple
        </Link>
      </nav>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">
          {updated}
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-forest-deep sm:text-5xl">
          {title}
        </h1>
        <div className="prose prose-neutral mt-10 max-w-none text-charcoal/85 [&_a]:font-semibold [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-display [&_h2]:italic [&_h2]:text-forest-deep [&_h2]:mt-10 [&_h2]:text-2xl [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2">
          {children}
        </div>
      </main>
    </div>
  );
}

function BackLink() {
  return (
    <p className="mt-12">
      <Link
        to="/"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-charcoal/50 hover:text-forest"
      >
        ← Back to home
      </Link>
    </p>
  );
}

export { LegalShell, BackLink };