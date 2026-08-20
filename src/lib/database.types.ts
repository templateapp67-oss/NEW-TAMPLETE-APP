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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          flat_number: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          latitude: number | null
          longitude: number | null
          pincode: string
          state: string | null
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          flat_number: string
          id?: string
          is_default?: boolean
          label: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode: string
          state?: string | null
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          flat_number?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string
          state?: string | null
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string | null
          request_id: string | null
          salon_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id?: string | null
          request_id?: string | null
          salon_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string | null
          request_id?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "audit_logs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          block_type: string
          booking_id: string | null
          created_at: string
          ends_at: string
          id: string
          reason: string | null
          salon_id: string
          staff_id: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          block_type: string
          booking_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          reason?: string | null
          salon_id: string
          staff_id?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          block_type?: string
          booking_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string | null
          salon_id?: string
          staff_id?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "availability_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_disputes: {
        Row: {
          assigned_to: string | null
          booking_id: string
          created_at: string
          description: string
          id: string
          opened_by: string
          reason_code: string
          resolution_note: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id: string
          created_at?: string
          description: string
          id?: string
          opened_by: string
          reason_code: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          reason_code?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          discount_paise: number
          duration_minutes_snapshot: number
          id: string
          line_total_paise: number
          quantity: number
          service_id: string
          service_name_snapshot: string
          staff_id: string | null
          tax_paise: number
          unit_price_paise: number
        }
        Insert: {
          booking_id: string
          discount_paise?: number
          duration_minutes_snapshot: number
          id?: string
          line_total_paise: number
          quantity?: number
          service_id: string
          service_name_snapshot: string
          staff_id?: string | null
          tax_paise?: number
          unit_price_paise: number
        }
        Update: {
          booking_id?: string
          discount_paise?: number
          duration_minutes_snapshot?: number
          id?: string
          line_total_paise?: number
          quantity?: number
          service_id?: string
          service_name_snapshot?: string
          staff_id?: string | null
          tax_paise?: number
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_due_paise: number
          appointment_end: string
          appointment_start: string
          booking_number: string
          cancel_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_note: string | null
          customer_user_id: string | null
          discount_paise: number
          disputed_at: string | null
          final_due_paise: number
          final_payment_ready_at: string | null
          financial_status: string
          fully_paid_at: string | null
          id: string
          idempotency_key: string | null
          internal_note: string | null
          salon_address_snapshot: Json
          salon_customer_id: string
          salon_id: string
          source: string
          staff_id: string | null
          staff_name_snapshot: string | null
          started_at: string | null
          status: string
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          updated_at: string
        }
        Insert: {
          advance_due_paise: number
          appointment_end: string
          appointment_start: string
          booking_number: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_note?: string | null
          customer_user_id?: string | null
          discount_paise?: number
          disputed_at?: string | null
          final_due_paise: number
          final_payment_ready_at?: string | null
          financial_status?: string
          fully_paid_at?: string | null
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          salon_address_snapshot?: Json
          salon_customer_id: string
          salon_id: string
          source: string
          staff_id?: string | null
          staff_name_snapshot?: string | null
          started_at?: string | null
          status: string
          subtotal_paise?: number
          tax_paise?: number
          total_paise: number
          updated_at?: string
        }
        Update: {
          advance_due_paise?: number
          appointment_end?: string
          appointment_start?: string
          booking_number?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_note?: string | null
          customer_user_id?: string | null
          discount_paise?: number
          disputed_at?: string | null
          final_due_paise?: number
          final_payment_ready_at?: string | null
          financial_status?: string
          fully_paid_at?: string | null
          id?: string
          idempotency_key?: string | null
          internal_note?: string | null
          salon_address_snapshot?: Json
          salon_customer_id?: string
          salon_id?: string
          source?: string
          staff_id?: string | null
          staff_name_snapshot?: string | null
          started_at?: string | null
          status?: string
          subtotal_paise?: number
          tax_paise?: number
          total_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_salon_customer_id_fkey"
            columns: ["salon_customer_id"]
            isOneToOne: false
            referencedRelation: "salon_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address_label: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          latitude: number
          longitude: number
          rejection_reason: string | null
          salon_id: string
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          address_label?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          latitude: number
          longitude: number
          rejection_reason?: string | null
          salon_id: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          address_label?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          latitude?: number
          longitude?: number
          rejection_reason?: string | null
          salon_id?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "business_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rule_events: {
        Row: {
          amount_paise: number | null
          booking_id: string | null
          context: Json
          created_at: string
          detail: string | null
          event: string
          event_type: string
          id: string
          metadata: Json | null
          rule_id: string
          salon_id: string | null
          severity: string
        }
        Insert: {
          amount_paise?: number | null
          booking_id?: string | null
          context?: Json
          created_at?: string
          detail?: string | null
          event: string
          event_type?: string
          id?: string
          metadata?: Json | null
          rule_id: string
          salon_id?: string | null
          severity?: string
        }
        Update: {
          amount_paise?: number | null
          booking_id?: string | null
          context?: Json
          created_at?: string
          detail?: string | null
          event?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          rule_id?: string
          salon_id?: string | null
          severity?: string
        }
        Relationships: []
      }
      commission_events: {
        Row: {
          available_at: string | null
          basis_amount_paise: number
          calculation_snapshot: Json
          commission_amount_paise: number
          created_at: string
          event_type: string
          growth_partner_id: string
          hold_until: string | null
          id: string
          plan_version_id: string
          qualifying_transaction_id: string | null
          rate_basis_points: number
          reason_code: string | null
          reversed_at: string | null
          salon_id: string
          shop_attribution_id: string
          source_event_id: string
          status: string
        }
        Insert: {
          available_at?: string | null
          basis_amount_paise: number
          calculation_snapshot: Json
          commission_amount_paise: number
          created_at?: string
          event_type: string
          growth_partner_id: string
          hold_until?: string | null
          id?: string
          plan_version_id: string
          qualifying_transaction_id?: string | null
          rate_basis_points: number
          reason_code?: string | null
          reversed_at?: string | null
          salon_id: string
          shop_attribution_id: string
          source_event_id: string
          status: string
        }
        Update: {
          available_at?: string | null
          basis_amount_paise?: number
          calculation_snapshot?: Json
          commission_amount_paise?: number
          created_at?: string
          event_type?: string
          growth_partner_id?: string
          hold_until?: string | null
          id?: string
          plan_version_id?: string
          qualifying_transaction_id?: string | null
          rate_basis_points?: number
          reason_code?: string | null
          reversed_at?: string | null
          salon_id?: string
          shop_attribution_id?: string
          source_event_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_events_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "commission_events_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "commission_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_qualifying_transaction_id_fkey"
            columns: ["qualifying_transaction_id"]
            isOneToOne: false
            referencedRelation: "qualifying_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "commission_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_shop_attribution_id_fkey"
            columns: ["shop_attribution_id"]
            isOneToOne: false
            referencedRelation: "shop_attributions"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_plan_versions: {
        Row: {
          commission_plan_id: string
          created_at: string
          earning_type: string
          fixed_amount_paise: number | null
          hold_days: number
          id: string
          maximum_commission_paise: number | null
          minimum_transaction_paise: number | null
          qualification_required: boolean
          rate_basis_points: number
          rule_definition: Json
          valid_from: string
          valid_until: string | null
          version_number: number
        }
        Insert: {
          commission_plan_id: string
          created_at?: string
          earning_type: string
          fixed_amount_paise?: number | null
          hold_days?: number
          id?: string
          maximum_commission_paise?: number | null
          minimum_transaction_paise?: number | null
          qualification_required?: boolean
          rate_basis_points?: number
          rule_definition?: Json
          valid_from: string
          valid_until?: string | null
          version_number: number
        }
        Update: {
          commission_plan_id?: string
          created_at?: string
          earning_type?: string
          fixed_amount_paise?: number | null
          hold_days?: number
          id?: string
          maximum_commission_paise?: number | null
          minimum_transaction_paise?: number | null
          qualification_required?: boolean
          rate_basis_points?: number
          rule_definition?: Json
          valid_from?: string
          valid_until?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_plan_versions_commission_plan_id_fkey"
            columns: ["commission_plan_id"]
            isOneToOne: false
            referencedRelation: "commission_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_plans: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          name: string
          status: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name: string
          status: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name?: string
          status?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          created_at: string
          id: string
          message: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          author: string
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          salon_id: string
          service_id: string | null
          service_name: string
          user_id: string | null
          verified_booking: boolean
        }
        Insert: {
          author?: string
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          salon_id: string
          service_id?: string | null
          service_name: string
          user_id?: string | null
          verified_booking?: boolean
        }
        Update: {
          author?: string
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          salon_id?: string
          service_id?: string | null
          service_name?: string
          user_id?: string | null
          verified_booking?: boolean
        }
        Relationships: []
      }
      customer_settings: {
        Row: {
          created_at: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_salons: {
        Row: {
          created_at: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_salons_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "favorite_salons_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_salons_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_salons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_salons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorite_services: {
        Row: {
          created_at: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorite_staff: {
        Row: {
          created_at: string
          staff_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          staff_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      growth_partner_commissions: {
        Row: {
          accrued_at: string
          attribution_id: string | null
          booking_gross_paise: number
          booking_id: string
          commission_paise: number
          commission_rate_bps: number
          completed_at: string | null
          created_at: string
          growth_partner_id: string
          hold_days: number
          hold_until: string
          id: string
          paid_at: string | null
          payout_reference: string | null
          platform_fee_paise: number
          released_at: string | null
          salon_id: string
          source_event: string | null
          status: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          accrued_at?: string
          attribution_id?: string | null
          booking_gross_paise?: number
          booking_id: string
          commission_paise?: number
          commission_rate_bps?: number
          completed_at?: string | null
          created_at?: string
          growth_partner_id: string
          hold_days?: number
          hold_until: string
          id?: string
          paid_at?: string | null
          payout_reference?: string | null
          platform_fee_paise?: number
          released_at?: string | null
          salon_id: string
          source_event?: string | null
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          accrued_at?: string
          attribution_id?: string | null
          booking_gross_paise?: number
          booking_id?: string
          commission_paise?: number
          commission_rate_bps?: number
          completed_at?: string | null
          created_at?: string
          growth_partner_id?: string
          hold_days?: number
          hold_until?: string
          id?: string
          paid_at?: string | null
          payout_reference?: string | null
          platform_fee_paise?: number
          released_at?: string | null
          salon_id?: string
          source_event?: string | null
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_partner_commissions_booking_fk"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_partners: {
        Row: {
          address: string | null
          alternate_phone: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          closed_at: string | null
          commission_plan_id: string | null
          created_at: string
          district: string | null
          id: string
          partner_code: string
          paused_at: string | null
          referral_code: string
          region_code: string | null
          state: string | null
          status: string
          status_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          closed_at?: string | null
          commission_plan_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          partner_code: string
          paused_at?: string | null
          referral_code: string
          region_code?: string | null
          state?: string | null
          status?: string
          status_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          closed_at?: string | null
          commission_plan_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          partner_code?: string
          paused_at?: string | null
          referral_code?: string
          region_code?: string | null
          state?: string | null
          status?: string
          status_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "growth_partners_commission_plan_fk"
            columns: ["commission_plan_id"]
            isOneToOne: false
            referencedRelation: "commission_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string
          operation: string
          request_hash: string
          response_reference: Json | null
          salon_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          idempotency_key: string
          operation: string
          request_hash: string
          response_reference?: Json | null
          salon_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          operation?: string
          request_hash?: string
          response_reference?: Json | null
          salon_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "idempotency_keys_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string
          customer_snapshot: Json
          discount_paise: number
          id: string
          invoice_number: string
          issued_at: string | null
          pdf_path: string | null
          salon_id: string
          status: string
          subtotal_paise: number
          tax_paise: number
          tax_registration_snapshot: Json
          total_paise: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_snapshot: Json
          discount_paise: number
          id?: string
          invoice_number: string
          issued_at?: string | null
          pdf_path?: string | null
          salon_id: string
          status: string
          subtotal_paise: number
          tax_paise: number
          tax_registration_snapshot?: Json
          total_paise: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_snapshot?: Json
          discount_paise?: number
          id?: string
          invoice_number?: string
          issued_at?: string | null
          pdf_path?: string | null
          salon_id?: string
          status?: string
          subtotal_paise?: number
          tax_paise?: number
          tax_registration_snapshot?: Json
          total_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "invoices_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_account_deletion_requests: {
        Row: {
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          reason: string | null
          to_status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_applications: {
        Row: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note?: string | null
          employer_notes?: string | null
          expected_salary?: number | null
          id?: string
          job_id: string
          resume_id?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          candidate_profile_id?: string
          candidate_user_id?: string
          cover_note?: string | null
          employer_notes?: string | null
          expected_salary?: number | null
          id?: string
          job_id?: string
          resume_id?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_applications_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "job_candidate_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          salon_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          salon_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_audit_log_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_audit_log_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_audit_log_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_blocked_employers: {
        Row: {
          candidate_user_id: string
          created_at: string
          salon_id: string
        }
        Insert: {
          candidate_user_id: string
          created_at?: string
          salon_id: string
        }
        Update: {
          candidate_user_id?: string
          created_at?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_blocked_employers_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_blocked_employers_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_blocked_employers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_blocked_employers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_blocked_employers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_certifications: {
        Row: {
          candidate_id: string
          certificate_name: string
          certificate_path: string | null
          completion_year: number | null
          created_at: string
          id: string
          institution_name: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          certificate_name: string
          certificate_path?: string | null
          completion_year?: number | null
          created_at?: string
          id?: string
          institution_name?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          certificate_name?: string
          certificate_path?: string | null
          completion_year?: number | null
          created_at?: string
          id?: string
          institution_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_certifications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_certifications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_education: {
        Row: {
          candidate_id: string
          completion_year: number | null
          course_name: string
          created_at: string
          description: string | null
          id: string
          institution_name: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          completion_year?: number | null
          course_name: string
          created_at?: string
          description?: string | null
          id?: string
          institution_name?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          completion_year?: number | null
          course_name?: string
          created_at?: string
          description?: string | null
          id?: string
          institution_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_education_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_education_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_employment_types: {
        Row: {
          candidate_id: string
          employment_type: string
        }
        Insert: {
          candidate_id: string
          employment_type: string
        }
        Update: {
          candidate_id?: string
          employment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_employment_types_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_employment_types_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_experience: {
        Row: {
          candidate_id: string
          city: string | null
          created_at: string
          currently_working: boolean
          description: string | null
          end_date: string | null
          id: string
          role_title: string
          salon_name: string
          sort_order: number
          start_date: string
          state: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          city?: string | null
          created_at?: string
          currently_working?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          role_title: string
          salon_name: string
          sort_order?: number
          start_date: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          city?: string | null
          created_at?: string
          currently_working?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          role_title?: string
          salon_name?: string
          sort_order?: number
          start_date?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_preferences: {
        Row: {
          available_from: string | null
          candidate_id: string
          created_at: string
          open_to_relocation: boolean
          preferred_city: string | null
          preferred_state: string | null
          radius_km: number | null
          salary_max: number | null
          salary_min: number | null
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          candidate_id: string
          created_at?: string
          open_to_relocation?: boolean
          preferred_city?: string | null
          preferred_state?: string | null
          radius_km?: number | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          candidate_id?: string
          created_at?: string
          open_to_relocation?: boolean
          preferred_city?: string | null
          preferred_state?: string | null
          radius_km?: number | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_preferences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_preferences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_preferred_roles: {
        Row: {
          candidate_id: string
          created_at: string
          role_name: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          role_name: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_preferred_roles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_preferred_roles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_resumes: {
        Row: {
          candidate_id: string
          file_size: number
          id: string
          is_primary: boolean
          mime_type: string
          original_filename: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          candidate_id: string
          file_size: number
          id?: string
          is_primary?: boolean
          mime_type: string
          original_filename: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          candidate_id?: string
          file_size?: number
          id?: string
          is_primary?: boolean
          mime_type?: string
          original_filename?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_resumes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_resumes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_candidate_skills: {
        Row: {
          candidate_id: string
          created_at: string
          proficiency_level: string | null
          skill_id: string
          years_experience: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          proficiency_level?: string | null
          skill_id: string
          years_experience?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          proficiency_level?: string | null
          skill_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_candidate_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "job_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      job_conversations: {
        Row: {
          candidate_unread_count: number
          candidate_user_id: string
          created_at: string
          employer_unread_count: number
          employer_user_id: string
          id: string
          job_id: string
          last_message: string | null
          last_message_at: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_unread_count?: number
          candidate_user_id: string
          created_at?: string
          employer_unread_count?: number
          employer_user_id: string
          id?: string
          job_id: string
          last_message?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_unread_count?: number
          candidate_user_id?: string
          created_at?: string
          employer_unread_count?: number
          employer_user_id?: string
          id?: string
          job_id?: string
          last_message?: string | null
          last_message_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_conversations_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_conversations_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_conversations_employer_user_id_fkey"
            columns: ["employer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_conversations_employer_user_id_fkey"
            columns: ["employer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_employer_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_employer_verifications: {
        Row: {
          business_proof_path: string | null
          id: string
          identity_proof_path: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salon_id: string
          salon_proof_path: string | null
          status: string
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          business_proof_path?: string | null
          id?: string
          identity_proof_path?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_id: string
          salon_proof_path?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          business_proof_path?: string | null
          id?: string
          identity_proof_path?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_id?: string
          salon_proof_path?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_employer_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_employer_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_employer_verifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_employer_verifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_employer_verifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_employer_verifications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_employer_verifications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_interview_requests: {
        Row: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_message?: string | null
          candidate_user_id: string
          created_at?: string
          created_by: string
          duration_minutes?: number
          employer_message?: string | null
          id?: string
          interview_type: string
          location_text?: string | null
          meeting_url?: string | null
          salon_id: string
          scheduled_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_message?: string | null
          candidate_user_id?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number
          employer_message?: string | null
          id?: string
          interview_type?: string
          location_text?: string | null
          meeting_url?: string | null
          salon_id?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_requests_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_requests_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_interview_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_interview_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_interview_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_interview_schedule_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          interview_id: string
          new_start: string
          previous_start: string | null
          reason: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          interview_id: string
          new_start: string
          previous_start?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          interview_id?: string
          new_start?: string
          previous_start?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_schedule_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_schedule_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_interview_schedule_history_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "job_interview_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      job_messages: {
        Row: {
          attachment: Json | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_user_id: string
        }
        Insert: {
          attachment?: Json | null
          body?: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_user_id: string
        }
        Update: {
          attachment?: Json | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "job_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_notifications: {
        Row: {
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_offers: {
        Row: {
          application_id: string
          candidate_user_id: string
          created_at: string
          created_by: string
          employment_type: string | null
          expires_at: string | null
          id: string
          job_role: string
          joining_date: string | null
          offer_document_path: string | null
          offer_notes: string | null
          responded_at: string | null
          salary: number | null
          salon_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_user_id: string
          created_at?: string
          created_by: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          job_role: string
          joining_date?: string | null
          offer_document_path?: string | null
          offer_notes?: string | null
          responded_at?: string | null
          salary?: number | null
          salon_id: string
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_user_id?: string
          created_at?: string
          created_by?: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          job_role?: string
          joining_date?: string | null
          offer_document_path?: string | null
          offer_notes?: string | null
          responded_at?: string | null
          salary?: number | null
          salon_id?: string
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_candidate_user_id_fkey"
            columns: ["candidate_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_portfolio_items: {
        Row: {
          candidate_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          image_path: string
          item_date: string | null
          sort_order: number
          technique: string | null
          title: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_path: string
          item_date?: string | null
          sort_order?: number
          technique?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string
          item_date?: string | null
          sort_order?: number
          technique?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_portfolio_items_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_employer_candidate_cards"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "job_portfolio_items_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "job_seeker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_skills: {
        Row: {
          is_required: boolean
          job_id: string
          skill_id: string
        }
        Insert: {
          is_required?: boolean
          job_id: string
          skill_id: string
        }
        Update: {
          is_required?: boolean
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "job_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        Insert: {
          admin_review_reason?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months?: number | null
          experience_min_months?: number
          expires_at?: string | null
          freshers_allowed?: boolean
          id?: string
          image_path?: string | null
          incentives?: string | null
          joining_date?: string | null
          location_id?: string | null
          openings?: number
          pay_type?: string | null
          published_at?: string | null
          responsibilities?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salon_id: string
          status?: string
          tags?: string[]
          tips_info?: string | null
          title: string
          updated_at?: string
          weekly_off?: string | null
          working_days?: string | null
          working_hours?: string | null
          workplace_type?: string
        }
        Update: {
          admin_review_reason?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          employment_type?: string
          experience_max_months?: number | null
          experience_min_months?: number
          expires_at?: string | null
          freshers_allowed?: boolean
          id?: string
          image_path?: string | null
          incentives?: string | null
          joining_date?: string | null
          location_id?: string | null
          openings?: number
          pay_type?: string | null
          published_at?: string | null
          responsibilities?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salon_id?: string
          status?: string
          tags?: string[]
          tips_info?: string | null
          title?: string
          updated_at?: string
          weekly_off?: string | null
          working_days?: string | null
          working_hours?: string | null
          workplace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "job_salon_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "job_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_posts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_posts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_salon_locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_primary: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          salon_id: string
          state: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          salon_id: string
          state: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          salon_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_salon_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_salon_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_salon_members: {
        Row: {
          created_at: string
          member_role: string
          salon_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          member_role: string
          salon_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          member_role?: string
          salon_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_salon_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_salon_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_salon_profiles: {
        Row: {
          business_type: string | null
          created_at: string
          instagram_url: string | null
          jobs_enabled: boolean
          owner_user_id: string
          salon_id: string
          updated_at: string
          verification_status: string
          website_url: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          instagram_url?: string | null
          jobs_enabled?: boolean
          owner_user_id: string
          salon_id: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          instagram_url?: string | null
          jobs_enabled?: boolean
          owner_user_id?: string
          salon_id?: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_salon_profiles_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_profiles_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_salon_profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "job_salon_profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_salon_profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_saved_searches: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          employment_type: string | null
          id: string
          match_frequency: string
          name: string
          notify_email: boolean
          notify_in_app: boolean
          notify_push: boolean
          salary_min: number | null
          search_query: string | null
          skill_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          employment_type?: string | null
          id?: string
          match_frequency?: string
          name: string
          notify_email?: boolean
          notify_in_app?: boolean
          notify_push?: boolean
          salary_min?: number | null
          search_query?: string | null
          skill_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          employment_type?: string | null
          id?: string
          match_frequency?: string
          name?: string
          notify_email?: boolean
          notify_in_app?: boolean
          notify_push?: boolean
          salary_min?: number | null
          search_query?: string | null
          skill_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saved_searches_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "job_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_seeker_profiles: {
        Row: {
          available_from: string | null
          bio: string | null
          city: string | null
          country: string
          created_at: string
          expected_salary_max: number | null
          expected_salary_min: number | null
          experience_level: string | null
          headline: string | null
          id: string
          latitude: number | null
          longitude: number | null
          open_to_relocation: boolean
          profile_completion: number
          profile_visibility: string
          state: string | null
          total_experience_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_from?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          experience_level?: string | null
          headline?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          open_to_relocation?: boolean
          profile_completion?: number
          profile_visibility?: string
          state?: string | null
          total_experience_months?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_from?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          experience_level?: string | null
          headline?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          open_to_relocation?: boolean
          profile_completion?: number
          profile_visibility?: string
          state?: string | null
          total_experience_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_seeker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_seeker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      job_support_messages: {
        Row: {
          attachment_path: string | null
          created_at: string
          id: string
          message: string
          sender_user_id: string | null
          ticket_id: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          message: string
          sender_user_id?: string | null
          ticket_id: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_support_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_support_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "job_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      job_support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          issue_type: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          issue_type: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_user_roles: {
        Row: {
          account_status: string
          created_at: string
          onboarding_completed: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          created_at?: string
          onboarding_completed?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          created_at?: string
          onboarding_completed?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      leave_types: {
        Row: {
          business_id: string
          created_at: string
          default_days: number
          id: string
          is_active: boolean
          is_paid: boolean
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          default_days?: number
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          default_days?: number
          id?: string
          is_active?: boolean
          is_paid?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "leave_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          current_points: number
          lifetime_points: number
          tier: string
          tier_valid_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_points?: number
          lifetime_points?: number
          tier?: string
          tier_valid_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_points?: number
          lifetime_points?: number
          tier?: string
          tier_valid_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          points_delta: number
          source_event_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points_delta: number
          source_event_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points_delta?: number
          source_event_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketing_campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_status: string
          failure_code: string | null
          opened_at: string | null
          salon_customer_id: string
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          failure_code?: string | null
          opened_at?: string | null
          salon_customer_id: string
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string
          failure_code?: string | null
          opened_at?: string | null
          salon_customer_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "owner_marketing_campaign_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_recipients_salon_customer_id_fkey"
            columns: ["salon_customer_id"]
            isOneToOne: false
            referencedRelation: "salon_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          attributed_revenue_paise: number
          audience_label: string
          booking_count: number
          channel: string
          clicked_count: number
          completed_at: string | null
          created_at: string
          created_by: string
          delivered_count: number
          delivery_cost_paise: number
          failure_reason: string | null
          id: string
          message_body: string | null
          name: string
          offer_id: string | null
          opened_count: number
          queued_at: string | null
          recipient_count: number
          salon_id: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          template_key: string | null
          updated_at: string
        }
        Insert: {
          attributed_revenue_paise?: number
          audience_label: string
          booking_count?: number
          channel: string
          clicked_count?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          delivered_count?: number
          delivery_cost_paise?: number
          failure_reason?: string | null
          id?: string
          message_body?: string | null
          name: string
          offer_id?: string | null
          opened_count?: number
          queued_at?: string | null
          recipient_count?: number
          salon_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          attributed_revenue_paise?: number
          audience_label?: string
          booking_count?: number
          channel?: string
          clicked_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          delivered_count?: number
          delivery_cost_paise?: number
          failure_reason?: string | null
          id?: string
          message_body?: string | null
          name?: string
          offer_id?: string | null
          opened_count?: number
          queued_at?: string | null
          recipient_count?: number
          salon_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketing_campaigns_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "marketplace_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      marketplace_trending_overrides: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          priority: number
          salon_id: string
          score_boost: number
          starts_at: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          salon_id: string
          score_boost?: number
          starts_at?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          salon_id?: string
          score_boost?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_trending_overrides_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "marketplace_trending_overrides_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_trending_overrides_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          benefits: Json
          billing_period: string
          created_at: string
          description: string | null
          discount_percent: number
          eligible_service_ids: string[] | null
          id: string
          is_active: boolean
          name: string
          price_paise: number
          reward_points_rate: number
          slug: string
          sort_order: number
        }
        Insert: {
          benefits?: Json
          billing_period?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          eligible_service_ids?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          price_paise?: number
          reward_points_rate?: number
          slug: string
          sort_order?: number
        }
        Update: {
          benefits?: Json
          billing_period?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          eligible_service_ids?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          price_paise?: number
          reward_points_rate?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      membership_redemptions: {
        Row: {
          booking_id: string | null
          discount_paise: number
          id: string
          membership_id: string
          redeemed_at: string
        }
        Insert: {
          booking_id?: string | null
          discount_paise?: number
          id?: string
          membership_id: string
          redeemed_at?: string
        }
        Update: {
          booking_id?: string | null
          discount_paise?: number
          id?: string
          membership_id?: string
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_redemptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          renewal_price_paise: number | null
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          renewal_price_paise?: number | null
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          renewal_price_paise?: number | null
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_records: {
        Row: {
          action: string
          content_id: string
          content_type: string
          created_at: string
          decided_at: string
          decided_by: string | null
          id: string
          notes: string | null
          reason: string | null
        }
        Insert: {
          action: string
          content_id: string
          content_type: string
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          content_id?: string
          content_type?: string
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          data: Json
          delivery_status: string
          id: string
          message: string
          notification_type: string
          read_at: string | null
          recipient_user_id: string
          salon_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
        }
        Insert: {
          booking_id?: string | null
          channel: string
          created_at?: string
          data?: Json
          delivery_status?: string
          id?: string
          message: string
          notification_type: string
          read_at?: string | null
          recipient_user_id: string
          salon_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          data?: Json
          delivery_status?: string
          id?: string
          message?: string
          notification_type?: string
          read_at?: string | null
          recipient_user_id?: string
          salon_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_redemptions: {
        Row: {
          booking_id: string
          created_at: string
          customer_user_id: string
          discount_paise: number
          id: string
          offer_id: string
          user_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_user_id: string
          discount_paise: number
          id?: string
          offer_id: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_user_id?: string
          discount_paise?: number
          id?: string
          offer_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offer_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_services: {
        Row: {
          offer_id: string
          service_id: string
        }
        Insert: {
          offer_id: string
          service_id: string
        }
        Update: {
          offer_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_services_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          code: string
          code_public: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          maximum_discount_paise: number | null
          membership_only: boolean
          minimum_booking_paise: number
          name: string
          per_customer_limit: number
          priority: number
          salon_id: string
          terms: string | null
          total_redemption_limit: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          code_public?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          maximum_discount_paise?: number | null
          membership_only?: boolean
          minimum_booking_paise?: number
          name: string
          per_customer_limit?: number
          priority?: number
          salon_id: string
          terms?: string | null
          total_redemption_limit?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          code_public?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          maximum_discount_paise?: number | null
          membership_only?: boolean
          minimum_booking_paise?: number
          name?: string
          per_customer_limit?: number
          priority?: number
          salon_id?: string
          terms?: string | null
          total_redemption_limit?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_member_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          organization_member_id: string
          permission_key: string
        }
        Insert: {
          allowed: boolean
          created_at?: string
          organization_member_id: string
          permission_key: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          organization_member_id?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_permissions_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          display_name: string
          gst_number_masked: string | null
          id: string
          legal_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          display_name: string
          gst_number_masked?: string | null
          id?: string
          legal_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string
          gst_number_masked?: string | null
          id?: string
          legal_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_payout_items: {
        Row: {
          booking_id: string
          completed_at: string | null
          created_at: string
          gross_paise: number
          id: string
          owner_amount_paise: number
          payout_id: string
          platform_fee_paise: number
          salon_id: string
        }
        Insert: {
          booking_id: string
          completed_at?: string | null
          created_at?: string
          gross_paise?: number
          id?: string
          owner_amount_paise?: number
          payout_id: string
          platform_fee_paise?: number
          salon_id: string
        }
        Update: {
          booking_id?: string
          completed_at?: string | null
          created_at?: string
          gross_paise?: number
          id?: string
          owner_amount_paise?: number
          payout_id?: string
          platform_fee_paise?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "owner_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_payout_runs: {
        Row: {
          booking_count: number
          completed_at: string | null
          engine_version: string
          id: string
          notes: string | null
          owner_count: number
          run_date: string
          scheduled_for: string
          started_at: string
          status: string
          total_paise: number
          trigger_source: string
        }
        Insert: {
          booking_count?: number
          completed_at?: string | null
          engine_version?: string
          id?: string
          notes?: string | null
          owner_count?: number
          run_date: string
          scheduled_for: string
          started_at?: string
          status?: string
          total_paise?: number
          trigger_source?: string
        }
        Update: {
          booking_count?: number
          completed_at?: string | null
          engine_version?: string
          id?: string
          notes?: string | null
          owner_count?: number
          run_date?: string
          scheduled_for?: string
          started_at?: string
          status?: string
          total_paise?: number
          trigger_source?: string
        }
        Relationships: []
      }
      owner_payouts: {
        Row: {
          amount_paise: number
          booking_count: number
          created_at: string
          failure_reason: string | null
          gross_paise: number
          id: string
          owner_share_bps: number
          owner_user_id: string | null
          payout_reference: string | null
          platform_fee_paise: number
          run_date: string
          run_id: string
          salon_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise?: number
          booking_count?: number
          created_at?: string
          failure_reason?: string | null
          gross_paise?: number
          id?: string
          owner_share_bps?: number
          owner_user_id?: string | null
          payout_reference?: string | null
          platform_fee_paise?: number
          run_date: string
          run_id: string
          salon_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          booking_count?: number
          created_at?: string
          failure_reason?: string | null
          gross_paise?: number
          id?: string
          owner_share_bps?: number
          owner_user_id?: string | null
          payout_reference?: string | null
          platform_fee_paise?: number
          run_date?: string
          run_id?: string
          salon_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_payouts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "owner_payout_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string
          growth_partner_id: string
          id: string
          max_uses: number | null
          revoked_at: string | null
          status: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string
          growth_partner_id: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          status?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          growth_partner_id?: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          status?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_codes_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_codes_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_kyc_cases: {
        Row: {
          address_match: boolean | null
          bank_name_match: boolean | null
          created_at: string
          expires_at: string | null
          growth_partner_id: string
          id: string
          pan_name_match: boolean | null
          provider: string | null
          provider_case_id: string | null
          rejection_reason_code: string | null
          review_notes: string | null
          reviewed_by: string | null
          risk_level: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          address_match?: boolean | null
          bank_name_match?: boolean | null
          created_at?: string
          expires_at?: string | null
          growth_partner_id: string
          id?: string
          pan_name_match?: boolean | null
          provider?: string | null
          provider_case_id?: string | null
          rejection_reason_code?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          status: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          address_match?: boolean | null
          bank_name_match?: boolean | null
          created_at?: string
          expires_at?: string | null
          growth_partner_id?: string
          id?: string
          pan_name_match?: boolean | null
          provider?: string | null
          provider_case_id?: string | null
          rejection_reason_code?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_kyc_cases_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_kyc_cases_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_cases_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_cases_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partner_kyc_documents: {
        Row: {
          document_type: string
          expires_on: string | null
          id: string
          issued_on: string | null
          kyc_case_id: string
          masked_identifier: string | null
          provider_document_id: string | null
          rejection_reason: string | null
          status: string
          storage_path: string
          uploaded_at: string
          verified_at: string | null
        }
        Insert: {
          document_type: string
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          kyc_case_id: string
          masked_identifier?: string | null
          provider_document_id?: string | null
          rejection_reason?: string | null
          status: string
          storage_path: string
          uploaded_at?: string
          verified_at?: string | null
        }
        Update: {
          document_type?: string
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          kyc_case_id?: string
          masked_identifier?: string | null
          provider_document_id?: string | null
          rejection_reason?: string | null
          status?: string
          storage_path?: string
          uploaded_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_kyc_documents_kyc_case_id_fkey"
            columns: ["kyc_case_id"]
            isOneToOne: false
            referencedRelation: "partner_kyc_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_accounts: {
        Row: {
          account_holder_name: string
          account_last4: string | null
          account_type: string
          bank_name: string | null
          created_at: string
          growth_partner_id: string
          id: string
          ifsc_masked: string | null
          is_active: boolean
          is_default: boolean
          provider_beneficiary_id: string
          updated_at: string
          upi_masked: string | null
          verification_provider_id: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_last4?: string | null
          account_type: string
          bank_name?: string | null
          created_at?: string
          growth_partner_id: string
          id?: string
          ifsc_masked?: string | null
          is_active?: boolean
          is_default?: boolean
          provider_beneficiary_id: string
          updated_at?: string
          upi_masked?: string | null
          verification_provider_id?: string | null
          verification_status: string
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_last4?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          growth_partner_id?: string
          id?: string
          ifsc_masked?: string | null
          is_active?: boolean
          is_default?: boolean
          provider_beneficiary_id?: string
          updated_at?: string
          upi_masked?: string | null
          verification_provider_id?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_accounts_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_payout_accounts_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_allocations: {
        Row: {
          allocated_amount_paise: number
          commission_event_id: string
          created_at: string
          payout_id: string
        }
        Insert: {
          allocated_amount_paise: number
          commission_event_id: string
          created_at?: string
          payout_id: string
        }
        Update: {
          allocated_amount_paise?: number
          commission_event_id?: string
          created_at?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_allocations_commission_event_id_fkey"
            columns: ["commission_event_id"]
            isOneToOne: true
            referencedRelation: "commission_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payout_allocations_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "partner_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          created_at: string
          currency: string
          failed_at: string | null
          failure_code: string | null
          failure_message_safe: string | null
          fee_paise: number
          gross_amount_paise: number
          growth_partner_id: string
          id: string
          idempotency_key: string
          net_amount_paise: number
          paid_at: string | null
          payout_account_id: string
          payout_number: string
          processed_at: string | null
          provider_payout_id: string | null
          requested_at: string
          status: string
          tax_withheld_paise: number
          updated_at: string
          utr: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          fee_paise?: number
          gross_amount_paise: number
          growth_partner_id: string
          id?: string
          idempotency_key: string
          net_amount_paise: number
          paid_at?: string | null
          payout_account_id: string
          payout_number: string
          processed_at?: string | null
          provider_payout_id?: string | null
          requested_at?: string
          status: string
          tax_withheld_paise?: number
          updated_at?: string
          utr?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          fee_paise?: number
          gross_amount_paise?: number
          growth_partner_id?: string
          id?: string
          idempotency_key?: string
          net_amount_paise?: number
          paid_at?: string | null
          payout_account_id?: string
          payout_number?: string
          processed_at?: string | null
          provider_payout_id?: string | null
          requested_at?: string
          status?: string
          tax_withheld_paise?: number
          updated_at?: string
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_payouts_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payouts_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "partner_payout_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_reward_claims: {
        Row: {
          claim_number: string
          created_at: string
          fulfilled_at: string | null
          growth_partner_id: string
          id: string
          milestone_id: string
          qualifying_shop_count_snapshot: number
          review_due_at: string
          reviewed_at: string | null
          selected_option: string
          status: string
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          claim_number: string
          created_at?: string
          fulfilled_at?: string | null
          growth_partner_id: string
          id?: string
          milestone_id: string
          qualifying_shop_count_snapshot: number
          review_due_at: string
          reviewed_at?: string | null
          selected_option: string
          status?: string
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          claim_number?: string
          created_at?: string
          fulfilled_at?: string | null
          growth_partner_id?: string
          id?: string
          milestone_id?: string
          qualifying_shop_count_snapshot?: number
          review_due_at?: string
          reviewed_at?: string | null
          selected_option?: string
          status?: string
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_reward_claims_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_reward_claims_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_reward_claims_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "partner_reward_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_reward_milestones: {
        Row: {
          checklist: Json
          claim_options: Json
          claim_unlock_shop_count: number
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          maximum_value_paise: number
          milestone_shop_count: number
          name: string
          sort_order: number
          specifications: Json
          updated_at: string
        }
        Insert: {
          checklist?: Json
          claim_options?: Json
          claim_unlock_shop_count: number
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          maximum_value_paise: number
          milestone_shop_count: number
          name: string
          sort_order?: number
          specifications?: Json
          updated_at?: string
        }
        Update: {
          checklist?: Json
          claim_options?: Json
          claim_unlock_shop_count?: number
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          maximum_value_paise?: number
          milestone_shop_count?: number
          name?: string
          sort_order?: number
          specifications?: Json
          updated_at?: string
        }
        Relationships: []
      }
      partner_reward_shop_qualifications: {
        Row: {
          active_scan_count: number
          created_at: string
          growth_partner_id: string
          qualified_at: string | null
          reason_code: string | null
          reviewed_at: string | null
          shop_attribution_id: string
          source_event_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active_scan_count?: number
          created_at?: string
          growth_partner_id: string
          qualified_at?: string | null
          reason_code?: string | null
          reviewed_at?: string | null
          shop_attribution_id: string
          source_event_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active_scan_count?: number
          created_at?: string
          growth_partner_id?: string
          qualified_at?: string | null
          reason_code?: string | null
          reviewed_at?: string | null
          shop_attribution_id?: string
          source_event_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_reward_shop_qualifications_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_reward_shop_qualifications_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_reward_shop_qualifications_shop_attribution_id_fkey"
            columns: ["shop_attribution_id"]
            isOneToOne: false
            referencedRelation: "shop_attributions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_type: string
          gross_amount_paise: number | null
          id: string
          occurred_at: string
          payload_hash: string
          payment_id: string
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_id: string
          received_at: string
          refunded_amount_paise: number
          signature_verified: boolean
        }
        Insert: {
          event_type: string
          gross_amount_paise?: number | null
          id?: string
          occurred_at: string
          payload_hash: string
          payment_id: string
          processed_at?: string | null
          processing_status?: string
          provider: string
          provider_event_id: string
          received_at?: string
          refunded_amount_paise?: number
          signature_verified: boolean
        }
        Update: {
          event_type?: string
          gross_amount_paise?: number | null
          id?: string
          occurred_at?: string
          payload_hash?: string
          payment_id?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_id?: string
          received_at?: string
          refunded_amount_paise?: number
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_id: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
        }
        Insert: {
          event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
        }
        Update: {
          event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          currency: string
          customer_user_id: string | null
          failure_code: string | null
          failure_message_safe: string | null
          id: string
          method: string | null
          paid_at: string | null
          payment_stage: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_signature_verified_at: string | null
          salon_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          payment_stage?: string | null
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature_verified_at?: string | null
          salon_id: string
          status: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          payment_stage?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature_verified_at?: string | null
          salon_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "payments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          business_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "payroll_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      platform_ledger_entries: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          entry_type: string
          id: string
          payment_id: string | null
          refund_id: string | null
          source_event_id: string
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          entry_type: string
          id?: string
          payment_id?: string | null
          refund_id?: string | null
          source_event_id: string
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          entry_type?: string
          id?: string
          payment_id?: string | null
          refund_id?: string | null
          source_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_ledger_entries_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue_rules: {
        Row: {
          advance_share_bps: number
          completion_statuses: string[]
          dispute_statuses: string[]
          final_share_bps: number
          growth_partner_hold_days: number
          growth_partner_share_of_platform_bps: number
          id: number
          owner_payout_enabled: boolean
          owner_payout_hour_local: number
          owner_share_bps: number
          payment_hold_statuses: string[]
          payout_engine_version: string
          payout_timezone: string
          platform_share_bps: number
          refund_full_window_hours: number
          refund_partial_share_bps: number
          updated_at: string
          void_statuses: string[]
        }
        Insert: {
          advance_share_bps?: number
          completion_statuses?: string[]
          dispute_statuses?: string[]
          final_share_bps?: number
          growth_partner_hold_days?: number
          growth_partner_share_of_platform_bps?: number
          id?: number
          owner_payout_enabled?: boolean
          owner_payout_hour_local?: number
          owner_share_bps?: number
          payment_hold_statuses?: string[]
          payout_engine_version?: string
          payout_timezone?: string
          platform_share_bps?: number
          refund_full_window_hours?: number
          refund_partial_share_bps?: number
          updated_at?: string
          void_statuses?: string[]
        }
        Update: {
          advance_share_bps?: number
          completion_statuses?: string[]
          dispute_statuses?: string[]
          final_share_bps?: number
          growth_partner_hold_days?: number
          growth_partner_share_of_platform_bps?: number
          id?: number
          owner_payout_enabled?: boolean
          owner_payout_hour_local?: number
          owner_share_bps?: number
          payment_hold_statuses?: string[]
          payout_engine_version?: string
          payout_timezone?: string
          platform_share_bps?: number
          refund_full_window_hours?: number
          refund_partial_share_bps?: number
          updated_at?: string
          void_statuses?: string[]
        }
        Relationships: []
      }
      platform_role_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          requested_role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          requested_role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          requested_role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_recently_viewed: boolean
          avatar_path: string | null
          avatar_url: string | null
          created_at: string
          currency_code: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          locale: string
          loyalty_points: number
          phone: string | null
          photo_url: string | null
          platform_role: string
          preferred_area: string | null
          preferred_city: string | null
          recently_viewed: Json
          terms_accepted_at: string | null
          timezone: string
          updated_at: string
          wallet_balance_paise: number
        }
        Insert: {
          allow_recently_viewed?: boolean
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          currency_code?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id: string
          is_active?: boolean
          locale?: string
          loyalty_points?: number
          phone?: string | null
          photo_url?: string | null
          platform_role?: string
          preferred_area?: string | null
          preferred_city?: string | null
          recently_viewed?: Json
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
          wallet_balance_paise?: number
        }
        Update: {
          allow_recently_viewed?: boolean
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          currency_code?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          locale?: string
          loyalty_points?: number
          phone?: string | null
          photo_url?: string | null
          platform_role?: string
          preferred_area?: string | null
          preferred_city?: string | null
          recently_viewed?: Json
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
          wallet_balance_paise?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_secret: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_secret: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_secret?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      qualifying_transactions: {
        Row: {
          business_date: string
          created_at: string
          eligible_amount_paise: number
          growth_partner_id: string
          id: string
          occurred_at: string
          payment_event_id: string
          qualification_status: string
          qualified_at: string | null
          reason_code: string | null
          reversed_at: string | null
          salon_id: string
          shop_attribution_id: string
        }
        Insert: {
          business_date: string
          created_at?: string
          eligible_amount_paise: number
          growth_partner_id: string
          id?: string
          occurred_at: string
          payment_event_id: string
          qualification_status: string
          qualified_at?: string | null
          reason_code?: string | null
          reversed_at?: string | null
          salon_id: string
          shop_attribution_id: string
        }
        Update: {
          business_date?: string
          created_at?: string
          eligible_amount_paise?: number
          growth_partner_id?: string
          id?: string
          occurred_at?: string
          payment_event_id?: string
          qualification_status?: string
          qualified_at?: string | null
          reason_code?: string | null
          reversed_at?: string | null
          salon_id?: string
          shop_attribution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifying_transactions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "qualifying_transactions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifying_transactions_payment_event_id_fkey"
            columns: ["payment_event_id"]
            isOneToOne: true
            referencedRelation: "payment_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifying_transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "qualifying_transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifying_transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifying_transactions_shop_attribution_id_fkey"
            columns: ["shop_attribution_id"]
            isOneToOne: false
            referencedRelation: "shop_attributions"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_paise: number
          approved_by: string | null
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          provider_refund_id: string | null
          reason: string
          requested_at: string
          requested_by: string | null
          salon_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          provider_refund_id?: string | null
          reason: string
          requested_at?: string
          requested_by?: string | null
          salon_id: string
          status: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          provider_refund_id?: string | null
          reason?: string
          requested_at?: string
          requested_by?: string | null
          salon_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refunds_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "refunds_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string | null
          review_id: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string | null
          review_id: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string | null
          review_id?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "customer_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          author_user_id: string
          created_at: string
          id: string
          message: string
          review_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          id?: string
          message: string
          review_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          id?: string
          message?: string
          review_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author: string | null
          booking_id: string | null
          comment: string | null
          created_at: string
          customer_user_id: string
          id: string
          is_verified_booking: boolean
          rating: number
          salon_customer_id: string | null
          salon_id: string
          service_id: string | null
          service_name: string | null
          staff_id: string | null
          status: string
          updated_at: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          author?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_user_id: string
          id?: string
          is_verified_booking?: boolean
          rating: number
          salon_customer_id?: string | null
          salon_id: string
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          author?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_user_id?: string
          id?: string
          is_verified_booking?: boolean
          rating?: number
          salon_customer_id?: string | null
          salon_id?: string
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_salon_customer_id_fkey"
            columns: ["salon_customer_id"]
            isOneToOne: false
            referencedRelation: "salon_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          id: string
          points: number
          redeemed_at: string | null
          source_ref_id: string | null
          source_ref_type: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          redeemed_at?: string | null
          source_ref_id?: string | null
          source_ref_type?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          redeemed_at?: string | null
          source_ref_id?: string | null
          source_ref_type?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_customers: {
        Row: {
          address: string | null
          city: string | null
          consent_updated_at: string | null
          created_at: string
          customer_type: string
          customer_user_id: string | null
          deleted_at: string | null
          email: string | null
          email_opt_in: boolean
          id: string
          joined_at: string
          last_visit_at: string | null
          lifetime_spend_paise: number
          marketing_opt_in: boolean
          name: string
          notes: string | null
          phone: string | null
          salon_id: string
          sms_opt_in: boolean
          updated_at: string
          visit_count: number
          whatsapp_number: string | null
          whatsapp_opt_in: boolean
        }
        Insert: {
          address?: string | null
          city?: string | null
          consent_updated_at?: string | null
          created_at?: string
          customer_type?: string
          customer_user_id?: string | null
          deleted_at?: string | null
          email?: string | null
          email_opt_in?: boolean
          id?: string
          joined_at?: string
          last_visit_at?: string | null
          lifetime_spend_paise?: number
          marketing_opt_in?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          salon_id: string
          sms_opt_in?: boolean
          updated_at?: string
          visit_count?: number
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
        }
        Update: {
          address?: string | null
          city?: string | null
          consent_updated_at?: string | null
          created_at?: string
          customer_type?: string
          customer_user_id?: string | null
          deleted_at?: string | null
          email?: string | null
          email_opt_in?: boolean
          id?: string
          joined_at?: string
          last_visit_at?: string | null
          lifetime_spend_paise?: number
          marketing_opt_in?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          salon_id?: string
          sms_opt_in?: boolean
          updated_at?: string
          visit_count?: number
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "salon_customers_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_customers_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          opens_at: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_ledger_entries: {
        Row: {
          available_at: string
          booking_id: string
          created_at: string
          entry_type: string
          fee_amount_paise: number
          gross_amount_paise: number
          id: string
          net_amount_paise: number
          payment_id: string
          refund_id: string | null
          salon_id: string
          source_event_id: string
          status: string
          tax_amount_paise: number
        }
        Insert: {
          available_at?: string
          booking_id: string
          created_at?: string
          entry_type: string
          fee_amount_paise?: number
          gross_amount_paise: number
          id?: string
          net_amount_paise: number
          payment_id: string
          refund_id?: string | null
          salon_id: string
          source_event_id: string
          status?: string
          tax_amount_paise?: number
        }
        Update: {
          available_at?: string
          booking_id?: string
          created_at?: string
          entry_type?: string
          fee_amount_paise?: number
          gross_amount_paise?: number
          id?: string
          net_amount_paise?: number
          payment_id?: string
          refund_id?: string | null
          salon_id?: string
          source_event_id?: string
          status?: string
          tax_amount_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "salon_ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_ledger_entries_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_ledger_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_ledger_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_ledger_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_media: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          id: string
          is_cover: boolean
          is_published: boolean
          media_type: string
          salon_id: string
          sort_order: number
          storage_path: string
          tag: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_cover?: boolean
          is_published?: boolean
          media_type: string
          salon_id: string
          sort_order?: number
          storage_path: string
          tag?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_cover?: boolean
          is_published?: boolean
          media_type?: string
          salon_id?: string
          sort_order?: number
          storage_path?: string
          tag?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_media_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_media_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_media_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_payout_accounts: {
        Row: {
          account_holder_name: string
          account_last4: string | null
          account_type: string
          bank_name: string | null
          created_at: string
          id: string
          ifsc_masked: string | null
          is_active: boolean
          is_default: boolean
          provider_beneficiary_id: string
          salon_id: string
          updated_at: string
          upi_masked: string | null
          verification_provider_id: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_last4?: string | null
          account_type: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_masked?: string | null
          is_active?: boolean
          is_default?: boolean
          provider_beneficiary_id: string
          salon_id: string
          updated_at?: string
          upi_masked?: string | null
          verification_provider_id?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_last4?: string | null
          account_type?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_masked?: string | null
          is_active?: boolean
          is_default?: boolean
          provider_beneficiary_id?: string
          salon_id?: string
          updated_at?: string
          upi_masked?: string | null
          verification_provider_id?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_payout_accounts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_payout_accounts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_payout_accounts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_payouts: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          failed_at: string | null
          failure_code: string | null
          failure_message_safe: string | null
          id: string
          idempotency_key: string
          paid_at: string | null
          payout_account_id: string
          payout_number: string
          processed_at: string | null
          provider_payout_id: string | null
          queued_at: string
          salon_id: string
          settlement_id: string
          status: string
          updated_at: string
          utr: string | null
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          id?: string
          idempotency_key: string
          paid_at?: string | null
          payout_account_id: string
          payout_number: string
          processed_at?: string | null
          provider_payout_id?: string | null
          queued_at?: string
          salon_id: string
          settlement_id: string
          status: string
          updated_at?: string
          utr?: string | null
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message_safe?: string | null
          id?: string
          idempotency_key?: string
          paid_at?: string | null
          payout_account_id?: string
          payout_number?: string
          processed_at?: string | null
          provider_payout_id?: string | null
          queued_at?: string
          salon_id?: string
          settlement_id?: string
          status?: string
          updated_at?: string
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_payouts_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "salon_payout_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_payouts_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: true
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_public_websites: {
        Row: {
          config: Json
          created_at: string
          is_published: boolean
          published_at: string | null
          published_by: string | null
          published_revision: number
          salon_id: string
          slug: string
          template_key: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          published_revision?: number
          salon_id: string
          slug: string
          template_key?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          published_revision?: number
          salon_id?: string
          slug?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_public_websites_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_public_websites_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_public_websites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_public_websites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_public_websites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_setup_proposal_versions: {
        Row: {
          change_note: string | null
          change_source: string
          changed_by: string
          created_at: string
          id: string
          payload: Json
          proposal_id: string
          version: number
        }
        Insert: {
          change_note?: string | null
          change_source: string
          changed_by: string
          created_at?: string
          id?: string
          payload: Json
          proposal_id: string
          version: number
        }
        Update: {
          change_note?: string | null
          change_source?: string
          changed_by?: string
          created_at?: string
          id?: string
          payload?: Json
          proposal_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "salon_setup_proposal_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposal_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_setup_proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "salon_setup_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_setup_proposals: {
        Row: {
          created_at: string
          growth_partner_id: string
          id: string
          onboarding_application_id: string
          owner_email: string | null
          owner_notes: string | null
          owner_reviewed_at: string | null
          owner_reviewed_by: string | null
          owner_user_id: string | null
          payload: Json
          published_at: string | null
          salon_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          growth_partner_id: string
          id?: string
          onboarding_application_id: string
          owner_email?: string | null
          owner_notes?: string | null
          owner_reviewed_at?: string | null
          owner_reviewed_by?: string | null
          owner_user_id?: string | null
          payload?: Json
          published_at?: string | null
          salon_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          growth_partner_id?: string
          id?: string
          onboarding_application_id?: string
          owner_email?: string | null
          owner_notes?: string | null
          owner_reviewed_at?: string | null
          owner_reviewed_by?: string | null
          owner_user_id?: string | null
          payload?: Json
          published_at?: string | null
          salon_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "salon_setup_proposals_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_onboarding_application_id_fkey"
            columns: ["onboarding_application_id"]
            isOneToOne: true
            referencedRelation: "shop_onboarding_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_owner_reviewed_by_fkey"
            columns: ["owner_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_owner_reviewed_by_fkey"
            columns: ["owner_reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_setup_proposals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          accepts_online_bookings: boolean
          address: string
          area: string | null
          auto_confirm_bookings: boolean
          business_category: string | null
          city: string
          cover_image_path: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          gender_category: string | null
          id: string
          is_active: boolean
          landmark: string | null
          latitude: number | null
          location_accuracy_m: number | null
          location_address: string | null
          location_area: string | null
          location_city: string | null
          location_confirmed: boolean | null
          location_confirmed_at: string | null
          location_landmark: string | null
          location_pincode: string | null
          location_source: string | null
          location_zone: string | null
          logo_path: string | null
          longitude: number | null
          name: string
          organization_id: string
          phone: string | null
          pincode: string | null
          rating_average: number
          review_count: number
          slug: string
          starting_price_paise: number | null
          state: string | null
          timezone: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          accepts_online_bookings?: boolean
          address: string
          area?: string | null
          auto_confirm_bookings?: boolean
          business_category?: string | null
          city: string
          cover_image_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          gender_category?: string | null
          id?: string
          is_active?: boolean
          landmark?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          location_address?: string | null
          location_area?: string | null
          location_city?: string | null
          location_confirmed?: boolean | null
          location_confirmed_at?: string | null
          location_landmark?: string | null
          location_pincode?: string | null
          location_source?: string | null
          location_zone?: string | null
          logo_path?: string | null
          longitude?: number | null
          name: string
          organization_id: string
          phone?: string | null
          pincode?: string | null
          rating_average?: number
          review_count?: number
          slug: string
          starting_price_paise?: number | null
          state?: string | null
          timezone?: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          accepts_online_bookings?: boolean
          address?: string
          area?: string | null
          auto_confirm_bookings?: boolean
          business_category?: string | null
          city?: string
          cover_image_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          gender_category?: string | null
          id?: string
          is_active?: boolean
          landmark?: string | null
          latitude?: number | null
          location_accuracy_m?: number | null
          location_address?: string | null
          location_area?: string | null
          location_city?: string | null
          location_confirmed?: boolean | null
          location_confirmed_at?: string | null
          location_landmark?: string | null
          location_pincode?: string | null
          location_source?: string | null
          location_zone?: string | null
          logo_path?: string | null
          longitude?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          pincode?: string | null
          rating_average?: number
          review_count?: number
          slug?: string
          starting_price_paise?: number | null
          state?: string | null
          timezone?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "salons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          label: string | null
          method: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          label?: string | null
          method: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          label?: string | null
          method?: string
          user_id?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          buffer_after_minutes: number
          buffer_before_minutes: number
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_path: string | null
          is_active: boolean
          is_bookable_online: boolean
          name: string
          price_paise: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_bookable_online?: boolean
          name: string
          price_paise: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_bookable_online?: boolean
          name?: string
          price_paise?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          allocated_net_paise: number
          created_at: string
          salon_ledger_entry_id: string
          settlement_id: string
        }
        Insert: {
          allocated_net_paise: number
          created_at?: string
          salon_ledger_entry_id: string
          settlement_id: string
        }
        Update: {
          allocated_net_paise?: number
          created_at?: string
          salon_ledger_entry_id?: string
          settlement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_salon_ledger_entry_id_fkey"
            columns: ["salon_ledger_entry_id"]
            isOneToOne: true
            referencedRelation: "salon_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          created_at: string
          currency: string
          expected_at: string | null
          fee_paise: number
          gross_paise: number
          id: string
          idempotency_key: string | null
          net_paise: number
          period_end: string
          period_start: string
          provider_settlement_id: string | null
          salon_id: string
          settled_at: string | null
          status: string
          tax_paise: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          expected_at?: string | null
          fee_paise?: number
          gross_paise: number
          id?: string
          idempotency_key?: string | null
          net_paise: number
          period_end: string
          period_start: string
          provider_settlement_id?: string | null
          salon_id: string
          settled_at?: string | null
          status: string
          tax_paise?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          expected_at?: string | null
          fee_paise?: number
          gross_paise?: number
          id?: string
          idempotency_key?: string | null
          net_paise?: number
          period_end?: string
          period_start?: string
          provider_settlement_id?: string | null
          salon_id?: string
          settled_at?: string | null
          status?: string
          tax_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "settlements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_attributions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attributed_at: string
          attribution_method: string
          created_at: string
          effective_from: string
          effective_until: string | null
          growth_partner_id: string
          id: string
          onboarding_application_id: string | null
          partner_code_id: string | null
          reason: string | null
          salon_id: string
          source_event_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attributed_at?: string
          attribution_method: string
          created_at?: string
          effective_from: string
          effective_until?: string | null
          growth_partner_id: string
          id?: string
          onboarding_application_id?: string | null
          partner_code_id?: string | null
          reason?: string | null
          salon_id: string
          source_event_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attributed_at?: string
          attribution_method?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          growth_partner_id?: string
          id?: string
          onboarding_application_id?: string | null
          partner_code_id?: string | null
          reason?: string | null
          salon_id?: string
          source_event_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_attributions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shop_attributions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "shop_attributions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_onboarding_application_id_fkey"
            columns: ["onboarding_application_id"]
            isOneToOne: false
            referencedRelation: "shop_onboarding_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_partner_code_id_fkey"
            columns: ["partner_code_id"]
            isOneToOne: false
            referencedRelation: "partner_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_branches: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          landmark: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          salon_id: string
          slug: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          salon_id: string
          slug?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          salon_id?: string
          slug?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_branches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "shop_branches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_branches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_onboarding_applications: {
        Row: {
          about_shop: string | null
          accuracy_confirmed_at: string | null
          annual_turnover_band: string | null
          business_type: string | null
          changes_requested: Json
          city: string | null
          closing_time: string | null
          created_at: string
          current_step: number
          district: string | null
          existing_salon_id: string | null
          full_address: string | null
          gender_category: string | null
          gstin_masked: string | null
          id: string
          instagram_handle: string | null
          landmark: string | null
          latitude: number | null
          locality: string | null
          longitude: number | null
          opening_time: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_phone_verified_at: string | null
          owner_preferred_language: string | null
          owner_whatsapp: string | null
          pan_masked: string | null
          pincode: string | null
          profile_creation_authorized_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_category: string | null
          shop_name: string | null
          staff_count: number | null
          starting_price_paise: number | null
          state: string | null
          status: string
          submitted_at: string | null
          submitted_by_partner_id: string
          updated_at: string
          website_template: string | null
          website_url: string | null
          weekly_off: number | null
          years_in_business: number | null
        }
        Insert: {
          about_shop?: string | null
          accuracy_confirmed_at?: string | null
          annual_turnover_band?: string | null
          business_type?: string | null
          changes_requested?: Json
          city?: string | null
          closing_time?: string | null
          created_at?: string
          current_step?: number
          district?: string | null
          existing_salon_id?: string | null
          full_address?: string | null
          gender_category?: string | null
          gstin_masked?: string | null
          id?: string
          instagram_handle?: string | null
          landmark?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          opening_time?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_phone_verified_at?: string | null
          owner_preferred_language?: string | null
          owner_whatsapp?: string | null
          pan_masked?: string | null
          pincode?: string | null
          profile_creation_authorized_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_category?: string | null
          shop_name?: string | null
          staff_count?: number | null
          starting_price_paise?: number | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by_partner_id: string
          updated_at?: string
          website_template?: string | null
          website_url?: string | null
          weekly_off?: number | null
          years_in_business?: number | null
        }
        Update: {
          about_shop?: string | null
          accuracy_confirmed_at?: string | null
          annual_turnover_band?: string | null
          business_type?: string | null
          changes_requested?: Json
          city?: string | null
          closing_time?: string | null
          created_at?: string
          current_step?: number
          district?: string | null
          existing_salon_id?: string | null
          full_address?: string | null
          gender_category?: string | null
          gstin_masked?: string | null
          id?: string
          instagram_handle?: string | null
          landmark?: string | null
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          opening_time?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_phone_verified_at?: string | null
          owner_preferred_language?: string | null
          owner_whatsapp?: string | null
          pan_masked?: string | null
          pincode?: string | null
          profile_creation_authorized_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_category?: string | null
          shop_name?: string | null
          staff_count?: number | null
          starting_price_paise?: number | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by_partner_id?: string
          updated_at?: string
          website_template?: string | null
          website_url?: string | null
          weekly_off?: number | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_onboarding_applications_existing_salon_id_fkey"
            columns: ["existing_salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_existing_salon_id_fkey"
            columns: ["existing_salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_existing_salon_id_fkey"
            columns: ["existing_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_submitted_by_partner_id_fkey"
            columns: ["submitted_by_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "shop_onboarding_applications_submitted_by_partner_id_fkey"
            columns: ["submitted_by_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_onboarding_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          id: string
          masked_identifier: string | null
          rejection_reason: string | null
          status: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          id?: string
          masked_identifier?: string | null
          rejection_reason?: string | null
          status: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          id?: string
          masked_identifier?: string | null
          rejection_reason?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_onboarding_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "shop_onboarding_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "skills_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          sort_order: number
          tagline: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          sort_order?: number
          tagline?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          sort_order?: number
          tagline?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      sponsored_events: {
        Row: {
          content_id: string
          content_type: string
          count: number
          event_date: string
          event_type: string
        }
        Insert: {
          content_id: string
          content_type: string
          count?: number
          event_date?: string
          event_type: string
        }
        Update: {
          content_id?: string
          content_type?: string
          count?: number
          event_date?: string
          event_type?: string
        }
        Relationships: []
      }
      sponsored_shops: {
        Row: {
          badge_text: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_path: string | null
          is_active: boolean
          salon_id: string
          sort_order: number
          starts_at: string | null
          title: string | null
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          salon_id: string
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          salon_id?: string
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_shops_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "sponsored_shops_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_shops_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_videos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          thumbnail_path: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_path?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          thumbnail_path?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_path: string | null
          bio: string | null
          commission_percent: number | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          employment_status: string
          experience_years: number | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          is_public: boolean
          joining_date: string | null
          live_status: string
          name: string
          organization_member_id: string | null
          phone: string | null
          primary_role: string | null
          profile_photo_url: string | null
          rating_average: number
          review_count: number
          role_title: string | null
          salon_id: string
          self_service_enabled: boolean
          specialty: string | null
          staff_role_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          commission_percent?: number | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          employment_status?: string
          experience_years?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          joining_date?: string | null
          live_status?: string
          name: string
          organization_member_id?: string | null
          phone?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          rating_average?: number
          review_count?: number
          role_title?: string | null
          salon_id: string
          self_service_enabled?: boolean
          specialty?: string | null
          staff_role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          commission_percent?: number | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          employment_status?: string
          experience_years?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          joining_date?: string | null
          live_status?: string
          name?: string
          organization_member_id?: string | null
          phone?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          rating_average?: number
          review_count?: number
          role_title?: string | null
          salon_id?: string
          self_service_enabled?: boolean
          specialty?: string | null
          staff_role_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_staff_role_id_fkey"
            columns: ["staff_role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          attendance_date: string
          business_id: string
          check_in: string | null
          check_out: string | null
          created_at: string
          edited_at: string | null
          edited_by: string | null
          id: string
          manager_note: string | null
          staff_id: string
          status: string
          updated_at: string
          worked_minutes: number | null
        }
        Insert: {
          attendance_date: string
          business_id: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          manager_note?: string | null
          staff_id: string
          status?: string
          updated_at?: string
          worked_minutes?: number | null
        }
        Update: {
          attendance_date?: string
          business_id?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          manager_note?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
          worked_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "staff_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_audit_logs: {
        Row: {
          action: string
          business_id: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_value: Json | null
          note: string | null
          old_value: Json | null
          performed_at: string
          performed_by: string | null
          staff_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string | null
          staff_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          performed_at?: string
          performed_by?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "staff_audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          is_available: boolean
          override_date: string
          reason: string | null
          staff_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date: string
          reason?: string | null
          staff_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date?: string
          reason?: string | null
          staff_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_overrides_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_overrides_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_blocked_times: {
        Row: {
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          reason: string | null
          staff_id: string
          start_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          reason?: string | null
          staff_id: string
          start_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_blocked_times_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_blocked_times_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_bonus_records: {
        Row: {
          amount: number
          bonus_type: string
          created_at: string
          description: string | null
          id: string
          payroll_period_id: string | null
          staff_id: string
        }
        Insert: {
          amount: number
          bonus_type?: string
          created_at?: string
          description?: string | null
          id?: string
          payroll_period_id?: string | null
          staff_id: string
        }
        Update: {
          amount?: number
          bonus_type?: string
          created_at?: string
          description?: string | null
          id?: string
          payroll_period_id?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_bonus_records_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_bonus_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_bonus_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_breaks: {
        Row: {
          break_date: string | null
          break_end: string
          break_start: string
          created_at: string
          id: string
          shift_id: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          break_date?: string | null
          break_end: string
          break_start: string
          created_at?: string
          id?: string
          shift_id?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          break_date?: string | null
          break_end?: string
          break_start?: string
          created_at?: string
          id?: string
          shift_id?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_breaks_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_breaks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_breaks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_commission_settings: {
        Row: {
          commission_model: string
          created_at: string
          default_fixed_amount: number | null
          default_percentage: number | null
          id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          commission_model?: string
          created_at?: string
          default_fixed_amount?: number | null
          default_percentage?: number | null
          id?: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          commission_model?: string
          created_at?: string
          default_fixed_amount?: number | null
          default_percentage?: number | null
          id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_commission_settings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_commission_settings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          staff_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          staff_id: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          staff_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relationship: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relationship: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relationship?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_emergency_contacts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_emergency_contacts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_balances: {
        Row: {
          allocated_days: number
          created_at: string
          id: string
          leave_type_id: string
          remaining_days: number | null
          staff_id: string
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          allocated_days?: number
          created_at?: string
          id?: string
          leave_type_id: string
          remaining_days?: number | null
          staff_id: string
          updated_at?: string
          used_days?: number
          year: number
        }
        Update: {
          allocated_days?: number
          created_at?: string
          id?: string
          leave_type_id?: string
          remaining_days?: number | null
          staff_id?: string
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type_id: string
          manager_note: string | null
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type_id: string
          manager_note?: string | null
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          manager_note?: string | null
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payment_accounts: {
        Row: {
          account_name: string | null
          account_number_encrypted: string | null
          created_at: string
          id: string
          ifsc_encrypted: string | null
          is_primary: boolean
          payment_method: string
          staff_id: string
          updated_at: string
          upi_id_encrypted: string | null
        }
        Insert: {
          account_name?: string | null
          account_number_encrypted?: string | null
          created_at?: string
          id?: string
          ifsc_encrypted?: string | null
          is_primary?: boolean
          payment_method?: string
          staff_id: string
          updated_at?: string
          upi_id_encrypted?: string | null
        }
        Update: {
          account_name?: string | null
          account_number_encrypted?: string | null
          created_at?: string
          id?: string
          ifsc_encrypted?: string | null
          is_primary?: boolean
          payment_method?: string
          staff_id?: string
          updated_at?: string
          upi_id_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_payment_accounts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payment_accounts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payroll_commissions: {
        Row: {
          booking_id: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          payroll_record_id: string
          service_amount: number
          service_id: string | null
          staff_id: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          payroll_record_id: string
          service_amount?: number
          service_id?: string | null
          staff_id: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          payroll_record_id?: string
          service_amount?: number
          service_id?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_commissions_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "staff_payroll_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payroll_deductions: {
        Row: {
          amount: number
          created_at: string
          deduction_type: string
          description: string | null
          id: string
          payroll_record_id: string
          staff_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deduction_type?: string
          description?: string | null
          id?: string
          payroll_record_id: string
          staff_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deduction_type?: string
          description?: string | null
          id?: string
          payroll_record_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_deductions_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "staff_payroll_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_deductions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_deductions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payroll_records: {
        Row: {
          base_salary: number
          created_at: string
          id: string
          net_payable: number | null
          payment_status: string
          payroll_period_id: string
          processed_at: string | null
          settled_at: string | null
          staff_id: string
          total_bonus: number
          total_commission: number
          total_deductions: number
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          id?: string
          net_payable?: number | null
          payment_status?: string
          payroll_period_id: string
          processed_at?: string | null
          settled_at?: string | null
          staff_id: string
          total_bonus?: number
          total_commission?: number
          total_deductions?: number
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          id?: string
          net_payable?: number | null
          payment_status?: string
          payroll_period_id?: string
          processed_at?: string | null
          settled_at?: string | null
          staff_id?: string
          total_bonus?: number
          total_commission?: number
          total_deductions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_records_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payroll_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "staff_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          is_working: boolean
          staff_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          is_working?: boolean
          staff_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_working?: boolean
          staff_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_service_commissions: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          service_id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          commission_type: string
          commission_value?: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          service_id: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          service_id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_service_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_service_commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_service_commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          commission_percent_override: number | null
          created_at: string
          custom_duration_minutes: number | null
          custom_price_paise: number | null
          is_active: boolean
          service_id: string
          staff_id: string
        }
        Insert: {
          commission_percent_override?: number | null
          created_at?: string
          custom_duration_minutes?: number | null
          custom_price_paise?: number | null
          is_active?: boolean
          service_id: string
          staff_id: string
        }
        Update: {
          commission_percent_override?: number | null
          created_at?: string
          custom_duration_minutes?: number | null
          custom_price_paise?: number | null
          is_active?: boolean
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shift_swap_requests: {
        Row: {
          created_at: string
          id: string
          original_end_time: string
          original_start_time: string
          reason: string | null
          replacement_staff_id: string
          requested_at: string
          requesting_staff_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          shift_id: string | null
          status: string
          swap_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_end_time: string
          original_start_time: string
          reason?: string | null
          replacement_staff_id: string
          requested_at?: string
          requesting_staff_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string | null
          status?: string
          swap_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          original_end_time?: string
          original_start_time?: string
          reason?: string | null
          replacement_staff_id?: string
          requested_at?: string
          requesting_staff_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string | null
          status?: string
          swap_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shift_swap_requests_replacement_staff_id_fkey"
            columns: ["replacement_staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shift_swap_requests_replacement_staff_id_fkey"
            columns: ["replacement_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shift_swap_requests_requesting_staff_id_fkey"
            columns: ["requesting_staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shift_swap_requests_requesting_staff_id_fkey"
            columns: ["requesting_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shift_swap_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          schedule_id: string | null
          shift_date: string | null
          shift_type: string
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          schedule_id?: string | null
          shift_date?: string | null
          shift_type?: string
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          schedule_id?: string | null
          shift_date?: string | null
          shift_type?: string
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "staff_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_skills: {
        Row: {
          created_at: string
          id: string
          skill_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_path: string | null
          created_at: string
          id: string
          message: string
          sender_type: string
          sender_user_id: string | null
          ticket_id: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          message: string
          sender_type: string
          sender_user_id?: string | null
          ticket_id: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_type?: string
          sender_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          payment_id: string | null
          priority: string
          requester_user_id: string
          resolved_at: string | null
          salon_id: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          payment_id?: string | null
          priority?: string
          requester_user_id: string
          resolved_at?: string | null
          salon_id?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          payment_id?: string | null
          priority?: string
          requester_user_id?: string
          resolved_at?: string | null
          salon_id?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "support_tickets_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          appointment_reminders: boolean
          autoplay_ambiance: boolean
          booking_updates: boolean
          display_mode: string
          email_notifications: boolean
          offers_promotions: boolean
          push_notifications: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rewards_updates: boolean
          sms_notifications: boolean
          updated_at: string
          use_location_automatically: boolean
          user_id: string
          whatsapp_notifications: boolean
        }
        Insert: {
          appointment_reminders?: boolean
          autoplay_ambiance?: boolean
          booking_updates?: boolean
          display_mode?: string
          email_notifications?: boolean
          offers_promotions?: boolean
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rewards_updates?: boolean
          sms_notifications?: boolean
          updated_at?: string
          use_location_automatically?: boolean
          user_id: string
          whatsapp_notifications?: boolean
        }
        Update: {
          appointment_reminders?: boolean
          autoplay_ambiance?: boolean
          booking_updates?: boolean
          display_mode?: string
          email_notifications?: boolean
          offers_promotions?: boolean
          push_notifications?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rewards_updates?: boolean
          sms_notifications?: boolean
          updated_at?: string
          use_location_automatically?: boolean
          user_id?: string
          whatsapp_notifications?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_private_locations: {
        Row: {
          accuracy_m: number
          altitude_accuracy_m: number | null
          altitude_m: number | null
          captured_at: string
          heading_degrees: number | null
          latitude: number
          longitude: number
          speed_mps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_m: number
          altitude_accuracy_m?: number | null
          altitude_m?: number | null
          captured_at: string
          heading_degrees?: number | null
          latitude: number
          longitude: number
          speed_mps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_m?: number
          altitude_accuracy_m?: number | null
          altitude_m?: number | null
          captured_at?: string
          heading_degrees?: number | null
          latitude?: number
          longitude?: number
          speed_mps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          converted_booking_id: string | null
          created_at: string
          customer_user_id: string | null
          expires_at: string | null
          id: string
          notification_preference: string
          notified_at: string | null
          position: number | null
          requested_date: string
          requested_time: string
          salon_customer_id: string | null
          salon_id: string
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          converted_booking_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          expires_at?: string | null
          id?: string
          notification_preference?: string
          notified_at?: string | null
          position?: number | null
          requested_date: string
          requested_time: string
          salon_customer_id?: string | null
          salon_id: string
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          converted_booking_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          expires_at?: string | null
          id?: string
          notification_preference?: string
          notified_at?: string | null
          position?: number | null
          requested_date?: string
          requested_time?: string
          salon_customer_id?: string | null
          salon_id?: string
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "waitlist_entries_salon_customer_id_fkey"
            columns: ["salon_customer_id"]
            isOneToOne: false
            referencedRelation: "salon_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "waitlist_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_catalog_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_services: {
        Row: {
          service_id: string
          waitlist_entry_id: string
        }
        Insert: {
          service_id: string
          waitlist_entry_id: string
        }
        Update: {
          service_id?: string
          waitlist_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_services_waitlist_entry_id_fkey"
            columns: ["waitlist_entry_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          reason: string | null
          ref_id: string | null
          ref_type: string | null
          tx_type: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          reason?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tx_type: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          reason?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tx_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      growth_partner_commission_summary: {
        Row: {
          growth_partner_id: string | null
          held_count: number | null
          held_paise: number | null
          next_release_at: string | null
          paid_paise: number | null
          payable_count: number | null
          payable_paise: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_partner_commissions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "growth_partner_commissions_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_partner_reward_progress: {
        Row: {
          growth_partner_id: string | null
          pending_shop_count: number | null
          progress_updated_at: string | null
          qualifying_shop_count: number | null
        }
        Relationships: []
      }
      growth_partner_reward_shop_history: {
        Row: {
          active_scan_count: number | null
          growth_partner_id: string | null
          partner_code: string | null
          qualified_at: string | null
          reason_code: string | null
          salon_id: string | null
          salon_name: string | null
          shop_attribution_id: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_reward_shop_qualifications_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partner_reward_progress"
            referencedColumns: ["growth_partner_id"]
          },
          {
            foreignKeyName: "partner_reward_shop_qualifications_growth_partner_id_fkey"
            columns: ["growth_partner_id"]
            isOneToOne: false
            referencedRelation: "growth_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_reward_shop_qualifications_shop_attribution_id_fkey"
            columns: ["shop_attribution_id"]
            isOneToOne: false
            referencedRelation: "shop_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_attributions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      job_employer_candidate_cards: {
        Row: {
          available_from: string | null
          avatar_path: string | null
          bio: string | null
          candidate_id: string | null
          city: string | null
          expected_salary_max: number | null
          expected_salary_min: number | null
          experience_level: string | null
          full_name: string | null
          headline: string | null
          open_to_relocation: boolean | null
          skills: string[] | null
          state: string | null
          total_experience_months: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_seeker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_seeker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_marketing_campaign_history: {
        Row: {
          attributed_revenue_paise: number | null
          audience_label: string | null
          booking_count: number | null
          channel: string | null
          click_rate_percent: number | null
          clicked_count: number | null
          completed_at: string | null
          conversion_rate_percent: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          delivery_cost_paise: number | null
          failure_reason: string | null
          id: string | null
          message_body: string | null
          name: string | null
          offer_id: string | null
          open_rate_percent: number | null
          opened_count: number | null
          queued_at: string | null
          recipient_count: number | null
          roi_multiple: number | null
          salon_id: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          template_key: string | null
          updated_at: string | null
        }
        Insert: {
          attributed_revenue_paise?: number | null
          audience_label?: string | null
          booking_count?: number | null
          channel?: string | null
          click_rate_percent?: never
          clicked_count?: number | null
          completed_at?: string | null
          conversion_rate_percent?: never
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          delivery_cost_paise?: number | null
          failure_reason?: string | null
          id?: string | null
          message_body?: string | null
          name?: string | null
          offer_id?: string | null
          open_rate_percent?: never
          opened_count?: number | null
          queued_at?: string | null
          recipient_count?: number | null
          roi_multiple?: never
          salon_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          template_key?: string | null
          updated_at?: string | null
        }
        Update: {
          attributed_revenue_paise?: number | null
          audience_label?: string | null
          booking_count?: number | null
          channel?: string | null
          click_rate_percent?: never
          clicked_count?: number | null
          completed_at?: string | null
          conversion_rate_percent?: never
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          delivery_cost_paise?: number | null
          failure_reason?: string | null
          id?: string | null
          message_body?: string | null
          name?: string | null
          offer_id?: string | null
          open_rate_percent?: never
          opened_count?: number | null
          queued_at?: string | null
          recipient_count?: number | null
          roi_multiple?: never
          salon_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          template_key?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketing_campaigns_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_payout_summary: {
        Row: {
          amount_paise: number | null
          booking_count: number | null
          created_at: string | null
          gross_paise: number | null
          owner_share_bps: number | null
          payout_reference: string | null
          platform_fee_paise: number | null
          run_date: string | null
          salon_id: string | null
          status: string | null
        }
        Insert: {
          amount_paise?: number | null
          booking_count?: number | null
          created_at?: string | null
          gross_paise?: number | null
          owner_share_bps?: number | null
          payout_reference?: string | null
          platform_fee_paise?: number | null
          run_date?: string | null
          salon_id?: string | null
          status?: string | null
        }
        Update: {
          amount_paise?: number | null
          booking_count?: number | null
          created_at?: string | null
          gross_paise?: number | null
          owner_share_bps?: number | null
          payout_reference?: string | null
          platform_fee_paise?: number | null
          run_date?: string | null
          salon_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      public_catalog_staff: {
        Row: {
          avatar_path: string | null
          bio: string | null
          id: string | null
          live_status: string | null
          name: string | null
          rating_average: number | null
          review_count: number | null
          role_title: string | null
          salon_id: string | null
          specialty: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_listings"
            referencedColumns: ["salon_id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "public_job_salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      public_job_listings: {
        Row: {
          benefits: string | null
          category: string | null
          city: string | null
          description: string | null
          employment_type: string | null
          experience_max_months: number | null
          experience_min_months: number | null
          expires_at: string | null
          freshers_allowed: boolean | null
          id: string | null
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          location_label: string | null
          logo_path: string | null
          openings: number | null
          pay_type: string | null
          published_at: string | null
          rating_average: number | null
          responsibilities: string | null
          review_count: number | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string | null
          salon_name: string | null
          salon_slug: string | null
          salon_verified: boolean | null
          state: string | null
          tags: string[] | null
          tips_info: string | null
          title: string | null
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string | null
        }
        Relationships: []
      }
      public_job_salon_profiles: {
        Row: {
          business_category: string | null
          business_type: string | null
          city: string | null
          cover_image_path: string | null
          description: string | null
          id: string | null
          instagram_url: string | null
          logo_path: string | null
          name: string | null
          rating_average: number | null
          review_count: number | null
          slug: string | null
          state: string | null
          verification_status: string | null
          verified: boolean | null
          website_url: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string | null
          user_id: string | null
        }
        Insert: {
          role?: string | null
          user_id?: string | null
        }
        Update: {
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_interview: {
        Args: { target_interview_id: string }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_job_offer: {
        Args: { target_offer_id: string }
        Returns: {
          application_id: string
          candidate_user_id: string
          created_at: string
          created_by: string
          employment_type: string | null
          expires_at: string | null
          id: string
          job_role: string
          joining_date: string | null
          offer_document_path: string | null
          offer_notes: string | null
          responded_at: string | null
          salary: number | null
          salon_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accrue_reward_points: {
        Args: { p_points: number; p_reason?: string }
        Returns: undefined
      }
      approve_job: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_leave_request: {
        Args: { p_manager_note?: string; p_request_id: string }
        Returns: Json
      }
      approve_platform_role_request: {
        Args: { p_approve: boolean; p_request_id: string }
        Returns: string
      }
      approve_proposal: {
        Args: { p_notes?: string; p_proposal_id: string }
        Returns: string
      }
      approve_shift_swap: { Args: { p_request_id: string }; Returns: Json }
      auth_user_staff_has_permission: {
        Args: { p_action: string; p_module: string; p_salon_id: string }
        Returns: boolean
      }
      backfill_growth_partner_commissions: {
        Args: { p_limit?: number }
        Returns: number
      }
      bootstrap_shop_owner: {
        Args: {
          p_business_category?: string
          p_business_name: string
          p_contact_number?: string
        }
        Returns: string
      }
      calculate_payroll_record: {
        Args: {
          p_base_salary?: number
          p_payroll_period_id: string
          p_staff_id: string
        }
        Returns: string
      }
      calculate_staff_commission: {
        Args: {
          p_booking_id: string
          p_service_amount: number
          p_service_id: string
          p_staff_id: string
        }
        Returns: Json
      }
      cancel_customer_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: boolean
      }
      check_staff_permission: {
        Args: { p_action: string; p_module: string }
        Returns: boolean
      }
      claim_growth_partner_reward: {
        Args: { p_milestone_id: string; p_selected_option: string }
        Returns: string
      }
      clear_my_private_location: { Args: never; Returns: undefined }
      close_job: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_interview: {
        Args: { target_interview_id: string }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_job_employer_onboarding: {
        Args: {
          p_address: string
          p_business_name: string
          p_business_type?: string
          p_city: string
          p_contact_name: string
          p_instagram_url?: string
          p_postal_code?: string
          p_state: string
          p_website_url?: string
        }
        Returns: string
      }
      complete_job_seeker_onboarding: {
        Args: {
          p_available_from?: string
          p_bio: string
          p_city: string
          p_employment_types?: string[]
          p_expected_salary_max?: number
          p_expected_salary_min?: number
          p_experience_level: string
          p_headline: string
          p_open_to_relocation?: boolean
          p_preferred_roles?: string[]
          p_state: string
          p_total_experience_months: number
        }
        Returns: string
      }
      create_customer_booking: {
        Args: {
          p_appointment_start: string
          p_customer_note?: string
          p_idempotency_key?: string
          p_salon_id: string
          p_service_ids: string[]
          p_staff_id: string
        }
        Returns: string
      }
      create_interview_request: {
        Args: {
          p_duration_minutes?: number
          p_employer_message?: string
          p_interview_type: string
          p_location_text?: string
          p_meeting_url?: string
          p_scheduled_start: string
          target_application_id: string
        }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_job_post: {
        Args: {
          p_benefits?: string
          p_category: string
          p_description: string
          p_employment_type: string
          p_experience_max_months?: number
          p_experience_min_months?: number
          p_freshers_allowed?: boolean
          p_image_path?: string
          p_location_id: string
          p_openings?: number
          p_pay_type?: string
          p_salary_max?: number
          p_salary_min?: number
          p_salon_id: string
          p_tags?: string[]
          p_title: string
          p_working_days?: string
          p_working_hours?: string
          p_workplace_type?: string
        }
        Returns: string
      }
      create_job_support_ticket: {
        Args: {
          p_description: string
          p_issue_type: string
          p_priority?: string
          p_subject: string
        }
        Returns: string
      }
      create_owner_booking: {
        Args: {
          p_appointment_start: string
          p_customer_name: string
          p_customer_note?: string
          p_customer_phone?: string
          p_customer_user_id: string
          p_idempotency_key?: string
          p_is_walk_in?: boolean
          p_salon_id: string
          p_service_ids: string[]
          p_staff_id: string
        }
        Returns: string
      }
      create_partner_payout: {
        Args: { p_growth_partner_id: string; p_idempotency_key: string }
        Returns: string
      }
      create_salon_settlement: {
        Args: {
          p_idempotency_key: string
          p_period_end: string
          p_period_start: string
          p_salon_id: string
        }
        Returns: string
      }
      credit_reward_points: {
        Args: {
          p_points: number
          p_title?: string
          p_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      credit_wallet: {
        Args: {
          p_amount_paise: number
          p_reason?: string
          p_ref_id?: string
          p_ref_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      decline_interview: {
        Args: { p_reason?: string; target_interview_id: string }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decline_job_offer: {
        Args: { target_offer_id: string }
        Returns: {
          application_id: string
          candidate_user_id: string
          created_at: string
          created_by: string
          employment_type: string | null
          expires_at: string | null
          id: string
          job_role: string
          joining_date: string | null
          offer_document_path: string | null
          offer_notes: string | null
          responded_at: string | null
          salary: number | null
          salon_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_user_cascade: { Args: { p_email: string }; Returns: undefined }
      disable_organization_member: {
        Args: { p_member_id: string; p_reason?: string }
        Returns: undefined
      }
      ensure_growth_partner_identity: {
        Args: never
        Returns: {
          id: string
          partner_code: string
          referral_code: string
          status: string
          user_id: string
        }[]
      }
      finalize_razorpay_capture: {
        Args: {
          p_method: string
          p_occurred_at?: string
          p_payload_hash: string
          p_provider_event_id: string
          p_provider_order_id: string
          p_provider_payment_id: string
        }
        Returns: string
      }
      get_auth_user_staff_role: {
        Args: { p_salon_id: string }
        Returns: string
      }
      get_customer_bookings: {
        Args: { p_booking_id?: string; p_salon_id?: string }
        Returns: Json[]
      }
      get_job_applicant_cards: {
        Args: never
        Returns: {
          application_id: string
          avatar_path: string
          candidate_user_id: string
          city: string
          email: string
          full_name: string
          headline: string
          phone: string
          skills: string[]
          state: string
          total_experience_months: number
        }[]
      }
      get_job_conversation_summaries: {
        Args: never
        Returns: {
          candidate_avatar_path: string
          candidate_email: string
          candidate_name: string
          candidate_unread_count: number
          candidate_user_id: string
          conversation_id: string
          employer_avatar_path: string
          employer_name: string
          employer_unread_count: number
          employer_user_id: string
          job_id: string
          job_title: string
          last_message: string
          last_message_at: string
          salon_logo_path: string
          salon_name: string
          status: string
        }[]
      }
      get_owner_bookings: { Args: { p_booking_id?: string }; Returns: Json[] }
      get_public_salon_service_catalog: {
        Args: { p_salon_id: string; p_template_key: string }
        Returns: Json
      }
      get_staff_available_slots: {
        Args: {
          p_business_id: string
          p_date: string
          p_service_id: string
          p_staff_id: string
        }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      is_proposal_attributed: {
        Args: { p_proposal_id: string }
        Returns: boolean
      }
      is_public_business_location_salon: {
        Args: { p_salon_id: string }
        Returns: boolean
      }
      is_salon_owner: { Args: { p_salon_id: string }; Returns: boolean }
      job_assert_authenticated: { Args: never; Returns: string }
      job_can_manage_application: {
        Args: { target_application_id: string }
        Returns: boolean
      }
      job_create_match_notifications: {
        Args: { target_job_id: string }
        Returns: undefined
      }
      job_current_role: { Args: never; Returns: string }
      job_email_portal_role: { Args: { p_email: string }; Returns: string }
      job_is_active_salon_member: {
        Args: { target_salon_id: string }
        Returns: boolean
      }
      job_is_admin: { Args: never; Returns: boolean }
      job_register_role: { Args: { requested_role: string }; Returns: string }
      mark_application_viewed: {
        Args: { target_application_id: string }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_candidate_hired: {
        Args: { target_application_id: string }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_final_payment_ready: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      mark_growth_partner_commissions_paid: {
        Args: { p_commission_ids: string[]; p_reference?: string }
        Returns: number
      }
      mark_owner_payouts_paid: {
        Args: { p_payout_ids: string[]; p_reference?: string }
        Returns: number
      }
      marketplace_categories: {
        Args: never
        Returns: {
          icon: string
          name: string
          salon_count: number
          service_count: number
          slug: string
          sort_order: number
        }[]
      }
      marketplace_homepage_sections: {
        Args: never
        Returns: {
          section_key: string
          sort_order: number
          title: string
          visible: boolean
        }[]
      }
      marketplace_membership_plans: {
        Args: never
        Returns: {
          benefits: Json
          billing_period: string
          description: string
          discount_percent: number
          id: string
          name: string
          price_paise: number
          reward_points_rate: number
          slug: string
        }[]
      }
      marketplace_nearby: {
        Args: {
          p_area?: string
          p_city?: string
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_offset?: number
          p_radius_km?: number
        }
        Returns: {
          area: string
          business_category: string
          city: string
          cover_image_path: string
          distance_km: number
          id: string
          latitude: number
          longitude: number
          name: string
          rating_avg: number
          review_count: number
          slug: string
          starting_price_paise: number
        }[]
      }
      marketplace_next_slots: {
        Args: { p_salon_ids: string[]; p_tz?: string }
        Returns: {
          next_slot_iso: string
          salon_id: string
        }[]
      }
      marketplace_offers: {
        Args: { p_limit?: number }
        Returns: {
          code: string
          description: string
          discount_type: string
          discount_value: number
          eligible_services: Json
          maximum_discount_paise: number
          membership_only: boolean
          minimum_booking_paise: number
          name: string
          offer_id: string
          remaining_global: number
          salon_id: string
          salon_name: string
          salon_slug: string
          terms: string
          valid_from: string
          valid_until: string
        }[]
      }
      marketplace_partner_promos: {
        Args: never
        Returns: {
          description: string
          discount_type: string
          discount_value: number
          offer_id: string
          offer_name: string
          salon_id: string
          salon_name: string
          salon_slug: string
          valid_until: string
        }[]
      }
      marketplace_popular_services: {
        Args: { p_limit?: number }
        Returns: {
          booking_count: number
          duration_minutes: number
          price_paise: number
          salon_id: string
          salon_name: string
          service_id: string
          service_name: string
        }[]
      }
      marketplace_recommendations: {
        Args: { p_limit?: number }
        Returns: {
          area: string
          booking_count: number
          business_category: string
          city: string
          cover_image_path: string
          id: string
          name: string
          personalized: boolean
          rating_avg: number
          reason: string
          review_count: number
          score: number
          slug: string
          starting_price_paise: number
        }[]
      }
      marketplace_salon_stats: {
        Args: never
        Returns: {
          booking_count: number
          partner_onboarded: boolean
          rating_avg: number
          recent_reviews: Json
          review_count: number
          salon_id: string
        }[]
      }
      marketplace_search: {
        Args: {
          p_area?: string
          p_category?: string
          p_city?: string
          p_gender?: string
          p_has_offer?: boolean
          p_limit?: number
          p_max_price_paise?: number
          p_min_rating?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
        }
        Returns: {
          area: string
          booking_count: number
          business_category: string
          city: string
          cover_image_path: string
          gender_category: string
          has_offer: boolean
          id: string
          landmark: string
          name: string
          rating_avg: number
          review_count: number
          score: number
          slug: string
          starting_price_paise: number
        }[]
      }
      marketplace_search_suggestions: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          kind: string
          name: string
          slug: string
        }[]
      }
      marketplace_slots: {
        Args: {
          p_date: string
          p_salon_id: string
          p_service_ids: string[]
          p_staff_id?: string
          p_tz?: string
        }
        Returns: {
          slot_end: string
          slot_start: string
          staff_id: string
          staff_name: string
        }[]
      }
      marketplace_sponsored: { Args: never; Returns: Json }
      marketplace_top_rated: {
        Args: { p_limit?: number; p_min_reviews?: number }
        Returns: {
          area: string
          bayesian_rating: number
          booking_count: number
          business_category: string
          city: string
          cover_image_path: string
          id: string
          name: string
          rating_avg: number
          review_count: number
          slug: string
          starting_price_paise: number
        }[]
      }
      marketplace_trending: {
        Args: { p_limit?: number }
        Returns: {
          area: string
          booking_count: number
          business_category: string
          city: string
          id: string
          name: string
          overridden: boolean
          rating_avg: number
          review_count: number
          slug: string
          trending_score: number
        }[]
      }
      membership_benefit_for_booking: {
        Args: {
          p_salon_id: string
          p_service_ids: string[]
          p_subtotal_paise: number
        }
        Returns: {
          discount_paise: number
          discount_percent: number
          eligible: boolean
          plan_name: string
          points_awarded: number
          reason: string
        }[]
      }
      my_membership_status: {
        Args: never
        Returns: {
          benefits: Json
          discount_percent: number
          expires_at: string
          plan_name: string
          renewal_price_paise: number
          reward_points_rate: number
          starts_at: string
          status: string
        }[]
      }
      my_recently_viewed: {
        Args: { p_limit?: number }
        Returns: {
          area: string
          city: string
          cover_image_path: string
          id: string
          name: string
          slug: string
          viewed_at: string
        }[]
      }
      nexora_owner_salon_ids: { Args: never; Returns: string[] }
      open_booking_dispute: {
        Args: {
          p_booking_id: string
          p_description: string
          p_reason_code: string
        }
        Returns: string
      }
      operate_owner_booking: {
        Args: {
          p_action: string
          p_booking_id: string
          p_new_start?: string
          p_reason?: string
        }
        Returns: string
      }
      pause_job: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      prepare_razorpay_order: {
        Args: {
          p_booking_id: string
          p_provider_order_id: string
          p_stage: string
        }
        Returns: string
      }
      process_owner_payouts: {
        Args: { p_as_of?: string }
        Returns: {
          booking_count: number
          completed_at: string | null
          engine_version: string
          id: string
          notes: string | null
          owner_count: number
          run_date: string
          scheduled_for: string
          started_at: string
          status: string
          total_paise: number
          trigger_source: string
        }
        SetofOptions: {
          from: "*"
          to: "owner_payout_runs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_payroll: { Args: { p_payroll_period_id: string }; Returns: Json }
      process_verified_refund: {
        Args: {
          p_provider_event_id: string
          p_provider_refund_id: string
          p_refund_id: string
        }
        Returns: boolean
      }
      publish_job: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_salon_website: {
        Args: { p_notes?: string; p_proposal_id: string }
        Returns: string
      }
      quote_booking_refund: {
        Args: {
          p_appointment_start: string
          p_now?: string
          p_paid_paise: number
        }
        Returns: {
          hours_before: number
          refund_kind: string
          refund_paise: number
        }[]
      }
      record_marketing_campaign_metrics: {
        Args: {
          p_attributed_revenue_paise: number
          p_booking_count: number
          p_campaign_id: string
          p_clicked_count: number
          p_delivered_count: number
          p_delivery_cost_paise: number
          p_failure_reason?: string
          p_opened_count: number
          p_status: string
        }
        Returns: undefined
      }
      record_marketplace_event: {
        Args: { p_event_type: string; p_salon_id: string }
        Returns: boolean
      }
      record_owner_offline_payment: {
        Args: {
          p_booking_id: string
          p_idempotency_key: string
          p_method: string
        }
        Returns: string
      }
      record_partner_reward_shop_qualification: {
        Args: {
          p_active_scan_count: number
          p_growth_partner_id: string
          p_reason_code: string
          p_shop_attribution_id: string
          p_source_event_id: string
          p_status: string
        }
        Returns: undefined
      }
      record_sponsored_event: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_event_type: string
        }
        Returns: boolean
      }
      record_verified_payment_capture: {
        Args: {
          p_amount_paise: number
          p_booking_id: string
          p_method: string
          p_occurred_at?: string
          p_payload_hash: string
          p_provider: string
          p_provider_event_id: string
          p_provider_order_id: string
          p_provider_payment_id: string
        }
        Returns: string
      }
      redeem_booking_offer: {
        Args: { p_booking_id: string; p_offer_code: string }
        Returns: number
      }
      redeem_loyalty_points: {
        Args: {
          p_points: number
          p_title?: string
          p_wallet_credit_paise: number
        }
        Returns: undefined
      }
      reject_application: {
        Args: { p_reason?: string; target_application_id: string }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_job: {
        Args: { p_reason?: string; target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_leave_request: {
        Args: { p_manager_note?: string; p_request_id: string }
        Returns: Json
      }
      reject_shift_swap: {
        Args: { p_reason?: string; p_request_id: string }
        Returns: Json
      }
      release_growth_partner_commissions: {
        Args: { p_now?: string }
        Returns: number
      }
      report_employer: {
        Args: { p_details?: string; p_reason: string; target_salon_id: string }
        Returns: string
      }
      report_job: {
        Args: { p_details?: string; p_reason: string; target_job_id: string }
        Returns: string
      }
      request_booking_refund: {
        Args: { p_amount_paise: number; p_payment_id: string; p_reason: string }
        Returns: string
      }
      request_customer_cancellation: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: string
      }
      request_growth_partner_setup_edit: {
        Args: { p_proposal_id: string; p_reason: string }
        Returns: undefined
      }
      request_interview_reschedule: {
        Args: { p_reason: string; target_interview_id: string }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_job_account_deletion: {
        Args: { p_reason?: string }
        Returns: string
      }
      request_platform_role: {
        Args: { p_note?: string; p_role: string }
        Returns: string
      }
      reschedule_customer_booking: {
        Args: { p_appointment_start: string; p_booking_id: string }
        Returns: boolean
      }
      reschedule_interview: {
        Args: {
          p_new_start: string
          p_reason?: string
          target_interview_id: string
        }
        Returns: {
          application_id: string
          candidate_message: string | null
          candidate_user_id: string
          created_at: string
          created_by: string
          duration_minutes: number
          employer_message: string | null
          id: string
          interview_type: string
          location_text: string | null
          meeting_url: string | null
          salon_id: string
          scheduled_start: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_interview_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_partner_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          kind: string
          valid: boolean
        }[]
      }
      resume_job: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_business_location: {
        Args: { p_approve: boolean; p_reason?: string; p_salon_id: string }
        Returns: string
      }
      review_employer_verification: {
        Args: {
          p_notes?: string
          p_status: string
          target_verification_id: string
        }
        Returns: {
          business_proof_path: string | null
          id: string
          identity_proof_path: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salon_id: string
          salon_proof_path: string | null
          status: string
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_employer_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_salon_setup: {
        Args: { p_action: string; p_notes?: string; p_proposal_id: string }
        Returns: string
      }
      run_owner_daily_payouts: {
        Args: { p_as_of?: string; p_force?: boolean; p_source?: string }
        Returns: {
          booking_count: number
          completed_at: string | null
          engine_version: string
          id: string
          notes: string | null
          owner_count: number
          run_date: string
          scheduled_for: string
          started_at: string
          status: string
          total_paise: number
          trigger_source: string
        }
        SetofOptions: {
          from: "*"
          to: "owner_payout_runs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_growth_partner_salon_setup: {
        Args: { p_application_id: string; p_payload: Json; p_submit?: boolean }
        Returns: string
      }
      save_my_private_location: {
        Args: {
          p_accuracy_m: number
          p_altitude_accuracy_m?: number
          p_altitude_m?: number
          p_captured_at?: string
          p_heading_degrees?: number
          p_latitude: number
          p_longitude: number
          p_speed_mps?: number
        }
        Returns: undefined
      }
      save_owner_marketing_campaign: {
        Args: {
          p_action?: string
          p_audience_label: string
          p_campaign_id: string
          p_channel: string
          p_customer_ids?: string[]
          p_message_body?: string
          p_name: string
          p_offer_id?: string
          p_salon_id: string
          p_scheduled_at?: string
          p_template_key?: string
        }
        Returns: string
      }
      search_job_candidates: {
        Args: {
          p_city?: string
          p_limit?: number
          p_offset?: number
          p_skill_id?: string
        }
        Returns: {
          available_from: string
          avatar_path: string
          bio: string
          candidate_id: string
          city: string
          expected_salary_max: number
          expected_salary_min: number
          experience_level: string
          full_name: string
          headline: string
          open_to_relocation: boolean
          skills: string[]
          state: string
          total_experience_months: number
          user_id: string
        }[]
      }
      seed_leave_types_for_business: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      seed_staff_roles_for_business: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      send_job_offer: {
        Args: {
          p_employment_type: string
          p_expires_at?: string
          p_job_role: string
          p_joining_date: string
          p_offer_document_path?: string
          p_offer_notes?: string
          p_salary: number
          target_application_id: string
        }
        Returns: {
          application_id: string
          candidate_user_id: string
          created_at: string
          created_by: string
          employment_type: string | null
          expires_at: string | null
          id: string
          job_role: string
          joining_date: string | null
          offer_document_path: string | null
          offer_notes: string | null
          responded_at: string | null
          salary: number | null
          salon_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_owner_marketing_campaign_state: {
        Args: { p_action: string; p_campaign_id: string }
        Returns: string
      }
      set_partner_payout_status: {
        Args: {
          p_failure_code?: string
          p_payout_id: string
          p_provider_payout_id?: string
          p_status: string
          p_utr?: string
        }
        Returns: boolean
      }
      set_salon_payout_status: {
        Args: {
          p_failure_code?: string
          p_payout_id: string
          p_provider_payout_id?: string
          p_status: string
          p_utr?: string
        }
        Returns: boolean
      }
      settle_payroll: { Args: { p_payroll_period_id: string }; Returns: Json }
      shortlist_application: {
        Args: { target_application_id: string }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      staff_has_permission: {
        Args: { p_action: string; p_module: string; p_staff_id: string }
        Returns: boolean
      }
      submit_employer_verification: {
        Args: {
          p_business_proof_path: string
          p_identity_proof_path: string
          p_salon_proof_path: string
          target_salon_id: string
        }
        Returns: string
      }
      submit_job_application: {
        Args: {
          p_available_from?: string
          p_cover_note?: string
          p_expected_salary?: number
          p_resume_id?: string
          target_job_id: string
        }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_job_for_approval: {
        Args: { target_job_id: string }
        Returns: {
          admin_review_reason: string | null
          benefits: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          employment_type: string
          experience_max_months: number | null
          experience_min_months: number
          expires_at: string | null
          freshers_allowed: boolean
          id: string
          image_path: string | null
          incentives: string | null
          joining_date: string | null
          location_id: string | null
          openings: number
          pay_type: string | null
          published_at: string | null
          responsibilities: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_max: number | null
          salary_min: number | null
          salon_id: string
          status: string
          tags: string[]
          tips_info: string | null
          title: string
          updated_at: string
          weekly_off: string | null
          working_days: string | null
          working_hours: string | null
          workplace_type: string
        }
        SetofOptions: {
          from: "*"
          to: "job_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_my_business_location: {
        Args: {
          p_address_label?: string
          p_latitude: number
          p_longitude: number
          p_salon_id: string
        }
        Returns: string
      }
      user_manages_salon: { Args: { p_salon_id: string }; Returns: boolean }
      verify_business_rules: {
        Args: never
        Returns: {
          detail: string
          rule_id: string
          rule_name: string
          rule_no: number
          status: string
        }[]
      }
      verify_customer_phase1_backend: {
        Args: never
        Returns: {
          check_id: string
          check_name: string
          check_no: number
          detail: string
          status: string
        }[]
      }
      verify_phase3_rbac: {
        Args: never
        Returns: {
          check_name: string
          detail: string
          status: string
        }[]
      }
      verify_phase7_location_security: {
        Args: never
        Returns: {
          check_name: string
          detail: string
          passed: boolean
        }[]
      }
      verify_shop_owner_phase2_backend: {
        Args: never
        Returns: {
          check_id: string
          check_name: string
          check_no: number
          detail: string
          status: string
        }[]
      }
      withdraw_application: {
        Args: { p_reason?: string; target_application_id: string }
        Returns: {
          available_from: string | null
          candidate_profile_id: string
          candidate_user_id: string
          cover_note: string | null
          employer_notes: string | null
          expected_salary: number | null
          id: string
          job_id: string
          resume_id: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      withdraw_job_offer: {
        Args: { p_reason?: string; target_offer_id: string }
        Returns: {
          application_id: string
          candidate_user_id: string
          created_at: string
          created_by: string
          employment_type: string | null
          expires_at: string | null
          id: string
          job_role: string
          joining_date: string | null
          offer_document_path: string | null
          offer_notes: string | null
          responded_at: string | null
          salary: number | null
          salon_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
