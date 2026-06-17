import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

type VehiclesPageProps = {
  params: Promise<{
    dealerSlug: string;
  }>;
};

export default async function VehiclesPage({
  params,
}: VehiclesPageProps): Promise<ReactElement> {
  const { dealerSlug } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-col gap-6 rounded-[28px] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-border bg-background">
              Inventory
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
              Vehicle listings
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Available vehicles will appear here once the dealership starts publishing inventory.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${dealerSlug}/vehicles/sample-sedan`}>
              View sample vehicle
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            "Featured inventory",
            "Vehicle details",
            "Contact options",
          ].map((item) => (
            <Card key={item} className="border-border bg-background shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{item}</CardTitle>
                <CardDescription>Available soon</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
                Listings and details will appear here when inventory is ready.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
