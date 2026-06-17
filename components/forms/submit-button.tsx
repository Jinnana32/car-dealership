"use client";

import { useFormStatus } from "react-dom";
import type { ReactElement } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  ...props
}: SubmitButtonProps): ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button {...props} aria-disabled={pending} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

