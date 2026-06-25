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
import { getBrochureDisclaimer } from "@/features/brochures/utils";
import {
  formatVehicleCurrency,
  formatVehicleMileage,
} from "@/features/vehicles/utils";

const styles = StyleSheet.create({
  body: {
    color: "#1f1f1f",
    fontSize: 11,
    paddingBottom: 28,
    paddingHorizontal: 32,
    paddingTop: 28,
  },
  contactLine: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  contentSection: {
    marginTop: 18,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.55,
    marginTop: 8,
  },
  disclaimer: {
    borderTopColor: "#d6d3d1",
    borderTopWidth: 1,
    color: "#57534e",
    fontSize: 9,
    lineHeight: 1.5,
    marginTop: 16,
    paddingTop: 10,
  },
  header: {
    alignItems: "flex-start",
    borderBottomColor: "#e7e5e4",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  headerMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  label: {
    color: "#78716c",
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  logo: {
    height: 38,
    marginBottom: 10,
    objectFit: "contain",
    width: 140,
  },
  metaText: {
    color: "#57534e",
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: "right",
  },
  multiVehicleImage: {
    borderRadius: 10,
    height: 190,
    objectFit: "cover",
    width: "100%",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  qrCode: {
    height: 80,
    objectFit: "contain",
    width: 80,
  },
  qrLabel: {
    color: "#78716c",
    fontSize: 9,
    marginTop: 6,
  },
  qrSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  singleImage: {
    borderRadius: 12,
    height: 240,
    objectFit: "cover",
    width: "100%",
  },
  specCard: {
    backgroundColor: "#f5f5f4",
    borderColor: "#e7e5e4",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "31%",
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  specValue: {
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 16,
  },
  vehicleLink: {
    color: "#b91c1c",
    fontSize: 10,
    lineHeight: 1.45,
    marginTop: 10,
  },
  vehicleSection: {
    marginTop: 18,
  },
  vehicleSectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  vehicleSummary: {
    color: "#57534e",
    fontSize: 11,
    lineHeight: 1.45,
    marginTop: 6,
  },
});

function buildVehicleSubtitle(vehicle: PreparedBrochureVehicle): string {
  return [vehicle.year, vehicle.brand, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" • ");
}

function getShortDescription(description: string | null): string | null {
  const value = description?.trim();

  if (!value) {
    return null;
  }

  return value.length > 220 ? `${value.slice(0, 217).trimEnd()}...` : value;
}

function buildSingleVehicleSpecs(
  vehicle: PreparedBrochureVehicle,
  includePrice: boolean,
): Array<[string, string]> {
  const specs: Array<[string, string | null]> = [
    includePrice ? ["Price", formatVehicleCurrency(vehicle.price)] : ["Price", null],
    ["Mileage", formatVehicleMileage(vehicle.mileage)],
    ["Transmission", vehicle.transmission || "Not set"],
    ["Fuel Type", vehicle.fuelType || "Not set"],
    ["Body Type", vehicle.bodyType || "Not set"],
    ["Color", vehicle.color || "Not set"],
  ];

  return specs.filter((item): item is [string, string] => Boolean(item[1]));
}

function DealershipHeader({
  document,
}: {
  document: PreparedBrochureDocument;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        {document.dealership.logoDataUrl ? (
          <Image src={document.dealership.logoDataUrl} style={styles.logo} />
        ) : null}
        <Text style={styles.pageTitle}>{document.title}</Text>
        <Text style={styles.vehicleSummary}>{document.dealership.name}</Text>
      </View>

      <View style={styles.headerMeta}>
        <Text style={styles.metaText}>Generated {document.generatedAt}</Text>
        {document.includeContactDetails && document.dealership.contactPhone ? (
          <Text style={styles.metaText}>{document.dealership.contactPhone}</Text>
        ) : null}
        {document.includeContactDetails && document.dealership.contactEmail ? (
          <Text style={styles.metaText}>{document.dealership.contactEmail}</Text>
        ) : null}
        {document.includeContactDetails && document.dealership.facebookPageUrl ? (
          <Text style={styles.metaText}>{document.dealership.facebookPageUrl}</Text>
        ) : null}
      </View>
    </View>
  );
}

function PublicLinkSection({
  includeQrCode,
  vehicle,
}: {
  includeQrCode: boolean;
  vehicle: PreparedBrochureVehicle;
}) {
  if (!vehicle.publicUrl && !vehicle.qrCodeDataUrl) {
    return null;
  }

  return (
    <View style={[styles.vehicleSectionHeader, { marginTop: 16 }]}>
      <View style={styles.titleBlock}>
        <Text style={styles.label}>Public listing</Text>
        {vehicle.publicUrl ? (
          <Text style={styles.vehicleLink}>{vehicle.publicUrl}</Text>
        ) : (
          <Text style={styles.vehicleSummary}>
            Public vehicle URL was not available when this brochure was generated.
          </Text>
        )}
      </View>

      {includeQrCode && vehicle.qrCodeDataUrl ? (
        <View style={styles.qrSection}>
          <Image src={vehicle.qrCodeDataUrl} style={styles.qrCode} />
          <Text style={styles.qrLabel}>Scan to view</Text>
        </View>
      ) : null}
    </View>
  );
}

function SingleVehiclePage({
  document,
  vehicle,
}: {
  document: PreparedBrochureDocument;
  vehicle: PreparedBrochureVehicle;
}) {
  const specs = buildSingleVehicleSpecs(vehicle, document.includePrice);

  return (
    <Page size="A4" style={styles.body}>
      <DealershipHeader document={document} />

      <View style={styles.contentSection}>
        {vehicle.featuredImageDataUrl ? (
          <Image src={vehicle.featuredImageDataUrl} style={styles.singleImage} />
        ) : (
          <View
            style={[
              styles.singleImage,
              {
                alignItems: "center",
                backgroundColor: "#f5f5f4",
                borderColor: "#e7e5e4",
                borderWidth: 1,
                justifyContent: "center",
              },
            ]}
          >
            <Text style={styles.vehicleSummary}>No featured image available</Text>
          </View>
        )}

        <View style={styles.vehicleSection}>
          <Text style={styles.label}>Vehicle</Text>
          <Text style={{ fontSize: 19, fontWeight: 700 }}>{vehicle.title}</Text>
          <Text style={styles.vehicleSummary}>{buildVehicleSubtitle(vehicle)}</Text>
        </View>

        <View style={styles.specGrid}>
          {specs.map(([label, value]) => (
            <View key={label} style={styles.specCard}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>

        {vehicle.description ? (
          <View style={styles.vehicleSection}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{vehicle.description}</Text>
          </View>
        ) : null}

        <PublicLinkSection
          includeQrCode={document.includeQrCode}
          vehicle={vehicle}
        />

        {document.includeContactDetails ? (
          <View style={styles.vehicleSection}>
            <Text style={styles.label}>Contact details</Text>
            <Text style={styles.contactLine}>{document.dealership.name}</Text>
            {document.dealership.contactPhone ? (
              <Text style={styles.contactLine}>{document.dealership.contactPhone}</Text>
            ) : null}
            {document.dealership.contactEmail ? (
              <Text style={styles.contactLine}>{document.dealership.contactEmail}</Text>
            ) : null}
          </View>
        ) : null}

        {document.includeDisclaimer ? (
          <Text style={styles.disclaimer}>{getBrochureDisclaimer()}</Text>
        ) : null}
      </View>
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

      <View style={styles.vehicleSection}>
        <Text style={styles.label}>Vehicle</Text>
        <Text style={{ fontSize: 18, fontWeight: 700 }}>{vehicle.title}</Text>
        <Text style={styles.vehicleSummary}>{buildVehicleSubtitle(vehicle)}</Text>
      </View>

      <View style={styles.vehicleSection}>
        {vehicle.featuredImageDataUrl ? (
          <Image src={vehicle.featuredImageDataUrl} style={styles.multiVehicleImage} />
        ) : (
          <View
            style={[
              styles.multiVehicleImage,
              {
                alignItems: "center",
                backgroundColor: "#f5f5f4",
                borderColor: "#e7e5e4",
                borderWidth: 1,
                justifyContent: "center",
              },
            ]}
          >
            <Text style={styles.vehicleSummary}>No featured image available</Text>
          </View>
        )}
      </View>

      <View style={styles.specGrid}>
        {buildSingleVehicleSpecs(vehicle, document.includePrice).map(([label, value]) => (
          <View key={label} style={styles.specCard}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.specValue}>{value}</Text>
          </View>
        ))}
      </View>

      {getShortDescription(vehicle.description) ? (
        <View style={styles.vehicleSection}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{getShortDescription(vehicle.description)}</Text>
        </View>
      ) : null}

      <PublicLinkSection
        includeQrCode={document.includeQrCode}
        vehicle={vehicle}
      />

      {document.includeContactDetails ? (
        <View style={styles.vehicleSection}>
          <Text style={styles.label}>Contact details</Text>
          <Text style={styles.contactLine}>{document.dealership.name}</Text>
          {document.dealership.contactPhone ? (
            <Text style={styles.contactLine}>{document.dealership.contactPhone}</Text>
          ) : null}
          {document.dealership.contactEmail ? (
            <Text style={styles.contactLine}>{document.dealership.contactEmail}</Text>
          ) : null}
        </View>
      ) : null}

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
