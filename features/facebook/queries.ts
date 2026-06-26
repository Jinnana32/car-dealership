import "server-only";

import { cache } from "react";

import { FACEBOOK_MESSENGER_PAGE_ID } from "@/features/facebook/constants";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getFacebookLeads } from "@/features/facebook/leadgen-queries";
import { getVehicleOptions } from "@/features/inquiries/queries";
import type { Vehicle } from "@/features/vehicles/types";
import {
  buildAbsolutePublicVehicleUrl,
  buildFacebookPublishReadiness,
  buildFacebookPostUrl,
  buildMessengerLink,
  getFacebookGeneratedContentLabel,
} from "@/features/facebook/utils";
import type {
  FacebookConnection,
  FacebookContentHistoryResult,
  FacebookGeneratedContent,
  FacebookGeneratedContentWithRelations,
  FacebookMessengerClickItem,
  FacebookPostPublication,
  FacebookPublicationHistoryResult,
  FacebookPublicationRecordWithRelations,
  FacebookSalesHubData,
  VehicleFacebookContext,
} from "@/features/facebook/types";
import {
  facebookContentHistoryFiltersSchema,
  facebookPublicationHistorySchema,
} from "@/features/facebook/validators";
import {
  hasFacebookPublishingAccessToken,
  hasFacebookSiteUrl,
} from "@/lib/facebook/server";

type FacebookContentHistorySearchParams = {
  contentType?: string | string[];
  vehicleId?: string | string[];
};

type FacebookPublicationHistorySearchParams = {
  status?: string | string[];
  vehicleId?: string | string[];
};

type PublicMessengerConnection = {
  messenger_page_identifier: string | null;
  page_name: string | null;
  status: FacebookConnection["status"];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isMessengerConfigured(
  connection: Pick<
    FacebookConnection,
    "messenger_page_identifier" | "status"
  > | null,
): connection is Pick<FacebookConnection, "messenger_page_identifier" | "status"> & {
  messenger_page_identifier: string;
} {
  if (!connection?.messenger_page_identifier?.trim()) {
    return false;
  }

  return (
    connection.status === "configured" || connection.status === "connected"
  );
}

function isFacebookPageConfigured(
  connection: FacebookConnection | null,
  resolvedPageId: string | null,
): boolean {
  if (!connection || !resolvedPageId) {
    return false;
  }

  return (
    connection.status === "configured" || connection.status === "connected"
  );
}

function getResolvedFacebookPageId(
  connection: FacebookConnection | null,
): string | null {
  const fromConnection = connection?.page_id?.trim() || null;
  const fromEnv = process.env.META_PAGE_ID?.trim() || null;

  return fromConnection ?? fromEnv;
}

function getPublicSiteUrl(): string | null {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
}

async function mapGeneratedContentRelations(
  access: AdminAccessContext,
  rows: FacebookGeneratedContent[],
): Promise<FacebookGeneratedContentWithRelations[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const vehicleIds = Array.from(new Set(rows.map((row) => row.vehicle_id)));
  const creatorIds = Array.from(
    new Set(
      rows
        .map((row) => row.created_by)
        .filter((createdBy): createdBy is string => Boolean(createdBy)),
    ),
  );

  const [vehiclesResponse, creatorsResponse] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, slug, title")
      .eq("dealership_id", access.dealership.id)
      .in("id", vehicleIds),
    creatorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", creatorIds)
      : Promise.resolve({
          data: [] as Array<{
            email: string | null;
            full_name: string | null;
            id: string;
          }>,
        }),
  ]);

  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const creatorsById = new Map(
    (creatorsResponse.data ?? []).map((profile) => [
      profile.id,
      profile.full_name?.trim() || profile.email || "Team member",
    ]),
  );

  return rows.map((row) => ({
    ...row,
    createdByName: row.created_by
      ? creatorsById.get(row.created_by) ?? "Team member"
      : null,
    vehicle: vehiclesById.get(row.vehicle_id) ?? null,
  }));
}

