export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "normalized"
  }

  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          affected_id: string | null
          details: Json | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          affected_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          affected_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          created_at: string | null
          error: string | null
          function_name: string | null
          id: string
          response_body: string | null
          response_status: number | null
          status: string | null
          success: boolean
          task: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          function_name?: string | null
          id?: string
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          success: boolean
          task: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          function_name?: string | null
          id?: string
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          success?: boolean
          task?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      cron_config: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          merchant_id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          merchant_id: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          merchant_id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_log: {
        Row: {
          created_at: string | null
          id: number
          message: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          message?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string | null
          timestamp: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          timestamp?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          timestamp?: string | null
          type?: string
        }
        Relationships: []
      }
      fiat_payouts: {
        Row: {
          amount: number
          id: string
          status: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          status?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          status?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiat_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          created_at: string | null
          last_value: number
          merchant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          last_value?: number
          merchant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          last_value?: number
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_counters_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_settings: {
        Row: {
          business_name: string | null
          created_at: string
          email_payment_notifications_enabled: boolean
          last_seen_payments_at: string | null
          merchant_id: string
          public_receipts_enabled: boolean
          updated_at: string
          wallet_extra_ids: Json | null
          wallets: Json | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email_payment_notifications_enabled?: boolean
          last_seen_payments_at?: string | null
          merchant_id: string
          public_receipts_enabled?: boolean
          updated_at?: string
          wallet_extra_ids?: Json | null
          wallets?: Json | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email_payment_notifications_enabled?: boolean
          last_seen_payments_at?: string | null
          merchant_id?: string
          public_receipts_enabled?: boolean
          updated_at?: string
          wallet_extra_ids?: Json | null
          wallets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          auto_convert_enabled: boolean | null
          business_address: Json | null
          business_description: string | null
          business_industry: string | null
          business_name: string
          business_type: string | null
          business_website: string | null
          charge_customer_fee: boolean | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          industry: string | null
          last_name: string | null
          last_subscription_payment: string | null
          monthly_subscription_id: string | null
          onboarded: boolean | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          onboarding_step: number | null
          payment_config: Json | null
          phone_number: string | null
          plan: string | null
          preferred_currencies: Json | null
          preferred_currency: string | null
          preferred_payout_currency: string | null
          referred_by_partner: string | null
          referred_by_rep: string | null
          sales_type: string | null
          setup_fee_amount: number | null
          setup_paid: boolean | null
          subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          supported_currencies: string[] | null
          tax_enabled: boolean | null
          tax_rates: Json | null
          tax_strategy: string | null
          timezone: string | null
          trial_end: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
          wallet_generation_method: string | null
          wallets: Json | null
          website: string | null
          website_url: string | null
          yearly_subscription_id: string | null
        }
        Insert: {
          auto_convert_enabled?: boolean | null
          business_address?: Json | null
          business_description?: string | null
          business_industry?: string | null
          business_name: string
          business_type?: string | null
          business_website?: string | null
          charge_customer_fee?: boolean | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          last_subscription_payment?: string | null
          monthly_subscription_id?: string | null
          onboarded?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          payment_config?: Json | null
          phone_number?: string | null
          plan?: string | null
          preferred_currencies?: Json | null
          preferred_currency?: string | null
          preferred_payout_currency?: string | null
          referred_by_partner?: string | null
          referred_by_rep?: string | null
          sales_type?: string | null
          setup_fee_amount?: number | null
          setup_paid?: boolean | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          supported_currencies?: string[] | null
          tax_enabled?: boolean | null
          tax_rates?: Json | null
          tax_strategy?: string | null
          timezone?: string | null
          trial_end?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
          wallet_generation_method?: string | null
          wallets?: Json | null
          website?: string | null
          website_url?: string | null
          yearly_subscription_id?: string | null
        }
        Update: {
          auto_convert_enabled?: boolean | null
          business_address?: Json | null
          business_description?: string | null
          business_industry?: string | null
          business_name?: string
          business_type?: string | null
          business_website?: string | null
          charge_customer_fee?: boolean | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          last_subscription_payment?: string | null
          monthly_subscription_id?: string | null
          onboarded?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          payment_config?: Json | null
          phone_number?: string | null
          plan?: string | null
          preferred_currencies?: Json | null
          preferred_currency?: string | null
          preferred_payout_currency?: string | null
          referred_by_partner?: string | null
          referred_by_rep?: string | null
          sales_type?: string | null
          setup_fee_amount?: number | null
          setup_paid?: boolean | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          supported_currencies?: string[] | null
          tax_enabled?: boolean | null
          tax_rates?: Json | null
          tax_strategy?: string | null
          timezone?: string | null
          trial_end?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
          wallet_generation_method?: string | null
          wallets?: Json | null
          website?: string | null
          website_url?: string | null
          yearly_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_referred_by_partner_fkey"
            columns: ["referred_by_partner"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_referred_by_rep_fkey"
            columns: ["referred_by_rep"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_bonus_log: {
        Row: {
          bonus_amount: number | null
          created_at: string | null
          id: string
          month: string
          original_bonus: number | null
          paid: boolean | null
          rank: number | null
          rep_id: string | null
          sales_count: number | null
          split_bonus: number | null
          tie_count: number | null
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          month: string
          original_bonus?: number | null
          paid?: boolean | null
          rank?: number | null
          rep_id?: string | null
          sales_count?: number | null
          split_bonus?: number | null
          tie_count?: number | null
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          month?: string
          original_bonus?: number | null
          paid?: boolean | null
          rank?: number | null
          rep_id?: string | null
          sales_count?: number | null
          split_bonus?: number | null
          tie_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_bonus_log_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      nowpayments_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          bonus_paid: boolean | null
          created_at: string | null
          id: string
          merchant_id: string
          partner_id: string
          validated: boolean | null
          validated_at: string | null
        }
        Insert: {
          bonus_paid?: boolean | null
          created_at?: string | null
          id?: string
          merchant_id: string
          partner_id: string
          validated?: boolean | null
          validated_at?: string | null
        }
        Update: {
          bonus_paid?: boolean | null
          created_at?: string | null
          id?: string
          merchant_id?: string
          partner_id?: string
          validated?: boolean | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          internal_notes: string | null
          pending: boolean | null
          preferred_currency: string | null
          referral_code: string | null
          total_bonus: number | null
          total_referrals: number | null
          user_id: string | null
          w9_submitted: boolean | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          pending?: boolean | null
          preferred_currency?: string | null
          referral_code?: string | null
          total_bonus?: number | null
          total_referrals?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          pending?: boolean | null
          preferred_currency?: string | null
          referral_code?: string | null
          total_bonus?: number | null
          total_referrals?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          accepted_cryptos: Json | null
          amount: number
          auto_convert_enabled: boolean | null
          base_amount: number | null
          charge_customer_fee: boolean | null
          created_at: string | null
          currency: string
          current_uses: number | null
          description: string | null
          expires_at: string | null
          fee_percentage: number | null
          id: string
          last_payment_at: string | null
          link_id: string
          max_uses: number | null
          merchant_id: string
          metadata: Json | null
          pos_device_id: string | null
          preferred_payout_currency: string | null
          qr_code_data: string | null
          source: string | null
          status: string | null
          subscription_id: string | null
          subtotal_with_tax: number | null
          tax_amount: number | null
          tax_enabled: boolean | null
          tax_label: string | null
          tax_percentage: number | null
          tax_rates: Json | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          accepted_cryptos?: Json | null
          amount: number
          auto_convert_enabled?: boolean | null
          base_amount?: number | null
          charge_customer_fee?: boolean | null
          created_at?: string | null
          currency?: string
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          fee_percentage?: number | null
          id?: string
          last_payment_at?: string | null
          link_id: string
          max_uses?: number | null
          merchant_id: string
          metadata?: Json | null
          pos_device_id?: string | null
          preferred_payout_currency?: string | null
          qr_code_data?: string | null
          source?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal_with_tax?: number | null
          tax_amount?: number | null
          tax_enabled?: boolean | null
          tax_label?: string | null
          tax_percentage?: number | null
          tax_rates?: Json | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          accepted_cryptos?: Json | null
          amount?: number
          auto_convert_enabled?: boolean | null
          base_amount?: number | null
          charge_customer_fee?: boolean | null
          created_at?: string | null
          currency?: string
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          fee_percentage?: number | null
          id?: string
          last_payment_at?: string | null
          link_id?: string
          max_uses?: number | null
          merchant_id?: string
          metadata?: Json | null
          pos_device_id?: string | null
          preferred_payout_currency?: string | null
          qr_code_data?: string | null
          source?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal_with_tax?: number | null
          tax_amount?: number | null
          tax_enabled?: boolean | null
          tax_label?: string | null
          tax_percentage?: number | null
          tax_rates?: Json | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_pos_device_id_fkey"
            columns: ["pos_device_id"]
            isOneToOne: false
            referencedRelation: "terminal_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          closed_by: string | null
          device_id: string
          ended_at: string | null
          id: string
          merchant_id: string
          opened_by: string | null
          started_at: string | null
        }
        Insert: {
          closed_by?: string | null
          device_id: string
          ended_at?: string | null
          id?: string
          merchant_id: string
          opened_by?: string | null
          started_at?: string | null
        }
        Update: {
          closed_by?: string | null
          device_id?: string
          ended_at?: string | null
          id?: string
          merchant_id?: string
          opened_by?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "terminal_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rep_sales: {
        Row: {
          date: string | null
          id: string
          merchant_id: string | null
          rep_id: string | null
          validated: boolean | null
        }
        Insert: {
          date?: string | null
          id?: string
          merchant_id?: string | null
          rep_id?: string | null
          validated?: boolean | null
        }
        Update: {
          date?: string | null
          id?: string
          merchant_id?: string | null
          rep_id?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rep_sales_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rep_sales_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      reps: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          internal_notes: string | null
          last_tier_update: string | null
          pending: boolean | null
          preferred_currency: string | null
          previous_month_sales: number | null
          referral_code: string | null
          tier: number | null
          total_commission: number | null
          total_sales: number | null
          user_id: string | null
          w9_submitted: boolean | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          last_tier_update?: string | null
          pending?: boolean | null
          preferred_currency?: string | null
          previous_month_sales?: number | null
          referral_code?: string | null
          tier?: number | null
          total_commission?: number | null
          total_sales?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          last_tier_update?: string | null
          pending?: boolean | null
          preferred_currency?: string | null
          previous_month_sales?: number | null
          referral_code?: string | null
          tier?: number | null
          total_commission?: number | null
          total_sales?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_amount_overrides: {
        Row: {
          amount: number
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          merchant_id: string
          note: string | null
          notice_sent_at: string | null
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          effective_from: string
          effective_until?: string | null
          id?: string
          merchant_id: string
          note?: string | null
          notice_sent_at?: string | null
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          merchant_id?: string
          note?: string | null
          notice_sent_at?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_amount_overrides_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_amount_overrides_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          merchant_id: string
          period_end: string
          period_start: string
          status: string | null
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          subscription_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          merchant_id: string
          period_end: string
          period_start: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          merchant_id?: string
          period_end?: string
          period_start?: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          cycle_start_at: string
          due_date: string
          id: string
          invoice_number: string | null
          merchant_id: string
          metadata: Json | null
          paid_at: string | null
          payment_link_id: string | null
          sent_at: string | null
          sent_via: string | null
          status: string
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          cycle_start_at: string
          due_date: string
          id?: string
          invoice_number?: string | null
          merchant_id: string
          metadata?: Json | null
          paid_at?: string | null
          payment_link_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          cycle_start_at?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          merchant_id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_link_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          accepted_cryptos: Json | null
          amount: number
          auto_convert_enabled: boolean | null
          auto_resume_on_payment: boolean
          billing_anchor: string
          charge_customer_fee: boolean | null
          completed_at: string | null
          created_at: string | null
          currency: string
          customer_id: string
          description: string | null
          generate_days_in_advance: number
          id: string
          interval: string
          interval_count: number
          invoice_due_days: number
          max_cycles: number | null
          merchant_id: string
          metadata: Json | null
          missed_payments_count: number | null
          next_billing_at: string | null
          past_due_after_days: number
          pause_after_missed_payments: number | null
          paused_at: string | null
          preferred_payout_currency: string | null
          resumed_at: string | null
          status: string
          tax_enabled: boolean | null
          tax_rates: Json | null
          title: string
          total_cycles: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_cryptos?: Json | null
          amount: number
          auto_convert_enabled?: boolean | null
          auto_resume_on_payment?: boolean
          billing_anchor: string
          charge_customer_fee?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_id: string
          description?: string | null
          generate_days_in_advance?: number
          id?: string
          interval: string
          interval_count?: number
          invoice_due_days?: number
          max_cycles?: number | null
          merchant_id: string
          metadata?: Json | null
          missed_payments_count?: number | null
          next_billing_at?: string | null
          past_due_after_days?: number
          pause_after_missed_payments?: number | null
          paused_at?: string | null
          preferred_payout_currency?: string | null
          resumed_at?: string | null
          status?: string
          tax_enabled?: boolean | null
          tax_rates?: Json | null
          title: string
          total_cycles?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_cryptos?: Json | null
          amount?: number
          auto_convert_enabled?: boolean | null
          auto_resume_on_payment?: boolean
          billing_anchor?: string
          charge_customer_fee?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_id?: string
          description?: string | null
          generate_days_in_advance?: number
          id?: string
          interval?: string
          interval_count?: number
          invoice_due_days?: number
          max_cycles?: number | null
          merchant_id?: string
          metadata?: Json | null
          missed_payments_count?: number | null
          next_billing_at?: string | null
          past_due_after_days?: number
          pause_after_missed_payments?: number | null
          paused_at?: string | null
          preferred_payout_currency?: string | null
          resumed_at?: string | null
          status?: string
          tax_enabled?: boolean | null
          tax_rates?: Json | null
          title?: string
          total_cycles?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string
          resolved: boolean | null
          role: string | null
          subject: string | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          resolved?: boolean | null
          role?: string | null
          subject?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          resolved?: boolean | null
          role?: string | null
          subject?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_currencies: {
        Row: {
          address_format: string | null
          address_type: string | null
          code: string
          contract_address: string | null
          created_at: string | null
          decimals: number | null
          derivation_path: string | null
          display_name: string | null
          enabled: boolean | null
          icon_url: string | null
          id: string
          is_token: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          network: string | null
          nowpayments_code: string | null
          parent_currency: string | null
          symbol: string | null
          trust_wallet_compatible: boolean | null
          updated_at: string | null
        }
        Insert: {
          address_format?: string | null
          address_type?: string | null
          code: string
          contract_address?: string | null
          created_at?: string | null
          decimals?: number | null
          derivation_path?: string | null
          display_name?: string | null
          enabled?: boolean | null
          icon_url?: string | null
          id?: string
          is_token?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          network?: string | null
          nowpayments_code?: string | null
          parent_currency?: string | null
          symbol?: string | null
          trust_wallet_compatible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address_format?: string | null
          address_type?: string | null
          code?: string
          contract_address?: string | null
          created_at?: string | null
          decimals?: number | null
          derivation_path?: string | null
          display_name?: string | null
          enabled?: boolean | null
          icon_url?: string | null
          id?: string
          is_token?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          network?: string | null
          nowpayments_code?: string | null
          parent_currency?: string | null
          symbol?: string | null
          trust_wallet_compatible?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      terminal_devices: {
        Row: {
          accepted_cryptos: Json | null
          allow_custom_tip: boolean | null
          charge_customer_fee: boolean | null
          created_at: string | null
          default_currency: string | null
          id: string
          label: string
          last_seen_at: string | null
          merchant_id: string
          public_id: string | null
          registered_by: string | null
          status: string | null
          tax_enabled: boolean | null
          tip_presets: Json | null
        }
        Insert: {
          accepted_cryptos?: Json | null
          allow_custom_tip?: boolean | null
          charge_customer_fee?: boolean | null
          created_at?: string | null
          default_currency?: string | null
          id?: string
          label: string
          last_seen_at?: string | null
          merchant_id: string
          public_id?: string | null
          registered_by?: string | null
          status?: string | null
          tax_enabled?: boolean | null
          tip_presets?: Json | null
        }
        Update: {
          accepted_cryptos?: Json | null
          allow_custom_tip?: boolean | null
          charge_customer_fee?: boolean | null
          created_at?: string | null
          default_currency?: string | null
          id?: string
          label?: string
          last_seen_at?: string | null
          merchant_id?: string
          public_id?: string | null
          registered_by?: string | null
          status?: string | null
          tax_enabled?: boolean | null
          tip_presets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "terminal_devices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_devices_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_history: {
        Row: {
          created_at: string | null
          id: string
          month: string
          new_tier: number
          old_tier: number | null
          previous_month_sales: number
          rep_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          new_tier: number
          old_tier?: number | null
          previous_month_sales: number
          rep_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          new_tier?: number
          old_tier?: number | null
          previous_month_sales?: number
          rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_history_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          amount_received: number | null
          asset: string | null
          base_amount: number | null
          conversion_fee_amount: number | null
          created_at: string | null
          cryptrac_fee: number | null
          currency: string | null
          currency_received: string | null
          customer_email: string | null
          customer_phone: string | null
          expires_at: string | null
          gateway_fee: number | null
          gateway_fee_amount: number | null
          id: string
          invoice_id: string | null
          is_fee_paid_by_user: boolean | null
          merchant_id: string | null
          merchant_receives: number | null
          network: string | null
          network_fee_amount: number | null
          nowpayments_payment_id: string | null
          order_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string | null
          payin_hash: string | null
          payment_data: Json | null
          payment_link_id: string | null
          payout_currency: string | null
          payout_hash: string | null
          public_receipt_id: string
          receipt_metadata: Json | null
          refund_amount: number | null
          refunded_at: string | null
          settlement_currency: string | null
          status: string | null
          subtotal_with_tax: number | null
          tax_amount: number | null
          tax_breakdown: Json | null
          tax_enabled: boolean | null
          tax_label: string | null
          tax_percentage: number | null
          tax_rates: Json | null
          total_amount_paid: number | null
          total_paid: number | null
          tx_hash: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          amount_received?: number | null
          asset?: string | null
          base_amount?: number | null
          conversion_fee_amount?: number | null
          created_at?: string | null
          cryptrac_fee?: number | null
          currency?: string | null
          currency_received?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          gateway_fee?: number | null
          gateway_fee_amount?: number | null
          id?: string
          invoice_id?: string | null
          is_fee_paid_by_user?: boolean | null
          merchant_id?: string | null
          merchant_receives?: number | null
          network?: string | null
          network_fee_amount?: number | null
          nowpayments_payment_id?: string | null
          order_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          payin_hash?: string | null
          payment_data?: Json | null
          payment_link_id?: string | null
          payout_currency?: string | null
          payout_hash?: string | null
          public_receipt_id?: string
          receipt_metadata?: Json | null
          refund_amount?: number | null
          refunded_at?: string | null
          settlement_currency?: string | null
          status?: string | null
          subtotal_with_tax?: number | null
          tax_amount?: number | null
          tax_breakdown?: Json | null
          tax_enabled?: boolean | null
          tax_label?: string | null
          tax_percentage?: number | null
          tax_rates?: Json | null
          total_amount_paid?: number | null
          total_paid?: number | null
          tx_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          amount_received?: number | null
          asset?: string | null
          base_amount?: number | null
          conversion_fee_amount?: number | null
          created_at?: string | null
          cryptrac_fee?: number | null
          currency?: string | null
          currency_received?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          gateway_fee?: number | null
          gateway_fee_amount?: number | null
          id?: string
          invoice_id?: string | null
          is_fee_paid_by_user?: boolean | null
          merchant_id?: string | null
          merchant_receives?: number | null
          network?: string | null
          network_fee_amount?: number | null
          nowpayments_payment_id?: string | null
          order_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string | null
          payin_hash?: string | null
          payment_data?: Json | null
          payment_link_id?: string | null
          payout_currency?: string | null
          payout_hash?: string | null
          public_receipt_id?: string
          receipt_metadata?: Json | null
          refund_amount?: number | null
          refunded_at?: string | null
          settlement_currency?: string | null
          status?: string | null
          subtotal_with_tax?: number | null
          tax_amount?: number | null
          tax_breakdown?: Json | null
          tax_enabled?: boolean | null
          tax_label?: string | null
          tax_percentage?: number | null
          tax_rates?: Json | null
          total_amount_paid?: number | null
          total_paid?: number | null
          tx_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_payments_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_history: {
        Row: {
          amount_paid: number | null
          id: string
          merchant_id: string | null
          stripe_id: string | null
          timestamp: string | null
        }
        Insert: {
          amount_paid?: number | null
          id?: string
          merchant_id?: string | null
          stripe_id?: string | null
          timestamp?: string | null
        }
        Update: {
          amount_paid?: number | null
          id?: string
          merchant_id?: string | null
          stripe_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_generation_log: {
        Row: {
          client_ip: unknown | null
          created_at: string | null
          currencies_generated: string[]
          generation_method: string
          id: string
          merchant_id: string
          user_agent: string | null
        }
        Insert: {
          client_ip?: unknown | null
          created_at?: string | null
          currencies_generated: string[]
          generation_method: string
          id?: string
          merchant_id: string
          user_agent?: string | null
        }
        Update: {
          client_ip?: unknown | null
          created_at?: string | null
          currencies_generated?: string[]
          generation_method?: string
          id?: string
          merchant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_generation_log_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          merchant_id: string | null
          next_retry_at: string | null
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          processing_error: string | null
          provider: string | null
          raw_data: Json | null
          request_headers: Json | null
          request_payload: Json
          request_signature: string | null
          source: string
          status: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          merchant_id?: string | null
          next_retry_at?: string | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          provider?: string | null
          raw_data?: Json | null
          request_headers?: Json | null
          request_payload: Json
          request_signature?: string | null
          source: string
          status?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          merchant_id?: string | null
          next_retry_at?: string | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          provider?: string | null
          raw_data?: Json | null
          request_headers?: Json | null
          request_payload?: Json
          request_signature?: string | null
          source?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_payment_link_status: {
        Args: {
          p_current_status: string
          p_confirmed_uses: number
          p_max_uses: number
          p_expires_at: string
        }
        Returns: string
      }
      calculate_subscription_proration: {
        Args: {
          merchant_id: string
          subscription_amount: number
          days_used: number
          total_days: number
        }
        Returns: number
      }
      check_scheduler_cron_status: {
        Args: Record<string, never>
        Returns: {
          job_name: string | null
          schedule: string | null
          active: boolean | null
          last_run: string | null
          last_status: string | null
          next_run: string | null
        }[]
      }
      check_wallet_extra_ids_valid: {
        Args: {
          extra_ids: Json
        }
        Returns: boolean
      }
      clean_expired_cache: {
        Args: Record<string, never>
        Returns: void
      }
      create_merchant_for_user: {
        Args: {
          p_user_id: string
          p_business_name?: string
        }
        Returns: {
          id: string | null
          user_id: string | null
          business_name: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          setup_paid: boolean | null
        }[]
      }
      get_current_merchant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_merchant_supported_currencies: {
        Args: {
          merchant_id: string
        }
        Returns: {
          code: string | null
          name: string | null
          symbol: string | null
          network: string | null
          is_token: boolean | null
          parent_currency: string | null
          trust_wallet_compatible: boolean | null
          address_format: string | null
          has_wallet: boolean | null
          display_name: string | null
        }[]
      }
      get_next_invoice_number: {
        Args: {
          merchant_uuid: string
        }
        Returns: string
      }
      get_payment_link_statistics: {
        Args: {
          p_merchant_id: string
        }
        Returns: {
          total_links: number | null
          active_links: number | null
          completed_links: number | null
          expired_links: number | null
          paused_links: number | null
          single_use_links: number | null
          total_payments: number | null
          total_revenue: number | null
        }[]
      }
      get_trust_wallet_currencies: {
        Args: Record<string, never>
        Returns: {
          code: string | null
          name: string | null
          symbol: string | null
          network: string | null
          is_token: boolean | null
          parent_currency: string | null
          trust_wallet_compatible: boolean | null
          address_type: string | null
          derivation_path: string | null
          enabled: boolean | null
          min_amount: number | null
          decimals: number | null
          display_name: string | null
        }[]
      }
      get_wallet_extra_id: {
        Args: {
          merchant_uuid: string
          currency: string
        }
        Returns: string
      }
      handle_monthly_bonus: {
        Args: Record<string, never>
        Returns: unknown
      }
      handle_partner_referral: {
        Args: Record<string, never>
        Returns: unknown
      }
      increment_payment_link_usage: {
        Args:
          | { input_id: string }
          | { p_link_id: string }
        Returns: void
      }
      manual_scheduler_trigger: {
        Args: Record<string, never>
        Returns: {
          success: boolean | null
          message: string | null
          executed_at: string | null
        }[]
      }
      remove_wallet_extra_id: {
        Args: {
          merchant_uuid: string
          currency: string
        }
        Returns: boolean
      }
      run_subscription_scheduler: {
        Args: Record<string, never>
        Returns: void
      }
      set_timestamp_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      set_wallet_extra_id: {
        Args: {
          merchant_uuid: string
          currency: string
          extra_id: string
        }
        Returns: boolean
      }
      trigger_invoice_generation: {
        Args: Record<string, never>
        Returns: void
      }
      trigger_subscription_scheduler: {
        Args: Record<string, never>
        Returns: Json
      }
      update_expired_payment_links: {
        Args: Record<string, never>
        Returns: number
      }
      update_payment_link_status: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_payment_link_usage: {
        Args: Record<string, never>
        Returns: unknown
      }
      update_updated_at_column: {
        Args: Record<string, never>
        Returns: unknown
      }
      validate_extra_id: {
        Args: {
          currency: string
          extra_id: string
        }
        Returns: boolean
      }
      validate_tax_calculation: {
        Args: {
          p_base_amount: number
          p_tax_rates: Json
          p_expected_tax_amount: number
        }
        Returns: boolean
      }
      validate_wallet_extra_ids_trigger: {
        Args: Record<string, never>
        Returns: unknown
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
