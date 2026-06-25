import type { AppRole } from "@/lib/auth/types";
import { canUseAiSalesAnalyst, canViewReports } from "@/lib/auth/permissions";

export type AdminNavigationIcon =
  | "aiSalesAnalyst"
  | "brochures"
  | "customers"
  | "dashboard"
  | "facebookSalesHub"
  | "inquiries"
  | "pipeline"
  | "reports"
  | "settings"
  | "vehicles";

export type AdminNavigationItem = {
  disabled?: boolean;
  href: string;
  icon?: AdminNavigationIcon;
  label: string;
};

export type AdminNavigationSection = {
  items: AdminNavigationItem[];
  title?: string;
};

export type AdminNavigationConfig = {
  mobileItems: AdminNavigationItem[];
  sidebarSections: AdminNavigationSection[];
};

export function getAdminNavigation(role: AppRole): AdminNavigationConfig {
  const aiItem: AdminNavigationItem | null = canUseAiSalesAnalyst(role)
    ? {
        href: "/admin/ai",
        icon: "aiSalesAnalyst",
        label: "AI Sales Analyst",
      }
    : null;
  const reportsItem: AdminNavigationItem | null =
    canViewReports(role)
      ? {
          href: "/admin/reports",
          icon: "reports",
          label: "Reports",
        }
      : null;

  return {
    mobileItems: [
      {
        href: "/admin/dashboard",
        icon: "dashboard",
        label: "Dashboard",
      },
      {
        href: "/admin/vehicles",
        icon: "vehicles",
        label: "Vehicles",
      },
      {
        href: "/admin/pipeline",
        icon: "pipeline",
        label: "Pipeline",
      },
      {
        href: "/admin/inquiries",
        icon: "inquiries",
        label: "Inquiries",
      },
      {
        href: "/admin/customers",
        icon: "customers",
        label: "Customers",
      },
      {
        href: "/admin/facebook",
        icon: "facebookSalesHub",
        label: "Facebook Sales Hub",
      },
      {
        href: "/admin/brochures",
        icon: "brochures",
        label: "Brochures",
      },
      ...(aiItem ? [aiItem] : []),
      ...(reportsItem ? [reportsItem] : []),
      {
        href: "/admin/settings",
        icon: "settings",
        label: "Settings",
      },
    ],
    sidebarSections: [
      {
        items: [
          {
            href: "/admin/dashboard",
            icon: "dashboard",
            label: "Dashboard",
          },
          {
            href: "/admin/vehicles",
            icon: "vehicles",
            label: "Vehicles",
          },
          {
            href: "/admin/pipeline",
            icon: "pipeline",
            label: "Pipeline",
          },
          {
            href: "/admin/inquiries",
            icon: "inquiries",
            label: "Inquiries",
          },
          {
            href: "/admin/customers",
            icon: "customers",
            label: "Customers",
          },
          {
            href: "/admin/facebook",
            icon: "facebookSalesHub",
            label: "Facebook Sales Hub",
          },
          {
            href: "/admin/brochures",
            icon: "brochures",
            label: "Brochures",
          },
          ...(aiItem ? [aiItem] : []),
          ...(reportsItem ? [reportsItem] : []),
          {
            href: "/admin/settings",
            icon: "settings",
            label: "Settings",
          },
        ],
      },
    ],
  };
}
