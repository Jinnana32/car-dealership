"use server";

import { revalidatePath } from "next/cache";

import {
  canCreateFacebookContent,
  canManageFacebookSettings,
  canPublishToFacebookPage,
} from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import { redirectWithMessage } from "@/lib/redirect";
import {
  publishPagePhotoPost,
  publishPageTextPost,
  sanitizeFacebookRequestPayload,
  sanitizeFacebookResponsePayload,
} from "@/lib/facebook/server";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFacebookConnection,
  getFacebookPublishReadiness,
} from "@/features/facebook/queries";
import {
  buildAdPrimaryText,
  buildFacebookCaption,
  buildMarketplaceDescription,
  buildVehiclePostDefaults,
} from "@/features/facebook/post-composer";
import {
  buildAdHeadline,
  buildMessengerLink,
  buildPublicVehiclePath,
  normalizeFacebookConnectionStatus,
} from "@/features/facebook/utils";
import type {
  FacebookApiLogInsert,
  FacebookConnectionInsert,
  FacebookGeneratedContentInsert,
  FacebookGeneratedContentType,
  FacebookPostPublication,
  FacebookPostPublicationInsert,
  FacebookPostPublicationUpdate,
} from "@/features/facebook/types";
import type { Vehicle } from "@/features/vehicles/types";
import {
  facebookConnectionSchema,
  facebookPublishVehicleSchema,
  generateFacebookContentSchema,
} from "@/features/facebook/validators";

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    (!candidate.startsWith("/admin/facebook") &&
      !candidate.startsWith("/admin/vehicles"))
  ) {
    return fallback;
  }

  return candidate;
}

const FACEBOOK_PUBLISH_FAILURE_MESSAGE =
  "Facebook publishing failed. Please check the Page token and app permissions.";

async function getFacebookManagerAccess(
  nextPath: string,
): Promise<AdminAccessContext | null> {
  const access = await requireAdminAccessContext(nextPath);

  if (!access) {
    return null;
  }

  return access;
}

async function getManagedVehicleOrRedirect(input: {
  access: AdminAccessContext;
  fallbackPath: string;
  vehicleId: string;
}): Promise<Vehicle> {
  const supabase = await createSupabaseServerClient();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", input.access.dealership.id)
    .eq("id", input.vehicleId)
    .maybeSingle<Vehicle>();

  if (error || !vehicle) {
    redirectWithMessage(input.fallbackPath, "error", "Vehicle not found.");
  }

  return vehicle;
}

async function getGeneratedContentForVehicle(input: {
  access: AdminAccessContext;
  generatedContentId: string;
  vehicleId: string;
}): Promise<{
  content: string;
  id: string;
} | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("facebook_generated_content")
    .select("id, content")
    .eq("dealership_id", input.access.dealership.id)
    .eq("vehicle_id", input.vehicleId)
    .eq("id", input.generatedContentId)
    .maybeSingle<{ content: string; id: string }>();

  return data ?? null;
}

function revalidateFacebookRoutes(input: {
  access: AdminAccessContext;
  publicVehiclePath?: string;
  vehicleId?: string;
}): void {
  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/settings");
  revalidatePath("/admin/facebook/content");
  revalidatePath("/admin/facebook/published-posts");
  revalidatePath("/admin/vehicles");

  if (input.vehicleId) {
    revalidatePath(`/admin/vehicles/${input.vehicleId}`);
  }

  revalidatePath(`/${input.access.dealership.slug}`);
  revalidatePath(`/${input.access.dealership.slug}/vehicles`);

  if (input.publicVehiclePath) {
    revalidatePath(input.publicVehiclePath);
  }
}

