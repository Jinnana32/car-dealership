"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

import type { AdminNavigationItem } from "@/lib/constants/admin-navigation";
import { cn } from "@/lib/utils";

type AdminMobileNavProps = {
  navigationItems: AdminNavigationItem[];
};

export function AdminMobileNav({
  navigationItems,
}: AdminMobileNavProps): ReactElement {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-white px-4 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/admin/pipeline" &&
              pathname.startsWith("/admin/inquiries"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border bg-white text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
