"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  Settings,
} from "lucide-react";
import type { ReactElement } from "react";

import { BrandSignature } from "@/components/branding/brand-signature";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  AdminNavigationIcon,
  AdminNavigationSection,
} from "@/lib/constants/admin-navigation";
import { cn } from "@/lib/utils";

const navigationIcons: Record<AdminNavigationIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  settings: Settings,
};

type AdminSidebarProps = {
  brandLogoSrc: string | null;
  dealershipName: string;
  navigationSections: AdminNavigationSection[];
  roleLabel: string;
  userDisplayName: string;
};

export function AdminSidebar({
  brandLogoSrc,
  dealershipName,
  navigationSections,
  roleLabel,
  userDisplayName,
}: AdminSidebarProps): ReactElement {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
      <div className="space-y-5 px-6 py-6">
        <BrandSignature
          className="min-h-10"
          logoClassName="max-h-10 max-w-[160px] object-contain"
          logoSrc={brandLogoSrc}
          showSubtitle={!brandLogoSrc}
        />

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Dealership
          </p>
          <p className="text-sm font-semibold text-foreground">
            {dealershipName}
          </p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {navigationSections.map((section, index) => (
            <div key={section.title ?? `section-${index}`} className="space-y-2">
              {section.title ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </p>
              ) : null}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon ? navigationIcons[item.icon] : null;
                  const isActive =
                    !item.disabled &&
                    (pathname === item.href ||
                      pathname.startsWith(`${item.href}/`));

                  if (item.disabled) {
                    return (
                      <div
                        key={`${section.title ?? "root"}-${item.label}`}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
                      >
                        <span className="flex items-center gap-3">
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          {item.label}
                        </span>
                        <Lock className="h-3.5 w-3.5 opacity-55" />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="space-y-3 border-t border-border px-6 py-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{userDisplayName}</p>
          <p className="text-xs text-muted-foreground">Admin workspace</p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-full border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground"
        >
          {roleLabel}
        </Badge>
      </div>
    </aside>
  );
}
