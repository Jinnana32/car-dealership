"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  generateMultiVehicleBrochure,
  generateSingleVehicleBrochure,
} from "@/features/brochures/actions";
import type { BrochurePickerFilters, BrochurePickerVehicle } from "@/features/brochures/types";
import {
  BROCHURE_PICKER_PAGE_SIZE,
  filterBrochurePickerVehicles,
  getBrochurePickerBrandOptions,
} from "@/features/brochures/utils";
import { VehicleAvailabilityBadge } from "@/features/vehicles/components/vehicle-availability-badge";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import {
  VEHICLE_AVAILABILITY_LABELS,
  VEHICLE_AVAILABILITIES,
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUSES,
} from "@/features/vehicles/constants";
import {
  formatVehicleCurrency,
} from "@/features/vehicles/utils";

type BrochureGeneratorMode = "multi" | "single";

type BrochureGeneratorWorkspaceProps = {
  vehicles: BrochurePickerVehicle[];
};

const DEFAULT_FILTERS: BrochurePickerFilters = {
  availability: "available",
  brand: "all",
  search: "",
  status: "published",
};

function BooleanSelect({
  defaultValue = "true",
  id,
  label,
  name,
}: {
  defaultValue?: "false" | "true";
  id: string;
  label: string;
  name: string;
}): ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select defaultValue={defaultValue} id={id} name={name}>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    </div>
  );
}

