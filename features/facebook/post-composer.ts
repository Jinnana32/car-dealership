import type { Dealership } from "@/lib/auth/types";
import {
  mergeSaleInclusions,
  normalizeVehicleFinancingTerms,
  type VehicleFinancingDisplayStyle,
  type VehicleFinancingTerm,
  type VehiclePostDefaults,
} from "@/features/vehicles/pricing";
import type { Vehicle } from "@/features/vehicles/types";
import {
  buildVehicleTitle,
  formatVehicleCurrency,
  formatVehicleCurrencyCompact,
  formatVehicleMileage,
  formatVehicleMileageCompact,
} from "@/features/vehicles/utils";

export type { VehiclePostDefaults };

function joinContentLines(lines: Array<string | null | undefined>): string {
  const joined: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine?.trim() ?? "";

    if (!line) {
      if (joined.length > 0 && joined[joined.length - 1] !== "") {
        joined.push("");
      }

      continue;
    }

    joined.push(line);
  }

  while (joined[joined.length - 1] === "") {
    joined.pop();
  }

  return joined.join("\n");
}

function getVehicleHeading(vehicle: Vehicle): string {
  return [vehicle.year, vehicle.brand, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");
}

function getVehicleEmoji(vehicle: Vehicle): string {
  const bodyType = vehicle.body_type?.toLowerCase() ?? "";

  if (bodyType.includes("van") || bodyType.includes("bus")) {
    return "🚐";
  }

  if (bodyType.includes("suv") || bodyType.includes("pickup") || bodyType.includes("truck")) {
    return "🚙";
  }

  return "🚗";
}

function getPostLocationTag(
  vehicle: Vehicle,
  defaults: VehiclePostDefaults,
): string | null {
  return vehicle.post_location_tag?.trim() || defaults.defaultPostLocationTag;
}

function buildPostHookSection(
  vehicle: Vehicle,
  defaults: VehiclePostDefaults,
): string | null {
  const locationTag = getPostLocationTag(vehicle, defaults);

  if (!locationTag) {
    return null;
  }

  return `🔥 FOR SALE | ${locationTag.toUpperCase()} 🔥`;
}

function buildVehicleTitleSection(vehicle: Vehicle): string {
  const emoji = getVehicleEmoji(vehicle);
  const heading = getVehicleHeading(vehicle) || buildVehicleTitle(vehicle);
  const transmissionSuffix = vehicle.transmission
    ? ` (${vehicle.transmission})`
    : "";

  return `${emoji} ${heading}${transmissionSuffix} ${emoji}`;
}

function buildTaglineSection(vehicle: Vehicle): string | null {
  return vehicle.condition_summary?.trim() || null;
}

function buildStructuredHighlightLines(vehicle: Vehicle): string[] {
  const lines: string[] = [];

  if (vehicle.transmission?.trim()) {
    lines.push(`✅ ${vehicle.transmission} Transmission`);
  }

  if (vehicle.engine?.trim()) {
    const fuelSuffix = vehicle.fuel_type?.trim()
      ? ` ${vehicle.fuel_type} Engine`
      : " Engine";

    lines.push(`✅ ${vehicle.engine}${fuelSuffix}`);
  } else if (vehicle.fuel_type?.trim()) {
    lines.push(`✅ ${vehicle.fuel_type}`);
  }

  if (vehicle.mileage !== null) {
    lines.push(`✅ Only ${formatVehicleMileageCompact(vehicle.mileage)} Original Mileage`);
  }

  if (vehicle.color?.trim()) {
    lines.push(`✅ ${vehicle.color}`);
  }

  if (vehicle.plate_number?.trim()) {
    lines.push(`✅ ${vehicle.plate_number}`);
  }

  for (const highlight of vehicle.highlights ?? []) {
    const trimmed = highlight.trim();

    if (trimmed) {
      lines.push(`✅ ${trimmed}`);
    }
  }

  return lines;
}

function buildHighlightsSection(vehicle: Vehicle): string[] {
  const structuredLines = buildStructuredHighlightLines(vehicle);

  if (structuredLines.length > 0) {
    return structuredLines;
  }

  const description = vehicle.description?.trim();

  if (!description) {
    return [];
  }

  const snippet =
    description.length > 220 ? `${description.slice(0, 217).trimEnd()}...` : description;

  return [snippet];
}

function buildUseCasesSection(vehicle: Vehicle): string[] {
  const useCases = (vehicle.use_cases ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (useCases.length === 0) {
    return [];
  }

  return [
    "🎯 Perfect for:",
    ...useCases.map((item) => `✔ ${item}`),
  ];
}

function formatFinancingTermLabel(term: VehicleFinancingTerm): string {
  if (term.label?.trim()) {
    return term.label.trim();
  }

  return `${term.term_years} ${term.term_years === 1 ? "Year" : "Years"}`;
}

function buildCashPriceLines(vehicle: Vehicle): string[] {
  if (!vehicle.show_cash_price_in_posts || vehicle.price === null) {
    return [];
  }

  const lines = [`💰 CASH PRICE: ${formatVehicleCurrency(vehicle.price)}`];

  if (vehicle.is_price_negotiable) {
    lines.push("📌 Negotiable for Serious Buyers");
  }

  return lines;
}

function buildFinancingSection(
  vehicle: Vehicle,
  defaults: VehiclePostDefaults,
): string[] {
  if (!vehicle.financing_enabled) {
    return [];
  }

  const terms = normalizeVehicleFinancingTerms(vehicle.financing_monthly_terms);
  const displayStyle = vehicle.financing_display_style as VehicleFinancingDisplayStyle;
  const headline =
    vehicle.financing_headline?.trim() ||
    defaults.defaultFinancingHeadline ||
    (terms.length > 0 || vehicle.financing_down_payment !== null
      ? "FINANCING OPTION — ALL IN!"
      : null);
  const lines: string[] = [];

  if (headline) {
    lines.push(
      displayStyle === "compact"
        ? `📊 ${headline}`
        : `💰 ${headline}`,
    );
  }

  if (vehicle.financing_down_payment !== null) {
    const downPaymentLabel = vehicle.financing_down_payment_label?.trim();
    const downPaymentText =
      displayStyle === "compact"
        ? `DP : ${formatVehicleCurrencyCompact(vehicle.financing_down_payment)}${downPaymentLabel ? ` ${downPaymentLabel}` : ""}`
        : `✅ Downpayment: ${formatVehicleCurrency(vehicle.financing_down_payment)}${downPaymentLabel ? ` (${downPaymentLabel})` : ""}`;

    lines.push(downPaymentText);
  }

  if (terms.length > 0 && displayStyle !== "headline_only") {
    if (displayStyle === "detailed" && terms.length > 0) {
      lines.push("Monthly Amortization:");
    }

    for (const term of terms) {
      if (displayStyle === "compact") {
        lines.push(
          `✅ ${term.term_years}yrs: ${formatVehicleCurrencyCompact(term.monthly_payment)}`,
        );
        continue;
      }

      lines.push(
        `✔️ ${formatFinancingTermLabel(term)} — ${formatVehicleCurrency(term.monthly_payment)}/month`,
      );
    }
  }

  if (vehicle.financing_notes?.trim()) {
    lines.push(
      displayStyle === "compact"
        ? vehicle.financing_notes.trim()
        : `📊 ${vehicle.financing_notes.trim()}`,
    );
  } else if (
    displayStyle === "headline_only" &&
    terms.length === 0 &&
    vehicle.financing_down_payment === null
  ) {
    lines.push("📊 Financing Options Available");
  }

  return lines;
}

function buildInclusionsSection(
  vehicle: Vehicle,
  defaults: VehiclePostDefaults,
): string[] {
  const inclusions = mergeSaleInclusions({
    dealershipDefaults: defaults.defaultSaleInclusions,
    vehicleInclusions: vehicle.sale_inclusions ?? [],
  });

  if (inclusions.length === 0) {
    return [];
  }

  return [
    "🎁 FREE INCLUSIONS:",
    ...inclusions.map((item) => `✅ ${item}`),
  ];
}

export function buildVehiclePostDefaults(
  dealership: Pick<
    Dealership,
    | "default_financing_headline"
    | "default_post_location_tag"
    | "default_sale_inclusions"
  >,
): VehiclePostDefaults {
  return {
    defaultFinancingHeadline: dealership.default_financing_headline?.trim() || null,
    defaultPostLocationTag: dealership.default_post_location_tag?.trim() || null,
    defaultSaleInclusions: dealership.default_sale_inclusions ?? [],
  };
}

export function buildFacebookCaption(input: {
  dealershipDefaults: VehiclePostDefaults;
  publicVehicleUrl: string;
  vehicle: Vehicle;
}): string {
  const highlights = buildHighlightsSection(input.vehicle);
  const useCases = buildUseCasesSection(input.vehicle);
  const cashLines = buildCashPriceLines(input.vehicle);
  const financingLines = buildFinancingSection(input.vehicle, input.dealershipDefaults);
  const inclusions = buildInclusionsSection(input.vehicle, input.dealershipDefaults);

  return joinContentLines([
    buildPostHookSection(input.vehicle, input.dealershipDefaults),
    buildVehicleTitleSection(input.vehicle),
    buildTaglineSection(input.vehicle),
    highlights.length > 0 ? "✨ KEY FEATURES:" : null,
    ...highlights,
    ...useCases,
    ...cashLines,
    ...financingLines,
    ...inclusions,
    "",
    "📩 Message now for viewing, reservation, and inquiries.",
    input.publicVehicleUrl ? `View listing: ${input.publicVehicleUrl}` : null,
  ]);
}

export function buildMarketplaceDescription(input: {
  dealershipDefaults: VehiclePostDefaults;
  publicVehicleUrl: string;
  vehicle: Vehicle;
}): string {
  const highlights = buildStructuredHighlightLines(input.vehicle);
  const cashLines = buildCashPriceLines(input.vehicle);
  const financingLines = buildFinancingSection(input.vehicle, input.dealershipDefaults);

  return joinContentLines([
    getVehicleHeading(input.vehicle) || buildVehicleTitle(input.vehicle),
    "",
    buildTaglineSection(input.vehicle),
    highlights.length > 0 ? "Highlights:" : null,
    ...highlights.map((line) => line.replace(/^✅\s*/, "")),
    ...cashLines.map((line) => line.replace(/^💰\s*/, "").replace(/^📌\s*/, "")),
    ...financingLines.map((line) => line.replace(/^💰\s*/, "").replace(/^📊\s*/, "").replace(/^✅\s*/, "")),
    "",
    input.vehicle.description?.trim() || "Well-maintained unit ready for viewing.",
    "",
    "For inquiries, contact the dealership or send a message through the vehicle listing page.",
    input.publicVehicleUrl ? `Listing: ${input.publicVehicleUrl}` : null,
  ]);
}

export function buildAdPrimaryText(input: {
  vehicle: Vehicle;
}): string {
  const vehicleLabel = getVehicleHeading(input.vehicle) || buildVehicleTitle(input.vehicle);
  const priceText =
    input.vehicle.price !== null
      ? `Priced at ${formatVehicleCurrency(input.vehicle.price)}, `
      : "";
  const mileageText =
    input.vehicle.mileage !== null
      ? `${formatVehicleMileage(input.vehicle.mileage)}, `
      : "";
  const terms = normalizeVehicleFinancingTerms(input.vehicle.financing_monthly_terms);
  const lowestMonthly = terms.length > 0 ? terms[0] : null;
  const financingText =
    input.vehicle.financing_enabled && lowestMonthly
      ? ` Financing from ${formatVehicleCurrency(lowestMonthly.monthly_payment)}/month, `
      : input.vehicle.financing_enabled
        ? " Financing options available, "
        : "";

  return joinContentLines([
    `Looking for a reliable ${vehicleLabel}? ${priceText}${mileageText}${financingText}this unit is available now and ready for viewing. Message us today for details or schedule availability.`,
  ]);
}
