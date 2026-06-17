import Link from "next/link";
import type { ReactElement } from "react";
import { ShieldAlert } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UnauthorizedStateProps = {
  description: string;
  title: string;
};

export function UnauthorizedState({
  description,
  title,
}: UnauthorizedStateProps): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f4] px-4 py-10">
      <Card className="w-full max-w-xl border-border bg-white shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="max-w-lg leading-6">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/login">Back to login</Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit">Log out</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
