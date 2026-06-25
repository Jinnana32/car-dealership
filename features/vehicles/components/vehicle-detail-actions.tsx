"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { archiveVehicle } from "@/features/vehicles/actions";

type VehicleDetailActionsProps = {
  canManage: boolean;
  vehicleId: string;
};

export function VehicleDetailActions({
  canManage,
  vehicleId,
}: VehicleDetailActionsProps): ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!canManage) {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline">
        <Link href={`/admin/vehicles/${vehicleId}/edit`}>Edit Vehicle</Link>
      </Button>

      <div ref={containerRef} className="relative">
        <Button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More vehicle actions"
          onClick={() => setOpen((current) => !current)}
          size="icon"
          type="button"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {open ? (
          <div
            className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-xl border border-border bg-white p-1 shadow-lg"
            role="menu"
          >
            <form
              action={archiveVehicle}
            >
              <input name="redirect_to" type="hidden" value="/admin/vehicles" />
              <input name="vehicle_id" type="hidden" value={vehicleId} />
              <ConfirmSubmitButton
                className="h-auto w-full justify-start rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                confirmMessage="Archive this vehicle?"
                onClick={() => setOpen(false)}
                type="submit"
                variant="ghost"
              >
                Archive vehicle
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
