import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { PublicEmptyState } from "@/features/public/components/public-empty-state";
import { PublicSiteFooter } from "@/features/public/components/public-site-footer";
import { PublicSiteHeader } from "@/features/public/components/public-site-header";
import { VehicleCard } from "@/features/public/components/vehicle-card";
import { getPublicDealershipBySlug, getPublicHomePageData } from "@/features/public/queries";

type DealerPageProps = {
  params: Promise<{
    dealerSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: DealerPageProps): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    return {
      title: "Dealership not found",
    };
  }

  return {
    description: `Browse available vehicles from ${dealership.name}.`,
    title: dealership.name,
  };
}

export default async function DealerPage({
  params,
}: DealerPageProps): Promise<ReactElement> {
  const { dealerSlug } = await params;
  const data = await getPublicHomePageData(dealerSlug);

  if (!data) {
    notFound();
  }

  const { dealership, featuredVehicles } = data;

  return (
    <>
      <PublicSiteHeader currentPage="home" dealership={dealership} />

      <main className="space-y-16 pb-16">
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(225,29,46,0.12),_transparent_36%),linear-gradient(180deg,_#fffdf9_0%,_#f8f3ec_100%)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Available Vehicles
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Find your next vehicle at {dealership.name}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Browse published units, compare specs, and discover vehicles currently available from the dealership inventory.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`/${dealership.slug}/vehicles`}>
                    Browse all vehicles
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button disabled size="lg" variant="outline">
                  Inquire about a vehicle - Coming soon
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Dealership Contact
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {dealership.name}
                  </p>
                </div>

                <div className="space-y-3">
                  {dealership.contact_phone ? (
                    <a
                      className="flex items-center gap-3 rounded-2xl border border-border bg-[#faf8f4] px-4 py-3 text-sm font-medium text-foreground"
                      href={`tel:${dealership.contact_phone}`}
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      {dealership.contact_phone}
                    </a>
                  ) : null}

                  {dealership.contact_email ? (
                    <a
                      className="flex items-center gap-3 rounded-2xl border border-border bg-[#faf8f4] px-4 py-3 text-sm font-medium text-foreground"
                      href={`mailto:${dealership.contact_email}`}
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      {dealership.contact_email}
                    </a>
                  ) : null}

                  {dealership.facebook_page_url ? (
                    <a
                      className="inline-flex text-sm font-semibold text-primary hover:underline"
                      href={dealership.facebook_page_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Visit Facebook Page
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-8 px-4 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Latest arrivals
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Featured inventory
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${dealership.slug}/vehicles`}>View full inventory</Link>
            </Button>
          </div>

          {featuredVehicles.length === 0 ? (
            <PublicEmptyState
              actionHref={`/${dealership.slug}/vehicles`}
              actionLabel="Browse inventory"
              description="Published vehicles will appear here once inventory is available."
              title="No vehicles available right now"
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredVehicles.map((vehicle) => (
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
