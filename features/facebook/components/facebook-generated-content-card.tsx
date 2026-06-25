import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CopyToClipboardButton } from "@/features/facebook/components/copy-to-clipboard-button";
import { formatVehicleDateTime } from "@/features/vehicles/utils";

type FacebookGeneratedContentCardProps = {
  canGenerate: boolean;
  content: string | null;
  createdAt: string | null;
  generateAction: (formData: FormData) => Promise<void>;
  title: string;
  vehicleId: string;
  redirectPath: string;
};

export function FacebookGeneratedContentCard({
  canGenerate,
  content,
  createdAt,
  generateAction,
  redirectPath,
  title,
  vehicleId,
}: FacebookGeneratedContentCardProps): ReactElement {
  const hasContent = Boolean(content?.trim());

  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {createdAt
            ? `Saved ${formatVehicleDateTime(createdAt)}`
            : "No generated content saved yet."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          readOnly
          value={content ?? ""}
          rows={7}
          placeholder="Generate content to save a Facebook-ready draft."
        />

        <div className="flex flex-wrap gap-2">
          {canGenerate ? (
            <form action={generateAction}>
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
            text={content ?? ""}
            variant="outline"
          >
            Copy
          </CopyToClipboardButton>

          {!canGenerate ? (
            <div className="rounded-full border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              Your role can view saved Facebook content.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
