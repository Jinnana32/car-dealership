import Link from "next/link";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSingleVehicleBrochure } from "@/features/brochures/actions";
import { BrochureExportStatusBadge } from "@/features/brochures/components/brochure-export-status-badge";
import type { VehicleBrochureSummary } from "@/features/brochures/types";
import { getBrochureExportTypeLabel } from "@/features/brochures/utils";
import {
  generateAdHeadline,
  generateAdPrimaryText,
  generateFacebookCaption,
  generateMarketplaceDescription,
  publishVehicleToFacebookPage,
} from "@/features/facebook/actions";
import { CopyToClipboardButton } from "@/features/facebook/components/copy-to-clipboard-button";
import { FacebookAlternateContentPanel } from "@/features/facebook/components/facebook-alternate-content-panel";
import { FacebookPublishHistoryList } from "@/features/facebook/components/facebook-publish-history-list";
import { VehicleFacebookPublisher } from "@/features/facebook/components/vehicle-facebook-publisher";
import type { VehicleFacebookContext } from "@/features/facebook/types";
import { buildPublicVehiclePath, buildVehicleFacebookReadiness } from "@/features/facebook/utils";
import { VehicleMarketingSettingsForm } from "@/features/vehicles/components/vehicle-marketing-settings-form";
import { VEHICLE_DETAIL_CONTENT_CLASS } from "@/features/vehicles/constants";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";
import { buildVehicleDetailPath, formatVehicleDateTime } from "@/features/vehicles/utils";

type VehicleMarketingTabProps = {
  brochureExports: VehicleBrochureSummary;
  canEditMarketing: boolean;
  canGenerateBrochures: boolean;
  canGenerateFacebookContent: boolean;
  canPublishToFacebook: boolean;
  dealershipSlug: string;
  facebookContext: VehicleFacebookContext;
  media: VehicleMediaWithSignedUrl[];
  vehicle: Vehicle;
};

