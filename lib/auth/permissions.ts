import type { AppRole } from "@/lib/auth/types";

export function canManageDealership(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function getRoleLabel(role: AppRole): string {
  if (role === "sales_agent") {
    return "Sales Agent";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