async function mapMessengerClickRelations(
  access: AdminAccessContext,
  rows: Array<{
    created_at: string;
    id: string;
    source_detail: string | null;
    vehicle_id: string | null;
  }>,
): Promise<FacebookMessengerClickItem[]> {
  const vehicleIds = Array.from(
    new Set(
      rows
        .map((row) => row.vehicle_id)
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  );
  const supabase = await createSupabaseServerClient();
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, slug, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : { data: [] };

  const vehiclesById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));

  return rows.map((row) => ({
    createdAt: row.created_at,
    id: row.id,
    sourceDetail: row.source_detail,
    vehicle: row.vehicle_id ? vehiclesById.get(row.vehicle_id) ?? null : null,
  }));
}

async function mapPublicationRelations(
  access: AdminAccessContext,
  rows: FacebookPostPublication[],
): Promise<FacebookPublicationRecordWithRelations[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const vehicleIds = Array.from(new Set(rows.map((row) => row.vehicle_id)));
  const generatedContentIds = Array.from(
    new Set(
      rows
        .map((row) => row.generated_content_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      rows
        .map((row) => row.published_by)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [vehiclesResponse, generatedContentResponse, profilesResponse] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("id, slug, title")
        .eq("dealership_id", access.dealership.id)
        .in("id", vehicleIds),
      generatedContentIds.length > 0
        ? supabase
            .from("facebook_generated_content")
            .select("id, content, content_type")
            .eq("dealership_id", access.dealership.id)
            .in("id", generatedContentIds)
        : Promise.resolve({ data: [] as Array<{ content: string; content_type: FacebookGeneratedContent["content_type"]; id: string }> }),
      profileIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", profileIds)
        : Promise.resolve({ data: [] as Array<{ email: string | null; full_name: string | null; id: string }> }),
    ]);

  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const generatedContentById = new Map(
    (generatedContentResponse.data ?? []).map((row) => [row.id, row]),
  );
  const profilesById = new Map(
    (profilesResponse.data ?? []).map((profile) => [
      profile.id,
      profile.full_name?.trim() || profile.email || "Team member",
    ]),
  );

  return rows.map((row) => ({
    ...row,
    generatedContent: row.generated_content_id
      ? generatedContentById.get(row.generated_content_id) ?? null
      : null,
    publishedByName: row.published_by
      ? profilesById.get(row.published_by) ?? "Team member"
      : null,
    vehicle: vehiclesById.get(row.vehicle_id) ?? null,
  }));
}

export async function getFacebookConnection(
  access: AdminAccessContext,
): Promise<FacebookConnection | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("facebook_connections")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .maybeSingle<FacebookConnection>();

  return data ?? null;
}

export const getPublicMessengerCtaConfig = cache(
  async (input: {
    dealerSlug: string;
    dealershipId: string;
    vehicleSlug: string;
  }): Promise<{ href: string; pageName: string | null } | null> => {
    const adminSupabase = createSupabaseAdminClient();
    const { data } = await adminSupabase
      .from("facebook_connections")
      .select("messenger_page_identifier, page_name, status")
      .eq("dealership_id", input.dealershipId)
      .maybeSingle<PublicMessengerConnection>();

    const messengerPageIdentifier =
      data?.messenger_page_identifier?.trim() || FACEBOOK_MESSENGER_PAGE_ID;

    if (
      !messengerPageIdentifier ||
      (data &&
        !isMessengerConfigured(data) &&
        messengerPageIdentifier !== FACEBOOK_MESSENGER_PAGE_ID)
    ) {
      return null;
    }

    const searchParams = new URLSearchParams({
      dealerSlug: input.dealerSlug,
      vehicleSlug: input.vehicleSlug,
    });

    return {
      href: `/api/messenger-click?${searchParams.toString()}`,
      pageName: data?.page_name ?? null,
    };
  },
);

