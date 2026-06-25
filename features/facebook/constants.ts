export const FACEBOOK_CONNECTION_STATUSES = [
  "not_connected",
  "configured",
  "connected",
  "error",
] as const;

export const FACEBOOK_GENERATED_CONTENT_TYPES = [
  "facebook_caption",
  "marketplace_description",
  "ad_primary_text",
  "ad_headline",
  "messenger_intro",
] as const;

export const FACEBOOK_PUBLISH_TYPES = [
  "text_link_post",
  "photo_post",
] as const;

export const FACEBOOK_PUBLICATION_STATUSES = [
  "pending",
  "published",
  "failed",
] as const;

export const FACEBOOK_MESSENGER_CONVERSATION_STATUSES = [
  "new",
  "reviewed",
  "converted",
  "ignored",
] as const;

export const FACEBOOK_LEAD_STATUSES = [
  "received",
  "processed",
  "duplicate",
  "failed",
] as const;

export const FACEBOOK_CONNECTION_STATUS_LABELS: Record<
  (typeof FACEBOOK_CONNECTION_STATUSES)[number],
  string
> = {
  configured: "Configured",
  connected: "Connected",
  error: "Error",
  not_connected: "Not Connected",
};

export const FACEBOOK_GENERATED_CONTENT_LABELS: Record<
  (typeof FACEBOOK_GENERATED_CONTENT_TYPES)[number],
  string
> = {
  ad_headline: "Ad Headline",
  ad_primary_text: "Ad Primary Text",
  facebook_caption: "Facebook Caption",
  marketplace_description: "Marketplace Description",
  messenger_intro: "Messenger Intro",
};

export const FACEBOOK_PUBLISH_TYPE_LABELS: Record<
  (typeof FACEBOOK_PUBLISH_TYPES)[number],
  string
> = {
  photo_post: "Photo Post",
  text_link_post: "Text + Link Post",
};

export const FACEBOOK_PUBLICATION_STATUS_LABELS: Record<
  (typeof FACEBOOK_PUBLICATION_STATUSES)[number],
  string
> = {
  failed: "Failed",
  pending: "Pending",
  published: "Published",
};

export const FACEBOOK_MESSENGER_CONVERSATION_STATUS_LABELS: Record<
  (typeof FACEBOOK_MESSENGER_CONVERSATION_STATUSES)[number],
  string
> = {
  converted: "Converted",
  ignored: "Ignored",
  new: "New",
  reviewed: "Reviewed",
};

export const FACEBOOK_LEAD_STATUS_LABELS: Record<
  (typeof FACEBOOK_LEAD_STATUSES)[number],
  string
> = {
  duplicate: "Duplicate",
  failed: "Failed",
  processed: "Processed",
  received: "Received",
};

export const FACEBOOK_HUB_COMING_SOON_ITEMS = [
  "Messenger Chatbot Capture",
  "Ad Draft Creation",
] as const;

export const FACEBOOK_CONTENT_FILTER_OPTIONS = [
  { label: "All content types", value: "all" },
  { label: "Facebook Caption", value: "facebook_caption" },
  { label: "Marketplace Description", value: "marketplace_description" },
  { label: "Ad Primary Text", value: "ad_primary_text" },
  { label: "Ad Headline", value: "ad_headline" },
  { label: "Messenger Intro", value: "messenger_intro" },
] as const;

export const FACEBOOK_PUBLICATION_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Published", value: "published" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
] as const;

export const FACEBOOK_MESSENGER_CONVERSATION_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "New", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Converted", value: "converted" },
  { label: "Ignored", value: "ignored" },
] as const;

export const FACEBOOK_LEAD_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Received", value: "received" },
  { label: "Processed", value: "processed" },
  { label: "Duplicate", value: "duplicate" },
  { label: "Failed", value: "failed" },
] as const;

export const DEFAULT_FACEBOOK_LEAD_FIELD_MAP = {
  budget_range: ["budget", "budget_range"],
  email: ["email", "email_address"],
  full_name: ["full_name", "name", "your_name"],
  message: ["message", "comments", "questions"],
  payment_preference: [
    "payment",
    "payment_preference",
    "cash_or_financing",
  ],
  phone: ["phone_number", "phone", "mobile_number", "mobile"],
} as const;
