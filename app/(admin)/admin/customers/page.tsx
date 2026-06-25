import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusToast } from "@/components/ui/status-toast";
import { CustomerEmptyState } from "@/features/customers/components/customer-empty-state";
import { CustomerListTable } from "@/features/customers/components/customer-list-table";
import { getCustomersList } from "@/features/customers/queries";
import { getAdminAccessContext } from "@/lib/auth/session";

type CustomersPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    search?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getCustomersList(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Customers"
        actions={
          <Button asChild>
            <Link href="/admin/leads/new">Add Lead</Link>
          </Button>
        }
      >
        <form className="flex flex-col gap-3 rounded-[20px] border border-border bg-white p-4 lg:flex-row lg:items-center">
          <Input
            defaultValue={result.filters.search}
            name="search"
            placeholder="Search customer name, phone, or email"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/customers">Reset</Link>
            </Button>
          </div>
        </form>

        {result.customers.length === 0 ? (
          <CustomerEmptyState />
        ) : (
          <>
            <CustomerListTable customers={result.customers} />
            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.customers.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
