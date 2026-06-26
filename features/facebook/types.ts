import type {
  Inquiry,
  InquiryStatus,
  PaymentPreference,
  VehicleOption,
} from "@/features/inquiries/types";
import type { Customer, CustomerDuplicateMatch } from "@/features/customers/types";
import type { Vehicle } from "@/features/vehicles/types";
import type { Database } from "@/lib/supabase/database.types";

export type FacebookConnection =
  Database["public"]["Tables"]["facebook_connections"]["Row"];
export type FacebookConnectionInsert =
  Database["public"]["Tables"]["facebook_connections"]["Insert"];
export type FacebookConnectionUpdate =
  Database["public"]["Tables"]["facebook_connections"]["Update"];
export type FacebookGeneratedContent =
  Database["public"]["Tables"]["facebook_generated_content"]["Row"];
export type FacebookGeneratedContentInsert =
  Database["public"]["Tables"]["facebook_generated_content"]["Insert"];
export type FacebookLeadFormMapping =
  Database["public"]["Tables"]["facebook_lead_form_mappings"]["Row"];
export type FacebookLeadFormMappingInsert =
  Database["public"]["Tables"]["facebook_lead_form_mappings"]["Insert"];
export type FacebookLeadFormMappingUpdate =
  Database["public"]["Tables"]["facebook_lead_form_mappings"]["Update"];
export type FacebookLead =
  Database["public"]["Tables"]["facebook_leads"]["Row"];
export type FacebookLeadInsert =
  Database["public"]["Tables"]["facebook_leads"]["Insert"];
export type FacebookLeadUpdate =
  Database["public"]["Tables"]["facebook_leads"]["Update"];
export type FacebookPostComment =
  Database["public"]["Tables"]["facebook_post_comments"]["Row"];
export type FacebookPostCommentInsert =
  Database["public"]["Tables"]["facebook_post_comments"]["Insert"];
export type FacebookPostCommentUpdate =
  Database["public"]["Tables"]["facebook_post_comments"]["Update"];
export type FacebookApiLog = Database["public"]["Tables"]["facebook_api_logs"]["Row"];
export type FacebookApiLogInsert =
  Database["public"]["Tables"]["facebook_api_logs"]["Insert"];
export type FacebookWebhookEvent =
  Database["public"]["Tables"]["facebook_webhook_events"]["Row"];
export type FacebookWebhookEventInsert =
  Database["public"]["Tables"]["facebook_webhook_events"]["Insert"];
export type FacebookPostPublication =
  Database["public"]["Tables"]["facebook_post_publications"]["Row"];
export type FacebookPostPublicationInsert =
  Database["public"]["Tables"]["facebook_post_publications"]["Insert"];
export type FacebookPostPublicationUpdate =
  Database["public"]["Tables"]["facebook_post_publications"]["Update"];
export type MessengerConversation =
  Database["public"]["Tables"]["messenger_conversations"]["Row"];
export type MessengerConversationInsert =
  Database["public"]["Tables"]["messenger_conversations"]["Insert"];
export type MessengerConversationUpdate =
  Database["public"]["Tables"]["messenger_conversations"]["Update"];
export type MessengerMessage =
  Database["public"]["Tables"]["messenger_messages"]["Row"];
export type MessengerMessageInsert =
  Database["public"]["Tables"]["messenger_messages"]["Insert"];
export type FacebookConnectionStatus = FacebookConnection["status"];
export type FacebookGeneratedContentType =
  FacebookGeneratedContent["content_type"];
export type FacebookLeadStatus = FacebookLead["status"];
export type FacebookCommentStatus = FacebookPostComment["status"];
export type FacebookPublishType = FacebookPostPublication["publish_type"];
export type FacebookPublicationStatus = FacebookPostPublication["status"];
export type FacebookMessengerConversationStatus = MessengerConversation["status"];

