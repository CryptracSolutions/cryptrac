export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          extensions?: Json
          variables?: Json
          query?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
        Relationships: []
      }
      automation_logs: {
        Row: {
          error: string | null
          id: string
          success: boolean
          task: string
          timestamp: string | null
        }
        Insert: {
          error?: string | null
          id?: string
          success: boolean
          task: string
          timestamp?: string | null
        }
        Update: {
          error?: string | null
          id?: string
          success?: boolean
          task?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email: string
          id: string
          status: string | null
          timestamp: string | null
          type: string
        }
        Insert: {
          email: string
          id?: string
          status?: string | null
          timestamp?: string | null
          type: string
        }
        Update: {
          email?: string
          id?: string
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
        Relationships: []
      }
      merchant_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          merchant_id: string | null
          pay_currency: string | null
          status: string | null
          tx_hash: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          merchant_id?: string | null
          pay_currency?: string | null
          status?: string | null
          tx_hash?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          merchant_id?: string | null
          pay_currency?: string | null
          status?: string | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          business_name: string
          country: string | null
          created_at: string | null
          id: string
          industry: string | null
          onboarded: boolean | null
          plan: string | null
          subscription_id: string | null
          trial_end: string | null
          usage_count: number | null
          user_id: string | null
          wallets: Json | null
          website: string | null
        }
        Insert: {
          business_name: string
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          onboarded?: boolean | null
          plan?: string | null
          subscription_id?: string | null
          trial_end?: string | null
          usage_count?: number | null
          user_id?: string | null
          wallets?: Json | null
          website?: string | null
        }
        Update: {
          business_name?: string
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          onboarded?: boolean | null
          plan?: string | null
          subscription_id?: string | null
          trial_end?: string | null
          usage_count?: number | null
          user_id?: string | null
          wallets?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      monthly_bonus_log: {
        Row: {
          bonus_amount: number | null
          created_at: string | null
          id: string
          month: string
          paid: boolean | null
          rank: number | null
          rep_id: string | null
          sales_count: number | null
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          month: string
          paid?: boolean | null
          rank?: number | null
          rep_id?: string | null
          sales_count?: number | null
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string | null
          id?: string
          month?: string
          paid?: boolean | null
          rank?: number | null
          rep_id?: string | null
          sales_count?: number | null
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
      partners: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          pending: boolean | null
          total_bonus: number | null
          total_referrals: number | null
          user_id: string | null
          w9_submitted: boolean | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          pending?: boolean | null
          total_bonus?: number | null
          total_referrals?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          pending?: boolean | null
          total_bonus?: number | null
          total_referrals?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Relationships: []
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
          pending: boolean | null
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
          pending?: boolean | null
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
          pending?: boolean | null
          tier?: number | null
          total_commission?: number | null
          total_sales?: number | null
          user_id?: string | null
          w9_submitted?: boolean | null
        }
        Relationships: []
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
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_proration: {
        Args: { full_fee: number; merchant_id: string }
        Returns: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

