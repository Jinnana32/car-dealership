import type { ReactElement } from "react";

import { VehiclePhotoManager } from "@/features/vehicles/components/vehicle-photo-manager";
import { VEHICLE_DETAIL_CONTENT_CLASS } from "@/features/vehicles/constants";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";
import { buildVehicleDetailPath } from "@/features/vehicles/utils";

type VehiclePhotosTabProps = {
  canManage: boolean;
  media: VehicleMediaWithSignedUrl[];
  vehicle: Vehicle;
};

export function VehiclePhotosTab({
  canManage,
  media,
  vehicle,
}: VehiclePhotosTabProps): ReactElement {
  return (
    <div className={VEHICLE_DETAIL_CONTENT_CLASS}>
      <VehiclePhotoManager
        canManage={canManage}
        media={media}
        redirectPath={buildVehicleDetailPath(vehicle.id, "photos")}
        vehicle={vehicle}
      />
    </div>
  );
}
