"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FacebookPublishPreparedContent } from "@/features/facebook/types";
import { buildFacebookPublishReadiness } from "@/features/facebook/utils";
import type { Vehicle } from "@/features/vehicles/types";

type VehicleFacebookPublisherProps = {
  canPublish: boolean;
  facebookPageConfigured: boolean;
  generatedContentOptions: FacebookPublishPreparedContent[];
  hasFeaturedImage: boolean;
  hasPageAccessToken: boolean;
  hasSiteUrl: boolean;
  initialCaption: string;
  initialGeneratedContentId: string;
  publicVehicleUrl: string | null;
  publishAction: (formData: FormData) => Promise<void>;
  redirectPath: string;
  vehicle: Vehicle;
};

export function VehicleFacebookPublisher({
  canPublish,
  facebookPageConfigured,
  generatedContentOptions,
  hasFeaturedImage,
  hasPageAccessToken,
  hasSiteUrl,
  initialCaption,
  initialGeneratedContentId,
  publicVehicleUrl,
  publishAction,
  redirectPath,
  vehicle,
}: VehicleFacebookPublisherProps): ReactElement {
  const [selectedContentId, setSelectedContentId] = useState(initialGeneratedContentId);
  const [caption, setCaption] = useState(initialCaption);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const selectedPublishType = "text_link_post";
  const selectedContent = useMemo(
    () =>
      generatedContentOptions.find((item) => item.id === selectedContentId) ?? null,
    [generatedContentOptions, selectedContentId],
  );
  const readinessItems = useMemo(
    () =>
      buildFacebookPublishReadiness({
        caption,
        facebookPageConfigured,
        hasFeaturedImage,
        hasPageAccessToken,
        hasSiteUrl,
        publicVehicleUrl,
        publishType: selectedPublishType,
        vehicle,
      }),
    [
      caption,
      facebookPageConfigured,
      hasFeaturedImage,
      hasPageAccessToken,
      hasSiteUrl,
      publicVehicleUrl,
      selectedPublishType,
      vehicle,
    ],
  );
  const passedCount = readinessItems.filter((item) => item.passed).length;
  const failedItems = readinessItems.filter((item) => !item.passed);
  const isPublishReady = failedItems.length === 0;

  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Publish to Facebook Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!canPublish ? (
          <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
            Only owners and admins can publish to the Facebook Page.
          </div>
        ) : null}

        <form action={publishAction} className="space-y-5">
          <input name="redirect_to" type="hidden" value={redirectPath} />
          <input name="generated_content_id" type="hidden" value={selectedContentId} />
          <input name="publish_type" type="hidden" value={selectedPublishType} />
          <input name="vehicle_id" type="hidden" value={vehicle.id} />

          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="generated_content_picker">Saved caption</Label>
              <Select
                id="generated_content_picker"
                onChange={(event) => {
                  const nextId = event.target.value;

                  setSelectedContentId(nextId);

                  if (!nextId) {
                    return;
                  }

                  const nextContent = generatedContentOptions.find(
                    (item) => item.id === nextId,
                  );

                  if (nextContent) {
                    setCaption(nextContent.content);
                  }
                }}
                value={selectedContentId}
              >
                <option value="">Write caption manually</option>
                {generatedContentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                name="caption"
                onChange={(event) => setCaption(event.target.value)}
                rows={10}
                value={caption}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[#fafaf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Post preview
            </p>
            <div className="mt-3 space-y-3">
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {caption.trim() || "Caption preview will appear here."}
              </p>
              {publicVehicleUrl ? (
                <div className="rounded-xl border border-border bg-white px-3 py-3 text-sm text-primary">
                  {publicVehicleUrl}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                  Set `NEXT_PUBLIC_SITE_URL` to generate the public vehicle URL.
                </div>
              )}
              {selectedContent ? (
                <p className="text-xs text-muted-foreground">
                  Source: {selectedContent.label}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className={
              isPublishReady
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            }
          >
            <p className="font-semibold">
              Publish readiness: {passedCount}/{readinessItems.length}
            </p>
            {!isPublishReady ? (
              <p className="mt-1">
                Blocked by: {failedItems.map((item) => item.label).join(", ")}.
              </p>
            ) : (
              <p className="mt-1">Ready to publish as a text + link post.</p>
            )}
          </div>

          {failedItems.length > 0 ? (
            <details className="rounded-2xl border border-border bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                View publish checks
              </summary>
              <ul className="mt-3 space-y-2">
                {readinessItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground">{item.label}</span>
                    <span className={item.passed ? "text-emerald-700" : "text-red-700"}>
                      {item.passed ? "Ready" : item.detail ?? "Missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div className="flex items-start gap-3 rounded-2xl border border-border bg-[#fafaf9] px-4 py-3">
            <input
              checked={confirmChecked}
              className="mt-1 h-4 w-4 rounded border-border"
              id="confirm_publish"
              name="confirm_publish"
              onChange={(event) => setConfirmChecked(event.target.checked)}
              type="checkbox"
              value="true"
            />
            <Label
              className="space-y-1 text-sm font-normal leading-6"
              htmlFor="confirm_publish"
            >
              <span className="font-medium text-foreground">
                I understand this will publish the current caption to the dealership Facebook
                Page.
              </span>
              <span className="block text-muted-foreground">
                Publishing is explicit and will create a publication history record.
              </span>
            </Label>
          </div>

          <ConfirmSubmitButton
            confirmMessage="Publish this vehicle to the dealership Facebook Page?"
            disabled={!canPublish || !confirmChecked || !isPublishReady}
            pendingLabel="Publishing..."
            type="submit"
          >
            Publish to Facebook
          </ConfirmSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
