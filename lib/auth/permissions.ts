import type { AppRole } from "@/lib/auth/types";

export function canManageDealership(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageVehicles(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canCreateLeads(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "sales_agent";
}

export function canViewCustomers(role: AppRole): boolean {
  return canCreateLeads(role);
}

export function canViewInquiries(role: AppRole): boolean {
  return canCreateLeads(role);
}

export function canAssignInquiries(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canAccessFacebookSalesHub(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "sales_agent";
}

export function canManageFacebookSettings(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canCreateFacebookContent(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "sales_agent";
}

export function canPublishToFacebookPage(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canGenerateBrochures(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "sales_agent";
}

export function canRecordSales(role: AppRole): boolean {
  return role === "owner" || role === "admin" || role === "sales_agent";
}

export function canViewSales(role: AppRole): boolean {
  return canRecordSales(role);
}

export function canViewReports(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canUseAiSalesAnalyst(role: AppRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageInquiryRecord(
  role: AppRole,
  currentProfileId: string,
  assignedToProfileId: string | null,
): boolean {
  if (role === "owner" || role === "admin") {
    return true;
  }

  return role === "sales_agent" && assignedToProfileId === currentProfileId;
}

export function getRoleLabel(role: AppRole): string {
  if (role === "sales_agent") {
    return "Sales Agent";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}
