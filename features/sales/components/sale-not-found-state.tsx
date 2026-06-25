import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SaleNotFoundState(): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl rounded-[24px] border-border bg-white shadow-none">
        <CardHeader>
          <CardTitle>Sale not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The sale you are looking for is not available or you do not have access to it.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/sales">Back to sales</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
