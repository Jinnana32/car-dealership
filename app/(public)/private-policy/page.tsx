import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

const BUSINESS_NAME = "Best Wheels Car Display";
const EFFECTIVE_DATE = "June 23, 2026";

export const metadata: Metadata = {
  description: `Privacy policy for ${BUSINESS_NAME}.`,
  title: "Privacy Policy",
};

function PolicySection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}): ReactElement {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivatePolicyPage(): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
  const contactEmail = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || null;

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {BUSINESS_NAME}
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Privacy Policy
            </p>
          </div>
          {siteUrl ? (
            <Link className="text-sm font-medium text-primary hover:underline" href="/">
              Back to site
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="space-y-8 rounded-[24px] border border-border/70 bg-white p-6 shadow-sm md:p-10">
          <div className="space-y-3 border-b border-border/60 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
            <p className="text-sm leading-7 text-muted-foreground">
              This Privacy Policy describes how {BUSINESS_NAME} (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) collects, uses, and protects personal information when you use our
              website, contact us about vehicles, or interact with us through Facebook and related
              services.
            </p>
          </div>

          <PolicySection title="1. Information we collect">
            <p>We may collect the following types of information:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Contact details</strong> such as
                your name, phone number, and email address when you submit an inquiry, request
                information about a vehicle, or contact us by phone, email, or messaging.
              </li>
              <li>
                <strong className="font-medium text-foreground">Inquiry information</strong> such
                as the vehicle you are interested in, your message, budget preferences, and other
                details you choose to provide.
              </li>
              <li>
                <strong className="font-medium text-foreground">Facebook and Messenger data</strong>{" "}
                when you interact with our Facebook Page, submit a Facebook Lead Form, send us a
                Messenger message, or comment on our posts. This may include your Facebook profile
                name, Facebook user ID, message content, and related metadata provided by Meta.
              </li>
              <li>
                <strong className="font-medium text-foreground">Technical information</strong> such
                as browser type, device information, IP address, and basic usage data collected
                through standard web server and security logs.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="2. How we use your information">
            <p>We use personal information to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Respond to your inquiries and provide customer support</li>
              <li>Match you with vehicles and follow up on sales opportunities</li>
              <li>Operate our inventory website and dealership services</li>
              <li>Process leads received from our website, Facebook, and Messenger</li>
              <li>Maintain internal records, reporting, and business operations</li>
              <li>Improve our services, security, and user experience</li>
              <li>Comply with legal obligations and protect against fraud or abuse</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Facebook and Meta integrations">
            <p>
              Our services may connect with Meta platforms, including Facebook Pages, Lead Ads,
              Messenger, and post engagement features. When you interact with us through Meta, Meta
              may also collect and process information according to Meta&apos;s own privacy policies.
            </p>
            <p>
              Information received from Meta is used only to manage customer inquiries, sales
              follow-up, and related dealership operations. We do not sell Facebook or Messenger data
              to third parties.
            </p>
            <p>
              For more information about how Meta handles your data, visit{" "}
              <a
                className="text-primary hover:underline"
                href="https://www.facebook.com/privacy/policy/"
                rel="noreferrer"
                target="_blank"
              >
                Meta&apos;s Privacy Policy
              </a>
              .
            </p>
          </PolicySection>

          <PolicySection title="4. How we share information">
            <p>We may share personal information only as needed to operate our business, including:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Service providers</strong> that
                host our website, store data, or provide infrastructure and security services
              </li>
              <li>
                <strong className="font-medium text-foreground">Authorized dealership staff</strong>{" "}
                who need access to respond to inquiries and manage sales
              </li>
              <li>
                <strong className="font-medium text-foreground">Legal or regulatory authorities</strong>{" "}
                when required by law or to protect our rights, customers, or the public
              </li>
            </ul>
            <p>We do not sell your personal information.</p>
          </PolicySection>

          <PolicySection title="5. Data retention">
            <p>
              We retain personal information for as long as needed to respond to inquiries, manage
              customer relationships, meet legal and accounting requirements, and resolve disputes.
              When information is no longer needed, we take reasonable steps to delete or anonymize
              it.
            </p>
          </PolicySection>

          <PolicySection title="6. Data security">
            <p>
              We use reasonable administrative, technical, and organizational safeguards to protect
              personal information. No method of transmission or storage is completely secure, and we
              cannot guarantee absolute security.
            </p>
          </PolicySection>

          <PolicySection title="7. Your choices and rights">
            <p>You may:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Request access to or correction of your personal information</li>
              <li>Ask us to delete information where applicable law allows</li>
              <li>Opt out of non-essential marketing communications</li>
              <li>Stop messaging us on Facebook Messenger at any time</li>
            </ul>
            <p>
              To make a privacy-related request, contact us using the details in the Contact section
              below.
            </p>
          </PolicySection>

          <PolicySection title="8. Children&apos;s privacy">
            <p>
              Our services are not directed to children under 13, and we do not knowingly collect
              personal information from children under 13. If you believe a child has provided us
              personal information, please contact us so we can take appropriate action.
            </p>
          </PolicySection>

          <PolicySection title="9. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The effective date at the top of
              this page will reflect the latest version. Continued use of our services after changes
              are posted means you accept the updated policy.
            </p>
          </PolicySection>

          <PolicySection title="10. Contact us">
            <p>
              If you have questions about this Privacy Policy or how we handle personal information,
              contact:
            </p>
            <div className="rounded-2xl border border-border/70 bg-[#faf8f5] p-4 text-sm text-foreground">
              <p className="font-semibold">{BUSINESS_NAME}</p>
              {contactEmail ? (
                <p>
                  Email:{" "}
                  <a className="text-primary hover:underline" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Email: contact the dealership using the contact details on our website.
                </p>
              )}
              {siteUrl ? (
                <p>
                  Website:{" "}
                  <a className="text-primary hover:underline" href={siteUrl}>
                    {siteUrl}
                  </a>
                </p>
              ) : null}
            </div>
          </PolicySection>
        </div>
      </main>

      <footer className="border-t border-border/70 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground md:px-6">
          <p>
            &copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
