import "server-only";

import { getInquirySourceLabel } from "@/features/inquiries/utils";
import type { Inquiry } from "@/features/inquiries/types";
import { getFollowUpBucket } from "@/features/pipeline/utils";
import type { VehicleSale } from "@/features/sales/types";
import type { DealershipAiContext, AiContextSummary, AiVehicleReference } from "@/features/ai/types";
import type { AdminAccessContext } from "@/lib/auth/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { Vehicle } from "@/features/vehicles/types";
import type { Customer } from "@/features/customers/types";
import type {
  FacebookLead,
  FacebookPostPublication,
  MessengerConversation,
} from "@/features/facebook/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type VehicleSummaryRow = Pick<
  Vehicle,
  | "availability"
  | "brand"
  | "created_at"
  | "description"
  | "featured_image_url"
  | "fuel_type"
  | "id"
  | "mileage"
  | "model"
  | "price"
  | "slug"
  | "status"
  | "title"
  | "transmission"
  | "updated_at"
  | "variant"
  | "year"
>;

type InquirySummaryRow = Pick<
  Inquiry,
  | "assigned_to"
  | "created_at"
  | "customer_id"
  | "id"
  | "next_follow_up_at"
  | "source_type"
  | "status"
  | "vehicle_id"
>;

type CustomerSummaryRow = Pick<Customer, "full_name" | "id">;
type VehicleMediaSummaryRow = {
  vehicle_id: string;
};
type ProfileSummaryRow = {
  email: string | null;
  full_name: string | null;
  id: string;
};

const TOP_LIMIT = 10;

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

