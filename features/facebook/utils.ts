import {
  FACEBOOK_CONNECTION_STATUS_LABELS,
  FACEBOOK_GENERATED_CONTENT_LABELS,
  FACEBOOK_LEAD_STATUS_LABELS,
  FACEBOOK_MESSENGER_CONVERSATION_STATUS_LABELS,
  FACEBOOK_PUBLICATION_STATUS_LABELS,
  FACEBOOK_PUBLISH_TYPE_LABELS,
} from "@/features/facebook/constants";
import type {
  FacebookConnectionStatus,
  FacebookGeneratedContentType,
  FacebookLeadStatus,
  FacebookMessengerConversationStatus,
  FacebookPublicationStatus,
  FacebookPublishReadinessItem,
  FacebookPublishType,
  FacebookReadinessItem,
} from "@/features/facebook/types";
import type { Vehicle } from "@/features/vehicles/types";
import { buildVehicleTitle } from "@/features/vehicles/utils";

export function getFacebookConnectionStatusLabel(
  status: FacebookConnectionStatus,
): string {
  return FACEBOOK_CONNECTION_STATUS_LABELS[status];
}

export function getFacebookGeneratedContentLabel(
  contentType: FacebookGeneratedContentType,
): string {
  return FACEBOOK_GENERATED_CONTENT_LABELS[contentType];
}

export function getFacebookPublishTypeLabel(
  publishType: FacebookPublishType,
): string {
  return FACEBOOK_PUBLISH_TYPE_LABELS[publishType];
}

export function getFacebookPublicationStatusLabel(
  status: FacebookPublicationStatus,
): string {
  return FACEBOOK_PUBLICATION_STATUS_LABELS[status];
}

export function getFacebookMessengerConversationStatusLabel(
  status: FacebookMessengerConversationStatus,
): string {
  return FACEBOOK_MESSENGER_CONVERSATION_STATUS_LABELS[status];
}

export function getFacebookLeadStatusLabel(status: FacebookLeadStatus): string {
  return FACEBOOK_LEAD_STATUS_LABELS[status];
}

export function buildPublicVehiclePath(
  dealerSlug: string,
  vehicleSlug: string,
): string {
  return `/${dealerSlug}/vehicles/${vehicleSlug}`;
}

export function buildAbsolutePublicVehicleUrl(input: {
  dealerSlug: string;
  siteUrl: string;
  vehicleSlug: string;
}): string {
  const siteUrl = input.siteUrl.replace(/\/+$/, "");

  return `${siteUrl}${buildPublicVehiclePath(input.dealerSlug, input.vehicleSlug)}`;
}

export function buildFacebookPostUrl(input: {
  facebookPhotoId: string | null;
  facebookPostId: string | null;
}): string | null {
  if (input.facebookPostId) {
    return `https://www.facebook.com/${input.facebookPostId}`;
  }

  if (input.facebookPhotoId) {
    return `https://www.facebook.com/photo/?fbid=${input.facebookPhotoId}`;
  }

  return null;
}

export function buildMessengerRef(vehicleSlug: string): string {
  return `vehicle_${vehicleSlug}`;
}

export function buildMessengerLink(input: {
  messengerPageIdentifier: string;
  vehicleSlug: string;
}): string {
  const ref = buildMessengerRef(input.vehicleSlug);

  return `https://m.me/${encodeURIComponent(input.messengerPageIdentifier)}?ref=${encodeURIComponent(ref)}`;
}

export function normalizeFacebookConnectionStatus(input: {
  messengerPageIdentifier: string | null;
  pageName: string | null;
  status: FacebookConnectionStatus;
}): FacebookConnectionStatus {
  const hasRequiredFields =
    Boolean(input.pageName?.trim()) &&
    Boolean(input.messengerPageIdentifier?.trim());

  if (!hasRequiredFields) {
    return input.status === "error" ? "error" : "not_connected";
  }

  if (input.status === "connected" || input.status === "error") {
    return input.status;
  }

  return "configured";
}

