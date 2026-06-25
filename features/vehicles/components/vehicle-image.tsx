import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type VehicleImageProps = {
  alt: string;
  className?: string;
  imageClassName?: string;
  src: string | null;
};

export function VehicleImage({
  alt,
  className,
  imageClassName,
  src,
}: VehicleImageProps): ReactElement {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#fafaf9]",
        className,
      )}
    >
      {src ? (
        <Image
          alt={alt}
          className={cn("object-cover", imageClassName)}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          src={src}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-[0.16em]">
            No photo
          </span>
        </div>
      )}
    </div>
  );
}
