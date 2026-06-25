"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  INQUIRY_SOURCE_FILTER_OPTIONS,
  INQUIRY_STATUS_FILTER_OPTIONS,
} from "@/features/inquiries/constants";
import type { DealershipMemberOption } from "@/features/inquiries/types";
import { PIPELINE_FOLLOW_UP_FILTER_OPTIONS } from "@/features/pipeline/constants";
import type { PipelineViewMode } from "@/features/pipeline/types";
import {
  buildPipelineHref,
  countActivePipelineFilters,
} from "@/features/pipeline/utils";
import { cn } from "@/lib/utils";

type PipelineFiltersProps = {
  assignedToId: string;
  followUp: string;
  memberOptions: DealershipMemberOption[];
  search: string;
  showClosed: boolean;
  source: string;
  status: string;
  vehicleId: string;
  vehicleOptions: Array<{ id: string; label: string }>;
  view: PipelineViewMode;
};

export function PipelineFilters({
  assignedToId,
  followUp,
  memberOptions,
  search,
  showClosed,
  source,
  status,
  vehicleId,
  vehicleOptions,
  view,
}: PipelineFiltersProps): ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(Boolean(vehicleId));

  const activeFilterCount = useMemo(
    () =>
      countActivePipelineFilters({
        assignedToId,
        followUp,
        search,
        showClosed,
        source,
        status,
        vehicleId,
        view,
      }),
    [assignedToId, followUp, search, showClosed, source, status, vehicleId, view],
  );

  function submitFilters(): void {
    formRef.current?.requestSubmit();
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    router.push(
      buildPipelineHref({
        assignedToId: String(formData.get("assignedToId") ?? ""),
        followUp: String(formData.get("followUp") ?? "all"),
        search: String(formData.get("search") ?? ""),
        showClosed: formData.get("showClosed") === "true",
        source: String(formData.get("source") ?? "all"),
        status: String(formData.get("status") ?? "all"),
        vehicleId: String(formData.get("vehicleId") ?? ""),
        view: String(formData.get("view") ?? "board") as PipelineViewMode,
      }),
    );
  }

  function setFollowUpFilter(nextFollowUp: string): void {
    router.push(
      buildPipelineHref({
        assignedToId,
        followUp: nextFollowUp,
        search,
        showClosed,
        source,
        status,
        vehicleId,
        view,
      }),
    );
  }

  return (
    <div className="space-y-3">
      <form
        ref={formRef}
        className="rounded-[20px] border border-border bg-white p-4"
        onSubmit={handleFormSubmit}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Input
            aria-label="Search pipeline"
            className="xl:min-w-[220px] xl:flex-1"
            defaultValue={search}
            name="search"
            onChange={() => {
              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }

              searchDebounceRef.current = setTimeout(() => {
                submitFilters();
              }, 400);
            }}
            placeholder="Search customer, vehicle, or message"
          />

          <Select
            aria-label="Filter by source"
            className="xl:w-[170px]"
            defaultValue={source}
            name="source"
            onChange={() => submitFilters()}
          >
            {INQUIRY_SOURCE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {view === "list" ? (
            <Select
              aria-label="Filter by status"
              className="xl:w-[170px]"
              defaultValue={status}
              name="status"
              onChange={() => submitFilters()}
            >
              {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}

          <Select
            aria-label="Filter by assignee"
            className="xl:w-[180px]"
            defaultValue={assignedToId}
            name="assignedToId"
            onChange={() => submitFilters()}
          >
            <option value="">All assignees</option>
            {memberOptions.map((option) => (
              <option key={option.profileId} value={option.profileId}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button
            className="xl:w-auto"
            onClick={() => setFiltersExpanded((current) => !current)}
            type="button"
            variant="outline"
          >
            More filters
            {activeFilterCount > 0 ? (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        {filtersExpanded ? (
          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
            <Select
              aria-label="Filter by vehicle"
              className="sm:max-w-sm sm:flex-1"
              defaultValue={vehicleId}
              name="vehicleId"
              onChange={() => submitFilters()}
            >
              <option value="">All vehicles</option>
              {vehicleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>

            {view === "board" ? (
              <label className="flex items-center gap-2 rounded-xl border border-border bg-[#fafaf9] px-3 py-2 text-sm text-foreground sm:shrink-0">
                <input
                  defaultChecked={showClosed}
                  name="showClosed"
                  onChange={() => submitFilters()}
                  type="checkbox"
                  value="true"
                />
                Show closed stages (Won / Lost)
              </label>
            ) : null}

            <Button asChild className="sm:w-auto" type="button" variant="ghost">
              <Link href={buildPipelineHref({ view })}>Reset filters</Link>
            </Button>
          </div>
        ) : (
          <>
            <input name="vehicleId" type="hidden" value={vehicleId} />
            {view === "board" && showClosed ? (
              <input name="showClosed" type="hidden" value="true" />
            ) : null}
          </>
        )}

        <input name="followUp" type="hidden" value={followUp} />
        <input name="view" type="hidden" value={view} />
      </form>

      <div className="flex flex-wrap gap-2">
        {PIPELINE_FOLLOW_UP_FILTER_OPTIONS.map((option) => {
          const isActive = followUp === option.value;

          return (
            <button
              key={option.value}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-white text-foreground hover:bg-accent",
              )}
              onClick={() => setFollowUpFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
