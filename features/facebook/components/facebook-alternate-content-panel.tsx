import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { CopyToClipboardButton } from "@/features/facebook/components/copy-to-clipboard-button";
import { formatVehicleDateTime } from "@/features/vehicles/utils";

type FacebookAlternateContentItem = {
  canGenerate: boolean;
  content: string | null;
  createdAt: string | null;
  generateAction: (formData: FormData) => Promise<void>;
  title: string;
};

type FacebookAlternateContentPanelProps = {
  items: FacebookAlternateContentItem[];
  redirectPath: string;
  vehicleId: string;
};

export function FacebookAlternateContentPanel({
  items,
  redirectPath,
  vehicleId,
}: FacebookAlternateContentPanelProps): ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Other generated content</p>
      <p className="text-sm text-muted-foreground">
        Marketplace, ad, and headline drafts for copy-paste workflows.
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const hasContent = Boolean(item.content?.trim());

          return (
            <details
              key={item.title}
              className="rounded-2xl border border-border bg-white px-4 py-3"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  <span>{item.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {hasContent
                      ? `Saved ${item.createdAt ? formatVehicleDateTime(item.createdAt) : "recently"}`
                      : "Not generated"}
                  </span>
                </span>
              </summary>

              <div className="mt-4 space-y-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {item.content?.trim() || "Generate content to save a draft for this vehicle."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.canGenerate ? (
                    <form action={item.generateAction}>
                      <input name="redirect_to" type="hidden" value={redirectPath} />
                      <input name="vehicle_id" type="hidden" value={vehicleId} />
                      <SubmitButton pendingLabel="Generating..." size="sm" type="submit">
                        {hasContent ? "Regenerate" : "Generate"}
                      </SubmitButton>
                    </form>
                  ) : null}

                  <CopyToClipboardButton
                    disabled={!hasContent}
                    size="sm"
                    text={item.content ?? ""}
                    variant="outline"
                  >
                    Copy
                  </CopyToClipboardButton>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
