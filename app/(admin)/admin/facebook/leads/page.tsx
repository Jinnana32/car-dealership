import Link from "next/link";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FacebookLeadStatusBadge } from "@/features/facebook/components/facebook-lead-status-badge";
import { retryFacebookLeadProcessing } from "@/features/facebook/leadgen-actions";
import { getFacebookLeads } from "@/features/facebook/leadgen-queries";
import { FACEBOOK_LEAD_STATUS_FILTER_OPTIONS } from "@/features/facebook/constants";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookLeadsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookLeadsPage({
  searchParams,
}: FacebookLeadsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getFacebookLeads(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Leads"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/lead-forms">Lead Form Mappings</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/inquiries">Open Inquiries</Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Imported leads
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.totalCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Received
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.receivedCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Processed
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.processedCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Failed
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.failedCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.latestReceivedAt
                ? `Latest ${formatCrmDateTime(result.latestReceivedAt)}`
                : "No lead submissions yet."}
            </p>
          </div>
        </div>

        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 lg:grid-cols-[240px_auto_auto]">
          <Select defaultValue={result.filters.status} name="status">
            {FACEBOOK_LEAD_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/facebook/leads">Reset</Link>
          </Button>
        </form>

        {result.leads.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No leads imported yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Facebook Lead Form submissions will appear here after the webhook receives the first valid leadgen event.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Received</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Inquiry</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Leadgen ID</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatCrmDateTime(lead.received_at)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {lead.form_name || "Unnamed form"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.form_id || "No form ID"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {lead.customer ? (
                          <div className="space-y-1">
                            <Link
                              className="font-medium text-primary hover:underline"
                              href={`/admin/customers/${lead.customer.id}`}
                            >
                              {lead.customer.full_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {lead.customer.phone || lead.customer.email || "No phone or email"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not linked yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {lead.inquiry ? (
                          <div className="space-y-2">
                            <InquiryStatusBadge status={lead.inquiry.status} />
                            <div>
                              <Link
                                className="text-sm font-medium text-primary hover:underline"
                                href={`/admin/inquiries/${lead.inquiry.id}`}
                              >
                                Open inquiry
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not created
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {lead.vehicle ? (
                          <Link
                            className="font-medium text-primary hover:underline"
                            href={`/admin/vehicles/${lead.vehicle.id}`}
                          >
                            {lead.vehicle.title}
                          </Link>
                        ) : (
                          "Not linked"
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <FacebookLeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {lead.leadgen_id}
                      </TableCell>
                      <TableCell className="max-w-[260px] align-top text-sm text-red-700">
                        {lead.error_message || "None"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          {lead.status === "failed" ? (
                            <form action={retryFacebookLeadProcessing}>
                              <input name="lead_id" type="hidden" value={lead.id} />
                              <input
                                name="redirect_to"
                                type="hidden"
                                value="/admin/facebook/leads"
                              />
                              <SubmitButton pendingLabel="Retrying..." size="sm" type="submit">
                                Retry
                              </SubmitButton>
                            </form>
                          ) : null}
                          {lead.customer ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/customers/${lead.customer.id}`}>
                                Customer
                              </Link>
                            </Button>
                          ) : null}
                          {lead.inquiry ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/inquiries/${lead.inquiry.id}`}>
                                Inquiry
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.leads.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
