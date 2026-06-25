import {
  INQUIRY_SOURCE_LABELS,
  INQUIRY_STATUS_LABELS,
  PAYMENT_PREFERENCE_LABELS,
} from "@/features/inquiries/constants";
import type {
  InquirySourceType,
  InquiryStatus,
  PaymentPreference,
} from "@/features/inquiries/types";

export function formatCrmDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCrmDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getInquirySourceLabel(sourceType: InquirySourceType): string {
  return INQUIRY_SOURCE_LABELS[sourceType];
}

export function getInquiryStatusLabel(status: InquiryStatus): string {
  return INQUIRY_STATUS_LABELS[status];
}

export function getPaymentPreferenceLabel(
  value: PaymentPreference | null,
): string {
  if (!value) {
    return "Not set";
  }

  return PAYMENT_PREFERENCE_LABELS[value];
}

export function buildCustomerNameParts(fullName: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0] ?? null,
      lastName: null,
    };
  }

  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

export function buildVehicleSummaryLine(input: {
  brand: string;
  model: string;
  year: number | null;
}): string {
  return [input.brand, input.model, input.year].filter(Boolean).join(" • ");
}

export function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}
