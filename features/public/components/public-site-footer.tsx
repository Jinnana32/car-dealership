import Link from "next/link";
import type { ReactElement } from "react";

import type { PublicDealership } from "@/features/public/types";

type PublicSiteFooterProps = {
  dealership: PublicDealership;
};

export function PublicSiteFooter({
  dealership,
}: PublicSiteFooterProps): ReactElement {
  return (
    <footer className="border-t border-border/70 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {dealership.name}
          </p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Browse published vehicles, compare available units, and reach out to
            the dealership when you find the right fit.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Explore
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <Link className="hover:text-primary" href={`/${dealership.slug}`}>
              Homepage
            </Link>
            <Link
              className="hover:text-primary"
              href={`/${dealership.slug}/vehicles`}
            >
              Available Vehicles
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Contact
          </p>
          <div className="space-y-2 text-sm text-foreground">
            {dealership.contact_phone ? <p>{dealership.contact_phone}</p> : null}
            {dealership.contact_email ? <p>{dealership.contact_email}</p> : null}
            {dealership.facebook_page_url ? (
              <a
                className="text-primary hover:underline"
                href={dealership.facebook_page_url}
                rel="noreferrer"
                target="_blank"
              >
                Facebook Page
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
