/* eslint-disable jsx-a11y/alt-text */
import "server-only";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

import type {
  PreparedBrochureDocument,
  PreparedBrochureVehicle,
} from "@/features/brochures/types";
import {
  getBrochureDisclaimer,
  sanitizeBrochureDescription,
} from "@/features/brochures/utils";
import {
  formatVehicleCurrency,
  formatVehicleMileage,
} from "@/features/vehicles/utils";

const brand = {
  red: "#dc2626",
  redDark: "#b91c1c",
  charcoal: "#171717",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f9fafb",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: brand.red,
    height: 5,
    marginBottom: 20,
    marginHorizontal: -32,
    marginTop: -28,
  },
  body: {
    color: brand.charcoal,
    fontSize: 10,
    paddingBottom: 28,
    paddingHorizontal: 32,
    paddingTop: 28,
  },
  brochureTitle: {
    color: brand.muted,
    fontSize: 10,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: brand.surface,
    borderColor: brand.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactCardWithQr: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactLine: {
    fontSize: 10,
    lineHeight: 1.5,
    marginTop: 2,
  },
  dealershipName: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.2,
    lineHeight: 1.2,
  },
  description: {
    color: "#374151",
    fontSize: 10,
    lineHeight: 1.55,
    marginTop: 8,
  },
  disclaimer: {
    borderTopColor: brand.border,
    borderTopWidth: 1,
    color: brand.muted,
    fontSize: 8,
    lineHeight: 1.5,
    marginTop: 16,
    paddingTop: 10,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerMeta: {
    alignItems: "flex-end",
    maxWidth: 200,
  },
  heroImage: {
    borderRadius: 10,
    height: 250,
    objectFit: "cover",
    width: "100%",
  },
  heroImagePlaceholder: {
    alignItems: "center",
    backgroundColor: brand.surface,
    borderColor: brand.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 250,
    justifyContent: "center",
    width: "100%",
  },
  label: {
    color: brand.muted,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  contactHint: {
    color: brand.muted,
    fontSize: 9,
    lineHeight: 1.4,
    marginTop: 6,
  },
  logo: {
    height: 48,
    marginBottom: 10,
    objectFit: "contain",
    width: 170,
  },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metaText: {
    color: brand.muted,
    fontSize: 8,
    lineHeight: 1.45,
    textAlign: "right",
  },
  multiVehicleImage: {
    borderRadius: 10,
    height: 170,
    objectFit: "cover",
    width: "100%",
  },
  priceBadge: {
    alignSelf: "flex-start",
    backgroundColor: brand.red,
    borderRadius: 6,
    color: brand.white,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qrCode: {
    height: 52,
    objectFit: "contain",
    width: 52,
  },
  qrSection: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  section: {
    marginTop: 16,
  },
  specCard: {
    backgroundColor: brand.surface,
    borderColor: brand.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "48%",
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  specValue: {
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 16,
  },
  vehicleSubtitle: {
    color: brand.muted,
    fontSize: 10,
    lineHeight: 1.4,
    marginTop: 4,
  },
  vehicleTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.3,
    lineHeight: 1.15,
  },
});

function buildVehicleSubtitle(vehicle: PreparedBrochureVehicle): string | null {
  const parts = [vehicle.year, vehicle.brand, vehicle.model, vehicle.variant].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join(" • ") : null;
}

function buildVehicleSpecs(
  vehicle: PreparedBrochureVehicle,
  includePrice: boolean,
): Array<[string, string]> {
  const specs: Array<[string, string | null]> = [];

  if (!includePrice && vehicle.price !== null) {
    specs.push(["Price", formatVehicleCurrency(vehicle.price)]);
  }

  if (vehicle.mileage !== null) {
    specs.push(["Mileage", formatVehicleMileage(vehicle.mileage)]);
  }

  if (vehicle.transmission?.trim()) {
    specs.push(["Transmission", vehicle.transmission.trim()]);
  }

  if (vehicle.fuelType?.trim()) {
    specs.push(["Fuel type", vehicle.fuelType.trim()]);
  }

  if (vehicle.bodyType?.trim()) {
    specs.push(["Body type", vehicle.bodyType.trim()]);
  }

  if (vehicle.color?.trim()) {
    specs.push(["Color", vehicle.color.trim()]);
  }

  return specs.filter((item): item is [string, string] => Boolean(item[1]));
}

function DealershipHeader({
  document,
}: {
  document: PreparedBrochureDocument;
}) {
  const customTitle =
    document.title.trim() !== document.dealership.name.trim()
      ? document.title
      : null;

  return (
    <View>
      <View style={styles.accentBar} />

      <View style={styles.logoRow}>
        {document.dealership.logoDataUrl ? (
          <Image src={document.dealership.logoDataUrl} style={styles.logo} />
        ) : (
          <Text style={styles.dealershipName}>{document.dealership.name}</Text>
        )}

        <View style={styles.headerMeta}>
          <Text style={styles.metaText}>Generated {document.generatedAt}</Text>
          {document.includeContactDetails && document.dealership.contactPhone ? (
            <Text style={styles.metaText}>{document.dealership.contactPhone}</Text>
          ) : null}
          {document.includeContactDetails && document.dealership.contactEmail ? (
            <Text style={styles.metaText}>{document.dealership.contactEmail}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.titleBlock}>
          {document.dealership.logoDataUrl ? (
            <Text style={styles.dealershipName}>{document.dealership.name}</Text>
          ) : null}
          {customTitle ? (
            <Text style={styles.brochureTitle}>{customTitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function VehicleHero({
  includePrice,
  vehicle,
}: {
  includePrice: boolean;
  vehicle: PreparedBrochureVehicle;
}) {
  const subtitle = buildVehicleSubtitle(vehicle);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Featured vehicle</Text>
      <Text style={styles.vehicleTitle}>{vehicle.title}</Text>
      {subtitle ? <Text style={styles.vehicleSubtitle}>{subtitle}</Text> : null}
      {includePrice && vehicle.price !== null ? (
        <Text style={styles.priceBadge}>{formatVehicleCurrency(vehicle.price)}</Text>
      ) : null}
    </View>
  );
}

function SpecGrid({
  includePrice,
  vehicle,
}: {
  includePrice: boolean;
  vehicle: PreparedBrochureVehicle;
}) {
  const specs = buildVehicleSpecs(vehicle, includePrice);

  if (specs.length === 0) {
    return null;
  }

  return (
    <View style={styles.specGrid}>
      {specs.map(([label, value]) => (
        <View key={label} style={styles.specCard}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.specValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function DescriptionSection({
  description,
  maxLength = 360,
}: {
  description: string | null;
  maxLength?: number;
}) {
  const value = sanitizeBrochureDescription(description, maxLength);

  if (!value) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Overview</Text>
      <Text style={styles.description}>{value}</Text>
    </View>
  );
}

function ContactFooter({
  document,
  vehicle,
}: {
  document: PreparedBrochureDocument;
  vehicle: PreparedBrochureVehicle;
}) {
  const hasQrCode = document.includeQrCode && Boolean(vehicle.qrCodeDataUrl);
  const hasContactDetails = document.includeContactDetails;

  if (!hasContactDetails && !hasQrCode) {
    return null;
  }

  return (
    <View
      style={
        hasQrCode ? [styles.contactCard, styles.contactCardWithQr] : styles.contactCard
      }
    >
      <View style={styles.titleBlock}>
        <Text style={styles.label}>Contact us</Text>
        {hasContactDetails ? (
          <>
            <Text style={styles.contactLine}>{document.dealership.name}</Text>
            {document.dealership.contactPhone ? (
              <Text style={styles.contactLine}>{document.dealership.contactPhone}</Text>
            ) : null}
            {document.dealership.contactEmail ? (
              <Text style={styles.contactLine}>{document.dealership.contactEmail}</Text>
            ) : null}
            {document.dealership.facebookPageUrl ? (
              <Text style={styles.contactLine}>{document.dealership.facebookPageUrl}</Text>
            ) : null}
          </>
        ) : null}
        {hasQrCode ? (
          <Text style={styles.contactHint}>Scan to view the full listing.</Text>
        ) : null}
      </View>

      {hasQrCode && vehicle.qrCodeDataUrl ? (
        <View style={styles.qrSection}>
          <Image src={vehicle.qrCodeDataUrl} style={styles.qrCode} />
        </View>
      ) : null}
    </View>
  );
}

function VehicleImage({
  imageDataUrl,
  variant,
}: {
  imageDataUrl: string | null;
  variant: "hero" | "multi";
}) {
  const imageStyle = variant === "hero" ? styles.heroImage : styles.multiVehicleImage;

  if (!imageDataUrl) {
    return (
      <View
        style={
          variant === "multi"
            ? [styles.heroImagePlaceholder, { height: 200 }]
            : styles.heroImagePlaceholder
        }
      >
        <Text style={styles.vehicleSubtitle}>No featured image available</Text>
      </View>
    );
  }

  return <Image src={imageDataUrl} style={imageStyle} />;
}

function SingleVehiclePage({
  document,
  vehicle,
}: {
  document: PreparedBrochureDocument;
  vehicle: PreparedBrochureVehicle;
}) {
  return (
    <Page size="A4" style={styles.body}>
      <DealershipHeader document={document} />
      <VehicleHero includePrice={document.includePrice} vehicle={vehicle} />

      <View style={styles.section}>
        <VehicleImage imageDataUrl={vehicle.featuredImageDataUrl} variant="hero" />
      </View>

      <SpecGrid includePrice={document.includePrice} vehicle={vehicle} />
      <DescriptionSection description={vehicle.description} />
      <ContactFooter document={document} vehicle={vehicle} />

      {document.includeDisclaimer ? (
        <Text style={styles.disclaimer}>{getBrochureDisclaimer()}</Text>
      ) : null}
    </Page>
  );
}

function MultiVehiclePage({
  document,
  vehicle,
}: {
  document: PreparedBrochureDocument;
  vehicle: PreparedBrochureVehicle;
}) {
  return (
    <Page size="A4" style={styles.body}>
      <DealershipHeader document={document} />
      <VehicleHero includePrice={document.includePrice} vehicle={vehicle} />

      <View style={styles.section}>
        <VehicleImage imageDataUrl={vehicle.featuredImageDataUrl} variant="multi" />
      </View>

      <SpecGrid includePrice={document.includePrice} vehicle={vehicle} />
      <DescriptionSection description={vehicle.description} maxLength={280} />
      <ContactFooter document={document} vehicle={vehicle} />

      {document.includeDisclaimer ? (
        <Text style={styles.disclaimer}>{getBrochureDisclaimer()}</Text>
      ) : null}
    </Page>
  );
}

function BrochurePdfDocument({
  document,
}: {
  document: PreparedBrochureDocument;
}) {
  if (document.exportType === "single_vehicle") {
    return (
      <Document title={document.title}>
        <SingleVehiclePage document={document} vehicle={document.vehicles[0]} />
      </Document>
    );
  }

  return (
    <Document title={document.title}>
      {document.vehicles.map((vehicle) => (
        <MultiVehiclePage
          key={vehicle.slug}
          document={document}
          vehicle={vehicle}
        />
      ))}
    </Document>
  );
}

async function normalizePdfOutput(value: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (value instanceof ReadableStream) {
    const reader = value.getReader();
    const chunks: Buffer[] = [];

    while (true) {
      const { done, value: chunk } = await reader.read();

      if (done) {
        break;
      }

      if (chunk) {
        chunks.push(Buffer.from(chunk));
      }
    }

    return Buffer.concat(chunks);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value
  ) {
    const chunks: Buffer[] = [];

    for await (const chunk of value as AsyncIterable<Uint8Array | Buffer | string>) {
      chunks.push(
        typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk),
      );
    }

    return Buffer.concat(chunks);
  }

  throw new Error("Unable to render brochure PDF.");
}

export async function renderBrochurePdf(
  document: PreparedBrochureDocument,
): Promise<Buffer> {
  const output = await pdf(<BrochurePdfDocument document={document} />).toBuffer();

  return normalizePdfOutput(output);
}