export const getPublicFacebookChatPageId = cache(
  async (dealershipId: string): Promise<string | null> => {
    const adminSupabase = createSupabaseAdminClient();
    const { data } = await adminSupabase
      .from("facebook_connections")
      .select("page_id, status")
      .eq("dealership_id", dealershipId)
      .maybeSingle<Pick<FacebookConnection, "page_id" | "status">>();

    if (
      data &&
      (data.status === "configured" || data.status === "connected")
    ) {
      const resolvedPageId = getResolvedFacebookPageId(data as FacebookConnection);

      if (resolvedPageId) {
        return resolvedPageId;
      }
    }

    return process.env.META_PAGE_ID?.trim() || null;
  },
);

export const getPublicMessengerFallbackHref = cache(
  async (dealershipId: string): Promise<string | null> => {
    const adminSupabase = createSupabaseAdminClient();
    const { data } = await adminSupabase
      .from("facebook_connections")
      .select("messenger_page_identifier, status")
      .eq("dealership_id", dealershipId)
      .maybeSingle<Pick<FacebookConnection, "messenger_page_identifier" | "status">>();

    if (!isMessengerConfigured(data)) {
      return null;
    }

    return `https://m.me/${encodeURIComponent(data.messenger_page_identifier.trim())}`;
  },
);

export async function getVehicleFacebookPublications(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<FacebookPublicationRecordWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("facebook_post_publications")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  return mapPublicationRelations(
    access,
    (data ?? []) as FacebookPostPublication[],
  );
}

export async function getFacebookPublishReadiness(input: {
  access: AdminAccessContext;
  caption: string | null;
  hasFeaturedImage: boolean;
  publishType: FacebookPostPublication["publish_type"];
  vehicle: Vehicle;
}): Promise<{
  publicVehicleUrl: string | null;
  readiness: VehicleFacebookContext["publishReadiness"];
  resolvedFacebookPageId: string | null;
}> {
  const connection = await getFacebookConnection(input.access);
  const resolvedFacebookPageId = getResolvedFacebookPageId(connection);
  const siteUrl = getPublicSiteUrl();
  const publicVehicleUrl = siteUrl
    ? buildAbsolutePublicVehicleUrl({
        dealerSlug: input.access.dealership.slug,
        siteUrl,
        vehicleSlug: input.vehicle.slug,
      })
    : null;
  const readiness = buildFacebookPublishReadiness({
    caption: input.caption,
    facebookPageConfigured: isFacebookPageConfigured(
      connection,
      resolvedFacebookPageId,
    ),
    hasFeaturedImage: input.hasFeaturedImage,
    hasPageAccessToken: hasFacebookPublishingAccessToken(),
    hasSiteUrl: hasFacebookSiteUrl(),
    publicVehicleUrl,
    publishType: input.publishType,
    vehicle: input.vehicle,
  });

  return {
    publicVehicleUrl,
    readiness,
    resolvedFacebookPageId,
  };
}

