import type { Database } from "@/lib/supabase/database.types";

export type AppRole =
  Database["public"]["Tables"]["dealership_members"]["Row"]["role"];

export type Dealership =
  Database["public"]["Tables"]["dealerships"]["Row"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type DealershipMembership =
  Database["public"]["Tables"]["dealership_members"]["Row"];

export type AdminAccessContext = {
  dealership: Dealership;
  membership: DealershipMembership;
  profile: Profile;
  user: {
    email: string | null;
    id: string;
  };
};

