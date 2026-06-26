"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatMoneyInput,
  parseMoneyInput,
  sanitizeMoneyInput,
} from "@/lib/money";

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "inputMode" | "onChange" | "type" | "value"
> & {
  allowDecimals?: boolean;
  defaultValue?: string | number | null;
  onValueChange?: (displayValue: string, numericValue: number | null) => void;
  value?: string;
};

function getCommittedDisplayValue(
  value: string | number | null | undefined,
  allowDecimals: boolean,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return formatMoneyInput(value, { allowDecimals });
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      allowDecimals = false,
      className,
      defaultValue,
      onBlur,
      onFocus,
      onValueChange,
      value: controlledValue,
      ...props
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
      getCommittedDisplayValue(defaultValue, allowDecimals),
    );
    const [focused, setFocused] = React.useState(false);
    const [draftValue, setDraftValue] = React.useState("");

    const committedValue = isControlled
      ? getCommittedDisplayValue(controlledValue, allowDecimals)
      : uncontrolledValue;

    React.useEffect(() => {
      if (!isControlled) {
        setUncontrolledValue(getCommittedDisplayValue(defaultValue, allowDecimals));
      }
    }, [allowDecimals, defaultValue, isControlled]);

    function commitValue(nextValue: string): void {
      const formatted = formatMoneyInput(nextValue, { allowDecimals });

      if (!isControlled) {
        setUncontrolledValue(formatted);
      }

      onValueChange?.(formatted, parseMoneyInput(formatted));
    }

    function handleFocus(event: React.FocusEvent<HTMLInputElement>): void {
      setFocused(true);
      setDraftValue(sanitizeMoneyInput(committedValue, { allowDecimals }));
      onFocus?.(event);
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
      const sanitized = sanitizeMoneyInput(event.target.value, { allowDecimals });
      setDraftValue(sanitized);
      onValueChange?.(sanitized, parseMoneyInput(sanitized));
    }

    function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
      setFocused(false);
      commitValue(draftValue || committedValue);
      onBlur?.(event);
    }

    return (
      <Input
        ref={ref}
        className={cn(className)}
        inputMode={allowDecimals ? "decimal" : "numeric"}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        type="text"
        value={focused ? draftValue : committedValue}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
