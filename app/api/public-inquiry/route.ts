import { NextResponse } from "next/server";

import type { CustomerUpdate } from "@/features/customers/types";
import { buildCustomerNameParts } from "@/features/inquiries/utils";
import { publicInquirySchema } from "@/features/inquiries/public-validators";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const WEBSITE_INQUIRY_NOTE =
  "Website inquiry submitted from public vehicle page.";
const WEBSITE_SOURCE_DETAIL = "Public vehicle detail page";

type DealershipLookup = {
  id: string;
  slug: string;
};

type VehicleLookup = {
  id: string;
  slug: string;
};

type CustomerLookup = {
  email: string | null;
  first_name: string | null;
  full_name: string;
  id: string;
  last_name: string | null;
  phone: string | null;
};

function buildSuccessResponse(): NextResponse {
  return NextResponse.json({
    message:
      "Thank you! The dealership has received your inquiry and will contact you soon.",
    success: true,
  });
}

function buildErrorResponse(input: {
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
  status: number;
}): NextResponse {
  return NextResponse.json(
    {
      error: input.error,
      fieldErrors: input.fieldErrors ?? {},
      success: false,
    },
    {
      status: input.status,
    },
  );
}

function toMetadataRecord(metadata: Json | null | undefined): Record<string, Json> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, Json>;
}

function toIsoDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function findExistingCustomer(input: {
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>;
  dealershipId: string;
  email: string | null;
  phone: string;
}): Promise<CustomerLookup | null> {
  const { adminSupabase, dealershipId, email, phone } = input;
  const { data: phoneMatches, error: phoneLookupError } = await adminSupabase
    .from("customers")
    .select("id, full_name, first_name, last_name, phone, email")
    .eq("dealership_id", dealershipId)
    .eq("phone", phone)
    .order("created_at", { ascending: true })
    .limit(1);

  if (phoneLookupError) {
    throw new Error("customer_phone_lookup_failed");
  }

  const phoneMatch = phoneMatches?.[0] ?? null;

  if (phoneMatch) {
    return phoneMatch;
  }

  if (!email) {
    return null;
  }

  const { data: emailMatches, error: emailLookupError } = await adminSupabase
    .from("customers")
    .select("id, full_name, first_name, last_name, phone, email")
    .eq("dealership_id", dealershipId)
    .ilike("email", email)
    .order("created_at", { ascending: true })
    .limit(1);

  if (emailLookupError) {
    throw new Error("customer_email_lookup_failed");
  }

  return emailMatches?.[0] ?? null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return buildErrorResponse({
      error: "Invalid request payload.",
      status: 400,
    });
  }

  const parsed = publicInquirySchema.safeParse(body);

  if (!parsed.success) {
    return buildErrorResponse({
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      status: 422,
    });
  }

  if (parsed.data.company_website.trim().length > 0) {
    return buildSuccessResponse();
  }

  const adminSupabase = createSupabaseAdminClient();

  const { data: dealership } = await adminSupabase
    .from("dealerships")
    .select("id, slug")
    .eq("slug", parsed.data.dealerSlug)
    .maybeSingle<DealershipLookup>();

  if (!dealership) {
    return buildErrorResponse({
      error: "This dealership is not available right now.",
      status: 404,
    });
  }

  const { data: vehicle } = await adminSupabase
    .from("vehicles")
    .select("id, slug")
    .eq("dealership_id", dealership.id)
    .eq("slug", parsed.data.vehicleSlug)
    .eq("status", "published")
    .eq("availability", "available")
    .maybeSingle<VehicleLookup>();

  if (!vehicle) {
    return buildErrorResponse({
      error: "This vehicle is no longer available for inquiries.",
      status: 409,
    });
  }

  const normalizedEmail = parsed.data.email?.toLowerCase() ?? null;
  const { firstName, lastName } = buildCustomerNameParts(parsed.data.full_name);
  const preferredViewingDateIso = toIsoDateTime(parsed.data.preferred_viewing_date);

  try {
    const existingCustomer = await findExistingCustomer({
      adminSupabase,
      dealershipId: dealership.id,
      email: normalizedEmail,
      phone: parsed.data.phone,
    });

    let customerId = existingCustomer?.id ?? null;

    if (existingCustomer) {
      const customerUpdates: CustomerUpdate = {};

      if (!existingCustomer.phone && parsed.data.phone) {
        customerUpdates.phone = parsed.data.phone;
      }

      if (!existingCustomer.email && normalizedEmail) {
        customerUpdates.email = normalizedEmail;
      }

      if (!existingCustomer.first_name && firstName) {
        customerUpdates.first_name = firstName;
      }

      if (!existingCustomer.last_name && lastName) {
        customerUpdates.last_name = lastName;
      }

      if (!existingCustomer.full_name.trim()) {
        customerUpdates.full_name = parsed.data.full_name;
      }

      if (Object.keys(customerUpdates).length > 0) {
        const { error: customerUpdateError } = await adminSupabase
          .from("customers")
          .update(customerUpdates)
          .eq("id", existingCustomer.id);

        if (customerUpdateError) {
          throw new Error("customer_update_failed");
        }
      }
    } else {
      const { data: createdCustomer, error: createdCustomerError } =
        await adminSupabase
          .from("customers")
          .insert({
            dealership_id: dealership.id,
            email: normalizedEmail,
            first_name: firstName,
            full_name: parsed.data.full_name,
            last_name: lastName,
            phone: parsed.data.phone,
            source_type: "website_inquiry_form",
          })
          .select("id")
          .single<{ id: string }>();

      if (createdCustomerError || !createdCustomer) {
        throw new Error("customer_create_failed");
      }

      customerId = createdCustomer.id;
    }

    if (!customerId) {
      throw new Error("customer_missing");
    }

    const { data: inquiry, error: inquiryError } = await adminSupabase
      .from("inquiries")
      .insert({
        budget_range: parsed.data.budget_range,
        customer_id: customerId,
        dealership_id: dealership.id,
        next_follow_up_at: preferredViewingDateIso,
        original_message: parsed.data.message,
        payment_preference: parsed.data.payment_preference,
        source_detail: WEBSITE_SOURCE_DETAIL,
        source_type: "website_inquiry_form",
        status: "new",
        vehicle_id: vehicle.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (inquiryError || !inquiry) {
      throw new Error("inquiry_create_failed");
    }

    const eventMetadata = {
      dealerSlug: dealership.slug,
      page: "vehicle_detail",
      preferredViewingDate: parsed.data.preferred_viewing_date,
      source: "website_inquiry_form",
      vehicleSlug: vehicle.slug,
    } satisfies Record<string, Json>;

    const { data: createdEvent } = await adminSupabase
      .from("inquiry_events")
      .select("id, metadata")
      .eq("dealership_id", dealership.id)
      .eq("inquiry_id", inquiry.id)
      .eq("event_type", "created")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; metadata: Json }>();

    if (createdEvent) {
      const { error: createdEventUpdateError } = await adminSupabase
        .from("inquiry_events")
        .update({
          metadata: {
            ...toMetadataRecord(createdEvent.metadata),
            ...eventMetadata,
          },
          note: WEBSITE_INQUIRY_NOTE,
        })
        .eq("id", createdEvent.id);

      if (createdEventUpdateError) {
        throw new Error("inquiry_event_update_failed");
      }
    } else {
      const { error: inquiryEventInsertError } = await adminSupabase
        .from("inquiry_events")
        .insert({
        dealership_id: dealership.id,
        event_type: "created",
        inquiry_id: inquiry.id,
        metadata: eventMetadata,
        note: WEBSITE_INQUIRY_NOTE,
      });

      if (inquiryEventInsertError) {
        throw new Error("inquiry_event_insert_failed");
      }
    }

    const leadSourceMetadata = {
      dealerSlug: dealership.slug,
      page: "vehicle_detail",
      preferredViewingDate: parsed.data.preferred_viewing_date,
      vehicleSlug: vehicle.slug,
    } satisfies Record<string, Json>;

    const { data: leadSourceEvent } = await adminSupabase
      .from("lead_source_events")
      .select("id, metadata")
      .eq("dealership_id", dealership.id)
      .eq("inquiry_id", inquiry.id)
      .eq("source_type", "website_inquiry_form")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; metadata: Json }>();

    if (leadSourceEvent) {
      const { error: leadSourceEventUpdateError } = await adminSupabase
        .from("lead_source_events")
        .update({
          event_name: "public_vehicle_inquiry_submitted",
          metadata: {
            ...toMetadataRecord(leadSourceEvent.metadata),
            ...leadSourceMetadata,
          },
          source_detail: WEBSITE_SOURCE_DETAIL,
        })
        .eq("id", leadSourceEvent.id);

      if (leadSourceEventUpdateError) {
        throw new Error("lead_source_event_update_failed");
      }
    } else {
      const { error: leadSourceEventInsertError } = await adminSupabase
        .from("lead_source_events")
        .insert({
        customer_id: customerId,
        dealership_id: dealership.id,
        event_name: "public_vehicle_inquiry_submitted",
        inquiry_id: inquiry.id,
        metadata: leadSourceMetadata,
        source_detail: WEBSITE_SOURCE_DETAIL,
        source_type: "website_inquiry_form",
        vehicle_id: vehicle.id,
      });

      if (leadSourceEventInsertError) {
        throw new Error("lead_source_event_insert_failed");
      }
    }
  } catch {
    return buildErrorResponse({
      error: "Unable to send your inquiry right now.",
      status: 500,
    });
  }

  return buildSuccessResponse();
}