export type FacebookGeneratedContentWithRelations = FacebookGeneratedContent & {
  createdByName: string | null;
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookMessengerClickItem = {
  createdAt: string;
  id: string;
  sourceDetail: string | null;
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookLeadRecord = FacebookLead & {
  customer: Pick<Customer, "email" | "full_name" | "id" | "phone"> | null;
  inquiry: Pick<Inquiry, "created_at" | "id" | "status"> | null;
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookLeadFormMappingRecord = FacebookLeadFormMapping & {
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookLeadFieldMap = {
  budget_range: string[];
  email: string[];
  full_name: string[];
  message: string[];
  payment_preference: string[];
  phone: string[];
};

export type FacebookLeadFormMappingValues = {
  field_map_json: string;
  form_id: string;
  form_name: string;
  is_active: "true" | "false";
  mapping_id: string;
  redirect_to: string;
  vehicle_id: string;
};

export type FacebookLeadFormMappingFilters = {
  edit: string;
};

export type FacebookLeadListFilters = {
  status: FacebookLeadStatus | "all";
};

export type FacebookLeadListResult = {
  failedCount: number;
  filters: FacebookLeadListFilters;
  leads: FacebookLeadRecord[];
  latestReceivedAt: string | null;
  processedCount: number;
  receivedCount: number;
  totalCount: number;
};

export type FacebookLeadFormMappingsResult = {
  editingMapping: FacebookLeadFormMappingRecord | null;
  filters: FacebookLeadFormMappingFilters;
  mappings: FacebookLeadFormMappingRecord[];
  totalCount: number;
  vehicleOptions: VehicleOption[];
};

export type FacebookLeadLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { record: FacebookLeadRecord; type: "ok" };

export type FacebookLeadProcessingSummary = {
  customerId: string | null;
  errorMessage?: string;
  inquiryId: string | null;
  leadId: string | null;
  status: "duplicate" | "failed" | "processed";
};

export type FacebookPostCommentRecord = FacebookPostComment & {
  customer: Pick<Customer, "email" | "full_name" | "id" | "phone"> | null;
  inquiry: Pick<Inquiry, "created_at" | "id" | "status"> | null;
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookCommentListFilters = {
  status: FacebookCommentStatus | "all";
};

export type FacebookCommentListResult = {
  comments: FacebookPostCommentRecord[];
  failedCount: number;
  filters: FacebookCommentListFilters;
  latestReceivedAt: string | null;
  processedCount: number;
  receivedCount: number;
  totalCount: number;
};

export type FacebookPostCommentProcessingSummary = {
  commentId: string | null;
  customerId: string | null;
  errorMessage?: string;
  inquiryId: string | null;
  status: "duplicate" | "failed" | "ignored" | "processed";
};

export type FacebookMessengerConversationRecord = MessengerConversation & {
  linkedCustomer: Pick<Customer, "email" | "full_name" | "id" | "phone"> | null;
  linkedInquiry: Pick<Inquiry, "created_at" | "id" | "status"> | null;
  messageCount: number;
  resolvedVehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookMessengerMessageRecord = MessengerMessage & {
  resolvedVehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookMessengerInboxFilters = {
  q: string;
  status: FacebookMessengerConversationStatus | "all";
};

export type FacebookMessengerInboxResult = {
  filters: FacebookMessengerInboxFilters;
  latestReceivedAt: string | null;
  totalConversationCount: number;
  totalMessageCount: number;
  totalWebhookEventCount: number;
  conversations: FacebookMessengerConversationRecord[];
};

export type MessengerConversationDetailRecord = {
  conversation: FacebookMessengerConversationRecord;
  messages: FacebookMessengerMessageRecord[];
};

export type MessengerConversationLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { record: MessengerConversationDetailRecord; type: "ok" };

export type MessengerConversationActionValues = {
  conversation_id: string;
  redirect_to: string;
};

export type MessengerConversationConversionValues = {
  assigned_to: string;
  budget_range: string;
  conversation_id: string;
  customer_name: string;
  duplicate_resolution: "create_new" | "use_existing" | "";
  email: string;
  existing_customer_id: string;
  interested_vehicle_id: string;
  message: string;
  next_follow_up_at: string;
  payment_preference: PaymentPreference | "";
  phone: string;
  redirect_to: string;
  source_detail: string;
  status: InquiryStatus;
};

export type MessengerConversationConversionFormState = {
  duplicates?: CustomerDuplicateMatch[];
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: MessengerConversationConversionValues;
};

export type FacebookReadinessItem = {
  detail?: string;
  key: string;
  label: string;
  passed: boolean;
};

export type FacebookPublishReadinessItem = FacebookReadinessItem;

export type FacebookPublicationRecordWithRelations = FacebookPostPublication & {
  generatedContent: Pick<FacebookGeneratedContent, "content" | "content_type" | "id"> | null;
  publishedByName: string | null;
  vehicle: Pick<Vehicle, "id" | "slug" | "title"> | null;
};

export type FacebookSalesHubData = {
  connection: FacebookConnection | null;
  failedPublicationsCount: number;
  failedLeadCount: number;
  latestFacebookLead: FacebookLeadRecord | null;
  hasPageAccessToken: boolean;
  hasSiteUrl: boolean;
  lastFailedPublication: FacebookPublicationRecordWithRelations | null;
  lastSuccessfulPublication: FacebookPublicationRecordWithRelations | null;
  pagePublishingConfigured: boolean;
  processedLeadCount: number;
  publishedAvailableVehiclesCount: number;
  publishedPostsCount: number;
  recentFacebookLeads: FacebookLeadRecord[];
  recentFailedPublications: FacebookPublicationRecordWithRelations[];
  recentGeneratedContent: FacebookGeneratedContentWithRelations[];
  recentMessengerClicks: FacebookMessengerClickItem[];
  recentPublishedPosts: FacebookPublicationRecordWithRelations[];
  resolvedFacebookPageId: string | null;
  totalFacebookLeadsCount: number;
  vehiclesMissingReadinessCount: number;
};

export type FacebookContentHistoryFilters = {
  contentType: FacebookGeneratedContentType | "all";
  vehicleId: string;
};

export type FacebookContentHistoryResult = {
  content: FacebookGeneratedContentWithRelations[];
  filters: FacebookContentHistoryFilters;
  totalCount: number;
  vehicleOptions: VehicleOption[];
};

export type FacebookPublicationHistoryFilters = {
  status: FacebookPublicationStatus | "all";
  vehicleId: string;
};

export type FacebookPublicationHistoryResult = {
  filters: FacebookPublicationHistoryFilters;
  publications: FacebookPublicationRecordWithRelations[];
  totalCount: number;
  vehicleOptions: VehicleOption[];
};

export type FacebookPublishPreparedContent = {
  content: string;
  contentType: FacebookGeneratedContentType | "manual";
  id: string;
  label: string;
};

export type VehicleFacebookContext = {
  connection: FacebookConnection | null;
  generatedContentOptions: FacebookPublishPreparedContent[];
  hasPageAccessToken: boolean;
  hasSiteUrl: boolean;
  latestContent: Partial<Record<FacebookGeneratedContentType, FacebookGeneratedContent>>;
  publications: FacebookPublicationRecordWithRelations[];
  publicVehicleUrl: string | null;
  publishReadiness: FacebookPublishReadinessItem[];
  resolvedFacebookPageId: string | null;
  messengerLink: string | null;
};
