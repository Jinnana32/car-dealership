export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      dealerships: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          facebook_page_url: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          facebook_page_url?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          facebook_page_url?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dealership_members: {
        Row: {
          created_at: string;
          dealership_id: string;
          id: string;
          profile_id: string;
          role: "owner" | "admin" | "sales_agent";
        };
        Insert: {
          created_at?: string;
          dealership_id: string;
          id?: string;
          profile_id: string;
          role: "owner" | "admin" | "sales_agent";
        };
        Update: {
          created_at?: string;
          dealership_id?: string;
          id?: string;
          profile_id?: string;
          role?: "owner" | "admin" | "sales_agent";
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          auth_user_id: string;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
