export const VEHICLE_MEDIA_BUCKET = "vehicle-media";

type VehicleSelectOption = {
  label: string;
  value: string;
};

function buildVehicleSelectOptions(
  values: readonly string[],
): VehicleSelectOption[] {
  return values.map((value) => ({
    label: value,
    value,
  }));
}

export const VEHICLE_STATUSES = [
  "draft",
  "published",
  "reserved",
  "sold",
  "archived",
] as const;

export const VEHICLE_AVAILABILITIES = [
  "available",
  "reserved",
  "sold",
  "unavailable",
] as const;

export const VEHICLE_STATUS_LABELS: Record<(typeof VEHICLE_STATUSES)[number], string> = {
  archived: "Archived",
  draft: "Draft",
  published: "Published",
  reserved: "Reserved",
  sold: "Sold",
};

export const VEHICLE_AVAILABILITY_LABELS: Record<
  (typeof VEHICLE_AVAILABILITIES)[number],
  string
> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  unavailable: "Unavailable",
};

export const VEHICLE_STATUS_FILTER_OPTIONS = [
  { label: "All active", value: "active" },
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Reserved", value: "reserved" },
  { label: "Sold", value: "sold" },
  { label: "Archived", value: "archived" },
] as const;

export const VEHICLE_AVAILABILITY_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Sold", value: "sold" },
  { label: "Unavailable", value: "unavailable" },
] as const;

export const VEHICLE_LIST_PAGE_SIZES = [10, 25, 50] as const;

export const VEHICLE_LIST_DEFAULT_PAGE_SIZE = 10;

export const VEHICLE_LIST_PAGE_SIZE = VEHICLE_LIST_DEFAULT_PAGE_SIZE;

export const VEHICLE_LIST_PAGE_SIZE_OPTIONS = [
  { label: "10 per page", value: "10" },
  { label: "25 per page", value: "25" },
  { label: "50 per page", value: "50" },
] as const;

export type VehicleListPageSize = (typeof VEHICLE_LIST_PAGE_SIZES)[number];

export const VEHICLE_LIST_SORT_OPTIONS = [
  { label: "Recently updated", value: "updated_desc" },
  { label: "Oldest updated", value: "updated_asc" },
  { label: "Price: high to low", value: "price_desc" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Mileage: low to high", value: "mileage_asc" },
  { label: "Mileage: high to low", value: "mileage_desc" },
  { label: "Title: A to Z", value: "title_asc" },
] as const;

export const VEHICLE_LIST_SORTS = [
  "updated_desc",
  "updated_asc",
  "price_desc",
  "price_asc",
  "mileage_asc",
  "mileage_desc",
  "title_asc",
] as const;

export type VehicleListSort = (typeof VEHICLE_LIST_SORTS)[number];

export const VEHICLE_BRAND_OPTIONS = buildVehicleSelectOptions([
  "Audi",
  "BMW",
  "Chevrolet",
  "Ford",
  "Geely",
  "GWM",
  "Honda",
  "Hyundai",
  "Isuzu",
  "Jetour",
  "Kia",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "MG",
  "Mitsubishi",
  "Nissan",
  "Peugeot",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
]);

export const VEHICLE_MODEL_OPTIONS = buildVehicleSelectOptions([
  "A4",
  "Almera",
  "Altis",
  "BR-V",
  "BT-50",
  "Camry",
  "Civic",
  "City",
  "Conquest",
  "Coolray",
  "Corolla Cross",
  "CR-V",
  "CX-3",
  "CX-5",
  "CX-8",
  "D-Max",
  "E-Class",
  "Ertiga",
  "Everest",
  "Explorer",
  "Fortuner",
  "Hilux",
  "HR-V",
  "Jimny",
  "Land Cruiser Prado",
  "L300",
  "Mazda2",
  "Mazda3",
  "Montero Sport",
  "Mu-X",
  "Navara",
  "Okavango",
  "Ranger",
  "Raize",
  "Raptor",
  "Rush",
  "Santa Fe",
  "Seltos",
  "Soluto",
  "Sportage",
  "Strada",
  "Stargazer",
  "Swift",
  "Terra",
  "Territory",
  "Tiggo 5X",
  "Tiggo 7 Pro",
  "Tiggo 8 Pro",
  "Veloz",
  "Vios",
  "Wigo",
  "X3",
  "X5",
  "X7",
  "Xpander",
  "Xpander Cross",
  "Yaris",
]);

export const VEHICLE_VARIANT_OPTIONS = buildVehicleSelectOptions([
  "Base",
  "Standard",
  "E",
  "EL",
  "G",
  "GL",
  "GLS",
  "GT",
  "GX",
  "Highline",
  "Hybrid",
  "L",
  "LE",
  "Limited",
  "LX",
  "Premium",
  "RS",
  "SE",
  "Sport",
  "Touring",
  "V",
  "VX",
  "XE",
  "XLE",
]);

export const VEHICLE_FUEL_TYPE_OPTIONS = [
  { label: "Gasoline", value: "Gasoline" },
  { label: "Diesel", value: "Diesel" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Plug-in Hybrid", value: "Plug-in Hybrid" },
  { label: "Electric", value: "Electric" },
  { label: "LPG", value: "LPG" },
] as const satisfies readonly VehicleSelectOption[];

export const VEHICLE_TRANSMISSION_OPTIONS = [
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
  { label: "CVT", value: "CVT" },
  { label: "DCT", value: "DCT" },
  { label: "Semi-Automatic", value: "Semi-Automatic" },
] as const satisfies readonly VehicleSelectOption[];

export const VEHICLE_BODY_TYPE_OPTIONS = buildVehicleSelectOptions([
  "Sedan",
  "Hatchback",
  "SUV",
  "Crossover",
  "Pickup",
  "Van",
  "MPV",
  "Wagon",
  "Coupe",
  "Convertible",
]);

export const VEHICLE_COLOR_OPTIONS = buildVehicleSelectOptions([
  "Black",
  "Blue",
  "Brown",
  "Gray",
  "Green",
  "Orange",
  "Red",
  "Silver",
  "White",
  "Yellow",
]);

export const VEHICLE_DETAIL_CONTENT_CLASS = "mx-auto w-full max-w-5xl space-y-5";

export const VEHICLE_DETAIL_CONTENT_NARROW_CLASS = "mx-auto w-full max-w-3xl space-y-5";
