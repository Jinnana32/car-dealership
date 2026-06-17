import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageContentProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  tabs?: ReactNode;
  title: string;
};

export function PageContent({
  actions,
  children,
  className,
  description,
  tabs,
  title,
}: PageContentProps): ReactElement {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-4 border-b border-border pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {tabs ? <div className="flex flex-wrap items-center gap-2">{tabs}</div> : null}
      </div>

      {children}
    </div>
  );
}
