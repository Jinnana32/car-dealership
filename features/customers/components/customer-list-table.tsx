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
import type { CustomerListItem } from "@/features/customers/types";
import { formatCrmDate, getInquirySourceLabel } from "@/features/inquiries/utils";

type CustomerListTableProps = {
  customers: CustomerListItem[];
};

export function CustomerListTable({
  customers,
}: CustomerListTableProps): ReactElement {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Inquiries</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-semibold text-foreground">
                {customer.full_name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.phone ?? "Not set"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.email ?? "Not set"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.source_type
                  ? getInquirySourceLabel(customer.source_type as never)
                  : "Not set"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.inquiryCount}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCrmDate(customer.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/customers/${customer.id}`}>View</Link>
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