function buildGeneratedContent(input: {
  contentType: FacebookGeneratedContentType;
  dealershipDefaults: ReturnType<typeof buildVehiclePostDefaults>;
  messengerLink: string | null;
  publicVehicleUrl: string;
  vehicle: Vehicle;
}): string {
  switch (input.contentType) {
    case "facebook_caption":
      return buildFacebookCaption({
        dealershipDefaults: input.dealershipDefaults,
        publicVehicleUrl: input.publicVehicleUrl,
        vehicle: input.vehicle,
      });
    case "marketplace_description":
      return buildMarketplaceDescription({
        dealershipDefaults: input.dealershipDefaults,
        publicVehicleUrl: input.publicVehicleUrl,
        vehicle: input.vehicle,
      });
    case "ad_primary_text":
      return buildAdPrimaryText({
        vehicle: input.vehicle,
      });
    case "ad_headline":
      return buildAdHeadline({
        vehicle: input.vehicle,
      });
    case "messenger_intro":
      return input.messengerLink
        ? `Hi! I'm interested in the ${input.vehicle.title}. Here is the Messenger link for this unit: ${input.messengerLink}`
        : `Hi! I'm interested in the ${input.vehicle.title}. Please message us for more details.`;
    default:
      return buildFacebookCaption({
        dealershipDefaults: input.dealershipDefaults,
        publicVehicleUrl: input.publicVehicleUrl,
        vehicle: input.vehicle,
      });
  }
}

function getFeaturedImageUrl(vehicle: Vehicle): string | null {
  return vehicle.featured_image_url?.trim() || null;
}

export async function saveGeneratedFacebookContent(input: {
  access: AdminAccessContext;
  content: string;
  contentType: FacebookGeneratedContentType;
  metadata?: Json;
  vehicle: Vehicle;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const payload: FacebookGeneratedContentInsert = {
    content: input.content,
    content_type: input.contentType,
    created_by: input.access.profile.id,
    dealership_id: input.access.dealership.id,
    metadata: input.metadata ?? {},
    vehicle_id: input.vehicle.id,
  };

  const { error } = await supabase
    .from("facebook_generated_content")
    .insert(payload);

  if (error) {
    throw new Error("facebook_content_save_failed");
  }
}

async function createFacebookApiLog(input: {
  access: AdminAccessContext;
  action: string;
  endpoint: string | null;
  errorMessage?: string | null;
  requestPayload?: Record<string, unknown>;
  responsePayload?: unknown;
  status: "error" | "success";
  statusCode?: number | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const payload: FacebookApiLogInsert = {
    action: input.action,
    created_by: input.access.profile.id,
    dealership_id: input.access.dealership.id,
    endpoint: input.endpoint,
    error_message: input.errorMessage ?? null,
    request_payload: sanitizeFacebookRequestPayload(
      input.requestPayload ?? {},
    ) as Json,
    response_payload: sanitizeFacebookResponsePayload(
      input.responsePayload ?? {},
    ) as Json,
    status: input.status,
    status_code: input.statusCode ?? null,
  };

  const { error } = await supabase
    .from("facebook_api_logs")
    .insert(payload);

  if (error) {
    throw new Error("facebook_api_log_create_failed");
  }
}

export async function createFacebookPublicationRecord(input: {
  access: AdminAccessContext;
  caption: string;
  errorMessage?: string | null;
  facebookConnectionId: string | null;
  facebookPageId: string;
  featuredImageUrl: string | null;
  generatedContentId: string | null;
  metadata?: Json;
  publicVehicleUrl: string;
  publishType: FacebookPostPublication["publish_type"];
  status?: FacebookPostPublication["status"];
  vehicle: Vehicle;
}): Promise<FacebookPostPublication> {
  const supabase = await createSupabaseServerClient();
  const payload: FacebookPostPublicationInsert = {
    caption: input.caption,
    dealership_id: input.access.dealership.id,
    error_message: input.errorMessage ?? null,
    facebook_connection_id: input.facebookConnectionId,
    facebook_page_id: input.facebookPageId,
    featured_image_url: input.featuredImageUrl,
    generated_content_id: input.generatedContentId,
    metadata: input.metadata ?? {},
    public_vehicle_url: input.publicVehicleUrl,
    publish_type: input.publishType,
    published_by: input.access.profile.id,
    status: input.status ?? "pending",
    vehicle_id: input.vehicle.id,
  };

  const { data, error } = await supabase
    .from("facebook_post_publications")
    .insert(payload)
    .select("*")
    .single<FacebookPostPublication>();

  if (error || !data) {
    throw new Error("facebook_publication_create_failed");
  }

  return data;
}

async function updateFacebookPublicationRecord(input: {
  access: AdminAccessContext;
  publicationId: string;
  values: FacebookPostPublicationUpdate;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("facebook_post_publications")
    .update(input.values)
    .eq("dealership_id", input.access.dealership.id)
    .eq("id", input.publicationId);

  if (error) {
    throw new Error("facebook_publication_update_failed");
  }
}

async function runGeneratedContentAction(input: {
  contentType: FacebookGeneratedContentType;
  formData: FormData;
}): Promise<void> {
  const fallbackPath = "/admin/facebook";
  const access = await getFacebookManagerAccess(fallbackPath);

  if (!access || !canCreateFacebookContent(access.membership.role)) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "You do not have permission to generate Facebook content.",
    );
  }

  const parsed = generateFacebookContentSchema.safeParse({
    content_type: input.contentType,
    redirect_to: getStringValue(input.formData, "redirect_to"),
    vehicle_id: getStringValue(input.formData, "vehicle_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to generate content.",
    );
  }

  const redirectPath = sanitizeRedirectPath(
    parsed.data.redirect_to,
    `/admin/vehicles/${parsed.data.vehicle_id}`,
  );
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath: redirectPath,
    vehicleId: parsed.data.vehicle_id,
  });
  const publicVehiclePath = buildPublicVehiclePath(
    access.dealership.slug,
    vehicle.slug,
  );
  const publicVehicleUrl = publicVehiclePath;
  const connection = await getFacebookConnection(access);
  const messengerLink =
    connection?.messenger_page_identifier &&
    (connection.status === "configured" || connection.status === "connected")
      ? buildMessengerLink({
          messengerPageIdentifier: connection.messenger_page_identifier,
          vehicleSlug: vehicle.slug,
        })
      : null;
  const content = buildGeneratedContent({
    contentType: parsed.data.content_type,
    dealershipDefaults: buildVehiclePostDefaults(access.dealership),
    messengerLink,
    publicVehicleUrl,
    vehicle,
  });

  try {
    await saveGeneratedFacebookContent({
      access,
      content,
      contentType: parsed.data.content_type,
      metadata: {
        generated_from: "vehicle_detail",
        messenger_link: messengerLink,
        public_vehicle_path: publicVehiclePath,
      } satisfies Json,
      vehicle,
    });
  } catch {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to save generated Facebook content right now.",
    );
  }

  revalidateFacebookRoutes({
    access,
    publicVehiclePath,
    vehicleId: vehicle.id,
  });

  redirectWithMessage(
    redirectPath,
    "success",
    "Facebook-ready content generated.",
  );
}