export function VehicleMarketingTab({
  brochureExports,
  canEditMarketing,
  canGenerateBrochures,
  canGenerateFacebookContent,
  canPublishToFacebook,
  dealershipSlug,
  facebookContext,
  media,
  vehicle,
}: VehicleMarketingTabProps): ReactElement {
  const featuredMedia = media.find((item) => item.is_featured) ?? media[0] ?? null;
  const publicVehiclePath = buildPublicVehiclePath(dealershipSlug, vehicle.slug);
  const readinessItems = buildVehicleFacebookReadiness({
    dealershipSlug,
    hasFeaturedImage: Boolean(featuredMedia),
    messengerConfigured: Boolean(facebookContext.messengerLink),
    vehicle,
  });
  const passedCount = readinessItems.filter((item) => item.passed).length;
  const missingReadinessItems = readinessItems.filter((item) => !item.passed);
  const marketingPath = buildVehicleDetailPath(vehicle.id, "marketing");

  return (
    <div className={VEHICLE_DETAIL_CONTENT_CLASS}>
      {canEditMarketing ? (
        <VehicleMarketingSettingsForm redirectPath={marketingPath} vehicle={vehicle} />
      ) : null}

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Facebook readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={
              missingReadinessItems.length > 0
                ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            }
          >
            <p className="font-semibold">
              {passedCount}/{readinessItems.length} checks ready
            </p>
            {missingReadinessItems.length > 0 ? (
              <p className="mt-1">
                Still needed: {missingReadinessItems.map((item) => item.label).join(", ")}.
              </p>
            ) : (
              <p className="mt-1">This vehicle is ready for Facebook-focused sales workflows.</p>
            )}
          </div>

          {missingReadinessItems.length > 0 ? (
            <details className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                View all readiness checks
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

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={publicVehiclePath} target="_blank">
                Open public listing
              </Link>
            </Button>
            <CopyToClipboardButton
              disabled={!facebookContext.messengerLink}
              size="sm"
              text={facebookContext.messengerLink ?? ""}
              variant="outline"
            >
              Copy Messenger link
            </CopyToClipboardButton>
            {facebookContext.messengerLink ? (
              <Button asChild size="sm" variant="outline">
                <a href={facebookContext.messengerLink} rel="noreferrer" target="_blank">
                  Open Messenger link
                </a>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/facebook/settings">Configure Messenger</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {vehicle.post_location_tag ||
      (vehicle.highlights?.length ?? 0) > 0 ||
      (vehicle.use_cases?.length ?? 0) > 0 ||
      (vehicle.sale_inclusions?.length ?? 0) > 0 ? (
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Vehicle marketing notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle.post_location_tag ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Post location tag
                </p>
                <p className="text-sm text-foreground">{vehicle.post_location_tag}</p>
              </div>
            ) : null}

            {(vehicle.highlights?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.highlights?.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-border bg-[#fafaf9] px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {(vehicle.use_cases?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Use cases</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.use_cases?.map((useCase) => (
                    <span
                      key={useCase}
                      className="rounded-full border border-border bg-[#fafaf9] px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {(vehicle.sale_inclusions?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Sale inclusions</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.sale_inclusions?.map((inclusion) => (
                    <span
                      key={inclusion}
                      className="rounded-full border border-border bg-[#fafaf9] px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      {inclusion}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <VehicleFacebookPublisher
        canPublish={canPublishToFacebook}
        facebookPageConfigured={Boolean(
          facebookContext.connection &&
            facebookContext.resolvedFacebookPageId &&
            (facebookContext.connection.status === "configured" ||
              facebookContext.connection.status === "connected"),
        )}
        generatedContentOptions={facebookContext.generatedContentOptions}
        hasFeaturedImage={Boolean(featuredMedia)}
        hasPageAccessToken={facebookContext.hasPageAccessToken}
        hasSiteUrl={facebookContext.hasSiteUrl}
        initialCaption={
          facebookContext.latestContent.facebook_caption?.content ??
          facebookContext.generatedContentOptions[0]?.content ??
          ""
        }
        initialGeneratedContentId={
          facebookContext.latestContent.facebook_caption?.id ??
          facebookContext.generatedContentOptions[0]?.id ??
          ""
        }
        publicVehicleUrl={facebookContext.publicVehicleUrl}
        publishAction={publishVehicleToFacebookPage}
        redirectPath={marketingPath}
        vehicle={vehicle}
      />

      <FacebookAlternateContentPanel
        items={[
          {
            canGenerate: canGenerateFacebookContent,
            content: facebookContext.latestContent.facebook_caption?.content ?? null,
            createdAt: facebookContext.latestContent.facebook_caption?.created_at ?? null,
            generateAction: generateFacebookCaption,
            title: "Facebook caption",
          },
          {
            canGenerate: canGenerateFacebookContent,
            content: facebookContext.latestContent.marketplace_description?.content ?? null,
            createdAt:
              facebookContext.latestContent.marketplace_description?.created_at ?? null,
            generateAction: generateMarketplaceDescription,
            title: "Marketplace description",
          },
          {
            canGenerate: canGenerateFacebookContent,
            content: facebookContext.latestContent.ad_primary_text?.content ?? null,
            createdAt: facebookContext.latestContent.ad_primary_text?.created_at ?? null,
            generateAction: generateAdPrimaryText,
            title: "Ad primary text",
          },
          {
            canGenerate: canGenerateFacebookContent,
            content: facebookContext.latestContent.ad_headline?.content ?? null,
            createdAt: facebookContext.latestContent.ad_headline?.created_at ?? null,
            generateAction: generateAdHeadline,
            title: "Ad headline",
          },
        ]}
        redirectPath={marketingPath}
        vehicleId={vehicle.id}
      />

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Publish history</CardTitle>
        </CardHeader>
        <CardContent>
          <FacebookPublishHistoryList publications={facebookContext.publications} />
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Brochures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {canGenerateBrochures ? (
              <form action={generateSingleVehicleBrochure}>
                <input name="include_contact_details" type="hidden" value="true" />
                <input name="include_disclaimer" type="hidden" value="true" />
                <input name="include_price" type="hidden" value="true" />
                <input name="include_qr_code" type="hidden" value="true" />
                <input name="redirect_to" type="hidden" value={marketingPath} />
                <input name="vehicle_id" type="hidden" value={vehicle.id} />
                <SubmitButton pendingLabel="Generating..." size="sm" type="submit">
                  Generate brochure
                </SubmitButton>
              </form>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/brochures/new">Multi-vehicle brochure</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/brochures">Brochure history</Link>
            </Button>
          </div>

          {brochureExports.exports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
              No brochure exports for this vehicle yet.
            </div>
          ) : (
            <div className="space-y-2">
              {brochureExports.exports.map((exportRow) => (
                <div
                  key={exportRow.id}
                  className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {exportRow.title || "Untitled brochure"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getBrochureExportTypeLabel(exportRow.export_type)} ·{" "}
                        {exportRow.generated_at
                          ? formatVehicleDateTime(exportRow.generated_at)
                          : formatVehicleDateTime(exportRow.created_at)}
                      </p>
                      {exportRow.error_message ? (
                        <p className="text-xs text-red-700">{exportRow.error_message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BrochureExportStatusBadge status={exportRow.status} />
                      {exportRow.status === "generated" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/api/brochures/${exportRow.id}/download`}>Download</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
