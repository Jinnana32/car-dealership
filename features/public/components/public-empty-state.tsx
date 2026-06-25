import Link from "next/link";
import { CarFront } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

type PublicEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
};

export function PublicEmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: PublicEmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-border bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CarFront className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
