import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InquiryNotFoundState(): ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl rounded-[24px] border-border bg-white shadow-none">
        <CardHeader>
          <CardTitle>Inquiry not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The inquiry you are looking for is not available.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/pipeline?view=list">Back to pipeline</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