export async function getFacebookSalesHubData(
  access: AdminAccessContext,
): Promise<FacebookSalesHubData> {
  const supabase = await createSupabaseServerClient();
  const [
    connection,
    vehiclesResponse,
    generatedContentResponse,
    facebookLeadsResult,
    messengerClicksResponse,
    recentPublishedResponse,
    recentFailedResponse,
    publishedCountResponse,
    failedCountResponse,
  ] = await Promise.all([
    getFacebookConnection(access),
    supabase
      .from("vehicles")
      .select("id, price, description")
      .eq("dealership_id", access.dealership.id)
      .eq("status", "published")
      .eq("availability", "available"),
    supabase
      .from("facebook_generated_content")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .order("created_at", { ascending: false })
      .limit(6),
    getFacebookLeads(access, {}),
    supabase
      .from("lead_source_events")
      .select("id, created_at, vehicle_id, source_detail")
      .eq("dealership_id", access.dealership.id)
      .eq("event_name", "messenger_cta_clicked")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("facebook_post_publications")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5),
    supabase
      .from("facebook_post_publications")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("facebook_post_publications")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id)
      .eq("status", "published"),
    supabase
      .from("facebook_post_publications")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id)
      .eq("status", "failed"),
  ]);

  const publishedAvailableVehicles = vehiclesResponse.data ?? [];
  const vehicleIds = publishedAvailableVehicles.map((vehicle) => vehicle.id);
  const { data: vehicleMedia } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicle_media")
          .select("vehicle_id")
          .eq("dealership_id", access.dealership.id)
          .in("vehicle_id", vehicleIds)
      : { data: [] };

  const mediaVehicleIds = new Set((vehicleMedia ?? []).map((item) => item.vehicle_id));
  const vehiclesMissingReadinessCount = publishedAvailableVehicles.filter((vehicle) => {
    const missingDescription = !vehicle.description?.trim();
    const missingPrice = vehicle.price === null;
    const missingPhotos = !mediaVehicleIds.has(vehicle.id);

    return missingDescription || missingPrice || missingPhotos;
  }).length;

  const recentGeneratedContent = await mapGeneratedContentRelations(
    access,
    (generatedContentResponse.data ?? []) as FacebookGeneratedContent[],
  );
  const recentMessengerClicks = await mapMessengerClickRelations(
    access,
    messengerClicksResponse.data ?? [],
  );
  const recentPublishedPosts = await mapPublicationRelations(
    access,
    (recentPublishedResponse.data ?? []) as FacebookPostPublication[],
  );
  const recentFailedPublications = await mapPublicationRelations(
    access,
    (recentFailedResponse.data ?? []) as FacebookPostPublication[],
  );
  const resolvedFacebookPageId = getResolvedFacebookPageId(connection);
  const pagePublishingConfigured = isFacebookPageConfigured(
    connection,
    resolvedFacebookPageId,
  );

  return {
    connection,
    failedPublicationsCount: failedCountResponse.count ?? 0,
    hasPageAccessToken: hasFacebookPublishingAccessToken(),
    hasSiteUrl: hasFacebookSiteUrl(),
    lastFailedPublication: recentFailedPublications[0] ?? null,
    latestFacebookLead: facebookLeadsResult.leads[0] ?? null,
    lastSuccessfulPublication: recentPublishedPosts[0] ?? null,
    pagePublishingConfigured,
    processedLeadCount: facebookLeadsResult.processedCount,
    publishedAvailableVehiclesCount: publishedAvailableVehicles.length,
    publishedPostsCount: publishedCountResponse.count ?? 0,
    recentFacebookLeads: facebookLeadsResult.leads.slice(0, 5),
    recentFailedPublications,
    recentGeneratedContent,
    recentMessengerClicks,
    recentPublishedPosts,
    resolvedFacebookPageId,
    totalFacebookLeadsCount: facebookLeadsResult.totalCount,
    failedLeadCount: facebookLeadsResult.failedCount,
    vehiclesMissingReadinessCount,
  };
}

export function parseFacebookContentHistoryFilters(
  searchParams: FacebookContentHistorySearchParams,
): FacebookContentHistoryResult["filters"] {
  return facebookContentHistoryFiltersSchema.parse({
    contentType: getScalarValue(searchParams.contentType),
    vehicleId: getScalarValue(searchParams.vehicleId),
  });
}

export async function getFacebookContentHistory(
  access: AdminAccessContext,
  searchParams: FacebookContentHistorySearchParams,
): Promise<FacebookContentHistoryResult> {
  const filters = parseFacebookContentHistoryFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("facebook_generated_content")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.contentType !== "all") {
    query = query.eq("content_type", filters.contentType);
  }

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  const [rowsResponse, vehicleOptions] = await Promise.all([
    query,
    getVehicleOptions(access),
  ]);

  const content = await mapGeneratedContentRelations(
    access,
    (rowsResponse.data ?? []) as FacebookGeneratedContent[],
  );

  return {
    content,
    filters,
    totalCount: content.length,
    vehicleOptions,
  };
}

export function parseFacebookPublicationHistoryFilters(
  searchParams: FacebookPublicationHistorySearchParams,
): FacebookPublicationHistoryResult["filters"] {
  return facebookPublicationHistorySchema.parse({
    status: getScalarValue(searchParams.status),
    vehicleId: getScalarValue(searchParams.vehicleId),
  });
}

