import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DealerNotFound(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl rounded-[24px] border-border bg-white shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle>Dealership not found</CardTitle>
          <CardDescription>
            The dealership you are looking for is not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/login">Back to admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
