import Link from "next/link";
import { CarFront, SearchX } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { buildVehicleListHref } from "@/features/vehicles/utils";
import type { VehicleListFilters } from "@/features/vehicles/types";

type VehicleEmptyStateProps = {
  filters?: VehicleListFilters;
  variant: "empty" | "no-results";
};

export function VehicleEmptyState({
  filters,
  variant,
}: VehicleEmptyStateProps): ReactElement {
  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-border bg-white px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">No vehicles match these filters</h2>
          <p className="text-sm text-muted-foreground">
            Try a broader search or clear the active filters.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={filters ? buildVehicleListHref(filters, {
            availability: "all",
            bodyType: "all",
            brand: "all",
            maxPrice: null,
            minPrice: null,
            page: 1,
            search: "",
            sort: "updated_desc",
            status: "active",
          }) : "/admin/vehicles"}>
            Clear filters
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-border bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CarFront className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">No vehicles yet</h2>
        <p className="text-sm text-muted-foreground">
          Add your first vehicle to start building the dealership inventory.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin/vehicles/new">Add Vehicle</Link>
      </Button>
    </div>
  );
}
