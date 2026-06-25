import { z } from "zod";

export type VehicleCatalog = Record<string, Record<string, string[]>>;

const vehicleCatalogSchema: z.ZodType<VehicleCatalog> = z.record(
  z.string(),
  z.record(z.string(), z.array(z.string())),
);

export const DEFAULT_VEHICLE_CATALOG: VehicleCatalog = {
  Ford: {
    Everest: ["Trend", "Sport", "Titanium"],
    Explorer: ["Limited"],
    Ranger: ["XL", "XLT", "Wildtrak", "Raptor"],
    Territory: ["Trend", "Titanium"],
  },
  GAC: {
    Emzoom: ["GE", "GL", "GB"],
    "GS3 Emzoom": ["GE", "GL"],
  },
  Geely: {
    Coolray: ["Sport", "Premium"],
    Okavango: ["Comfort", "Luxury"],
  },
  GWM: {
    "Haval H6": ["HEV", "Premium"],
  },
  Honda: {
    "BR-V": ["S", "V", "VX"],
    City: ["S", "V", "RS"],
    Civic: ["S", "RS", "Type R"],
    "CR-V": ["S", "V", "VX", "RS"],
    "HR-V": ["S", "V", "RS"],
  },
  Hyundai: {
    "Santa Fe": ["GLS", "Calligraphy"],
    Stargazer: ["GL", "GL Plus"],
  },
  Isuzu: {
    "D-Max": ["RZ4E", "LS", "LS-A"],
    "Mu-X": ["LS", "LS-A"],
  },
  Kia: {
    Seltos: ["LX", "EX", "SX"],
    Soluto: ["LX", "EX"],
    Sportage: ["LX", "EX", "SX"],
  },
  Mazda: {
    Mazda2: ["Sedan", "Hatchback"],
    Mazda3: ["Sedan", "Sport"],
    "CX-3": ["Sport", "Touring"],
    "CX-5": ["Pro", "Sport", "Turbo"],
    "CX-8": ["Sport", "Touring"],
    "BT-50": ["Pioneer", "Thunder"],
  },
  Mitsubishi: {
    "Montero Sport": ["GLX", "GLS", "GT"],
    Strada: ["Cab & Chassis", "GL", "GLS", "Athlete"],
    "Xpander": ["GLX", "GLS", "Cross"],
    "Xpander Cross": ["GLS", "Sport"],
  },
  Nissan: {
    Almera: ["EL", "VE", "VL"],
    Navara: ["EL", "VE", "VL", "Pro-4X"],
    "Patrol Royale": ["4x4", "Premium"],
    Terra: ["EL", "VE", "VL"],
  },
  Suzuki: {
    Ertiga: ["GA", "GL", "GX"],
    Jimny: ["GL", "GLX"],
    Swift: ["GL", "GLX"],
  },
  Toyota: {
    Avanza: ["E", "G"],
    Camry: ["G", "V"],
    Corolla: ["Altis", "GR-S"],
    "Corolla Cross": ["G", "GR-S", "V"],
    Fortuner: ["G", "V", "Q", "LTD", "GR-S"],
    Hilux: ["FX", "J", "G", "Conquest", "GR-S"],
    "Hiace": ["Commuter", "GL Grandia", "Super Grandia"],
    Innova: ["E", "G", "V"],
    Raize: ["E", "G", "V"],
    Rush: ["E", "G"],
    Veloz: ["E", "G", "V"],
    Vios: ["Base", "E", "G", "XLE"],
    Wigo: ["E", "G"],
    "FJ Cruiser": ["Standard"],
    "Land Cruiser Prado": ["TX", "VX"],
  },
};

function normalizeCatalogKey(value: string): string {
  return value.trim();
}

function mergeVariantLists(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])].sort((a, b) => a.localeCompare(b));
}

export function mergeVehicleCatalog(
  baseCatalog: VehicleCatalog,
  customCatalog: VehicleCatalog,
): VehicleCatalog {
  const merged: VehicleCatalog = structuredClone(baseCatalog);

  for (const [brand, models] of Object.entries(customCatalog)) {
    const normalizedBrand = normalizeCatalogKey(brand);

    if (!normalizedBrand) {
      continue;
    }

    merged[normalizedBrand] ??= {};

    for (const [model, variants] of Object.entries(models)) {
      const normalizedModel = normalizeCatalogKey(model);

      if (!normalizedModel) {
        continue;
      }

      merged[normalizedBrand][normalizedModel] = mergeVariantLists(
        merged[normalizedBrand][normalizedModel] ?? [],
        variants.map(normalizeCatalogKey).filter(Boolean),
      );
    }
  }

  return merged;
}

export function parseVehicleCatalogInput(value: unknown): VehicleCatalog {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const parsed = vehicleCatalogSchema.safeParse(value);

  return parsed.success ? parsed.data : {};
}

export function serializeVehicleCatalog(catalog: VehicleCatalog): string {
  return JSON.stringify(catalog, null, 2);
}

export function getDealershipVehicleCatalog(
  customCatalog: unknown,
): VehicleCatalog {
  return mergeVehicleCatalog(
    DEFAULT_VEHICLE_CATALOG,
    parseVehicleCatalogInput(customCatalog),
  );
}

export function getVehicleBrandOptions(catalog: VehicleCatalog): string[] {
  return Object.keys(catalog).sort((left, right) => left.localeCompare(right));
}

export function getVehicleModelOptions(
  catalog: VehicleCatalog,
  brand: string,
): string[] {
  const models = catalog[brand];

  if (!models) {
    return [];
  }

  return Object.keys(models).sort((left, right) => left.localeCompare(right));
}

export function getVehicleVariantOptions(
  catalog: VehicleCatalog,
  brand: string,
  model: string,
): string[] {
  return [...(catalog[brand]?.[model] ?? [])].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function appendCustomOption(
  options: string[],
  currentValue: string,
): string[] {
  const trimmedValue = currentValue.trim();

  if (
    trimmedValue.length === 0 ||
    options.some((option) => option.toLowerCase() === trimmedValue.toLowerCase())
  ) {
    return options;
  }

  return [trimmedValue, ...options];
}
