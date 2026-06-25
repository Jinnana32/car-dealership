import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from "lucide-react";
import type { ReactElement } from "react";

import { BrandSignature } from "@/components/branding/brand-signature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutAction } from "@/lib/auth/actions";

type AdminTopNavProps = {
  brandLogoSrc: string | null;
  dealershipName: string;
  roleLabel: string;
  userDisplayName: string;
  userEmail: string | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AdminTopNav({
  brandLogoSrc,
  dealershipName,
  roleLabel,
  userDisplayName,
  userEmail,
}: AdminTopNavProps): ReactElement {
  const initials = getInitials(userDisplayName);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:hidden">
          <BrandSignature
            logoClassName="max-h-9 max-w-[150px] object-contain"
            logoSrc={brandLogoSrc}
            showSubtitle={!brandLogoSrc}
          />
          <p className="truncate pl-4 text-sm font-medium text-foreground">
            {dealershipName}
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search"
              className="h-11 border-border bg-[#fafaf9] pl-10 shadow-none"
              disabled
              placeholder="Global search coming soon"
              readOnly
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <Button
              aria-label="Notifications"
              disabled
              size="icon"
              title="Notifications coming soon"
              variant="outline"
              className="h-11 w-11 rounded-full border-border bg-white"
              type="button"
            >
              <Bell className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f] text-xs font-semibold text-white">
                {initials || "BW"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userDisplayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail ?? roleLabel}
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-[#fafaf9] px-2.5 py-1 md:flex">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {roleLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="h-11">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