export async function publishVehicleToFacebookPage(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook";
  const access = await getFacebookManagerAccess(fallbackPath);

  if (!access || !canPublishToFacebookPage(access.membership.role)) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Only owners and admins can publish to the Facebook Page.",
    );
  }

  const parsed = facebookPublishVehicleSchema.safeParse({
    caption: getStringValue(formData, "caption"),
    confirm_publish: getStringValue(formData, "confirm_publish"),
    generated_content_id: getStringValue(formData, "generated_content_id"),
    publish_type: getStringValue(formData, "publish_type"),
    redirect_to: getStringValue(formData, "redirect_to"),
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to publish to Facebook.",
    );
  }

  const redirectPath = sanitizeRedirectPath(
    parsed.data.redirect_to,
    `/admin/vehicles/${parsed.data.vehicle_id}`,
  );
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath: redirectPath,
    vehicleId: parsed.data.vehicle_id,
  });

  if (parsed.data.generated_content_id) {
    const generatedContent = await getGeneratedContentForVehicle({
      access,
      generatedContentId: parsed.data.generated_content_id,
      vehicleId: vehicle.id,
    });

    if (!generatedContent) {
      redirectWithMessage(
        redirectPath,
        "error",
        "Selected Facebook content could not be found for this vehicle.",
      );
    }
  }

  if (parsed.data.publish_type === "photo_post") {
    redirectWithMessage(
      redirectPath,
      "error",
      "Photo post publishing is not enabled yet. Use Text + Link Post for now.",
    );
  }

  const connection = await getFacebookConnection(access);
  const readiness = await getFacebookPublishReadiness({
    access,
    caption: parsed.data.caption,
    hasFeaturedImage: Boolean(getFeaturedImageUrl(vehicle)),
    publishType: parsed.data.publish_type,
    vehicle,
  });
  const missingItems = readiness.readiness.filter((item) => !item.passed);

  if (!connection || !readiness.resolvedFacebookPageId) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Facebook Page configuration is incomplete.",
    );
  }

  if (missingItems.length > 0 || !readiness.publicVehicleUrl) {
    redirectWithMessage(
      redirectPath,
      "error",
      `Publishing blocked until these items are ready: ${missingItems
        .map((item) => item.label)
        .join(", ")}.`,
    );
  }

  const featuredImageUrl = getFeaturedImageUrl(vehicle);
  let publication: FacebookPostPublication;

  try {
    publication = await createFacebookPublicationRecord({
      access,
      caption: parsed.data.caption,
      facebookConnectionId: connection.id,
      facebookPageId: readiness.resolvedFacebookPageId,
      featuredImageUrl,
      generatedContentId: parsed.data.generated_content_id || null,
      metadata: {
        publish_trigger: "vehicle_detail",
      } satisfies Json,
      publicVehicleUrl: readiness.publicVehicleUrl,
      publishType: parsed.data.publish_type,
      status: "pending",
      vehicle,
    });
  } catch {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to create the Facebook publication record.",
    );
  }

  const endpoint = `/${readiness.resolvedFacebookPageId}/feed`;
  const requestPayload = {
    caption: parsed.data.caption,
    generated_content_id: parsed.data.generated_content_id || null,
    link: readiness.publicVehicleUrl,
    page_id: readiness.resolvedFacebookPageId,
    publish_type: parsed.data.publish_type,
    vehicle_id: vehicle.id,
  };

  try {
    const publishResult =
      parsed.data.publish_type === "text_link_post"
        ? await publishPageTextPost({
            caption: parsed.data.caption,
            link: readiness.publicVehicleUrl,
            pageId: readiness.resolvedFacebookPageId,
          })
        : await publishPagePhotoPost({
            caption: `${parsed.data.caption}\n\n${readiness.publicVehicleUrl}`,
            imageUrl: featuredImageUrl ?? "",
            pageId: readiness.resolvedFacebookPageId,
          });

    if (!publishResult.success) {
      await updateFacebookPublicationRecord({
        access,
        publicationId: publication.id,
        values: {
          error_message: publishResult.errorMessage ?? "Facebook publishing failed.",
          metadata: {
            publish_result: sanitizeFacebookResponsePayload(
              publishResult.rawResponse ?? {},
            ) as Json,
          } satisfies Json,
          status: "failed",
        },
      });
      try {
        await createFacebookApiLog({
          access,
          action: "publish_vehicle_to_facebook_page",
          endpoint,
          errorMessage:
            publishResult.errorMessage ?? "Facebook publishing failed.",
          requestPayload,
          responsePayload: publishResult.rawResponse,
          status: "error",
          statusCode: publishResult.statusCode ?? null,
        });
      } catch {
        // Keep the publication failure state even if the API log cannot be stored.
      }

      revalidateFacebookRoutes({
        access,
        publicVehiclePath: buildPublicVehiclePath(access.dealership.slug, vehicle.slug),
        vehicleId: vehicle.id,
      });

      redirectWithMessage(
        redirectPath,
        "error",
        FACEBOOK_PUBLISH_FAILURE_MESSAGE,
      );
    }

    await updateFacebookPublicationRecord({
      access,
      publicationId: publication.id,
      values: {
        error_message: null,
        facebook_photo_id: publishResult.facebookPhotoId ?? null,
        facebook_post_id: publishResult.facebookPostId ?? null,
        metadata: {
          publish_result: sanitizeFacebookResponsePayload(
            publishResult.rawResponse ?? {},
          ) as Json,
        } satisfies Json,
        published_at: new Date().toISOString(),
        status: "published",
      },
    });
    try {
      await createFacebookApiLog({
        access,
        action: "publish_vehicle_to_facebook_page",
        endpoint,
        requestPayload,
        responsePayload: publishResult.rawResponse,
        status: "success",
        statusCode: publishResult.statusCode ?? null,
      });
    } catch {
      // Publishing succeeded; do not mark the publication as failed if logging fails.
    }
  } catch {
    try {
      await updateFacebookPublicationRecord({
        access,
        publicationId: publication.id,
        values: {
          error_message: "Unexpected Facebook publishing failure.",
          status: "failed",
        },
      });
      await createFacebookApiLog({
        access,
        action: "publish_vehicle_to_facebook_page",
        endpoint,
        errorMessage: "Unexpected Facebook publishing failure.",
        requestPayload,
        responsePayload: {},
        status: "error",
      });
    } catch {
      // Publishing failed and the failure record/log update also failed.
    }

    revalidateFacebookRoutes({
      access,
      publicVehiclePath: buildPublicVehiclePath(access.dealership.slug, vehicle.slug),
      vehicleId: vehicle.id,
    });

    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to publish this vehicle to Facebook right now.",
    );
  }

  revalidateFacebookRoutes({
    access,
    publicVehiclePath: buildPublicVehiclePath(access.dealership.slug, vehicle.slug),
    vehicleId: vehicle.id,
  });

  redirectWithMessage(
    redirectPath,
    "success",
    "Vehicle published to the Facebook Page.",
  );
}

