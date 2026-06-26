import type { AppRole } from "@/lib/auth/types";
import { canUseAiSalesAnalyst, canViewReports, canViewSales } from "@/lib/auth/permissions";

export type AdminNavigationIcon =
  | "aiSalesAnalyst"
  | "brochures"
  | "customers"
  | "dashboard"
  | "facebookSalesHub"
  | "pipeline"
  | "reports"
  | "sales"
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
  const salesItem: AdminNavigationItem | null = canViewSales(role)
    ? {
        href: "/admin/sales",
        icon: "sales",
        label: "Sales",
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
        label: "Leads",
      },
      ...(salesItem ? [salesItem] : []),
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
            label: "Leads",
          },
          ...(salesItem ? [salesItem] : []),
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
