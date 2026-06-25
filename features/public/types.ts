import type { Dealership } from "@/lib/auth/types";
import type { Vehicle } from "@/features/vehicles/types";

export type PublicDealership = Pick<
  Dealership,
  | "contact_email"
  | "contact_phone"
  | "facebook_page_url"
  | "id"
  | "logo_url"
  | "name"
  | "slug"
>;

export type PublicVehicle = Pick<
  Vehicle,
  | "availability"
  | "body_type"
  | "brand"
  | "color"
  | "description"
  | "featured_image_url"
  | "financing_down_payment"
  | "financing_down_payment_percent"
  | "financing_enabled"
  | "financing_monthly_terms"
  | "financing_notes"
  | "fuel_type"
  | "id"
  | "is_price_negotiable"
  | "mileage"
  | "model"
  | "price"
  | "slug"
  | "status"
  | "title"
  | "transmission"
  | "updated_at"
  | "variant"
  | "year"
>;

export type PublicVehicleMedia = {
  altText: string | null;
  id: string;
  isFeatured: boolean;
  signedUrl: string | null;
  sortOrder: number;
};

export type PublicVehicleCardRecord = PublicVehicle & {
  featuredImage: string | null;
};

export type PublicVehicleDetailRecord = {
  dealership: PublicDealership;
  media: PublicVehicleMedia[];
  vehicle: PublicVehicle;
};

export type PublicVehicleListFilters = {
  brand: string;
  maxPrice: number | null;
  minPrice: number | null;
  model: string;
  search: string;
};

export type PublicVehicleListPageData = {
  availableBrands: string[];
  availableModels: string[];
  dealership: PublicDealership;
  filters: PublicVehicleListFilters;
  totalCount: number;
  vehicles: PublicVehicleCardRecord[];
};

export type PublicHomePageData = {
  dealership: PublicDealership;
  featuredVehicles: PublicVehicleCardRecord[];
};
