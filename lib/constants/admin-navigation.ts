import { canManageDealership } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/types";

export type AdminNavigationIcon = "dashboard" | "settings";

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
  const canManage = canManageDealership(role);

  return {
    mobileItems: [
      {
        href: "/admin/dashboard",
        icon: "dashboard",
        label: "Dashboard",
      },
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
        ],
      },
      {
        title: "Inventory",
        items: [
          {
            disabled: true,
            href: "#",
            label: "Vehicles",
          },
          {
            disabled: true,
            href: "#",
            label: "Add Vehicle",
          },
        ],
      },
      {
        title: "Inquiries",
        items: [
          {
            disabled: true,
            href: "#",
            label: "Leads",
          },
          {
            disabled: true,
            href: "#",
            label: "Pipeline",
          },
          {
            disabled: true,
            href: "#",
            label: "Customers",
          },
        ],
      },
      {
        title: "Marketing",
        items: [
          {
            disabled: true,
            href: "#",
            label: "Facebook Posts",
          },
          {
            disabled: true,
            href: "#",
            label: "Post Generator",
          },
        ],
      },
      {
        items: [
          {
            disabled: true,
            href: "#",
            label: "Brochures",
          },
          {
            disabled: true,
            href: "#",
            label: "Reports",
          },
        ],
      },
      {
        title: "Settings",
        items: [
          {
            href: "/admin/settings",
            icon: "settings",
            label: "Dealership Profile",
          },
          ...(canManage
            ? [
                {
                  disabled: true,
                  href: "#",
                  label: "Users & Roles",
                },
                {
                  disabled: true,
                  href: "#",
                  label: "Integrations",
                },
              ]
            : []),
        ],
      },
    ],
  };
}
