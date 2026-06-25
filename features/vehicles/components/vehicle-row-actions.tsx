"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { archiveVehicle } from "@/features/vehicles/actions";

type VehicleRowActionsProps = {
  canManage: boolean;
  vehicleId: string;
};

export function VehicleRowActions({
  canManage,
  vehicleId,
}: VehicleRowActionsProps): ReactElement {
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

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Vehicle actions"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        size="icon"
        type="button"
        variant="ghost"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-border bg-white p-1 shadow-lg"
          role="menu"
        >
          <Link
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            href={`/admin/vehicles/${vehicleId}`}
            onClick={(event) => event.stopPropagation()}
            role="menuitem"
          >
            View details
          </Link>

          {canManage ? (
            <>
              <Link
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
                href={`/admin/vehicles/${vehicleId}/edit`}
                onClick={(event) => event.stopPropagation()}
                role="menuitem"
              >
                Edit vehicle
              </Link>

              <form
                action={archiveVehicle}
                className="border-t border-border/70 pt-1"
                onClick={(event) => event.stopPropagation()}
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
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
