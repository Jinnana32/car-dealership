"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  buildVehicleDetailPath,
  type VehicleDetailTab,
} from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

const vehicleDetailTabs: Array<{ label: string; tab: VehicleDetailTab }> = [
  { label: "Overview", tab: "overview" },
  { label: "Photos", tab: "photos" },
  { label: "Marketing", tab: "marketing" },
  { label: "Sales", tab: "sales" },
  { label: "Activity", tab: "activity" },
];

type VehicleDetailTabsProps = {
  vehicleId: string;
};

function isVehicleDetailTabActive(pathname: string, vehicleId: string, tab: VehicleDetailTab): boolean {
  const basePath = buildVehicleDetailPath(vehicleId, tab);

  if (tab === "overview") {
    return pathname === basePath;
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function VehicleDetailTabs({ vehicleId }: VehicleDetailTabsProps): ReactElement {
  const pathname = usePathname();

  return (
    <>
      {vehicleDetailTabs.map((item) => {
        const href = buildVehicleDetailPath(vehicleId, item.tab);
        const isActive = isVehicleDetailTabActive(pathname, vehicleId, item.tab);

        return (
          <Button
            key={item.tab}
            asChild
            className={cn(isActive && "pointer-events-none")}
            size="sm"
            variant={isActive ? "default" : "outline"}
          >
            <Link href={href}>{item.label}</Link>
          </Button>
        );
      })}
    </>
  );
}
