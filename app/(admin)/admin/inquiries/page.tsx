import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import { InquiryEmptyState } from "@/features/inquiries/components/inquiry-empty-state";
import { InquiryListTable } from "@/features/inquiries/components/inquiry-list-table";
import {
  INQUIRY_SOURCE_FILTER_OPTIONS,
  INQUIRY_STATUS_FILTER_OPTIONS,
} from "@/features/inquiries/constants";
import {
  getDealershipMemberOptions,
  getInquiriesList,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { PIPELINE_FOLLOW_UP_FILTER_OPTIONS } from "@/features/pipeline/constants";
import { getAdminAccessContext } from "@/lib/auth/session";

type InquiriesPageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    error?: string | string[];
    followUp?: string | string[];
    search?: string | string[];
    source?: string | string[];
    status?: string | string[];
    success?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InquiriesPage({
  searchParams,
}: InquiriesPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const [result, vehicleOptions, memberOptions] = await Promise.all([
    getInquiriesList(access, resolvedSearchParams),
    getVehicleOptions(access),
    getDealershipMemberOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Inquiries"
        actions={
          <Button asChild>
            <Link href="/admin/leads/new">Add Lead</Link>
          </Button>
        }
      >
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[minmax(0,1.35fr)_210px_190px_220px_220px_180px_auto]">
          <Input
            defaultValue={result.filters.search}
            name="search"
            placeholder="Search customer, vehicle, source detail, or message"
          />
          <Select defaultValue={result.filters.source} name="source">
            {INQUIRY_SOURCE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.status} name="status">
            {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.vehicleId} name="vehicleId">
            <option value="">All vehicles</option>
            {vehicleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.assignedToId} name="assignedToId">
            <option value="">All assignees</option>
            {memberOptions.map((option) => (
              <option key={option.profileId} value={option.profileId}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.followUp} name="followUp">
            {PIPELINE_FOLLOW_UP_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/inquiries">Reset</Link>
            </Button>
          </div>
        </form>

        {result.inquiries.length === 0 ? (
          <InquiryEmptyState />
        ) : (
          <>
            <InquiryListTable inquiries={result.inquiries} />
            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.inquiries.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
