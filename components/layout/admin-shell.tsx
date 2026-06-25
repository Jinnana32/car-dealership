import type { ReactElement, ReactNode } from "react";

import { getBrandConfig } from "@/lib/branding";
import { getRoleLabel } from "@/lib/auth/permissions";
import { getUserDisplayName } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getAdminNavigation } from "@/lib/constants/admin-navigation";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopNav } from "@/components/layout/admin-top-nav";

type AdminShellProps = {
  access: AdminAccessContext;
  children: ReactNode;
};

export function AdminShell({
  access,
  children,
}: AdminShellProps): ReactElement {
  const brand = getBrandConfig();
  const navigation = getAdminNavigation(access.membership.role);
  const roleLabel = getRoleLabel(access.membership.role);
  const userDisplayName = getUserDisplayName(access);

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <AdminSidebar
          brandLogoSrc={brand.logoSrc}
          dealershipName={access.dealership.name}
          navigationSections={navigation.sidebarSections}
          roleLabel={roleLabel}
          userDisplayName={userDisplayName}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopNav
            brandLogoSrc={brand.logoSrc}
            dealershipName={access.dealership.name}
            roleLabel={roleLabel}
            userDisplayName={userDisplayName}
            userEmail={access.user.email}
          />
          <AdminMobileNav navigationItems={navigation.mobileItems} />
          <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full min-w-0 max-w-[1320px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
