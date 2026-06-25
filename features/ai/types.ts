import type { InquirySourceType, InquiryStatus } from "@/features/inquiries/types";
import type { Database } from "@/lib/supabase/database.types";

export type AiChatSession =
  Database["public"]["Tables"]["ai_chat_sessions"]["Row"];
export type AiChatSessionInsert =
  Database["public"]["Tables"]["ai_chat_sessions"]["Insert"];
export type AiChatMessage =
  Database["public"]["Tables"]["ai_chat_messages"]["Row"];
export type AiChatMessageInsert =
  Database["public"]["Tables"]["ai_chat_messages"]["Insert"];
export type AiChatMessageRole = AiChatMessage["role"];

export type AiChatSessionListItem = Pick<
  AiChatSession,
  "created_at" | "id" | "title" | "updated_at"
> & {
  lastMessagePreview: string | null;
  messageCount: number;
};

export type AiChatMessageRecord = Pick<
  AiChatMessage,
  "content" | "created_at" | "id" | "metadata" | "role"
>;

export type AiMetricCard = {
  label: string;
  value: string;
};

export type AiVehicleReference = {
  adminPath: string;
  availability: string;
  facebookPostCount: number;
  id: string;
  inquiryCount: number;
  price: number | null;
  publicPath: string;
  publicUrl: string | null;
  status: string;
  title: string;
  year: number | null;
};

export type AiFollowUpReference = {
  adminPath: string;
  assignedToName: string | null;
  bucket: "future" | "none" | "overdue" | "today";
  customerName: string;
  followUpAt: string | null;
  inquiryId: string;
  sourceType: InquirySourceType;
  status: InquiryStatus;
  vehicleTitle: string | null;
};

export type AiLeadSourceSummaryRow = {
  activeInquiries: number;
  conversionRate: number;
  salesAmount: number;
  sourceLabel: string;
  sourceType: InquirySourceType;
  totalInquiries: number;
  wonInquiries: number;
};

export type DealershipAiContext = {
  brochureSummary: {
    recentExports: Array<{
      createdAt: string;
      exportType: "single_vehicle" | "multi_vehicle";
      title: string | null;
      vehicleCount: number;
    }>;
    totalBrochures: number;
    vehiclesWithBrochures: number;
  };
  dealership: {
    name: string;
    publicBaseUrl: string | null;
    slug: string;
  };
  facebookSummary: {
    failedPublishedPosts: number;
    generatedContentCount: number;
    messengerClickCount: number;
    messengerConversationCount: number;
    messengerConvertedInquiryCount: number;
    publishedPostCount: number;
    recentFailedPublishes: Array<{
      createdAt: string;
      errorMessage: string | null;
      vehicleTitle: string | null;
    }>;
    totalFacebookLeadForms: number;
  };
  generatedAt: string;
  inquirySummary: {
    contactedInquiries: number;
    conversionRate: number;
    dueTodayFollowUps: number;
    lostInquiries: number;
    negotiationInquiries: number;
    newInquiries: number;
    overdueFollowUps: number;
    recentInquiries: Array<{
      adminPath: string;
      assignedToName: string | null;
      createdAt: string;
      customerName: string;
      followUpAt: string | null;
      inquiryId: string;
      sourceLabel: string;
      status: InquiryStatus;
      vehicleTitle: string | null;
    }>;
    reservedInquiries: number;
    totalInquiries: number;
    viewingScheduledInquiries: number;
    wonInquiries: number;
  };
  inventorySummary: {
    archivedVehicles: number;
    availableInventoryValue: number;
    availableVehicles: number;
    averagePrice: number;
    draftVehicles: number;
    publishedVehicles: number;
    reservedVehicles: number;
    soldVehicles: number;
    totalVehicles: number;
    vehiclesMissingDetails: Array<{
      adminPath: string;
      missingDescription: boolean;
      missingPhoto: boolean;
      missingPrice: boolean;
      title: string;
    }>;
  };
  leadSourceSummary: {
    rows: AiLeadSourceSummaryRow[];
    topSource: string | null;
  };
  promotionCandidates: AiVehicleReference[];
  salesSummary: {
    averageSoldPrice: number;
    highestSale: {
      soldPrice: number;
      soldAt: string;
      vehicleTitle: string | null;
    } | null;
    lowestSale: {
      soldPrice: number;
      soldAt: string;
      vehicleTitle: string | null;
    } | null;
    recentSales: Array<{
      adminPath: string;
      customerName: string | null;
      inquirySourceLabel: string | null;
      soldAt: string;
      soldPrice: number;
      vehicleTitle: string | null;
    }>;
    salesByMonth: Array<{
      amount: number;
      label: string;
      soldCount: number;
    }>;
    soldVehicleCount: number;
    totalSalesAmount: number;
  };
  topOverdueFollowUps: AiFollowUpReference[];
  vehiclePerformanceSummary: {
    highInquiryNoSaleVehicles: AiVehicleReference[];
    noInquiryVehicles: AiVehicleReference[];
    slowMovingVehicles: AiVehicleReference[];
    topInquiryVehicles: AiVehicleReference[];
  };
};

export type AiContextSummary = {
  configured: boolean;
  hasOperationalData: boolean;
  metricCards: AiMetricCard[];
  topLeadSource: string | null;
  totalBrochures: number;
  totalFacebookLeadForms: number;
  totalSalesAmount: number;
  totalVehicles: number;
  totalWonInquiries: number;
};

export type AiAskResponse = {
  answer?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  messages: AiChatMessageRecord[];
  sessionId: string | null;
  sessions: AiChatSessionListItem[];
  setupRequired: boolean;
};
