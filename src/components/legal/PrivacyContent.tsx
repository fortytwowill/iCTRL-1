import React from "react";

interface SectionProps {
  title?: string;
  level?: 1 | 2 | 3;
  children?: React.ReactNode;
}

function Section({ title, level = 2, children }: SectionProps) {
  const baseClasses = "font-semibold text-foreground";
  const levelClasses = [
    "text-2xl mt-8 mb-4",
    "text-xl mt-6 mb-3",
    "text-lg mt-4 mb-2",
  ];

  if (!title) return <>{children}</>;

  if (level === 1) return <h1 className={`${baseClasses} ${levelClasses[0]}`}>{title}</h1>;
  if (level === 2) return <h2 className={`${baseClasses} ${levelClasses[1]}`}>{title}</h2>;
  return <h3 className={`${baseClasses} ${levelClasses[2]}`}>{title}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-7">{children}</p>;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-primary underline-offset-4 hover:underline"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-6 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-border text-sm">
        <thead className="bg-muted/60">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-muted/30"}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-border px-3 py-2 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HR() {
  return <hr className="border-border" />;
}

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm leading-7 text-foreground/90">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
        <P>Effective date: November 1, 2026 · Version: 20261101</P>
      </header>

      <P>
        This Privacy Policy describes how iCTRL (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) handles information when you deploy and use the iCTRL self-hosted software (the &ldquo;Software&rdquo;). Because iCTRL is open-source and self-hosted, <Bold>you control your own deployment and all data stored within it</Bold>.
      </P>

      <Section title="1. Self-Hosted Architecture" level={2} />
      <P>
        iCTRL is designed to run on infrastructure that you own or operate. The Software does not transmit operational data, inventory records, user activity, or authentication credentials to any external server controlled by the iCTRL project. All data remains within your deployment boundary unless you explicitly configure third-party integrations.
      </P>

      <Section title="2. Information Under Your Control" level={2} />
      <P>When you deploy iCTRL, you may store the following categories of information in your own database:</P>
      <UL
        items={[
          <><Bold>Account information:</Bold> email addresses and hashed passwords for users of your instance</>,
          <><Bold>Organization data:</Bold> names, team members, roles, and invitation records</>,
          <><Bold>Inventory data:</Bold> items, categories, locations, serial numbers, batch lots, and stock levels</>,
          <><Bold>Transaction logs:</Bold> check-in/check-out records, purchase orders, and audit trails</>,
          <><Bold>User-generated content:</Bold> labels, notes, bug reports, and uploaded screenshots</>,
        ]}
      />
      <P>
        You are the data controller for all information stored in your iCTRL instance. You are responsible for complying with applicable privacy legislation (such as PIPEDA, GDPR, or CCPA) as it applies to your users and organization.
      </P>

      <Section title="3. Authentication and Session Data" level={2} />
      <P>
        iCTRL uses <Bold>better-auth</Bold> to manage authentication, sessions, password resets, and organization membership. Session cookies are scoped to your deployment domain and are strictly necessary for the Software to function. You may configure session duration and cookie policies through environment variables in your deployment.
      </P>

      <Section title="4. Optional Third-Party Integrations" level={2} />
      <P>
        iCTRL includes optional integrations that you may configure at the platform-admin level. These integrations are disabled by default and only transmit data when you explicitly provide credentials:
      </P>
      <Table
        headers={["Integration", "Purpose", "Data Transmitted", "Your Responsibility"]}
        rows={[
          ["SMTP / Email provider", "Transactional email (invites, password resets, scheduled reports)", "Recipient addresses, email content", "Ensure your provider complies with applicable privacy laws"],
          ["SMS provider (Twilio, Vonage, etc.)", "Alert notifications", "Phone numbers, alert content", "Obtain consent from users before sending SMS"],
          ["Puter AI", "Optional Ask-AI assistant on Dashboard", "Prompts you submit, conversation context", "Review Puter's privacy policy before enabling"],
        ]}
      />
      <P>
        If you do not configure these integrations, iCTRL operates entirely offline with no external data transmission beyond your own network.
      </P>

      <Section title="5. Analytics and Telemetry" level={2} />
      <P>
        <Bold>iCTRL does not include any built-in analytics, telemetry, or tracking.</Bold> The Software does not phone home, does not collect usage statistics, and does not embed third-party tracking scripts. Your deployment's logs and database are the only records of activity.
      </P>

      <Section title="6. Data Security" level={2} />
      <P>You are responsible for securing your own deployment. We recommend:</P>
      <UL
        items={[
          <>deploying behind a reverse proxy with TLS termination (HTTPS),</>,
          <>restricting database access to the application container only,</>,
          <>using strong, unique passwords and rotating the <Bold>BETTER_AUTH_SECRET</Bold> environment variable periodically,</>,
          <>keeping your Docker images and dependencies up to date,</>,
          <>maintaining regular database backups via <code>pg_dump</code>.</>,
        ]}
      />

      <Section title="7. Data Retention and Deletion" level={2} />
      <P>
        Because you control the database, you control retention. You may delete any user, organization, or record at any time through the application interface or directly via SQL. To fully purge an instance, delete the PostgreSQL volume and the application's <code>DATA_DIR</code> volume.
      </P>

      <Section title="8. Children's Privacy" level={2} />
      <P>
        iCTRL is a business tool intended for use by organizations and their adult employees. The Software does not knowingly target or collect information from children.
      </P>

      <Section title="9. Changes to This Policy" level={2} />
      <P>
        This Privacy Policy reflects the design of iCTRL as a self-hosted, open-source project. If the project's architecture changes in a future release, this policy will be updated in the repository. You can review the history of this document at any time on GitHub.
      </P>

      <Section title="10. Contact" level={2} />
      <P>
        For questions about this Privacy Policy or the iCTRL project, open an issue on the <Link href="https://github.com/fortytwowill/iCTRL">iCTRL GitHub repository</Link>.
      </P>
      <P>
        For privacy requests related to <Bold>your specific deployment</Bold>, contact the administrator of your organization's iCTRL instance — they are the data controller for your information.
      </P>
    </div>
  );
}