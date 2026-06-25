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
import { formatCrmDateTime } from "@/features/inquiries/utils";
import type { VehicleSaleRecord } from "@/features/sales/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type SalesListTableProps = {
  sales: VehicleSaleRecord[];
};

export function SalesListTable({ sales }: SalesListTableProps): ReactElement {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Sold date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Sold price</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Recorded by</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="text-muted-foreground">
                {formatCrmDateTime(sale.sold_at)}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {sale.vehicle?.title ?? "Not linked"}
              </TableCell>
              <TableCell>{sale.customer?.full_name ?? "Not linked"}</TableCell>
              <TableCell>
                {sale.inquiry?.source_type ? (
                  <InquirySourceBadge sourceType={sale.inquiry.source_type} />
                ) : (
                  <span className="text-muted-foreground">Not linked</span>
                )}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {formatVehicleCurrency(sale.sold_price)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getVehicleSalePaymentTypeLabel(sale.payment_type)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sale.createdByName ?? "Team member"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/sales/${sale.id}`}>View</Link>
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
