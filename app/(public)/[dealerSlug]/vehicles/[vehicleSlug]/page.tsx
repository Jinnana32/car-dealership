import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VehicleDetailPageProps = {
  params: Promise<{
    dealerSlug: string;
    vehicleSlug: string;
  }>;
};

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps): Promise<ReactElement> {
  const { dealerSlug, vehicleSlug } = await params;
  const vehicleName = vehicleSlug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <Badge variant="outline" className="border-border bg-background">
            Vehicle details
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
            {vehicleName}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Photos, specifications, pricing, and dealership contact details will be shown here.
          </p>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href={`/${dealerSlug}/vehicles`}>
                <ArrowLeft className="h-4 w-4" />
                Back to inventory
              </Link>
            </Button>
          </div>
        </section>

        <Card className="border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Listing preview</CardTitle>
            <CardDescription>Vehicle information will appear here once this listing is published.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Photo gallery",
              "Vehicle specifications",
              "Inquiry options",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
