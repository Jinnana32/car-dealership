export const PIPELINE_STAGE_SEQUENCE = [
  "new",
  "contacted",
  "viewing_scheduled",
  "negotiation",
  "reserved",
  "won",
  "lost",
] as const;

export const ACTIVE_PIPELINE_STATUSES = [
  "new",
  "contacted",
  "viewing_scheduled",
  "negotiation",
  "reserved",
] as const;

export const TERMINAL_PIPELINE_STATUSES = [
  "won",
  "lost",
] as const;

export const DEFAULT_PIPELINE_STAGES = [
  {
    description: "Fresh inquiries waiting for first outreach.",
    is_terminal: false,
    key: "new",
    label: "New",
    sort_order: 0,
  },
  {
    description: "A sales agent has started communication with the customer.",
    is_terminal: false,
    key: "contacted",
    label: "Contacted",
    sort_order: 1,
  },
  {
    description: "The customer has a scheduled viewing, test drive, or visit.",
    is_terminal: false,
    key: "viewing_scheduled",
    label: "Viewing Scheduled",
    sort_order: 2,
  },
  {
    description: "Pricing, financing, or terms are being discussed.",
    is_terminal: false,
    key: "negotiation",
    label: "Negotiation",
    sort_order: 3,
  },
  {
    description: "The inquiry is close to closing and the vehicle is being held.",
    is_terminal: false,
    key: "reserved",
    label: "Reserved",
    sort_order: 4,
  },
  {
    description: "The customer successfully closed this inquiry.",
    is_terminal: true,
    key: "won",
    label: "Won",
    sort_order: 5,
  },
  {
    description: "The inquiry did not convert.",
    is_terminal: true,
    key: "lost",
    label: "Lost",
    sort_order: 6,
  },
] as const;

export const LOST_REASONS = [
  "price_too_high",
  "bought_elsewhere",
  "not_responsive",
  "financing_failed",
  "vehicle_unavailable",
  "other",
] as const;

export const LOST_REASON_LABELS: Record<(typeof LOST_REASONS)[number], string> = {
  bought_elsewhere: "Bought Elsewhere",
  financing_failed: "Financing Failed",
  not_responsive: "Not Responsive",
  other: "Other",
  price_too_high: "Price Too High",
  vehicle_unavailable: "Vehicle Unavailable",
};

export const PIPELINE_FOLLOW_UP_FILTER_OPTIONS = [
  { label: "All follow-ups", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Due today", value: "today" },
  { label: "Future", value: "future" },
  { label: "No follow-up", value: "none" },
] as const;

export const PIPELINE_VIEW_MODES = [
  "board",
  "list",
] as const;

export const PIPELINE_STAGE_COLORS = {
  contacted: {
    header: "bg-sky-600",
    headerMuted: "text-sky-100",
    headerText: "text-white",
    priceBadge: "bg-sky-50 text-sky-800",
  },
  lost: {
    header: "bg-zinc-500",
    headerMuted: "text-zinc-200",
    headerText: "text-white",
    priceBadge: "bg-zinc-100 text-zinc-700",
  },
  negotiation: {
    header: "bg-amber-600",
    headerMuted: "text-amber-100",
    headerText: "text-white",
    priceBadge: "bg-amber-50 text-amber-900",
  },
  new: {
    header: "bg-slate-600",
    headerMuted: "text-slate-200",
    headerText: "text-white",
    priceBadge: "bg-slate-100 text-slate-800",
  },
  reserved: {
    header: "bg-red-700",
    headerMuted: "text-red-100",
    headerText: "text-white",
    priceBadge: "bg-red-50 text-red-800",
  },
  viewing_scheduled: {
    header: "bg-violet-600",
    headerMuted: "text-violet-100",
    headerText: "text-white",
    priceBadge: "bg-violet-50 text-violet-800",
  },
  won: {
    header: "bg-emerald-600",
    headerMuted: "text-emerald-100",
    headerText: "text-white",
    priceBadge: "bg-emerald-50 text-emerald-800",
  },
} as const;
