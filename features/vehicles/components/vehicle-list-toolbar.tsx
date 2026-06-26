"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  VEHICLE_AVAILABILITY_FILTER_OPTIONS,
  VEHICLE_LIST_SORT_OPTIONS,
  VEHICLE_STATUS_FILTER_OPTIONS,
} from "@/features/vehicles/constants";
import type { VehicleListFilterOptions, VehicleListFilters } from "@/features/vehicles/types";
import { vehicleListFiltersSchema } from "@/features/vehicles/validators";
import { buildVehicleListHref } from "@/features/vehicles/utils";

type VehicleListToolbarProps = {
  canManage: boolean;
  filterOptions: VehicleListFilterOptions;
  filters: VehicleListFilters;
};

export function VehicleListToolbar({
  canManage,
  filterOptions,
  filters,
}: VehicleListToolbarProps): ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submitFilters(resetPage = true): void {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (resetPage) {
      const pageInput = form.elements.namedItem("page") as HTMLInputElement | null;

      if (pageInput) {
        pageInput.value = "1";
      }
    }

    form.requestSubmit();
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = vehicleListFiltersSchema.safeParse({
      availability: formData.get("availability"),
      bodyType: formData.get("bodyType"),
      brand: formData.get("brand"),
      maxPrice: formData.get("maxPrice"),
      minPrice: formData.get("minPrice"),
      page: formData.get("page"),
      pageSize: formData.get("pageSize"),
      search: formData.get("search"),
      sort: formData.get("sort"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return;
    }

    router.push(buildVehicleListHref(parsed.data));
  }

  return (
    <form
      ref={formRef}
      className="space-y-3 rounded-[20px] border border-border bg-white p-4"
      onSubmit={handleFormSubmit}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))]">
          <Input
            aria-label="Search vehicles"
            defaultValue={filters.search}
            name="search"
            onChange={() => {
              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }

              searchDebounceRef.current = setTimeout(() => {
                submitFilters(true);
              }, 400);
            }}
            placeholder="Search vehicles"
          />

          <Select
            aria-label="Filter by status"
            defaultValue={filters.status}
            name="status"
            onChange={() => submitFilters(true)}
          >
            {VEHICLE_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by availability"
            defaultValue={filters.availability}
            name="availability"
            onChange={() => submitFilters(true)}
          >
            {VEHICLE_AVAILABILITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by brand"
            defaultValue={filters.brand}
            name="brand"
            onChange={() => submitFilters(true)}
          >
            <option value="all">All brands</option>
            {filterOptions.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by body type"
            defaultValue={filters.bodyType}
            name="bodyType"
            onChange={() => submitFilters(true)}
          >
            <option value="all">All body types</option>
            {filterOptions.bodyTypes.map((bodyType) => (
              <option key={bodyType} value={bodyType}>
                {bodyType}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Sort vehicles"
            defaultValue={filters.sort}
            name="sort"
            onChange={() => submitFilters(false)}
          >
            {VEHICLE_LIST_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {canManage ? (
          <Button asChild className="shrink-0">
            <Link href="/admin/vehicles/new">Add Vehicle</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
        <CurrencyInput
          aria-label="Minimum price"
          defaultValue={filters.minPrice ?? ""}
          name="minPrice"
          onBlur={() => submitFilters(true)}
          placeholder="Min price"
        />
        <CurrencyInput
          aria-label="Maximum price"
          defaultValue={filters.maxPrice ?? ""}
          name="maxPrice"
          onBlur={() => submitFilters(true)}
          placeholder="Max price"
        />
        <Button asChild className="shrink-0" type="button" variant="ghost">
          <Link href="/admin/vehicles">Reset filters</Link>
        </Button>
      </div>

      <input name="page" type="hidden" value={String(filters.page)} />
      <input name="pageSize" type="hidden" value={String(filters.pageSize)} />
    </form>
  );
}
