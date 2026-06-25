import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

export function PipelineEmptyState(): ReactElement {
  return (
    <div className="rounded-[20px] border border-border bg-white px-6 py-14">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessagesSquare className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No active inquiries yet
          </p>
          <p className="text-sm text-muted-foreground">
            Add a lead to start tracking the dealership pipeline.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/leads/new">Add Lead</Link>
        </Button>
      </div>
    </div>
  );
}
