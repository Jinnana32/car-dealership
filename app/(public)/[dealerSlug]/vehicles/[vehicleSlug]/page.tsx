import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircleMore, Phone } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { getPublicMessengerCtaConfig } from "@/features/facebook/queries";
import { PublicVehicleInquiryForm } from "@/features/inquiries/components/public-vehicle-inquiry-form";
import { PublicEmptyState } from "@/features/public/components/public-empty-state";
import { PublicSiteFooter } from "@/features/public/components/public-site-footer";
import { PublicSiteHeader } from "@/features/public/components/public-site-header";
import { VehicleGallery } from "@/features/public/components/vehicle-gallery";
import { VehiclePrice } from "@/features/public/components/vehicle-price";
import { VehicleSpecs } from "@/features/public/components/vehicle-specs";
import {
  getPublicDealershipBySlug,
  getPublicVehicleDetailData,
} from "@/features/public/queries";

type PublicVehicleDetailPageProps = {
  params: Promise<{
    dealerSlug: string;
    vehicleSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicVehicleDetailPageProps): Promise<Metadata> {
  const { dealerSlug, vehicleSlug } = await params;
  const record = await getPublicVehicleDetailData(dealerSlug, vehicleSlug);

  if (!record) {
    return {
      title: "Vehicle not found",
    };
  }

  const priceText = record.vehicle.price
    ? ` - ${new Intl.NumberFormat("en-PH", {
        currency: "PHP",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(record.vehicle.price)}`
    : "";

  return {
    description:
      record.vehicle.description ||
      `${record.vehicle.year ?? ""} ${record.vehicle.brand} ${record.vehicle.model}${priceText} from ${record.dealership.name}.`.trim(),
    title: `${record.vehicle.title} | ${record.dealership.name}`,
  };
}

export default async function PublicVehicleDetailPage({
  params,
}: PublicVehicleDetailPageProps): Promise<ReactElement> {
  const { dealerSlug, vehicleSlug } = await params;
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    notFound();
  }

  const record = await getPublicVehicleDetailData(dealerSlug, vehicleSlug);

  if (!record) {
    return (
      <>
        <PublicSiteHeader currentPage="vehicles" dealership={dealership} />
        <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <PublicEmptyState
            actionHref={`/${dealership.slug}/vehicles`}
            actionLabel="Back to inventory"
            description="The vehicle you are looking for is not available or is no longer published."
            title="Vehicle not found"
          />
        </main>
        <PublicSiteFooter dealership={dealership} />
      </>
    );
  }

  const { media, vehicle } = record;
  const messengerCta = await getPublicMessengerCtaConfig({
    dealerSlug: dealership.slug,
    dealershipId: dealership.id,
    vehicleSlug: vehicle.slug,
  });

  return (
    <>
      <PublicSiteHeader currentPage="vehicles" dealership={dealership} />

      <main className="space-y-10 pb-16">
        <section className="border-b border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
            <Button asChild variant="ghost">
              <Link href={`/${dealership.slug}/vehicles`}>
                <ArrowLeft className="h-4 w-4" />
                Back to inventory
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.3fr)_380px]">
            <div className="space-y-8">
              <VehicleGallery media={media} title={vehicle.title} />

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  {vehicle.brand} · {vehicle.model}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  {vehicle.title}
                </h1>
                <VehiclePrice price={vehicle.price} size="detail" vehicle={vehicle} />
              </div>

              <VehicleSpecs vehicle={vehicle} />

              <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Description
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {vehicle.description || "No description available yet."}
                </p>
              </section>
            </div>

            <aside className="space-y-6">
              <PublicVehicleInquiryForm
                dealerSlug={dealership.slug}
                vehicleSlug={vehicle.slug}
              />

              <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Contact {dealership.name}
                </h2>
                <div className="mt-5 space-y-3">
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
                </div>
              </section>

              <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  More options
                </h2>
                <div className="mt-5 space-y-3">
                  {messengerCta ? (
                    <Button asChild className="w-full justify-start" size="lg" variant="outline">
                      <a href={messengerCta.href} rel="noreferrer" target="_blank">
                        <MessageCircleMore className="h-4 w-4" />
                        Message us on Messenger
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full justify-start"
                      disabled
                      size="lg"
                      variant="outline"
                    >
                      <MessageCircleMore className="h-4 w-4" />
                      Message us on Messenger
                    </Button>
                  )}
                  <Button className="w-full justify-start" disabled size="lg" variant="outline">
                    Download Brochure - Coming soon
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicSiteFooter dealership={dealership} />
    </>
  );
}
