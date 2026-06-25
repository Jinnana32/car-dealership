"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SheetProps = {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function Sheet({ children, onOpenChange, open }: SheetProps): ReactElement | null {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || !mounted) {
    return null;
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleOverlayClick}
      />
      <div className="relative flex h-full w-full justify-end">{children}</div>
    </div>,
    document.body,
  );
}

type SheetContentProps = {
  children: ReactNode;
  className?: string;
};

export function SheetContent({
  children,
  className,
}: SheetContentProps): ReactElement {
  return (
    <div
      className={cn(
        "relative ml-auto flex h-full w-full max-w-3xl shrink-0 flex-col overflow-hidden border-l border-border bg-white shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

type SheetHeaderProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
};

export function SheetHeader({
  actions,
  children,
  className,
  onClose,
}: SheetHeaderProps): ReactElement {
  return (
    <div className={cn("shrink-0 border-b border-border px-5 py-4", className)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          {children}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {onClose ? (
          <Button
            className="shrink-0"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close panel</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type SheetBodyProps = {
  children: ReactNode;
  className?: string;
};

export function SheetBody({ children, className }: SheetBodyProps): ReactElement {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", className)}>
      {children}
    </div>
  );
}