export async function upsertFacebookConnection(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook/settings";
  const access = await getFacebookManagerAccess(fallbackPath);

  if (!access || !canManageFacebookSettings(access.membership.role)) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Only owners and admins can update Facebook settings.",
    );
  }

  const parsed = facebookConnectionSchema.safeParse({
    ad_account_id: getStringValue(formData, "ad_account_id"),
    facebook_page_url: getStringValue(formData, "facebook_page_url"),
    messenger_page_identifier: getStringValue(formData, "messenger_page_identifier"),
    notes: getStringValue(formData, "notes"),
    page_id: getStringValue(formData, "page_id"),
    page_name: getStringValue(formData, "page_name"),
    page_username: getStringValue(formData, "page_username"),
    pixel_id: getStringValue(formData, "pixel_id"),
    redirect_to: getStringValue(formData, "redirect_to"),
    status: getStringValue(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to save Facebook settings.",
    );
  }

  const status = normalizeFacebookConnectionStatus({
    messengerPageIdentifier: parsed.data.messenger_page_identifier,
    pageName: parsed.data.page_name,
    status: parsed.data.status,
  });
  const payload: FacebookConnectionInsert = {
    ad_account_id: parsed.data.ad_account_id,
    dealership_id: access.dealership.id,
    facebook_page_url: parsed.data.facebook_page_url,
    messenger_page_identifier: parsed.data.messenger_page_identifier,
    notes: parsed.data.notes,
    page_id: parsed.data.page_id,
    page_name: parsed.data.page_name,
    page_username: parsed.data.page_username,
    pixel_id: parsed.data.pixel_id,
    status,
  };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("facebook_connections")
    .upsert(payload, { onConflict: "dealership_id" });

  if (error) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Unable to save Facebook settings right now.",
    );
  }

  revalidateFacebookRoutes({
    access,
  });

  redirectWithMessage(
    sanitizeRedirectPath(parsed.data.redirect_to, fallbackPath),
    "success",
    status === "not_connected"
      ? "Facebook settings saved. Messenger links are not configured yet."
      : "Facebook settings saved.",
  );
}

