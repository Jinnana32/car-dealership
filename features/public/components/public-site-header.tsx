import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import type { PublicDealership } from "@/features/public/types";

type PublicSiteHeaderProps = {
  currentPage: "home" | "vehicles";
  dealership: PublicDealership;
};

function NavigationLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}): ReactElement {
  return (
    <Link
      className={
        active
          ? "rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
          : "rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
      }
      href={href}
    >
      {label}
    </Link>
  );
}

export function PublicSiteHeader({
  currentPage,
  dealership,
}: PublicSiteHeaderProps): ReactElement {
  return (
    <header className="border-b border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="flex min-w-0 items-center gap-3"
          href={`/${dealership.slug}`}
        >
          {dealership.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={dealership.name}
              className="max-h-12 max-w-[180px] object-contain"
              src={dealership.logo_url}
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {dealership.name}
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Vehicle Inventory
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:justify-end">
          <nav className="flex flex-wrap items-center gap-1">
            <NavigationLink
              active={currentPage === "home"}
              href={`/${dealership.slug}`}
              label="Home"
            />
            <NavigationLink
              active={currentPage === "vehicles"}
              href={`/${dealership.slug}/vehicles`}
              label="Vehicles"
            />
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {dealership.contact_phone ? (
              <a
                className="text-sm font-medium text-foreground hover:text-primary"
                href={`tel:${dealership.contact_phone}`}
              >
                {dealership.contact_phone}
              </a>
            ) : null}
            <Button asChild size="sm">
              <Link href={`/${dealership.slug}/vehicles`}>Browse Inventory</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
