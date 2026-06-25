import type { ReactElement } from "react";

import { StatusToast } from "@/components/ui/status-toast";

type VehicleDetailToastsProps = {
  error?: string;
  success?: string;
};

export function VehicleDetailToasts({
  error,
  success,
}: VehicleDetailToastsProps): ReactElement {
  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />
    </>
  );
}

export function getVehicleDetailSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
