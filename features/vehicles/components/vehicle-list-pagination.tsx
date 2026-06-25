"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { VehicleListFilters } from "@/features/vehicles/types";
import { buildVehicleListHref } from "@/features/vehicles/utils";

type VehicleListPaginationProps = {
  filters: VehicleListFilters;
  pageCount: number;
  totalCount: number;
};

export function VehicleListPagination({
  filters,
  pageCount,
  totalCount,
}: VehicleListPaginationProps): ReactElement | null {
  const router = useRouter();

  if (totalCount === 0) {
    return null;
  }

  const start = (filters.page - 1) * filters.pageSize + 1;
  const end = Math.min(filters.page * filters.pageSize, totalCount);
  const previousPage = filters.page > 1 ? filters.page - 1 : null;
  const nextPage = filters.page < pageCount ? filters.page + 1 : null;

  function handlePageSizeChange(nextPageSize: string): void {
    router.push(
      buildVehicleListHref(filters, {
        page: 1,
        pageSize: Number(nextPageSize),
      }),
    );
  }

  return (
    <div className="flex flex-col gap-3 px-1 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
      <p>
        Showing {start}-{end} of {totalCount}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <Label className="sr-only" htmlFor="vehicle-page-size">
            Rows per page
          </Label>
          <Select
            aria-label="Rows per page"
            id="vehicle-page-size"
            onChange={(event) => handlePageSizeChange(event.target.value)}
            value={String(filters.pageSize)}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {pageCount > 1 ? (
            <>
              <Button
                asChild={Boolean(previousPage)}
                disabled={!previousPage}
                size="sm"
                variant="outline"
              >
                {previousPage ? (
                  <Link href={buildVehicleListHref(filters, { page: previousPage })}>
                    Previous
                  </Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>

              <span className="px-1 text-foreground">
                Page {filters.page} of {pageCount}
              </span>

              <Button
                asChild={Boolean(nextPage)}
                disabled={!nextPage}
                size="sm"
                variant="outline"
              >
                {nextPage ? (
                  <Link href={buildVehicleListHref(filters, { page: nextPage })}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </>
          ) : (
            <span className="text-foreground">
              Page 1 of 1
              {totalCount <= filters.pageSize ? " · all units shown" : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