function buildProfileName(profile: ProfileSummaryRow): string {
  return profile.full_name?.trim() || profile.email || "Team member";
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function buildPublicVehiclePath(input: {
  dealershipSlug: string;
  vehicleSlug: string;
}): string {
  return `/${input.dealershipSlug}/vehicles/${input.vehicleSlug}`;
}

function buildPublicVehicleUrl(path: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

function daysSince(value: string): number {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatVehicleTitle(vehicle: VehicleSummaryRow): string {
  return vehicle.title || [vehicle.year, vehicle.brand, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");
}

function buildVehicleReference(input: {
  dealershipSlug: string;
  facebookPostCount: number;
  inquiryCount: number;
  vehicle: VehicleSummaryRow;
}): AiVehicleReference {
  const publicPath = buildPublicVehiclePath({
    dealershipSlug: input.dealershipSlug,
    vehicleSlug: input.vehicle.slug,
  });

  return {
    adminPath: `/admin/vehicles/${input.vehicle.id}`,
    availability: input.vehicle.availability,
    facebookPostCount: input.facebookPostCount,
    id: input.vehicle.id,
    inquiryCount: input.inquiryCount,
    price: input.vehicle.price,
    publicPath,
    publicUrl: buildPublicVehicleUrl(publicPath),
    status: input.vehicle.status,
    title: formatVehicleTitle(input.vehicle),
    year: input.vehicle.year,
  };
}

function takeTop<T>(items: T[], limit = TOP_LIMIT): T[] {
  return items.slice(0, limit);
}

export async function getDealershipAiContext(
  access: AdminAccessContext,
): Promise<DealershipAiContext> {
  const adminSupabase = createSupabaseAdminClient();
  const [vehiclesResponse, vehicleMediaResponse, inquiriesResponse, customersResponse, salesResponse, leadSourceEventsResponse, facebookLeadsResponse, messengerConversationsResponse, facebookPostPublicationsResponse, brochureExportsResponse, facebookGeneratedContentCountResponse] = await Promise.all([
    adminSupabase
      .from("vehicles")
      .select(
        "id, availability, brand, created_at, description, featured_image_url, fuel_type, mileage, model, price, slug, status, title, transmission, updated_at, variant, year",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("vehicle_media")
      .select("vehicle_id")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("inquiries")
      .select(
        "id, assigned_to, created_at, customer_id, next_follow_up_at, source_type, status, vehicle_id",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("customers")
      .select("id, full_name")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("vehicle_sales")
      .select(
        "id, asking_price, created_by, customer_id, inquiry_id, payment_type, sold_at, sold_price, vehicle_id",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("lead_source_events")
      .select("created_at, event_name, inquiry_id, metadata, source_type, vehicle_id")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("facebook_leads")
      .select(
        "id, customer_id, form_id, form_name, inquiry_id, processed_at, received_at, status, vehicle_id",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("messenger_conversations")
      .select(
        "id, customer_id, inquiry_id, last_message_at, metadata, status, vehicle_id, vehicle_slug",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("facebook_post_publications")
      .select(
        "id, created_at, error_message, published_at, status, vehicle_id",
      )
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("brochure_exports")
      .select("created_at, export_type, generated_at, id, status, title, vehicle_ids")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("facebook_generated_content")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id),
  ]);

  const vehicles = (vehiclesResponse.data ?? []) as VehicleSummaryRow[];
  const vehicleMediaRows = (vehicleMediaResponse.data ?? []) as VehicleMediaSummaryRow[];
  const inquiries = (inquiriesResponse.data ?? []) as InquirySummaryRow[];
  const customers = (customersResponse.data ?? []) as CustomerSummaryRow[];
  const sales = (salesResponse.data ?? []) as VehicleSale[];
  const leadSourceEvents = (leadSourceEventsResponse.data ?? []) as Array<{
    created_at: string;
    event_name: string;
    inquiry_id: string | null;
    metadata: Json;
    source_type: string;
    vehicle_id: string | null;
  }>;
  const facebookLeads = (facebookLeadsResponse.data ?? []) as FacebookLead[];
  const messengerConversations = (messengerConversationsResponse.data ?? []) as Array<
    Pick<
      MessengerConversation,
      | "customer_id"
      | "id"
      | "inquiry_id"
      | "last_message_at"
      | "metadata"
      | "status"
      | "vehicle_id"
      | "vehicle_slug"
    >
  >;
  const facebookPostPublications = (facebookPostPublicationsResponse.data ??
    []) as Array<
    Pick<
      FacebookPostPublication,
      | "created_at"
      | "error_message"
      | "id"
      | "published_at"
      | "status"
      | "vehicle_id"
    >
  >;
  const brochureExports = (brochureExportsResponse.data ?? []) as Array<{
    created_at: string;
    export_type: "single_vehicle" | "multi_vehicle";
    generated_at: string | null;
    id: string;
    status: "pending" | "generated" | "failed";
    title: string | null;
    vehicle_ids: string[];
  }>;
  const generatedFacebookContentCount =
    facebookGeneratedContentCountResponse.count ?? 0;

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const inquiryById = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const vehicleMediaCountByVehicleId = new Map<string, number>();
  const inquiryCountByVehicleId = new Map<string, number>();
  const facebookPostCountByVehicleId = new Map<string, number>();
  const brochureCountByVehicleId = new Map<string, number>();
  const saleByVehicleId = new Map<string, VehicleSale>();
  const saleAmountByInquiryId = new Map<string, number>();
  const profileIds = Array.from(
    new Set(
      [
        ...inquiries
          .map((inquiry) => inquiry.assigned_to)
          .filter((profileId): profileId is string => Boolean(profileId)),
        ...sales
          .map((sale) => sale.created_by)
          .filter((profileId): profileId is string => Boolean(profileId)),
      ],
    ),
  );

  for (const row of vehicleMediaRows) {
    vehicleMediaCountByVehicleId.set(
      row.vehicle_id,
      (vehicleMediaCountByVehicleId.get(row.vehicle_id) ?? 0) + 1,
    );
  }

  for (const inquiry of inquiries) {
    if (!inquiry.vehicle_id) {
      continue;
    }

    inquiryCountByVehicleId.set(
      inquiry.vehicle_id,
      (inquiryCountByVehicleId.get(inquiry.vehicle_id) ?? 0) + 1,
    );
  }

  for (const publication of facebookPostPublications) {
    if (!publication.vehicle_id || publication.status !== "published") {
      continue;
    }

    facebookPostCountByVehicleId.set(
      publication.vehicle_id,
      (facebookPostCountByVehicleId.get(publication.vehicle_id) ?? 0) + 1,
    );
  }

  for (const exportRecord of brochureExports) {
    for (const vehicleId of exportRecord.vehicle_ids) {
      brochureCountByVehicleId.set(
        vehicleId,
        (brochureCountByVehicleId.get(vehicleId) ?? 0) + 1,
      );
    }
  }

  for (const sale of sales) {
    saleByVehicleId.set(sale.vehicle_id, sale);

    if (sale.inquiry_id) {
      saleAmountByInquiryId.set(sale.inquiry_id, sale.sold_price);
    }
  }

  const { data: profiles } =
    profileIds.length > 0
      ? await adminSupabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", profileIds)
      : { data: [] as ProfileSummaryRow[] };
  const profileNameById = new Map(
    (profiles ?? []).map((profile) => [profile.id, buildProfileName(profile)]),
  );

  const inventorySummary = {
    archivedVehicles: vehicles.filter((vehicle) => vehicle.status === "archived").length,
    availableInventoryValue: sum(
      vehicles
        .filter((vehicle) => vehicle.availability === "available" && vehicle.price !== null)
        .map((vehicle) => vehicle.price ?? 0),
    ),
    availableVehicles: vehicles.filter((vehicle) => vehicle.availability === "available").length,
    averagePrice: roundToOneDecimal(
      average(
        vehicles
          .map((vehicle) => vehicle.price)
          .filter((price): price is number => price !== null),
      ),
    ),
    draftVehicles: vehicles.filter((vehicle) => vehicle.status === "draft").length,
    publishedVehicles: vehicles.filter((vehicle) => vehicle.status === "published").length,
    reservedVehicles: vehicles.filter((vehicle) => vehicle.status === "reserved").length,
    soldVehicles: vehicles.filter((vehicle) => vehicle.status === "sold").length,
    totalVehicles: vehicles.length,
    vehiclesMissingDetails: takeTop(
      vehicles
        .map((vehicle) => ({
          adminPath: `/admin/vehicles/${vehicle.id}`,
          missingDescription: !vehicle.description?.trim(),
          missingPhoto:
            !vehicle.featured_image_url &&
            (vehicleMediaCountByVehicleId.get(vehicle.id) ?? 0) === 0,
          missingPrice: vehicle.price === null,
          title: formatVehicleTitle(vehicle),
        }))
        .filter(
          (vehicle) =>
            vehicle.missingDescription || vehicle.missingPhoto || vehicle.missingPrice,
        )
        .sort((left, right) => {
          const leftMissingCount = Number(left.missingDescription) + Number(left.missingPhoto) + Number(left.missingPrice);
          const rightMissingCount = Number(right.missingDescription) + Number(right.missingPhoto) + Number(right.missingPrice);

          return rightMissingCount - leftMissingCount;
        }),
    ),
  };

  const recentInquiries = takeTop(
    [...inquiries]
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .map((inquiry) => ({
        adminPath: `/admin/inquiries/${inquiry.id}`,
        assignedToName: inquiry.assigned_to
          ? profileNameById.get(inquiry.assigned_to) ?? null
          : null,
        createdAt: inquiry.created_at,
        customerName:
          customerById.get(inquiry.customer_id)?.full_name ?? "Unknown customer",
        followUpAt: inquiry.next_follow_up_at,
        inquiryId: inquiry.id,
        sourceLabel: getInquirySourceLabel(inquiry.source_type),
        status: inquiry.status,
        vehicleTitle: inquiry.vehicle_id
          ? vehicleById.get(inquiry.vehicle_id)?.title ?? null
          : null,
      })),
      20,
  );

  const overdueFollowUps = inquiries.filter(
    (inquiry) => getFollowUpBucket(inquiry.next_follow_up_at) === "overdue",
  );
  const dueTodayFollowUps = inquiries.filter(
    (inquiry) => getFollowUpBucket(inquiry.next_follow_up_at) === "today",
  );

  const inquirySummary = {
    contactedInquiries: inquiries.filter((inquiry) => inquiry.status === "contacted").length,
    conversionRate:
      inquiries.length > 0
        ? roundToOneDecimal(
            (inquiries.filter((inquiry) => inquiry.status === "won").length /
              inquiries.length) *
              100,
          )
        : 0,
    dueTodayFollowUps: dueTodayFollowUps.length,
    lostInquiries: inquiries.filter((inquiry) => inquiry.status === "lost").length,
    negotiationInquiries: inquiries.filter((inquiry) => inquiry.status === "negotiation").length,
    newInquiries: inquiries.filter((inquiry) => inquiry.status === "new").length,
    overdueFollowUps: overdueFollowUps.length,
    recentInquiries,
    reservedInquiries: inquiries.filter((inquiry) => inquiry.status === "reserved").length,
    totalInquiries: inquiries.length,
    viewingScheduledInquiries: inquiries.filter((inquiry) => inquiry.status === "viewing_scheduled").length,
    wonInquiries: inquiries.filter((inquiry) => inquiry.status === "won").length,
  };

  const salesByMonthMap = new Map<string, { amount: number; label: string; soldCount: number }>();

  for (const sale of sales) {
    const monthKey = sale.sold_at.slice(0, 7);
    const current = salesByMonthMap.get(monthKey) ?? {
      amount: 0,
      label: formatMonthLabel(sale.sold_at),
      soldCount: 0,
    };
    current.amount += sale.sold_price;
    current.soldCount += 1;
    salesByMonthMap.set(monthKey, current);
  }

  const sortedSales = [...sales].sort((left, right) => right.sold_at.localeCompare(left.sold_at));
  const salesSummary = {
    averageSoldPrice: roundToOneDecimal(average(sales.map((sale) => sale.sold_price))),
    highestSale:
      [...sales].sort((left, right) => right.sold_price - left.sold_price)[0]
        ? {
            soldAt:
              [...sales].sort((left, right) => right.sold_price - left.sold_price)[0]!.sold_at,
            soldPrice:
              [...sales].sort((left, right) => right.sold_price - left.sold_price)[0]!.sold_price,
            vehicleTitle:
              vehicleById.get(
                [...sales].sort((left, right) => right.sold_price - left.sold_price)[0]!.vehicle_id,
              )?.title ?? null,
          }
        : null,
    lowestSale:
      [...sales].sort((left, right) => left.sold_price - right.sold_price)[0]
        ? {
            soldAt:
              [...sales].sort((left, right) => left.sold_price - right.sold_price)[0]!.sold_at,
            soldPrice:
              [...sales].sort((left, right) => left.sold_price - right.sold_price)[0]!.sold_price,
            vehicleTitle:
              vehicleById.get(
                [...sales].sort((left, right) => left.sold_price - right.sold_price)[0]!.vehicle_id,
              )?.title ?? null,
          }
        : null,
    recentSales: takeTop(
      sortedSales.map((sale) => ({
        adminPath: `/admin/vehicles/${sale.vehicle_id}`,
        customerName: sale.customer_id
          ? customerById.get(sale.customer_id)?.full_name ?? null
          : null,
        inquirySourceLabel: sale.inquiry_id
          ? getInquirySourceLabel(inquiryById.get(sale.inquiry_id)?.source_type ?? "other")
          : null,
        soldAt: sale.sold_at,
        soldPrice: sale.sold_price,
        vehicleTitle: vehicleById.get(sale.vehicle_id)?.title ?? null,
      })),
    ),
    salesByMonth: takeTop(
      Array.from(salesByMonthMap.entries())
        .sort((left, right) => right[0].localeCompare(left[0]))
        .map(([, value]) => value),
      6,
    ),
    soldVehicleCount: sales.length,
    totalSalesAmount: sum(sales.map((sale) => sale.sold_price)),
  };

  const leadSourceRows = Array.from(
    inquiries.reduce((map, inquiry) => {
      const current = map.get(inquiry.source_type) ?? {
        activeInquiries: 0,
        conversionRate: 0,
        salesAmount: 0,
        sourceLabel: getInquirySourceLabel(inquiry.source_type),
        sourceType: inquiry.source_type,
        totalInquiries: 0,
        wonInquiries: 0,
      };

      current.totalInquiries += 1;

      if (inquiry.status === "won") {
        current.wonInquiries += 1;
      } else if (inquiry.status !== "lost") {
        current.activeInquiries += 1;
      }

      current.salesAmount += saleAmountByInquiryId.get(inquiry.id) ?? 0;
      map.set(inquiry.source_type, current);

      return map;
    }, new Map<Inquiry["source_type"], DealershipAiContext["leadSourceSummary"]["rows"][number]>()),
  )
    .map(([, value]) => ({
      ...value,
      conversionRate:
        value.totalInquiries > 0
          ? roundToOneDecimal((value.wonInquiries / value.totalInquiries) * 100)
          : 0,
    }))
    .sort((left, right) => right.totalInquiries - left.totalInquiries);

  const topLeadSource = leadSourceRows[0]?.sourceLabel ?? null;

  const topOverdueFollowUps = takeTop(
    [...inquiries]
      .filter((inquiry) => getFollowUpBucket(inquiry.next_follow_up_at) === "overdue")
      .sort((left, right) =>
        (left.next_follow_up_at ?? "").localeCompare(right.next_follow_up_at ?? ""),
      )
      .map((inquiry) => ({
        adminPath: `/admin/inquiries/${inquiry.id}`,
        assignedToName: inquiry.assigned_to
          ? profileNameById.get(inquiry.assigned_to) ?? null
          : null,
        bucket: getFollowUpBucket(inquiry.next_follow_up_at),
        customerName:
          customerById.get(inquiry.customer_id)?.full_name ?? "Unknown customer",
        followUpAt: inquiry.next_follow_up_at,
        inquiryId: inquiry.id,
        sourceType: inquiry.source_type,
        status: inquiry.status,
        vehicleTitle: inquiry.vehicle_id
          ? vehicleById.get(inquiry.vehicle_id)?.title ?? null
          : null,
      })),
    10,
  );

  const sortableVehicleReferences = vehicles.map((vehicle) => ({
    daysListed: daysSince(vehicle.created_at),
    hasCompleteListing:
      Boolean(vehicle.description?.trim()) &&
      (vehicle.price !== null) &&
      (Boolean(vehicle.featured_image_url) ||
        (vehicleMediaCountByVehicleId.get(vehicle.id) ?? 0) > 0),
    hasSale: saleByVehicleId.has(vehicle.id),
    reference: buildVehicleReference({
      dealershipSlug: access.dealership.slug,
      facebookPostCount: facebookPostCountByVehicleId.get(vehicle.id) ?? 0,
      inquiryCount: inquiryCountByVehicleId.get(vehicle.id) ?? 0,
      vehicle,
    }),
  }));

  const vehiclePerformanceSummary = {
    highInquiryNoSaleVehicles: takeTop(
      sortableVehicleReferences
        .filter((item) => item.reference.inquiryCount > 0 && !item.hasSale)
        .sort((left, right) => right.reference.inquiryCount - left.reference.inquiryCount)
        .map((item) => item.reference),
    ),
    noInquiryVehicles: takeTop(
      sortableVehicleReferences
        .filter(
          (item) =>
            item.reference.inquiryCount === 0 &&
            item.reference.availability === "available" &&
            item.reference.status !== "archived",
        )
        .sort((left, right) => right.daysListed - left.daysListed)
        .map((item) => item.reference),
    ),
    slowMovingVehicles: takeTop(
      sortableVehicleReferences
        .filter(
          (item) =>
            item.daysListed >= 30 &&
            item.reference.availability === "available" &&
            !item.hasSale,
        )
        .sort((left, right) => right.daysListed - left.daysListed)
        .map((item) => item.reference),
    ),
    topInquiryVehicles: takeTop(
      sortableVehicleReferences
        .filter((item) => item.reference.inquiryCount > 0)
        .sort((left, right) => right.reference.inquiryCount - left.reference.inquiryCount)
        .map((item) => item.reference),
    ),
  };

  const promotionCandidates = takeTop(
    sortableVehicleReferences
      .filter(
        (item) =>
          item.reference.status === "published" &&
          item.reference.availability === "available" &&
          item.hasCompleteListing,
      )
      .sort((left, right) => {
        if (left.reference.inquiryCount !== right.reference.inquiryCount) {
          return left.reference.inquiryCount - right.reference.inquiryCount;
        }

        if (left.reference.facebookPostCount !== right.reference.facebookPostCount) {
          return left.reference.facebookPostCount - right.reference.facebookPostCount;
        }

        return right.daysListed - left.daysListed;
      })
      .map((item) => item.reference),
    8,
  );

  const messengerClickCount = leadSourceEvents.filter(
    (event) =>
      event.source_type === "facebook_messenger" &&
      event.event_name === "messenger_cta_clicked",
  ).length;

  const facebookSummary = {
    failedPublishedPosts: facebookPostPublications.filter(
      (publication) => publication.status === "failed",
    ).length,
    generatedContentCount: generatedFacebookContentCount,
    messengerClickCount,
    messengerConversationCount: messengerConversations.length,
    messengerConvertedInquiryCount: messengerConversations.filter(
      (conversation) => conversation.inquiry_id !== null || conversation.status === "converted",
    ).length,
    publishedPostCount: facebookPostPublications.filter(
      (publication) => publication.status === "published",
    ).length,
    recentFailedPublishes: takeTop(
      facebookPostPublications
        .filter((publication) => publication.status === "failed")
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .map((publication) => ({
          createdAt: publication.created_at,
          errorMessage: publication.error_message,
          vehicleTitle: publication.vehicle_id
            ? vehicleById.get(publication.vehicle_id)?.title ?? null
            : null,
        })),
      5,
    ),
    totalFacebookLeadForms: facebookLeads.length,
  };

  const brochureVehicleIds = new Set(
    brochureExports.flatMap((exportRecord) => exportRecord.vehicle_ids),
  );

  const brochureSummary = {
    recentExports: takeTop(
      brochureExports
        .filter((exportRecord) => exportRecord.status === "generated")
        .sort((left, right) =>
          (right.generated_at ?? right.created_at).localeCompare(
            left.generated_at ?? left.created_at,
          ),
        )
        .map((exportRecord) => ({
          createdAt: exportRecord.generated_at ?? exportRecord.created_at,
          exportType: exportRecord.export_type,
          title: exportRecord.title,
          vehicleCount: exportRecord.vehicle_ids.length,
        })),
      10,
    ),
    totalBrochures: brochureExports.filter((exportRecord) => exportRecord.status === "generated").length,
    vehiclesWithBrochures: brochureVehicleIds.size,
  };

  return {
    brochureSummary,
    dealership: {
      name: access.dealership.name,
      publicBaseUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
      slug: access.dealership.slug,
    },
    facebookSummary,
    generatedAt: new Date().toISOString(),
    inquirySummary,
    inventorySummary,
    leadSourceSummary: {
      rows: leadSourceRows,
      topSource: topLeadSource,
    },
    promotionCandidates,
    salesSummary,
    topOverdueFollowUps,
    vehiclePerformanceSummary,
  };
}

export function buildAiContextSummary(input: {
  configured: boolean;
  context: DealershipAiContext;
}): AiContextSummary {
  const hasOperationalData =
    input.context.inventorySummary.totalVehicles > 0 ||
    input.context.inquirySummary.totalInquiries > 0 ||
    input.context.salesSummary.soldVehicleCount > 0 ||
    input.context.facebookSummary.totalFacebookLeadForms > 0 ||
    input.context.brochureSummary.totalBrochures > 0;

  return {
    configured: input.configured,
    hasOperationalData,
    metricCards: [
      {
        label: "Vehicles",
        value: String(input.context.inventorySummary.totalVehicles),
      },
      {
        label: "Inquiries",
        value: String(input.context.inquirySummary.totalInquiries),
      },
      {
        label: "Won inquiries",
        value: String(input.context.inquirySummary.wonInquiries),
      },
      {
        label: "Sales amount",
        value: formatVehicleCurrency(input.context.salesSummary.totalSalesAmount),
      },
      {
        label: "Overdue follow-ups",
        value: String(input.context.inquirySummary.overdueFollowUps),
      },
      {
        label: "Facebook leads",
        value: String(input.context.facebookSummary.totalFacebookLeadForms),
      },
    ],
    topLeadSource: input.context.leadSourceSummary.topSource,
    totalBrochures: input.context.brochureSummary.totalBrochures,
    totalFacebookLeadForms: input.context.facebookSummary.totalFacebookLeadForms,
    totalSalesAmount: input.context.salesSummary.totalSalesAmount,
    totalVehicles: input.context.inventorySummary.totalVehicles,
    totalWonInquiries: input.context.inquirySummary.wonInquiries,
  };
}
