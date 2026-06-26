const VEHICLE_MEDIA_PATH_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/.+$/i;

export function isValidVehicleMediaStoragePath(path: string): boolean {
  return (
    !path.includes("..") &&
    !path.startsWith("/") &&
    VEHICLE_MEDIA_PATH_PATTERN.test(path)
  );
}

export function buildVehicleMediaProxyUrl(storagePath: string): string {
  return `/api/vehicle-media?path=${encodeURIComponent(storagePath)}`;
}

export function getVehicleMediaMimeType(storagePath: string): string {
  const extension = storagePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
