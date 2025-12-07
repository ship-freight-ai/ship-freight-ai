export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          bid_amount: number
          carrier_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          load_id: string
          notes: string | null
          status: Database["public"]["Enums"]["bid_status"] | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          carrier_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          load_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bid_status"] | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          carrier_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          load_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bid_status"] | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_payouts: {
        Row: {
          amount_cents: number
          carrier_amount_cents: number
          carrier_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          payment_id: string
          platform_fee_cents: number
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          carrier_amount_cents: number
          carrier_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_id: string
          platform_fee_cents: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          carrier_amount_cents?: number
          carrier_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          payment_id?: string
          platform_fee_cents?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_payouts_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "carrier_payouts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          capacity: number | null
          company_name: string
          created_at: string | null
          dot_number: string | null
          equipment_types:
            | Database["public"]["Enums"]["equipment_type"][]
            | null
          id: string
          insurance_amount: number | null
          insurance_expiry: string | null
          mc_number: string | null
          on_time_percentage: number | null
          rating: number | null
          service_areas: string[] | null
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_enabled: boolean | null
          stripe_connect_payouts_enabled: boolean | null
          total_loads: number | null
          updated_at: string | null
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          capacity?: number | null
          company_name: string
          created_at?: string | null
          dot_number?: string | null
          equipment_types?:
            | Database["public"]["Enums"]["equipment_type"][]
            | null
          id?: string
          insurance_amount?: number | null
          insurance_expiry?: string | null
          mc_number?: string | null
          on_time_percentage?: number | null
          rating?: number | null
          service_areas?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_enabled?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          total_loads?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          capacity?: number | null
          company_name?: string
          created_at?: string | null
          dot_number?: string | null
          equipment_types?:
            | Database["public"]["Enums"]["equipment_type"][]
            | null
          id?: string
          insurance_amount?: number | null
          insurance_expiry?: string | null
          mc_number?: string | null
          on_time_percentage?: number | null
          rating?: number | null
          service_areas?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_enabled?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
          total_loads?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          load_id: string | null
          parent_document_id: string | null
          rejected_reason: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          load_id?: string | null
          parent_document_id?: string | null
          rejected_reason?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          load_id?: string | null
          parent_document_id?: string | null
          rejected_reason?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          ai_confidence_score: number | null
          booked_rate: number | null
          carrier_id: string | null
          commodity: string | null
          created_at: string | null
          delivery_date: string
          destination_address: string
          destination_city: string
          destination_facility_name: string | null
          destination_lat: number | null
          destination_lng: number | null
          destination_state: string
          destination_zip: string
          distance_miles: number | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          height: number | null
          id: string
          length: number | null
          load_number: number
          origin_address: string
          origin_city: string
          origin_facility_name: string | null
          origin_lat: number | null
          origin_lng: number | null
          origin_state: string
          origin_zip: string
          pickup_date: string
          posted_rate: number | null
          shipper_id: string
          source_document_url: string | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["load_status"] | null
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          booked_rate?: number | null
          carrier_id?: string | null
          commodity?: string | null
          created_at?: string | null
          delivery_date: string
          destination_address: string
          destination_city: string
          destination_facility_name?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_state: string
          destination_zip: string
          distance_miles?: number | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          height?: number | null
          id?: string
          length?: number | null
          load_number?: number
          origin_address: string
          origin_city: string
          origin_facility_name?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_state: string
          origin_zip: string
          pickup_date: string
          posted_rate?: number | null
          shipper_id: string
          source_document_url?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["load_status"] | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          booked_rate?: number | null
          carrier_id?: string | null
          commodity?: string | null
          created_at?: string | null
          delivery_date?: string
          destination_address?: string
          destination_city?: string
          destination_facility_name?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_state?: string
          destination_zip?: string
          distance_miles?: number | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          height?: number | null
          id?: string
          length?: number | null
          load_number?: number
          origin_address?: string
          origin_city?: string
          origin_facility_name?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_state?: string
          origin_zip?: string
          pickup_date?: string
          posted_rate?: number | null
          shipper_id?: string
          source_document_url?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["load_status"] | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          load_id: string | null
          message: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          load_id?: string | null
          message: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          load_id?: string | null
          message?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          carrier_id: string
          completed_at: string | null
          created_at: string | null
          dispute_reason: string | null
          escrow_held_at: string | null
          id: string
          load_id: string
          released_at: string | null
          shipper_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          carrier_id: string
          completed_at?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          escrow_held_at?: string | null
          id?: string
          load_id: string
          released_at?: string | null
          shipper_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          carrier_id?: string
          completed_at?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          escrow_held_at?: string | null
          id?: string
          load_id?: string
          released_at?: string | null
          shipper_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bid_notifications: boolean | null
          claimed_via_invite: string | null
          company_name: string | null
          created_at: string | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          load_update_notifications: boolean | null
          message_notifications: boolean | null
          role: Database["public"]["Enums"]["app_role"] | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          bid_notifications?: boolean | null
          claimed_via_invite?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          load_update_notifications?: boolean | null
          message_notifications?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          bid_notifications?: boolean | null
          claimed_via_invite?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          load_update_notifications?: boolean | null
          message_notifications?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_claimed_via_invite_fkey"
            columns: ["claimed_via_invite"]
            isOneToOne: false
            referencedRelation: "team_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          carrier_id: string
          comments: string | null
          communication_rating: number | null
          condition_rating: number | null
          created_at: string | null
          id: string
          load_id: string
          on_time: boolean
          overall_rating: number
          professionalism_rating: number | null
          shipper_id: string
          updated_at: string | null
        }
        Insert: {
          carrier_id: string
          comments?: string | null
          communication_rating?: number | null
          condition_rating?: number | null
          created_at?: string | null
          id?: string
          load_id: string
          on_time: boolean
          overall_rating: number
          professionalism_rating?: number | null
          shipper_id: string
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string
          comments?: string | null
          communication_rating?: number | null
          condition_rating?: number | null
          created_at?: string | null
          id?: string
          load_id?: string
          on_time?: boolean
          overall_rating?: number
          professionalism_rating?: number | null
          shipper_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          seats: number
          seats_used: number
          status: string
          stripe_customer_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          seats?: number
          seats_used?: number
          status: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          seats?: number
          seats_used?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          created_by: string
          email: string | null
          expires_at: string
          id: string
          invite_token: string
          seats_allocated: number
          seats_claimed: number
          status: Database["public"]["Enums"]["invite_status"]
          subscription_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by: string
          email?: string | null
          expires_at: string
          id?: string
          invite_token: string
          seats_allocated?: number
          seats_claimed?: number
          status?: Database["public"]["Enums"]["invite_status"]
          subscription_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_token?: string
          seats_allocated?: number
          seats_claimed?: number
          status?: Database["public"]["Enums"]["invite_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_updates: {
        Row: {
          carrier_id: string
          created_at: string | null
          id: string
          load_id: string
          location_address: string | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          location_state: string | null
          notes: string | null
          status: string
        }
        Insert: {
          carrier_id: string
          created_at?: string | null
          id?: string
          load_id: string
          location_address?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          notes?: string | null
          status: string
        }
        Update: {
          carrier_id?: string
          created_at?: string | null
          id?: string
          load_id?: string
          location_address?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_updates_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_release_old_payments: { Args: never; Returns: Json }
      expire_old_bids: { Args: never; Returns: undefined }
      expire_old_invites: { Args: never; Returns: undefined }
      get_platform_metrics: { Args: never; Returns: Json }
      get_subscription_analytics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "shipper" | "carrier"
      bid_status: "pending" | "accepted" | "rejected" | "countered" | "expired"
      document_type:
        | "pod"
        | "bol"
        | "rate_confirmation"
        | "insurance"
        | "mc_authority"
        | "other"
      equipment_type:
        | "dry_van"
        | "reefer"
        | "flatbed"
        | "step_deck"
        | "lowboy"
        | "tanker"
        | "box_truck"
        | "power_only"
      invite_status: "pending" | "claimed" | "expired" | "revoked"
      load_status:
        | "draft"
        | "posted"
        | "bidding"
        | "booked"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
      payment_status:
        | "pending"
        | "held_in_escrow"
        | "released"
        | "completed"
        | "failed"
        | "disputed"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "shipper", "carrier"],
      bid_status: ["pending", "accepted", "rejected", "countered", "expired"],
      document_type: [
        "pod",
        "bol",
        "rate_confirmation",
        "insurance",
        "mc_authority",
        "other",
      ],
      equipment_type: [
        "dry_van",
        "reefer",
        "flatbed",
        "step_deck",
        "lowboy",
        "tanker",
        "box_truck",
        "power_only",
      ],
      invite_status: ["pending", "claimed", "expired", "revoked"],
      load_status: [
        "draft",
        "posted",
        "bidding",
        "booked",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
      ],
      payment_status: [
        "pending",
        "held_in_escrow",
        "released",
        "completed",
        "failed",
        "disputed",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
