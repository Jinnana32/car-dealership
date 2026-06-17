import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { requireAdminAccessContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
};

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps): Promise<ReactElement> {
  const access = await requireAdminAccessContext("/admin/dashboard");

  if (!access) {
    return (
      <UnauthorizedState
        title="Admin access required"
        description="Your account does not have access to a dealership admin workspace yet. Contact an administrator for access."
      />
    );
  }

  return <AdminShell access={access}>{children}</AdminShell>;
}