export async function clearFacebookConnection(): Promise<void> {
  const fallbackPath = "/admin/facebook/settings";
  const access = await getFacebookManagerAccess(fallbackPath);

  if (!access || !canManageFacebookSettings(access.membership.role)) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Only owners and admins can clear Facebook settings.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("facebook_connections")
    .delete()
    .eq("dealership_id", access.dealership.id);

  if (error) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Unable to clear Facebook settings right now.",
    );
  }

  revalidateFacebookRoutes({
    access,
  });

  redirectWithMessage(
    fallbackPath,
    "success",
    "Facebook settings cleared.",
  );
}

export async function generateFacebookCaption(
  formData: FormData,
): Promise<void> {
  await runGeneratedContentAction({
    contentType: "facebook_caption",
    formData,
  });
}

export async function generateMarketplaceDescription(
  formData: FormData,
): Promise<void> {
  await runGeneratedContentAction({
    contentType: "marketplace_description",
    formData,
  });
}

export async function generateAdPrimaryText(
  formData: FormData,
): Promise<void> {
  await runGeneratedContentAction({
    contentType: "ad_primary_text",
    formData,
  });
}

export async function generateAdHeadline(
  formData: FormData,
): Promise<void> {
  await runGeneratedContentAction({
    contentType: "ad_headline",
    formData,
  });
}
