import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesEmptyState(): ReactElement {
  return (
    <Card className="rounded-[20px] border-border bg-white shadow-none">
      <CardHeader>
        <CardTitle>No closed deals yet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Record a won deal from the pipeline or a vehicle sales tab to start building
          your sales ledger.
        </p>
        <Button asChild>
          <Link href="/admin/pipeline?view=list">Open pipeline</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
