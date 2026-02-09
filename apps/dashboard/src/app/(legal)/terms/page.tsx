import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service"
};

export default function TermsOfServicePage() {
  return (
    <article className="prose-legal">
      <h1 className="text-gradient mb-2 text-4xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mb-12 text-sm">
        Last updated: February 9, 2026
      </p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Ignite (&quot;the Service&quot;), including the
          Discord bot and web dashboard, you agree to be bound by these Terms of
          Service. If you do not agree to these terms, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Ignite provides a Discord bot and an accompanying web dashboard that
          allow server administrators to manage their Discord guilds. Features
          include custom command management, guild settings configuration, and
          other server management tools.
        </p>
      </section>

      <section>
        <h2>3. User Accounts</h2>
        <p>
          To use the Service, you must sign in using your Discord account via
          OAuth. By authenticating, you authorize us to access certain
          information from your Discord profile as permitted by the scopes you
          approve. You are responsible for maintaining the security of your
          Discord account.
        </p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service for any unlawful purpose or in violation of
            Discord&apos;s Terms of Service.
          </li>
          <li>
            Attempt to interfere with, compromise, or disrupt the Service or its
            infrastructure.
          </li>
          <li>
            Abuse, harass, or harm others through the use of the Service.
          </li>
          <li>
            Reverse engineer, decompile, or attempt to extract the source code
            of the Service, except where permitted by law.
          </li>
          <li>
            Use the Service to send spam, unsolicited messages, or automated
            bulk content.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>
          All content, trademarks, and other intellectual property associated
          with the Service are owned by us or our licensors. You may not copy,
          modify, distribute, or create derivative works based on the Service
          without prior written consent.
        </p>
      </section>

      <section>
        <h2>6. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to the
          Service at any time, with or without cause, and with or without
          notice. Upon termination, your right to use the Service ceases
          immediately.
        </p>
      </section>

      <section>
        <h2>7. Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, either express or implied, including
          but not limited to implied warranties of merchantability, fitness for
          a particular purpose, and non-infringement.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          any loss of profits or revenues, arising out of or related to your use
          of the Service.
        </p>
      </section>

      <section>
        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms of Service from time to time. We will notify
          users of material changes by updating the &quot;Last updated&quot;
          date. Continued use of the Service after changes constitutes
          acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, please reach
          out through our Discord support server or open an issue on our GitHub
          repository.
        </p>
      </section>
    </article>
  );
}
