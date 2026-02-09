import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose-legal">
      <h1 className="text-gradient mb-2 text-4xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground mb-12 text-sm">
        Last updated: February 9, 2026
      </p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          When you sign in to Ignite with your Discord account, Discord shares
          some of your account information with us. Here is exactly what we
          receive and why:
        </p>
        <ul>
          <li>
            <strong>Your Discord profile</strong> (via
            the <code>identify</code> and <code>email</code> scopes): This
            includes your username, user ID, avatar, and email address. We need
            this to identify you and keep you signed in. We never see your
            Discord password.
          </li>
          <li>
            <strong>Your server list</strong> (via
            the <code>guilds</code> scope): We receive a list of the Discord
            servers (guilds) you belong to, along with what permissions you have
            in each one. This is how we know which servers you&apos;re allowed to
            manage through our dashboard.
          </li>
          <li>
            <strong>Login tokens:</strong> When you sign in, Discord gives us a
            pair of tokens (think of them like temporary keys) that are limited
            to the three scopes listed above: <code>identify</code>,{" "}
            <code>email</code>, and <code>guilds</code>. These tokens let us
            fetch your profile and server list &mdash; nothing else. They do{" "}
            <strong>not</strong> give us access to your messages, friends list,
            DMs, voice channels, or the ability to join servers or send messages
            on your behalf.
          </li>
          <li>
            <strong>How you use Ignite:</strong> We keep track of actions you
            take inside the dashboard, like creating commands or changing
            settings. This helps us understand which features people use and fix
            things when they break.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> read your Discord messages, collect your
          payment information, or track you across other websites.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          We only use your information to make Ignite work. Specifically:
        </p>
        <ul>
          <li>
            <strong>Signing you in:</strong> Your Discord profile lets us create
            your Ignite account and keep you logged in across visits.
          </li>
          <li>
            <strong>Showing your servers:</strong> Your server list is used to
            display the servers you can manage on the dashboard. If you
            don&apos;t have permission to manage a server, it won&apos;t show
            up.
          </li>
          <li>
            <strong>Running the bot:</strong> When you create a command or change
            a setting in the dashboard, we use your login tokens to apply those
            changes through Discord&apos;s systems.
          </li>
          <li>
            <strong>Fixing bugs and improving Ignite:</strong> Usage data helps
            us spot errors, understand what features matter most, and prioritize
            improvements.
          </li>
        </ul>
        <p>
          We will never sell your data, use it for advertising, or share it with
          anyone for marketing purposes.
        </p>
      </section>

      <section>
        <h2>3. How We Store and Protect Your Data</h2>
        <p>
          Your data is stored in a Convex database, a cloud-hosted platform
          designed for real-time applications. Here&apos;s how we keep it safe:
        </p>
        <ul>
          <li>
            <strong>Token encryption:</strong> The login tokens Discord gives us
            are encrypted before they&apos;re saved. That means even if someone
            gained unauthorized access to our database, the tokens would be
            unreadable without the encryption key.
          </li>
          <li>
            <strong>Secure connections:</strong> All communication between your
            browser, our servers, and Discord is encrypted in transit using
            HTTPS.
          </li>
          <li>
            <strong>Minimal data:</strong> We only store what we need to run the
            service. We don&apos;t keep extra copies of your data &ldquo;just in
            case.&rdquo;
          </li>
        </ul>
        <p>
          No system is 100% secure, but we take reasonable measures to protect
          your information and will notify you if a breach ever affects your
          data.
        </p>
      </section>

      <section>
        <h2>4. Third-Party Services</h2>
        <p>
          Ignite relies on a few external services to work. Each of these may
          receive limited data as described below:
        </p>
        <ul>
          <li>
            <strong>Discord:</strong> The core platform Ignite is built around.
            When you sign in or manage your servers, data flows between Ignite
            and Discord&apos;s API. Discord has its own{" "}
            <a
              href="https://discord.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>{" "}
            that governs how they handle your information on their end.
          </li>
          <li>
            <strong>Convex:</strong> Our database provider. Your account data and
            bot configurations are stored here. Convex acts as a data processor
            on our behalf and does not use your data for their own purposes.
          </li>
          <li>
            <strong>Sentry:</strong> An error-tracking service. When something
            goes wrong in Ignite, Sentry captures technical details about the
            error (like which page it happened on and what browser you were
            using) so we can fix it. This data is anonymized and does not include
            your Discord username or personal information.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. How Long We Keep Your Data</h2>
        <p>
          We keep your data for as long as you use Ignite. If you stop using the
          service, here&apos;s what happens:
        </p>
        <ul>
          <li>
            If you remove the Ignite bot from all of your servers and revoke its
            access in your Discord settings, we will automatically delete your
            data within 30 days.
          </li>
          <li>
            You can request immediate deletion of your data at any time by
            contacting us (see Section 9). We will process your request within
            14 days.
          </li>
          <li>
            Some anonymized, aggregated data (like &ldquo;500 people used the
            commands feature this month&rdquo;) may be retained for analytics
            purposes, but this data cannot be linked back to you.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>
          You are in control of your data. Here&apos;s what you can do at any
          time:
        </p>
        <ul>
          <li>
            <strong>See your data:</strong> You can request a copy of all the
            personal information we have about you.
          </li>
          <li>
            <strong>Fix inaccurate data:</strong> If any of your information is
            wrong, let us know and we&apos;ll correct it.
          </li>
          <li>
            <strong>Delete your data:</strong> You can ask us to permanently
            delete your account and all associated data.
          </li>
          <li>
            <strong>Revoke access:</strong> You can disconnect Ignite from your
            Discord account at any time by going to Discord &rarr; User
            Settings &rarr; Authorized Apps and removing Ignite. This
            immediately invalidates the login tokens we hold.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the methods listed in
          Section 9.
        </p>
      </section>

      <section>
        <h2>7. Children&apos;s Privacy</h2>
        <p>
          Ignite is not designed for anyone under the age of 13, which is also
          the minimum age to use Discord. We do not knowingly collect personal
          information from children. If you are a parent or guardian and believe
          your child has provided us with their information, please contact us
          and we will delete it promptly.
        </p>
      </section>

      <section>
        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy as Ignite evolves. When we make
          significant changes, we will update the &ldquo;Last updated&rdquo;
          date at the top of this page. For major changes that affect how we
          handle your data, we will make reasonable efforts to notify you (for
          example, through a notice on the dashboard). Your continued use of
          Ignite after a change means you accept the updated policy.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, want to request your
          data, or need to report a concern, you can reach us through:
        </p>
        <ul>
          <li>Our Discord support server</li>
          <li>Opening an issue on our GitHub repository</li>
        </ul>
        <p>
          We aim to respond to all privacy-related requests within 14 days.
        </p>
      </section>
    </article>
  );
}
