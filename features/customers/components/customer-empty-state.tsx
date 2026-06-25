import Link from "next/link";
import { UsersRound } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

export function CustomerEmptyState(): ReactElement {
  return (
    <div className="rounded-[20px] border border-border bg-white px-6 py-14">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UsersRound className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No customers yet</p>
          <p className="text-sm text-muted-foreground">
            Add a lead to start building your customer list.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/leads/new">Add Lead</Link>
        </Button>
      </div>
    </div>
  );
}
