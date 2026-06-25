"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ReactElement } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type CopyToClipboardButtonProps = Omit<ButtonProps, "onClick"> & {
  copiedLabel?: string;
  text: string;
};

export function CopyToClipboardButton({
  children,
  copiedLabel = "Copied",
  text,
  ...props
}: CopyToClipboardButtonProps): ReactElement {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  return (
    <Button
      {...props}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      type="button"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : children}
    </Button>
  );
}
