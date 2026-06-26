const MESSENGER_VEHICLE_MARKER_PATTERN = /\[BW:vehicle:([^\]]+)\]/;

export function buildMessengerVehicleMarker(vehicleSlug: string): string {
  return `[BW:vehicle:${vehicleSlug.trim()}]`;
}

export function parseMessengerVehicleMarker(
  messageText: string,
): { vehicleSlug: string } | null {
  const match = messageText.match(MESSENGER_VEHICLE_MARKER_PATTERN);
  const vehicleSlug = match?.[1]?.trim();

  if (!vehicleSlug) {
    return null;
  }

  return { vehicleSlug };
}

export function buildMessengerRef(vehicleSlug: string): string {
  return `vehicle_${vehicleSlug.trim()}`;
}

export function buildMessengerVehicleInquiryMessage(input: {
  vehicleSlug: string;
  vehicleTitle: string;
}): string {
  const marker = buildMessengerVehicleMarker(input.vehicleSlug);

  return [
    "Hi! I'm interested in this vehicle:",
    "",
    input.vehicleTitle.trim(),
    marker,
    "",
    "Could you share availability and pricing?",
  ].join("\n");
}