export function BrochureGeneratorWorkspace({
  vehicles,
}: BrochureGeneratorWorkspaceProps): ReactElement {
  const [mode, setMode] = useState<BrochureGeneratorMode>("single");
  const [filters, setFilters] = useState<BrochurePickerFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [singleSelectedId, setSingleSelectedId] = useState<string | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const brandOptions = useMemo(
    () => getBrochurePickerBrandOptions(vehicles),
    [vehicles],
  );

  const filteredVehicles = useMemo(
    () => filterBrochurePickerVehicles(vehicles, filters),
    [filters, vehicles],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredVehicles.length / BROCHURE_PICKER_PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * BROCHURE_PICKER_PAGE_SIZE,
    currentPage * BROCHURE_PICKER_PAGE_SIZE,
  );
  const canSubmit =
    mode === "single" ? Boolean(singleSelectedId) : multiSelectedIds.size >= 2;
  const submitLabel =
    mode === "single"
      ? "Generate Single Vehicle Brochure"
      : "Generate Multi-Vehicle Brochure";
  const selectionHint =
    mode === "single"
      ? singleSelectedId
        ? "1 vehicle selected"
        : "Select one vehicle"
      : multiSelectedIds.size >= 2
        ? `${multiSelectedIds.size} vehicles selected`
        : multiSelectedIds.size === 1
          ? "Select at least one more vehicle"
          : "Select at least two vehicles";

  function updateFilters(next: Partial<BrochurePickerFilters>): void {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  }

  function toggleMultiSelection(vehicleId: string): void {
    setMultiSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(vehicleId)) {
        next.delete(vehicleId);
      } else {
        next.add(vehicleId);
      }

      return next;
    });
  }

  function handleRowSelect(vehicleId: string): void {
    if (mode === "single") {
      setSingleSelectedId(vehicleId);
      return;
    }

    toggleMultiSelection(vehicleId);
  }

  function isRowSelected(vehicleId: string): boolean {
    return mode === "single"
      ? singleSelectedId === vehicleId
      : multiSelectedIds.has(vehicleId);
  }

  return (
    <form
      action={
        mode === "single"
          ? generateSingleVehicleBrochure
          : generateMultiVehicleBrochure
      }
      className="pb-28"
    >
      <input name="redirect_to" type="hidden" value="/admin/brochures" />

      {mode === "single" && singleSelectedId ? (
        <input name="vehicle_id" type="hidden" value={singleSelectedId} />
      ) : null}

      {mode === "multi"
        ? Array.from(multiSelectedIds).map((vehicleId) => (
            <input
              key={vehicleId}
              name="vehicle_ids"
              type="hidden"
              value={vehicleId}
            />
          ))
        : null}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setMode("single")}
            type="button"
            variant={mode === "single" ? "default" : "outline"}
          >
            Single vehicle
          </Button>
          <Button
            onClick={() => setMode("multi")}
            type="button"
            variant={mode === "multi" ? "default" : "outline"}
          >
            Multi-vehicle
          </Button>
        </div>

        <div className="rounded-[20px] border border-border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 md:col-span-2 xl:col-span-2">
              <Label htmlFor="brochure-search">Search</Label>
              <Input
                id="brochure-search"
                onChange={(event) =>
                  updateFilters({ search: event.target.value })
                }
                placeholder="Search title, brand, model, stock #"
                value={filters.search}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brochure-status">Status</Label>
              <Select
                id="brochure-status"
                onChange={(event) =>
                  updateFilters({
                    status: event.target.value as BrochurePickerFilters["status"],
                  })
                }
                value={filters.status}
              >
                <option value="all">All statuses</option>
                {VEHICLE_STATUSES.filter((status) => status !== "archived").map(
                  (status) => (
                    <option key={status} value={status}>
                      {VEHICLE_STATUS_LABELS[status]}
                    </option>
                  ),
                )}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brochure-availability">Availability</Label>
              <Select
                id="brochure-availability"
                onChange={(event) =>
                  updateFilters({
                    availability: event.target
                      .value as BrochurePickerFilters["availability"],
                  })
                }
                value={filters.availability}
              >
                <option value="all">All availability</option>
                {VEHICLE_AVAILABILITIES.map((availability) => (
                  <option key={availability} value={availability}>
                    {VEHICLE_AVAILABILITY_LABELS[availability]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brochure-brand">Brand</Label>
              <Select
                id="brochure-brand"
                onChange={(event) => updateFilters({ brand: event.target.value })}
                value={filters.brand}
              >
                <option value="all">All brands</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-border bg-white">
          {filteredVehicles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                No vehicles match these filters
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing search or broadening status and availability.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setPage(1);
                }}
                type="button"
                variant="outline"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12" />
                    <TableHead className="w-[72px]">Photo</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="hidden md:table-cell">Stock #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVehicles.map((vehicle) => {
                    const selected = isRowSelected(vehicle.id);

                    return (
                      <TableRow
                        key={vehicle.id}
                        className={
                          selected
                            ? "bg-primary/5 hover:bg-primary/5"
                            : "cursor-pointer"
                        }
                        onClick={() => handleRowSelect(vehicle.id)}
                      >
                        <TableCell>
                          <input
                            checked={selected}
                            className="h-4 w-4 accent-[var(--primary)]"
                            onChange={() => handleRowSelect(vehicle.id)}
                            onClick={(event) => event.stopPropagation()}
                            type={mode === "single" ? "radio" : "checkbox"}
                          />
                        </TableCell>
                        <TableCell>
                          <VehicleImage
                            alt={vehicle.title}
                            className="aspect-[4/3] w-14"
                            src={vehicle.featuredImageUrl}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {vehicle.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[vehicle.brand, vehicle.model, vehicle.year]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                            {vehicle.hasPublicListingWarning ? (
                              <p
                                className="text-xs text-amber-700"
                                title="Public listing link and QR code may be omitted for this vehicle."
                              >
                                QR/link may be omitted
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {vehicle.stockNumber || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            <VehicleStatusBadge status={vehicle.status} />
                            <VehicleAvailabilityBadge
                              availability={vehicle.availability}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {formatVehicleCurrency(vehicle.price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing{" "}
                  {(currentPage - 1) * BROCHURE_PICKER_PAGE_SIZE + 1}-
                  {Math.min(
                    currentPage * BROCHURE_PICKER_PAGE_SIZE,
                    filteredVehicles.length,
                  )}{" "}
                  of {filteredVehicles.length}
                  {filteredVehicles.length !== vehicles.length
                    ? ` (${vehicles.length} total)`
                    : ""}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    type="button"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    disabled={currentPage >= pageCount}
                    onClick={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                    type="button"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <details className="rounded-[20px] border border-border bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Brochure options
          </summary>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brochure-title">Title</Label>
              <Input
                id="brochure-title"
                name="title"
                placeholder="Optional brochure title"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BooleanSelect
                id="include-price"
                label="Include price"
                name="include_price"
              />
              <BooleanSelect
                id="include-qr"
                label="Include QR code"
                name="include_qr_code"
              />
              <BooleanSelect
                id="include-contact"
                label="Include contact details"
                name="include_contact_details"
              />
              <BooleanSelect
                id="include-disclaimer"
                label="Include disclaimer"
                name="include_disclaimer"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{selectionHint}</p>
            <p className="text-xs text-muted-foreground">
              {mode === "single"
                ? "One focused PDF for a single unit."
                : "Shareable selection PDF for multiple units."}
            </p>
          </div>

          <SubmitButton
            className="w-full sm:w-auto"
            disabled={!canSubmit}
            pendingLabel="Generating..."
            type="submit"
          >
            {submitLabel}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
