import { Star } from "lucide-react";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  setFeaturedVehicleMedia,
  uploadVehicleMedia,
} from "@/features/vehicles/actions";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";

type VehiclePhotoManagerProps = {
  canManage: boolean;
  media: VehicleMediaWithSignedUrl[];
  redirectPath: string;
  vehicle: Vehicle;
};

export function VehiclePhotoManager({
  canManage,
  media,
  redirectPath,
  vehicle,
}: VehiclePhotoManagerProps): ReactElement {
  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Photos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload and manage the gallery for this vehicle.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManage ? (
          <form action={uploadVehicleMedia} className="space-y-3">
            <input name="vehicle_id" type="hidden" value={vehicle.id} />
            <input name="redirect_to" type="hidden" value={redirectPath} />
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none text-foreground"
                htmlFor="media_files_detail"
              >
                Upload more photos
              </label>
              <Input
                accept="image/*"
                id="media_files_detail"
                multiple
                name="media_files"
                type="file"
              />
            </div>
            <SubmitButton pendingLabel="Uploading photos..." type="submit">
              Upload Photos
            </SubmitButton>
          </form>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {media.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-10 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              No vehicle photos yet.
            </div>
          ) : (
            media.map((item) => (
              <div
                key={item.id}
                className="space-y-3 rounded-2xl border border-border bg-white p-3"
              >
                <VehicleImage
                  alt={item.alt_text ?? vehicle.title}
                  className="aspect-[4/3]"
                  src={item.signedUrl}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.alt_text ?? vehicle.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sort order: {item.sort_order}
                    </p>
                  </div>
                  {item.is_featured ? (
                    <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Featured
                    </div>
                  ) : canManage ? (
                    <form action={setFeaturedVehicleMedia}>
                      <input name="media_id" type="hidden" value={item.id} />
                      <input name="redirect_to" type="hidden" value={redirectPath} />
                      <input name="vehicle_id" type="hidden" value={vehicle.id} />
                      <Button size="sm" type="submit" variant="outline">
                        Set featured
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
          Photo reordering and removal are not supported yet.
        </div>
      </CardContent>
    </Card>
  );
}
