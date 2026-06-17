import Link from "next/link";
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

export default function NotFound(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f4] px-4 py-10">
      <Card className="w-full max-w-xl border-border bg-white shadow-sm">
        <CardHeader>
          <Badge variant="outline" className="w-fit border-border bg-background">
            Not found
          </Badge>
          <CardTitle className="mt-2">Page not found</CardTitle>
          <CardDescription>The page you are looking for is not available.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Go to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Open login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
