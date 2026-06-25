"use client";

import { useFormStatus } from "react-dom";
import type { ReactElement } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  onClick,
  pendingLabel = "Saving...",
  ...props
}: ConfirmSubmitButtonProps): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      aria-disabled={pending || props.disabled}
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
