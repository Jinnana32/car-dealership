import Link from "next/link";
import { ArrowRight, CarFront, MessageSquareMore } from "lucide-react";
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

type DealerPageProps = {
  params: Promise<{
    dealerSlug: string;
  }>;
};

export default async function DealerPage({
  params,
}: DealerPageProps): Promise<ReactElement> {
  const { dealerSlug } = await params;
  const dealerName = dealerSlug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <Badge variant="outline" className="border-border bg-background">
            Inventory coming soon
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
            {dealerName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Explore the dealership inventory, featured units, and contact options in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/${dealerSlug}/vehicles`}>
                Browse inventory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" disabled>
              Contact dealership
            </Button>
          </div>
        </section>

        <Card className="border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>What to expect</CardTitle>
            <CardDescription>
              The public site will show vehicle highlights, inquiry details, and dealership contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 rounded-2xl border border-border bg-background p-4">
              <CarFront className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-foreground">
                Vehicle listings will appear here as soon as inventory is available.
              </p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-border bg-background p-4">
              <MessageSquareMore className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-foreground">
                Inquiry tools and dealership contact options will be shown here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
