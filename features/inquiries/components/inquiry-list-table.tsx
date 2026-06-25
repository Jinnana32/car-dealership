import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import type { InquiryListItem } from "@/features/inquiries/types";
import {
  formatCrmDate,
  getPaymentPreferenceLabel,
} from "@/features/inquiries/utils";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";

type InquiryListTableProps = {
  inquiries: InquiryListItem[];
};

export function InquiryListTable({
  inquiries,
}: InquiryListTableProps): ReactElement {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((inquiry) => (
            <TableRow key={inquiry.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {inquiry.customer?.full_name ?? "Customer unavailable"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inquiry.customer?.phone ?? inquiry.customer?.email ?? "No contact info"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
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
                {inquiry.assignedToName ?? "Unassigned"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <FollowUpBadge
                  bucket={inquiry.followUpBucket}
                  value={inquiry.next_follow_up_at}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCrmDate(inquiry.created_at)}
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
    </div>
  );
}
