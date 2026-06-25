"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import type { PublicVehicleMedia } from "@/features/public/types";
import { cn } from "@/lib/utils";

type VehicleGalleryProps = {
  title: string;
  media: PublicVehicleMedia[];
};

export function VehicleGallery({
  media,
  title,
}: VehicleGalleryProps): ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedMedia = media[selectedIndex] ?? null;

  return (
    <div className="space-y-4">
      <VehicleImage
        alt={selectedMedia?.altText ?? title}
        className="aspect-[16/10] w-full"
        src={selectedMedia?.signedUrl ?? null}
      />

      {media.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {media.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                "overflow-hidden rounded-2xl border transition-colors",
                index === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/40",
              )}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <VehicleImage
                alt={item.altText ?? `${title} photo ${index + 1}`}
                className="aspect-square w-full rounded-none border-0"
                src={item.signedUrl}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
