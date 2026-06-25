import type { VehicleSalePaymentType } from "@/features/sales/types";
import { VEHICLE_SALE_PAYMENT_TYPE_LABELS } from "@/features/sales/constants";

export function getVehicleSalePaymentTypeLabel(
  value: VehicleSalePaymentType,
): string {
  if (!value) {
    return "Not set";
  }

  return VEHICLE_SALE_PAYMENT_TYPE_LABELS[value];
}
