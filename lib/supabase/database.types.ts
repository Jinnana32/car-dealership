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
      ai_chat_messages: {
        Row: {
          content: string;
          created_at: string;
          dealership_id: string;
          id: string;
          metadata: Json;
          role: "user" | "assistant" | "system";
          session_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          dealership_id: string;
          id?: string;
          metadata?: Json;
          role: "user" | "assistant" | "system";
          session_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          dealership_id?: string;
          id?: string;
          metadata?: Json;
          role?: "user" | "assistant" | "system";
          session_id?: string;
        };
        Relationships: [];
      };
      ai_chat_sessions: {
        Row: {
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          id: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          email: string | null;
          facebook_profile_url: string | null;
          fb_customer_id: string | null;
          first_name: string | null;
          full_name: string;
          id: string;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          source_type: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          email?: string | null;
          facebook_profile_url?: string | null;
          fb_customer_id?: string | null;
          first_name?: string | null;
          full_name: string;
          id?: string;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          source_type?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          email?: string | null;
          facebook_profile_url?: string | null;
          fb_customer_id?: string | null;
          first_name?: string | null;
          full_name?: string;
          id?: string;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          source_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      dealerships: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          default_financing_apr_percent: number;
          default_financing_headline: string | null;
          default_post_location_tag: string | null;
          default_sale_inclusions: string[];
          facebook_page_url: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string;
          vehicle_catalog: Json;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          default_financing_apr_percent?: number;
          default_financing_headline?: string | null;
          default_post_location_tag?: string | null;
          default_sale_inclusions?: string[];
          facebook_page_url?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
          vehicle_catalog?: Json;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          default_financing_apr_percent?: number;
          default_financing_headline?: string | null;
          default_post_location_tag?: string | null;
          default_sale_inclusions?: string[];
          facebook_page_url?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
          vehicle_catalog?: Json;
        };
        Relationships: [];
      };
      brochure_exports: {
        Row: {
          created_at: string;
          dealership_id: string;
          error_message: string | null;
          export_type: "single_vehicle" | "multi_vehicle";
          file_url: string | null;
          generated_at: string | null;
          generated_by: string | null;
          id: string;
          metadata: Json;
          status: "pending" | "generated" | "failed";
          storage_path: string | null;
          title: string | null;
          vehicle_ids: string[];
        };
        Insert: {
          created_at?: string;
          dealership_id: string;
          error_message?: string | null;
          export_type: "single_vehicle" | "multi_vehicle";
          file_url?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string;
          metadata?: Json;
          status?: "pending" | "generated" | "failed";
          storage_path?: string | null;
          title?: string | null;
          vehicle_ids: string[];
        };
        Update: {
          created_at?: string;
          dealership_id?: string;
          error_message?: string | null;
          export_type?: "single_vehicle" | "multi_vehicle";
          file_url?: string | null;
          generated_at?: string | null;
          generated_by?: string | null;
          id?: string;
          metadata?: Json;
          status?: "pending" | "generated" | "failed";
          storage_path?: string | null;
          title?: string | null;
          vehicle_ids?: string[];
        };
        Relationships: [];
      };
      facebook_connections: {
        Row: {
          ad_account_id: string | null;
          created_at: string;
          dealership_id: string;
          facebook_page_url: string | null;
          id: string;
          messenger_page_identifier: string | null;
          notes: string | null;
          page_id: string | null;
          page_name: string | null;
          page_username: string | null;
          pixel_id: string | null;
          status: "not_connected" | "configured" | "connected" | "error";
          updated_at: string;
        };
        Insert: {
          ad_account_id?: string | null;
          created_at?: string;
          dealership_id: string;
          facebook_page_url?: string | null;
          id?: string;
          messenger_page_identifier?: string | null;
          notes?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          page_username?: string | null;
          pixel_id?: string | null;
          status?: "not_connected" | "configured" | "connected" | "error";
          updated_at?: string;
        };
        Update: {
          ad_account_id?: string | null;
          created_at?: string;
          dealership_id?: string;
          facebook_page_url?: string | null;
          id?: string;
          messenger_page_identifier?: string | null;
          notes?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          page_username?: string | null;
          pixel_id?: string | null;
          status?: "not_connected" | "configured" | "connected" | "error";
          updated_at?: string;
        };
        Relationships: [];
      };
      facebook_generated_content: {
        Row: {
          content: string;
          content_type:
            | "facebook_caption"
            | "marketplace_description"
            | "ad_primary_text"
            | "ad_headline"
            | "messenger_intro";
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          id: string;
          metadata: Json;
          vehicle_id: string;
        };
        Insert: {
          content: string;
          content_type:
            | "facebook_caption"
            | "marketplace_description"
            | "ad_primary_text"
            | "ad_headline"
            | "messenger_intro";
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          id?: string;
          metadata?: Json;
          vehicle_id: string;
        };
        Update: {
          content?: string;
          content_type?:
            | "facebook_caption"
            | "marketplace_description"
            | "ad_primary_text"
            | "ad_headline"
            | "messenger_intro";
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          id?: string;
          metadata?: Json;
          vehicle_id?: string;
        };
        Relationships: [];
      };
      facebook_lead_form_mappings: {
        Row: {
          created_at: string;
          dealership_id: string;
          field_map: Json;
          form_id: string;
          form_name: string | null;
          id: string;
          is_active: boolean;
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          created_at?: string;
          dealership_id: string;
          field_map?: Json;
          form_id: string;
          form_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          created_at?: string;
          dealership_id?: string;
          field_map?: Json;
          form_id?: string;
          form_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      facebook_leads: {
        Row: {
          ad_id: string | null;
          ad_name: string | null;
          adset_id: string | null;
          adset_name: string | null;
          campaign_id: string | null;
          campaign_name: string | null;
          created_at: string;
          customer_id: string | null;
          dealership_id: string;
          error_message: string | null;
          facebook_connection_id: string | null;
          field_data: Json;
          form_id: string | null;
          form_name: string | null;
          id: string;
          inquiry_id: string | null;
          leadgen_id: string;
          page_id: string | null;
          processed_at: string | null;
          raw_payload: Json;
          received_at: string;
          status: "received" | "processed" | "duplicate" | "failed";
          vehicle_id: string | null;
        };
        Insert: {
          ad_id?: string | null;
          ad_name?: string | null;
          adset_id?: string | null;
          adset_name?: string | null;
          campaign_id?: string | null;
          campaign_name?: string | null;
          created_at?: string;
          customer_id?: string | null;
          dealership_id: string;
          error_message?: string | null;
          facebook_connection_id?: string | null;
          field_data?: Json;
          form_id?: string | null;
          form_name?: string | null;
          id?: string;
          inquiry_id?: string | null;
          leadgen_id: string;
          page_id?: string | null;
          processed_at?: string | null;
          raw_payload?: Json;
          received_at?: string;
          status?: "received" | "processed" | "duplicate" | "failed";
          vehicle_id?: string | null;
        };
        Update: {
          ad_id?: string | null;
          ad_name?: string | null;
          adset_id?: string | null;
          adset_name?: string | null;
          campaign_id?: string | null;
          campaign_name?: string | null;
          created_at?: string;
          customer_id?: string | null;
          dealership_id?: string;
          error_message?: string | null;
          facebook_connection_id?: string | null;
          field_data?: Json;
          form_id?: string | null;
          form_name?: string | null;
          id?: string;
          inquiry_id?: string | null;
          leadgen_id?: string;
          page_id?: string | null;
          processed_at?: string | null;
          raw_payload?: Json;
          received_at?: string;
          status?: "received" | "processed" | "duplicate" | "failed";
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      facebook_api_logs: {
        Row: {
          action: string;
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          endpoint: string | null;
          error_message: string | null;
          id: string;
          request_payload: Json;
          response_payload: Json;
          status: "success" | "error";
          status_code: number | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          endpoint?: string | null;
          error_message?: string | null;
          id?: string;
          request_payload?: Json;
          response_payload?: Json;
          status: "success" | "error";
          status_code?: number | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          endpoint?: string | null;
          error_message?: string | null;
          id?: string;
          request_payload?: Json;
          response_payload?: Json;
          status?: "success" | "error";
          status_code?: number | null;
        };
        Relationships: [];
      };
      facebook_post_publications: {
        Row: {
          caption: string;
          comments_last_synced_at: string | null;
          created_at: string;
          dealership_id: string;
          error_message: string | null;
          facebook_connection_id: string | null;
          facebook_page_id: string | null;
          facebook_photo_id: string | null;
          facebook_post_id: string | null;
          featured_image_url: string | null;
          generated_content_id: string | null;
          id: string;
          metadata: Json;
          public_vehicle_url: string;
          publish_type: "text_link_post" | "photo_post";
          published_at: string | null;
          published_by: string | null;
          status: "pending" | "published" | "failed";
          vehicle_id: string;
        };
        Insert: {
          caption: string;
          comments_last_synced_at?: string | null;
          created_at?: string;
          dealership_id: string;
          error_message?: string | null;
          facebook_connection_id?: string | null;
          facebook_page_id?: string | null;
          facebook_photo_id?: string | null;
          facebook_post_id?: string | null;
          featured_image_url?: string | null;
          generated_content_id?: string | null;
          id?: string;
          metadata?: Json;
          public_vehicle_url: string;
          publish_type: "text_link_post" | "photo_post";
          published_at?: string | null;
          published_by?: string | null;
          status?: "pending" | "published" | "failed";
          vehicle_id: string;
        };
        Update: {
          caption?: string;
          comments_last_synced_at?: string | null;
          created_at?: string;
          dealership_id?: string;
          error_message?: string | null;
          facebook_connection_id?: string | null;
          facebook_page_id?: string | null;
          facebook_photo_id?: string | null;
          facebook_post_id?: string | null;
          featured_image_url?: string | null;
          generated_content_id?: string | null;
          id?: string;
          metadata?: Json;
          public_vehicle_url?: string;
          publish_type?: "text_link_post" | "photo_post";
          published_at?: string | null;
          published_by?: string | null;
          status?: "pending" | "published" | "failed";
          vehicle_id?: string;
        };
        Relationships: [];
      };
      facebook_post_comments: {
        Row: {
          author_facebook_id: string | null;
          author_name: string;
          created_at: string;
          customer_id: string | null;
          dealership_id: string;
          error_message: string | null;
          facebook_comment_id: string;
          facebook_connection_id: string | null;
          facebook_post_id: string;
          id: string;
          inquiry_id: string | null;
          message: string;
          page_id: string;
          parent_comment_id: string | null;
          processed_at: string | null;
          publication_id: string | null;
          raw_payload: Json;
          received_at: string;
          status: "received" | "processed" | "duplicate" | "ignored" | "failed";
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          author_facebook_id?: string | null;
          author_name: string;
          created_at?: string;
          customer_id?: string | null;
          dealership_id: string;
          error_message?: string | null;
          facebook_comment_id: string;
          facebook_connection_id?: string | null;
          facebook_post_id: string;
          id?: string;
          inquiry_id?: string | null;
          message: string;
          page_id: string;
          parent_comment_id?: string | null;
          processed_at?: string | null;
          publication_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          status?: "received" | "processed" | "duplicate" | "ignored" | "failed";
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          author_facebook_id?: string | null;
          author_name?: string;
          created_at?: string;
          customer_id?: string | null;
          dealership_id?: string;
          error_message?: string | null;
          facebook_comment_id?: string;
          facebook_connection_id?: string | null;
          facebook_post_id?: string;
          id?: string;
          inquiry_id?: string | null;
          message?: string;
          page_id?: string;
          parent_comment_id?: string | null;
          processed_at?: string | null;
          publication_id?: string | null;
          raw_payload?: Json;
          received_at?: string;
          status?: "received" | "processed" | "duplicate" | "ignored" | "failed";
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      facebook_webhook_events: {
        Row: {
          created_at: string;
          dealership_id: string;
          error_message: string | null;
          event_key: string;
          event_name: string;
          event_source: "messenger" | "lead_form" | "comment" | "unknown";
          facebook_connection_id: string | null;
          id: string;
          metadata: Json;
          object_type: string;
          page_id: string | null;
          processed_at: string | null;
          raw_payload: Json;
          recipient_id: string | null;
          sender_psid: string | null;
          status: "received" | "processed" | "ignored" | "error";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dealership_id: string;
          error_message?: string | null;
          event_key: string;
          event_name: string;
          event_source?: "messenger" | "lead_form" | "comment" | "unknown";
          facebook_connection_id?: string | null;
          id?: string;
          metadata?: Json;
          object_type?: string;
          page_id?: string | null;
          processed_at?: string | null;
          raw_payload?: Json;
          recipient_id?: string | null;
          sender_psid?: string | null;
          status?: "received" | "processed" | "ignored" | "error";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dealership_id?: string;
          error_message?: string | null;
          event_key?: string;
          event_name?: string;
          event_source?: "messenger" | "lead_form" | "comment" | "unknown";
          facebook_connection_id?: string | null;
          id?: string;
          metadata?: Json;
          object_type?: string;
          page_id?: string | null;
          processed_at?: string | null;
          raw_payload?: Json;
          recipient_id?: string | null;
          sender_psid?: string | null;
          status?: "received" | "processed" | "ignored" | "error";
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
      inquiries: {
        Row: {
          assigned_to: string | null;
          budget_range: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          dealership_id: string;
          id: string;
          lost_reason: string | null;
          next_follow_up_at: string | null;
          original_message: string | null;
          payment_preference: "cash" | "financing" | "undecided" | null;
          source_detail: string | null;
          source_reference_id: string | null;
          source_type:
            | "facebook_lead_form"
            | "facebook_messenger"
            | "website_inquiry_form"
            | "manual_entry"
            | "phone_call"
            | "walk_in"
            | "referral"
            | "facebook_comment"
            | "viber"
            | "whatsapp"
            | "other";
          status:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          updated_at: string;
          vehicle_id: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          budget_range?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          dealership_id: string;
          id?: string;
          lost_reason?: string | null;
          next_follow_up_at?: string | null;
          original_message?: string | null;
          payment_preference?: "cash" | "financing" | "undecided" | null;
          source_detail?: string | null;
          source_reference_id?: string | null;
          source_type:
            | "facebook_lead_form"
            | "facebook_messenger"
            | "website_inquiry_form"
            | "manual_entry"
            | "phone_call"
            | "walk_in"
            | "referral"
            | "facebook_comment"
            | "viber"
            | "whatsapp"
            | "other";
          status?:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          budget_range?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          dealership_id?: string;
          id?: string;
          lost_reason?: string | null;
          next_follow_up_at?: string | null;
          original_message?: string | null;
          payment_preference?: "cash" | "financing" | "undecided" | null;
          source_detail?: string | null;
          source_reference_id?: string | null;
          source_type?:
            | "facebook_lead_form"
            | "facebook_messenger"
            | "website_inquiry_form"
            | "manual_entry"
            | "phone_call"
            | "walk_in"
            | "referral"
            | "facebook_comment"
            | "viber"
            | "whatsapp"
            | "other";
          status?:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          updated_at?: string;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      inquiry_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          event_type:
            | "created"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "follow_up_set"
            | "customer_updated"
            | "vehicle_linked"
            | "marked_won"
            | "marked_lost";
          id: string;
          inquiry_id: string;
          metadata: Json;
          new_status: string | null;
          note: string | null;
          old_status: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          event_type:
            | "created"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "follow_up_set"
            | "customer_updated"
            | "vehicle_linked"
            | "marked_won"
            | "marked_lost";
          id?: string;
          inquiry_id: string;
          metadata?: Json;
          new_status?: string | null;
          note?: string | null;
          old_status?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          event_type?:
            | "created"
            | "status_changed"
            | "note_added"
            | "assigned"
            | "follow_up_set"
            | "customer_updated"
            | "vehicle_linked"
            | "marked_won"
            | "marked_lost";
          id?: string;
          inquiry_id?: string;
          metadata?: Json;
          new_status?: string | null;
          note?: string | null;
          old_status?: string | null;
        };
        Relationships: [];
      };
      pipeline_stages: {
        Row: {
          created_at: string;
          dealership_id: string;
          description: string | null;
          id: string;
          is_terminal: boolean;
          key:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dealership_id: string;
          description?: string | null;
          id?: string;
          is_terminal?: boolean;
          key:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dealership_id?: string;
          description?: string | null;
          id?: string;
          is_terminal?: boolean;
          key?:
            | "new"
            | "contacted"
            | "viewing_scheduled"
            | "negotiation"
            | "reserved"
            | "won"
            | "lost";
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_source_events: {
        Row: {
          created_at: string;
          customer_id: string | null;
          dealership_id: string;
          event_name: string;
          external_reference_id: string | null;
          id: string;
          inquiry_id: string | null;
          metadata: Json;
          source_detail: string | null;
          source_type: string;
          vehicle_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          dealership_id: string;
          event_name: string;
          external_reference_id?: string | null;
          id?: string;
          inquiry_id?: string | null;
          metadata?: Json;
          source_detail?: string | null;
          source_type: string;
          vehicle_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          dealership_id?: string;
          event_name?: string;
          external_reference_id?: string | null;
          id?: string;
          inquiry_id?: string | null;
          metadata?: Json;
          source_detail?: string | null;
          source_type?: string;
          vehicle_id?: string | null;
        };
        Relationships: [];
      };
      messenger_conversations: {
        Row: {
          created_at: string;
          customer_id: string | null;
          dealership_id: string;
          facebook_connection_id: string | null;
          id: string;
          inquiry_id: string | null;
          last_message: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          metadata: Json;
          page_id: string;
          referral_ref: string | null;
          sender_id: string;
          sender_psid: string;
          status: "new" | "reviewed" | "converted" | "ignored";
          vehicle_id: string | null;
          vehicle_slug: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          dealership_id: string;
          facebook_connection_id?: string | null;
          id?: string;
          inquiry_id?: string | null;
          last_message?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          metadata?: Json;
          page_id: string;
          referral_ref?: string | null;
          sender_id: string;
          sender_psid: string;
          status?: "new" | "reviewed" | "converted" | "ignored";
          vehicle_id?: string | null;
          vehicle_slug?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          dealership_id?: string;
          facebook_connection_id?: string | null;
          id?: string;
          inquiry_id?: string | null;
          last_message?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          metadata?: Json;
          page_id?: string;
          referral_ref?: string | null;
          sender_id?: string;
          sender_psid?: string;
          status?: "new" | "reviewed" | "converted" | "ignored";
          vehicle_id?: string | null;
          vehicle_slug?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messenger_messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          dealership_id: string;
          direction: "inbound" | "outbound";
          facebook_connection_id: string | null;
          facebook_message_id: string;
          id: string;
          message_text: string | null;
          metadata: Json;
          page_id: string;
          raw_payload: Json;
          sender_psid: string;
          sent_at: string;
          updated_at: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          dealership_id: string;
          direction?: "inbound" | "outbound";
          facebook_connection_id?: string | null;
          facebook_message_id: string;
          id?: string;
          message_text?: string | null;
          metadata?: Json;
          page_id: string;
          raw_payload?: Json;
          sender_psid: string;
          sent_at: string;
          updated_at?: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          dealership_id?: string;
          direction?: "inbound" | "outbound";
          facebook_connection_id?: string | null;
          facebook_message_id?: string;
          id?: string;
          message_text?: string | null;
          metadata?: Json;
          page_id?: string;
          raw_payload?: Json;
          sender_psid?: string;
          sent_at?: string;
          updated_at?: string;
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
      vehicle_media: {
        Row: {
          alt_text: string | null;
          created_at: string;
          dealership_id: string;
          id: string;
          is_featured: boolean;
          sort_order: number;
          storage_path: string | null;
          url: string;
          vehicle_id: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          dealership_id: string;
          id?: string;
          is_featured?: boolean;
          sort_order?: number;
          storage_path?: string | null;
          url: string;
          vehicle_id: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          dealership_id?: string;
          id?: string;
          is_featured?: boolean;
          sort_order?: number;
          storage_path?: string | null;
          url?: string;
          vehicle_id?: string;
        };
        Relationships: [];
      };
      sale_payment_plan_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          event_type: "created" | "updated";
          id: string;
          metadata: Json;
          plan_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          event_type: "created" | "updated";
          id?: string;
          metadata?: Json;
          plan_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          event_type?: "created" | "updated";
          id?: string;
          metadata?: Json;
          plan_id?: string;
        };
        Relationships: [];
      };
      sale_payment_plans: {
        Row: {
          apr_percent: number | null;
          balance_remaining: number;
          created_at: string;
          dealership_id: string;
          down_payment_amount: number;
          financed_amount: number | null;
          financier_name: string | null;
          id: string;
          monthly_payment: number | null;
          notes: string | null;
          plan_type: "cash" | "financing" | "mixed" | "trade_in";
          sale_id: string;
          status:
            | "cancelled"
            | "overdue"
            | "paid_in_full"
            | "partially_paid"
            | "pending";
          term_months: number | null;
          total_amount: number;
          trade_in_amount: number | null;
          updated_at: string;
        };
        Insert: {
          apr_percent?: number | null;
          balance_remaining: number;
          created_at?: string;
          dealership_id: string;
          down_payment_amount?: number;
          financed_amount?: number | null;
          financier_name?: string | null;
          id?: string;
          monthly_payment?: number | null;
          notes?: string | null;
          plan_type: "cash" | "financing" | "mixed" | "trade_in";
          sale_id: string;
          status:
            | "cancelled"
            | "overdue"
            | "paid_in_full"
            | "partially_paid"
            | "pending";
          term_months?: number | null;
          total_amount: number;
          trade_in_amount?: number | null;
          updated_at?: string;
        };
        Update: {
          apr_percent?: number | null;
          balance_remaining?: number;
          created_at?: string;
          dealership_id?: string;
          down_payment_amount?: number;
          financed_amount?: number | null;
          financier_name?: string | null;
          id?: string;
          monthly_payment?: number | null;
          notes?: string | null;
          plan_type?: "cash" | "financing" | "mixed" | "trade_in";
          sale_id?: string;
          status?:
            | "cancelled"
            | "overdue"
            | "paid_in_full"
            | "partially_paid"
            | "pending";
          term_months?: number | null;
          total_amount?: number;
          trade_in_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sale_payment_schedule_items: {
        Row: {
          amount_due: number;
          created_at: string;
          dealership_id: string;
          due_at: string;
          id: string;
          paid_payment_id: string | null;
          plan_id: string;
          status: "overdue" | "paid" | "pending" | "waived";
          updated_at: string;
        };
        Insert: {
          amount_due: number;
          created_at?: string;
          dealership_id: string;
          due_at: string;
          id?: string;
          paid_payment_id?: string | null;
          plan_id: string;
          status?: "overdue" | "paid" | "pending" | "waived";
          updated_at?: string;
        };
        Update: {
          amount_due?: number;
          created_at?: string;
          dealership_id?: string;
          due_at?: string;
          id?: string;
          paid_payment_id?: string | null;
          plan_id?: string;
          status?: "overdue" | "paid" | "pending" | "waived";
          updated_at?: string;
        };
        Relationships: [];
      };
      sale_payments: {
        Row: {
          amount: number;
          created_at: string;
          dealership_id: string;
          id: string;
          notes: string | null;
          paid_at: string;
          payment_method: "bank_transfer" | "cash" | "check" | "gcash" | "other";
          plan_id: string | null;
          recorded_by: string | null;
          reference_number: string | null;
          sale_id: string;
          status: "posted" | "voided";
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          dealership_id: string;
          id?: string;
          notes?: string | null;
          paid_at?: string;
          payment_method: "bank_transfer" | "cash" | "check" | "gcash" | "other";
          plan_id?: string | null;
          recorded_by?: string | null;
          reference_number?: string | null;
          sale_id: string;
          status?: "posted" | "voided";
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          dealership_id?: string;
          id?: string;
          notes?: string | null;
          paid_at?: string;
          payment_method?: "bank_transfer" | "cash" | "check" | "gcash" | "other";
          plan_id?: string | null;
          recorded_by?: string | null;
          reference_number?: string | null;
          sale_id?: string;
          status?: "posted" | "voided";
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicle_sales: {
        Row: {
          asking_price: number | null;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          dealership_id: string;
          id: string;
          inquiry_id: string | null;
          notes: string | null;
          payment_type: "cash" | "financing" | "trade_in" | "other" | null;
          sold_at: string;
          sold_price: number;
          updated_at: string;
          vehicle_id: string;
        };
        Insert: {
          asking_price?: number | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          dealership_id: string;
          id?: string;
          inquiry_id?: string | null;
          notes?: string | null;
          payment_type?: "cash" | "financing" | "trade_in" | "other" | null;
          sold_at?: string;
          sold_price: number;
          updated_at?: string;
          vehicle_id: string;
        };
        Update: {
          asking_price?: number | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          dealership_id?: string;
          id?: string;
          inquiry_id?: string | null;
          notes?: string | null;
          payment_type?: "cash" | "financing" | "trade_in" | "other" | null;
          sold_at?: string;
          sold_price?: number;
          updated_at?: string;
          vehicle_id?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          availability: "available" | "reserved" | "sold" | "unavailable";
          body_type: string | null;
          brand: string;
          color: string | null;
          condition_summary: string | null;
          created_at: string;
          created_by: string | null;
          dealership_id: string;
          description: string | null;
          engine: string | null;
          engine_size: string | null;
          engine_type: string | null;
          featured_image_url: string | null;
          financing_display_style: "compact" | "detailed" | "headline_only";
          financing_down_payment: number | null;
          financing_down_payment_label: string | null;
          financing_down_payment_percent: number | null;
          financing_enabled: boolean;
          financing_headline: string | null;
          financing_monthly_terms: Json;
          financing_notes: string | null;
          fuel_type: string | null;
          highlights: string[];
          id: string;
          is_price_negotiable: boolean;
          mileage: number | null;
          model: string;
          plate_number: string | null;
          post_location_tag: string | null;
          price: number | null;
          sale_inclusions: string[];
          show_cash_price_in_posts: boolean;
          slug: string;
          status: "draft" | "published" | "reserved" | "sold" | "archived";
          stock_number: string | null;
          title: string;
          transmission: string | null;
          updated_at: string;
          use_cases: string[];
          variant: string | null;
          vin: string | null;
          year: number | null;
        };
        Insert: {
          availability?: "available" | "reserved" | "sold" | "unavailable";
          body_type?: string | null;
          brand: string;
          color?: string | null;
          condition_summary?: string | null;
          created_at?: string;
          created_by?: string | null;
          dealership_id: string;
          description?: string | null;
          engine?: string | null;
          engine_size?: string | null;
          engine_type?: string | null;
          featured_image_url?: string | null;
          financing_display_style?: "compact" | "detailed" | "headline_only";
          financing_down_payment?: number | null;
          financing_down_payment_label?: string | null;
          financing_down_payment_percent?: number | null;
          financing_enabled?: boolean;
          financing_headline?: string | null;
          financing_monthly_terms?: Json;
          financing_notes?: string | null;
          fuel_type?: string | null;
          highlights?: string[];
          id?: string;
          is_price_negotiable?: boolean;
          mileage?: number | null;
          model: string;
          plate_number?: string | null;
          post_location_tag?: string | null;
          price?: number | null;
          sale_inclusions?: string[];
          show_cash_price_in_posts?: boolean;
          slug: string;
          status?: "draft" | "published" | "reserved" | "sold" | "archived";
          stock_number?: string | null;
          title: string;
          transmission?: string | null;
          updated_at?: string;
          use_cases?: string[];
          variant?: string | null;
          vin?: string | null;
          year?: number | null;
        };
        Update: {
          availability?: "available" | "reserved" | "sold" | "unavailable";
          body_type?: string | null;
          brand?: string;
          color?: string | null;
          condition_summary?: string | null;
          created_at?: string;
          created_by?: string | null;
          dealership_id?: string;
          description?: string | null;
          engine?: string | null;
          engine_size?: string | null;
          engine_type?: string | null;
          featured_image_url?: string | null;
          financing_display_style?: "compact" | "detailed" | "headline_only";
          financing_down_payment?: number | null;
          financing_down_payment_label?: string | null;
          financing_down_payment_percent?: number | null;
          financing_enabled?: boolean;
          financing_headline?: string | null;
          financing_monthly_terms?: Json;
          financing_notes?: string | null;
          fuel_type?: string | null;
          highlights?: string[];
          id?: string;
          is_price_negotiable?: boolean;
          mileage?: number | null;
          model?: string;
          plate_number?: string | null;
          post_location_tag?: string | null;
          price?: number | null;
          sale_inclusions?: string[];
          show_cash_price_in_posts?: boolean;
          slug?: string;
          status?: "draft" | "published" | "reserved" | "sold" | "archived";
          stock_number?: string | null;
          title?: string;
          transmission?: string | null;
          updated_at?: string;
          use_cases?: string[];
          variant?: string | null;
          vin?: string | null;
          year?: number | null;
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
