"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

type StatusToastProps = {
  message: string | null | undefined;
  variant: "error" | "info" | "success";
};

const toastStyles = {
  error: {
    icon: AlertCircle,
    wrapper: "border-red-200 bg-red-50 text-red-700",
  },
  info: {
    icon: Info,
    wrapper: "border-border bg-white text-foreground",
  },
  success: {
    icon: CheckCircle2,
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
} as const;

export function StatusToast({
  message,
  variant,
}: StatusToastProps): ReactElement | null {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [visible]);

  if (!message || !visible) {
    return null;
  }

  const Icon = toastStyles[variant].icon;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm justify-end">
      <div
        className={cn(
          "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm",
          toastStyles[variant].wrapper,
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