export function buildVehicleFacebookReadiness(input: {
  dealershipSlug: string;
  hasFeaturedImage: boolean;
  messengerConfigured: boolean;
  vehicle: Vehicle;
}): FacebookReadinessItem[] {
  const publicVehiclePath = buildPublicVehiclePath(
    input.dealershipSlug,
    input.vehicle.slug,
  );

  return [
    {
      key: "title",
      label: "Has title",
      passed: Boolean(input.vehicle.title.trim()),
    },
    {
      key: "price",
      label: "Has cash price or financing",
      passed:
        input.vehicle.price !== null ||
        (input.vehicle.financing_enabled &&
          (input.vehicle.financing_down_payment !== null ||
            Boolean(input.vehicle.financing_notes?.trim()))),
    },
    {
      key: "vehicle_core",
      label: "Has year, brand, and model",
      passed: Boolean(input.vehicle.year && input.vehicle.brand && input.vehicle.model),
    },
    {
      key: "mileage",
      label: "Has mileage",
      passed: input.vehicle.mileage !== null,
    },
    {
      key: "transmission",
      label: "Has transmission",
      passed: Boolean(input.vehicle.transmission?.trim()),
    },
    {
      key: "fuel_type",
      label: "Has fuel type",
      passed: Boolean(input.vehicle.fuel_type?.trim()),
    },
    {
      key: "description",
      label: "Has description",
      passed: Boolean(input.vehicle.description?.trim()),
    },
    {
      key: "featured_image",
      label: "Has featured image",
      passed: input.hasFeaturedImage,
    },
    {
      key: "published",
      label: "Is published",
      passed: input.vehicle.status === "published",
    },
    {
      key: "available",
      label: "Is available",
      passed: input.vehicle.availability === "available",
    },
    {
      detail: publicVehiclePath,
      key: "public_vehicle_url",
      label: "Has public vehicle URL",
      passed: Boolean(input.dealershipSlug && input.vehicle.slug),
    },
    {
      detail: input.messengerConfigured
        ? undefined
        : "Add a Messenger page identifier in Facebook settings.",
      key: "messenger_configured",
      label: "Messenger is configured",
      passed: input.messengerConfigured,
    },
  ];
}

export function buildAdHeadline(input: { vehicle: Vehicle }): string {
  const heading = [input.vehicle.year, input.vehicle.brand, input.vehicle.model]
    .filter(Boolean)
    .join(" ");

  return `${heading || buildVehicleTitle(input.vehicle)} Available`;
}

export function buildFacebookPublishReadiness(input: {
  caption: string | null;
  facebookPageConfigured: boolean;
  hasFeaturedImage: boolean;
  hasPageAccessToken: boolean;
  hasSiteUrl: boolean;
  publicVehicleUrl: string | null;
  publishType: FacebookPublishType;
  vehicle: Vehicle;
}): FacebookPublishReadinessItem[] {
  const baseReadiness: FacebookPublishReadinessItem[] = [
    {
      key: "vehicle_published",
      label: "Vehicle is published",
      passed: input.vehicle.status === "published",
    },
    {
      key: "vehicle_available",
      label: "Vehicle is available",
      passed: input.vehicle.availability === "available",
    },
    {
      key: "vehicle_title",
      label: "Vehicle has title",
      passed: Boolean(input.vehicle.title.trim()),
    },
    {
      key: "vehicle_price",
      label: "Vehicle has cash price or financing",
      passed:
        input.vehicle.price !== null ||
        (input.vehicle.financing_enabled &&
          (input.vehicle.financing_down_payment !== null ||
            Boolean(input.vehicle.financing_notes?.trim()))),
    },
    {
      detail: input.publicVehicleUrl ?? "Set NEXT_PUBLIC_SITE_URL to generate a public link.",
      key: "public_vehicle_url",
      label: "Vehicle has public URL",
      passed: Boolean(input.publicVehicleUrl),
    },
    {
      key: "facebook_page_configured",
      label: "Facebook Page is configured",
      passed: input.facebookPageConfigured,
    },
    {
      key: "page_access_token",
      label: "Page access token exists server-side",
      passed: input.hasPageAccessToken,
    },
    {
      key: "site_url",
      label: "NEXT_PUBLIC_SITE_URL exists",
      passed: input.hasSiteUrl,
    },
    {
      key: "caption_exists",
      label: "Caption exists",
      passed: Boolean(input.caption?.trim() && input.caption.trim().length >= 5),
    },
  ];

  if (input.publishType === "photo_post") {
    baseReadiness.push(
      {
        key: "featured_image_exists",
        label: "Featured image exists",
        passed: input.hasFeaturedImage,
      },
      {
        detail: input.hasFeaturedImage
          ? "Photo publishing is not enabled in this environment yet."
          : "Add a featured image before publishing a photo post.",
        key: "featured_image_publicly_accessible",
        label: "Featured image URL is publicly accessible",
        passed: false,
      },
    );
  }

  return baseReadiness;
}
