"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DealershipMemberOption } from "@/features/inquiries/types";
import { VEHICLE_SALE_PAYMENT_TYPE_FILTER_OPTIONS } from "@/features/sales/constants";
import type { SalesListFilters } from "@/features/sales/types";
import { buildSalesHref, countActiveSalesFilters } from "@/features/sales/utils";

type SalesFiltersProps = {
  filters: SalesListFilters;
  memberOptions: DealershipMemberOption[];
  vehicleOptions: Array<{ id: string; label: string }>;
};

export function SalesFilters({
  filters,
  memberOptions,
  vehicleOptions,
}: SalesFiltersProps): ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const activeFilterCount = countActiveSalesFilters(filters);

  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    router.push(
      buildSalesHref({
        from: String(formData.get("from") ?? ""),
        paymentType: String(formData.get("paymentType") ?? "all") as SalesListFilters["paymentType"],
        search: String(formData.get("search") ?? ""),
        soldById: String(formData.get("soldById") ?? ""),
        to: String(formData.get("to") ?? ""),
        vehicleId: String(formData.get("vehicleId") ?? ""),
      }),
    );
  }

  return (
    <form
      ref={formRef}
      className="space-y-3 rounded-[20px] border border-border bg-white p-4"
      onSubmit={handleFormSubmit}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_160px_160px_220px_auto]">
        <Input
          defaultValue={filters.search}
          name="search"
          placeholder="Search customer or vehicle"
        />
        <Input defaultValue={filters.from} name="from" type="date" />
        <Input defaultValue={filters.to} name="to" type="date" />
        <Select defaultValue={filters.paymentType} name="paymentType">
          {VEHICLE_SALE_PAYMENT_TYPE_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            Apply
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/sales">Reset</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select defaultValue={filters.vehicleId} name="vehicleId">
          <option value="">All vehicles</option>
          {vehicleOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select defaultValue={filters.soldById} name="soldById">
          <option value="">All sellers</option>
          {memberOptions.map((option) => (
            <option key={option.profileId} value={option.profileId}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </form>
  );
}
