import Link from "next/link";
import { SearchX } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VehicleNotFoundState(): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl rounded-[20px] border-border bg-white shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SearchX className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <CardTitle>Vehicle not found</CardTitle>
            <p className="text-sm text-muted-foreground">
              This vehicle record is not available for the current dealership.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/vehicles">Back to vehicles</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
