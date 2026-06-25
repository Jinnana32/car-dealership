import Image from "next/image";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type BrandSignatureProps = {
  className?: string;
  logoClassName?: string;
  logoSrc: string | null;
  showSubtitle?: boolean;
  subtitleClassName?: string;
  titleClassName?: string;
};

export function BrandSignature({
  className,
  logoClassName,
  logoSrc,
  showSubtitle = true,
  subtitleClassName,
  titleClassName,
}: BrandSignatureProps): ReactElement {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {logoSrc ? (
        <Image
          alt="Best Wheels"
          className={cn("block object-contain object-left", logoClassName)}
          height={60}
          priority
          sizes="204px"
          src={logoSrc}
          width={272}
        />
      ) : (
        <div className="min-w-0">
          <p
            className={cn(
              "text-lg font-semibold tracking-tight text-foreground",
              titleClassName,
            )}
          >
            Best Wheels
          </p>
          {showSubtitle ? (
            <p
              className={cn(
                "text-xs uppercase tracking-[0.22em] text-muted-foreground",
                subtitleClassName,
              )}
            >
              Car Display
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
