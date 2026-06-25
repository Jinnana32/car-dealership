"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleConditionBadge } from "@/features/vehicles/components/vehicle-condition-badge";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleInventoryBadge } from "@/features/vehicles/components/vehicle-inventory-badge";
import { VehicleRowActions } from "@/features/vehicles/components/vehicle-row-actions";
import type { VehicleListItem } from "@/features/vehicles/types";
import {
  formatVehicleDate,
  formatVehicleMileage,
  getVehicleListGlanceLine,
  getVehicleListPriceDisplay,
} from "@/features/vehicles/utils";

type VehicleListTableProps = {
  canManage: boolean;
  vehicles: VehicleListItem[];
};

export function VehicleListTable({
  canManage,
  vehicles,
}: VehicleListTableProps): ReactElement {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="hidden w-[84px] md:table-cell">Photo</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead className="hidden lg:table-cell">Stock #</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="hidden lg:table-cell">Mileage</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead className="hidden xl:table-cell">Updated</TableHead>
            <TableHead className="w-12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const priceDisplay = getVehicleListPriceDisplay(vehicle);
            const detailHref = `/admin/vehicles/${vehicle.id}`;

            return (
              <TableRow
                key={vehicle.id}
                className="cursor-pointer"
                onClick={() => router.push(detailHref)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(detailHref);
                  }
                }}
              >
                <TableCell className="hidden md:table-cell">
                  <VehicleImage
                    alt={vehicle.title}
                    className="aspect-[4/3] w-16"
                    src={vehicle.featuredMedia?.signedUrl ?? null}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link
                      className="font-semibold text-foreground hover:text-primary"
                      href={detailHref}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {vehicle.title}
                    </Link>
                    <p className="text-sm text-muted-foreground lg:hidden">
                      {getVehicleListGlanceLine(vehicle, { includeMileage: true })}
                    </p>
                    <p className="hidden text-sm text-muted-foreground lg:block">
                      {getVehicleListGlanceLine(vehicle)}
                    </p>
                    <VehicleConditionBadge conditionSummary={vehicle.condition_summary} />
                    {vehicle.stock_number ? (
                      <p className="text-xs text-muted-foreground lg:hidden">
                        Stock #{vehicle.stock_number}
                      </p>
                    ) : null}
                    {vehicle.financing_enabled ? (
                      <Badge className="mt-1 lg:hidden" variant="outline">
                        Financing
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {vehicle.stock_number ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{priceDisplay.primary}</p>
                    {priceDisplay.hint ? (
                      <p className="text-xs text-muted-foreground">{priceDisplay.hint}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatVehicleMileage(vehicle.mileage)}
                </TableCell>
                <TableCell>
                  <VehicleInventoryBadge
                    availability={vehicle.availability}
                    status={vehicle.status}
                  />
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {formatVehicleDate(vehicle.updated_at)}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <VehicleRowActions canManage={canManage} vehicleId={vehicle.id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
