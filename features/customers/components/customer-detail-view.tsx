import Link from "next/link";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateCustomer } from "@/features/customers/actions";
import type { CustomerRecord } from "@/features/customers/types";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDate, getPaymentPreferenceLabel } from "@/features/inquiries/utils";

type CustomerDetailViewProps = {
  canEdit: boolean;
  record: CustomerRecord;
};

export function CustomerDetailView({
  canEdit,
  record,
}: CustomerDetailViewProps): ReactElement {
  const { customer, inquiries } = record;

  return (
    <PageContent
      title={customer.full_name}
      description="Customer details"
      actions={
        <Button asChild>
          <Link href={`/admin/leads/new?customerId=${customer.id}`}>Add Lead</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Related inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {inquiries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-foreground">No inquiries yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a lead to connect this customer to a vehicle inquiry.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium text-foreground">
                          {inquiry.vehicle?.title ?? "Not linked"}
                        </TableCell>
                        <TableCell>
                          <InquirySourceBadge sourceType={inquiry.source_type} />
                        </TableCell>
                        <TableCell>
                          <InquiryStatusBadge status={inquiry.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getPaymentPreferenceLabel(inquiry.payment_preference)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCrmDate(inquiry.next_follow_up_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/inquiries/${inquiry.id}`}>View</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Customer profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateCustomer} className="space-y-4">
                <input name="customer_id" type="hidden" value={customer.id} />
                <input name="redirect_to" type="hidden" value={`/admin/customers/${customer.id}`} />

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={customer.full_name}
                    disabled={!canEdit}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={customer.phone ?? ""}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={customer.email ?? ""}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type">Source</Label>
                  <Input
                    id="source_type"
                    name="source_type"
                    defaultValue={customer.source_type ?? ""}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_profile_url">Facebook profile URL</Label>
                  <Input
                    id="facebook_profile_url"
                    name="facebook_profile_url"
                    defaultValue={customer.facebook_profile_url ?? ""}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={customer.notes ?? ""}
                    disabled={!canEdit}
                    rows={5}
                  />
                </div>

                {canEdit ? (
                  <SubmitButton pendingLabel="Saving customer..." type="submit">
                    Save customer
                  </SubmitButton>
                ) : (
                  <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                    Customer updates are limited by your current role and assignment access.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Created", formatCrmDate(customer.created_at)],
                ["Phone", customer.phone ?? "Not set"],
                ["Email", customer.email ?? "Not set"],
                ["Inquiries", String(inquiries.length)],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContent>
  );
}