export async function getFacebookPublicationHistory(
  access: AdminAccessContext,
  searchParams: FacebookPublicationHistorySearchParams,
): Promise<FacebookPublicationHistoryResult> {
  const filters = parseFacebookPublicationHistoryFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("facebook_post_publications")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  const [rowsResponse, vehicleOptions] = await Promise.all([
    query,
    getVehicleOptions(access),
  ]);

  const publications = await mapPublicationRelations(
    access,
    (rowsResponse.data ?? []) as FacebookPostPublication[],
  );

  return {
    filters,
    publications,
    totalCount: publications.length,
    vehicleOptions,
  };
}

export async function getVehicleFacebookContext(input: {
  access: AdminAccessContext;
  hasFeaturedImage: boolean;
  vehicle: Vehicle;
}): Promise<VehicleFacebookContext> {
  const [connection, generatedContentResponse, publications] =
    await Promise.all([
      getFacebookConnection(input.access),
      (await createSupabaseServerClient())
        .from("facebook_generated_content")
        .select("*")
        .eq("dealership_id", input.access.dealership.id)
        .eq("vehicle_id", input.vehicle.id)
        .order("created_at", { ascending: false }),
      getVehicleFacebookPublications(input.access, input.vehicle.id),
    ]);

  const rows = (generatedContentResponse.data ?? []) as FacebookGeneratedContent[];
  const latestContent: VehicleFacebookContext["latestContent"] = {};

  for (const row of rows) {
    if (!latestContent[row.content_type]) {
      latestContent[row.content_type] = row;
    }
  }

  const generatedContentOptions = rows.map((row) => ({
    content: row.content,
    contentType: row.content_type,
    id: row.id,
    label: `${getFacebookGeneratedContentLabel(row.content_type)} · ${new Intl.DateTimeFormat(
      "en-US",
      {
        day: "numeric",
        month: "short",
      },
    ).format(new Date(row.created_at))}`,
  }));
  const initialCaption =
    latestContent.facebook_caption?.content ??
    generatedContentOptions[0]?.content ??
    null;
  const publishReadiness = await getFacebookPublishReadiness({
    access: input.access,
    caption: initialCaption,
    hasFeaturedImage: input.hasFeaturedImage,
    publishType: "text_link_post",
    vehicle: input.vehicle,
  });

  return {
    connection,
    generatedContentOptions,
    hasPageAccessToken: hasFacebookPublishingAccessToken(),
    hasSiteUrl: hasFacebookSiteUrl(),
    latestContent,
    messengerLink: isMessengerConfigured(connection)
      ? buildMessengerLink({
          messengerPageIdentifier: connection.messenger_page_identifier,
          vehicleSlug: input.vehicle.slug,
        })
      : null,
    publications,
    publicVehicleUrl: publishReadiness.publicVehicleUrl,
    publishReadiness: publishReadiness.readiness,
    resolvedFacebookPageId: publishReadiness.resolvedFacebookPageId,
  };
}

export function getFacebookContentPreview(
  content: FacebookGeneratedContentWithRelations,
): string {
  const preview = content.content.split("\n").find((line) => line.trim()) ?? content.content;

  return preview.length > 120 ? `${preview.slice(0, 117).trimEnd()}...` : preview;
}

export function getFacebookPublicationPreview(
  publication: FacebookPublicationRecordWithRelations,
): string {
  const preview =
    publication.caption.split("\n").find((line) => line.trim()) ?? publication.caption;

  return preview.length > 120 ? `${preview.slice(0, 117).trimEnd()}...` : preview;
}

export function getFacebookPublicationUrl(
  publication: Pick<
    FacebookPostPublication,
    "facebook_photo_id" | "facebook_post_id"
  >,
): string | null {
  return buildFacebookPostUrl({
    facebookPhotoId: publication.facebook_photo_id,
    facebookPostId: publication.facebook_post_id,
  });
}
