export const INQUIRY_SOURCE_TYPES = [
  "facebook_lead_form",
  "facebook_messenger",
  "website_inquiry_form",
  "manual_entry",
  "phone_call",
  "walk_in",
  "referral",
  "facebook_comment",
  "viber",
  "whatsapp",
  "other",
] as const;

export const MANUAL_LEAD_SOURCE_TYPES = [
  "manual_entry",
  "phone_call",
  "walk_in",
  "referral",
  "facebook_comment",
  "viber",
  "whatsapp",
  "other",
] as const;

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "viewing_scheduled",
  "negotiation",
  "reserved",
  "won",
  "lost",
] as const;

export const PAYMENT_PREFERENCES = [
  "cash",
  "financing",
  "undecided",
] as const;

export const INQUIRY_SOURCE_LABELS: Record<
  (typeof INQUIRY_SOURCE_TYPES)[number],
  string
> = {
  facebook_comment: "Facebook Comment",
  facebook_lead_form: "Facebook Lead Form",
  facebook_messenger: "Facebook Messenger",
  manual_entry: "Manual Entry",
  other: "Other",
  phone_call: "Phone Call",
  referral: "Referral",
  viber: "Viber",
  walk_in: "Walk-in",
  website_inquiry_form: "Website Inquiry Form",
  whatsapp: "WhatsApp",
};

export const INQUIRY_STATUS_LABELS: Record<
  (typeof INQUIRY_STATUSES)[number],
  string
> = {
  contacted: "Contacted",
  lost: "Lost",
  negotiation: "Negotiation",
  new: "New",
  reserved: "Reserved",
  viewing_scheduled: "Viewing Scheduled",
  won: "Won",
};

export const PAYMENT_PREFERENCE_LABELS: Record<
  (typeof PAYMENT_PREFERENCES)[number],
  string
> = {
  cash: "Cash",
  financing: "Financing",
  undecided: "Undecided",
};

export const INQUIRY_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Viewing Scheduled", value: "viewing_scheduled" },
  { label: "Negotiation", value: "negotiation" },
  { label: "Reserved", value: "reserved" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
] as const;

export const INQUIRY_SOURCE_FILTER_OPTIONS = [
  { label: "All sources", value: "all" },
  { label: "Facebook Lead Form", value: "facebook_lead_form" },
  { label: "Facebook Messenger", value: "facebook_messenger" },
  { label: "Website Inquiry Form", value: "website_inquiry_form" },
  { label: "Manual Entry", value: "manual_entry" },
  { label: "Phone Call", value: "phone_call" },
  { label: "Walk-in", value: "walk_in" },
  { label: "Referral", value: "referral" },
  { label: "Facebook Comment", value: "facebook_comment" },
  { label: "Viber", value: "viber" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Other", value: "other" },
] as const;
