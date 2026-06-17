"use client";

import { useEffect } from "react";
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

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): ReactElement {
  useEffect(() => {
    // Surface unexpected runtime failures in development without exposing details in the UI.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-xl border-border/70">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              The foundation is in place, but this route hit an unexpected error.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
