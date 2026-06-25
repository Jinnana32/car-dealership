import type { VehicleListSort } from "@/features/vehicles/constants";
import type { Database } from "@/lib/supabase/database.types";

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];
export type VehicleMedia = Database["public"]["Tables"]["vehicle_media"]["Row"];
export type VehicleMediaInsert =
  Database["public"]["Tables"]["vehicle_media"]["Insert"];
export type VehicleStatus = Vehicle["status"];
export type VehicleAvailability = Vehicle["availability"];
export type VehicleStatusFilter = VehicleStatus | "active" | "all";
export type VehicleAvailabilityFilter = VehicleAvailability | "all";

export type VehicleMediaWithSignedUrl = VehicleMedia & {
  signedUrl: string | null;
};

export type VehicleListItem = Vehicle & {
  featuredMedia: VehicleMediaWithSignedUrl | null;
};

export type VehicleRecord = {
  media: VehicleMediaWithSignedUrl[];
  vehicle: Vehicle;
};

export type VehicleLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { record: VehicleRecord; type: "ok" };

export type VehicleListFilters = {
  availability: VehicleAvailabilityFilter;
  bodyType: string;
  brand: string;
  maxPrice: number | null;
  minPrice: number | null;
  page: number;
  pageSize: number;
  search: string;
  sort: VehicleListSort;
  status: VehicleStatusFilter;
};

export type VehicleListFilterOptions = {
  bodyTypes: string[];
  brands: string[];
};

export type VehicleListResult = {
  filterOptions: VehicleListFilterOptions;
  filters: VehicleListFilters;
  pageCount: number;
  totalCount: number;
  vehicles: VehicleListItem[];
};

export type VehicleFormValues = {
  availability: string;
  body_type: string;
  brand: string;
  color: string;
  description: string;
  engine_size: string;
  engine_type: string;
  financing_down_payment_percent: string;
  financing_enabled: string;
  financing_monthly_terms: string;
  fuel_type: string;
  highlights: string;
  mileage: string;
  model: string;
  plate_number: string;
  post_location_tag: string;
  price: string;
  sale_inclusions: string;
  slug: string;
  status: string;
  stock_number: string;
  title: string;
  transmission: string;
  use_cases: string;
  variant: string;
  vin: string;
  year: string;
};

export type VehicleFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: VehicleFormValues;
};
