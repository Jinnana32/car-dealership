import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PublicEmptyState } from "@/features/public/components/public-empty-state";
import { PublicSiteFooter } from "@/features/public/components/public-site-footer";
import { PublicSiteHeader } from "@/features/public/components/public-site-header";
import { VehicleCard } from "@/features/public/components/vehicle-card";
import {
  getPublicDealershipBySlug,
  getPublicVehicleListingPageData,
} from "@/features/public/queries";
import Link from "next/link";

type PublicVehiclesPageProps = {
  params: Promise<{
    dealerSlug: string;
  }>;
  searchParams: Promise<{
    brand?: string | string[];
    maxPrice?: string | string[];
    minPrice?: string | string[];
    model?: string | string[];
    search?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: PublicVehiclesPageProps): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    return {
      title: "Vehicles not found",
    };
  }

  return {
    description: `Browse published available vehicles from ${dealership.name}.`,
    title: `Available Vehicles | ${dealership.name}`,
  };
}

export default async function PublicVehiclesPage({
  params,
  searchParams,
}: PublicVehiclesPageProps): Promise<ReactElement> {
  const { dealerSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getPublicVehicleListingPageData(
    dealerSlug,
    resolvedSearchParams,
  );

  if (!data) {
    notFound();
  }

  const { availableBrands, availableModels, dealership, filters, totalCount, vehicles } =
    data;
  const hasActiveFilters = Boolean(
    filters.brand ||
      filters.model ||
      filters.search ||
      filters.minPrice !== null ||
      filters.maxPrice !== null,
  );

  return (
    <>
      <PublicSiteHeader currentPage="vehicles" dealership={dealership} />

      <main className="space-y-10 pb-16">
        <section className="border-b border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Inventory
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Available Vehicles
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Search the latest published vehicles currently available from {dealership.name}.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-6 px-4 md:px-6">
          <form className="grid gap-3 rounded-[24px] border border-border bg-white p-4 lg:grid-cols-[1.6fr_1fr_1fr_0.9fr_0.9fr_auto] lg:items-center">
            <Input
              defaultValue={filters.search}
              name="search"
              placeholder="Search title, brand, or model"
            />

            <Select defaultValue={filters.brand} name="brand">
              <option value="">All brands</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>

            <Select defaultValue={filters.model} name="model">
              <option value="">All models</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </Select>

            <Input
              defaultValue={filters.minPrice ?? ""}
              inputMode="numeric"
              name="minPrice"
              placeholder="Min price"
            />

            <Input
              defaultValue={filters.maxPrice ?? ""}
              inputMode="numeric"
              name="maxPrice"
              placeholder="Max price"
            />

            <div className="flex gap-2">
              <Button type="submit" variant="outline">
                Apply
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/${dealership.slug}/vehicles`}>Reset</Link>
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {vehicles.length} of {totalCount} available vehicles
            </p>
            <p className="text-sm text-muted-foreground">
              Filters: {filters.brand || "All brands"} · {filters.model || "All models"}
            </p>
          </div>

          {vehicles.length === 0 ? (
            <PublicEmptyState
              actionHref={hasActiveFilters ? `/${dealership.slug}/vehicles` : undefined}
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              description={
                hasActiveFilters
                  ? "Try adjusting your search or filters to find another vehicle."
                  : "Published vehicles will appear here once the dealership inventory is available."
              }
              title={
                hasActiveFilters
                  ? "No matching vehicles"
                  : "No vehicles available right now"
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  dealerSlug={dealership.slug}
                  vehicle={vehicle}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicSiteFooter dealership={dealership} />
    </>
  );
}
