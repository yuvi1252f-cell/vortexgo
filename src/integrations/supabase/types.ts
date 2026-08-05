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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bonus_coins: number
          created_at: string
          deposit_coins: number
          ff_name: string | null
          id: string
          phone: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string
          username: string
          winning_coins: number
        }
        Insert: {
          avatar_url?: string | null
          bonus_coins?: number
          created_at?: string
          deposit_coins?: number
          ff_name?: string | null
          id: string
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          updated_at?: string
          username?: string
          winning_coins?: number
        }
        Update: {
          avatar_url?: string | null
          bonus_coins?: number
          created_at?: string
          deposit_coins?: number
          ff_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          username?: string
          winning_coins?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_entries: {
        Row: {
          created_at: string
          ff_name: string
          id: string
          kills: number
          position: string
          prize: number
          rank: number | null
          team_no: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ff_name: string
          id?: string
          kills?: number
          position?: string
          prize?: number
          rank?: number | null
          team_no?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          ff_name?: string
          id?: string
          kills?: number
          position?: string
          prize?: number
          rank?: number | null
          team_no?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_entries_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at: string
          entry_fee: number
          filled_slots: number
          game: string
          id: string
          map: string
          match_time: string
          mode: Database["public"]["Enums"]["tournament_mode"]
          per_kill: number
          prize_pool: number
          room_id: string | null
          room_password: string | null
          rules: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_slots: number
          version: string
        }
        Insert: {
          banner_url?: string | null
          category?: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          entry_fee?: number
          filled_slots?: number
          game?: string
          id?: string
          map?: string
          match_time: string
          mode?: Database["public"]["Enums"]["tournament_mode"]
          per_kill?: number
          prize_pool?: number
          room_id?: string | null
          room_password?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_slots?: number
          version?: string
        }
        Update: {
          banner_url?: string | null
          category?: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          entry_fee?: number
          filled_slots?: number
          game?: string
          id?: string
          map?: string
          match_time?: string
          mode?: Database["public"]["Enums"]["tournament_mode"]
          per_kill?: number
          prize_pool?: number
          room_id?: string | null
          room_password?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          total_slots?: number
          version?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          note: string | null
          reference: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          upi_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          note?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          upi_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          note?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
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
      get_room_credentials: {
        Args: { p_tournament: string }
        Returns: {
          room_id: string
          room_password: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_tournament: {
        Args: { p_ff_name: string; p_tournament: string }
        Returns: {
          created_at: string
          ff_name: string
          id: string
          kills: number
          position: string
          prize: number
          rank: number | null
          team_no: number
          tournament_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tournament_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: { p_amount: number; p_method: string; p_upi_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          method: string | null
          note: string | null
          reference: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          upi_id: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "player"
      tournament_category: "survival" | "full_map" | "clash_squad" | "lone_wolf"
      tournament_mode: "solo" | "duo" | "squad"
      tournament_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      txn_status: "pending" | "approved" | "rejected"
      txn_type:
        | "deposit"
        | "withdraw"
        | "entry_fee"
        | "prize"
        | "referral"
        | "bonus"
        | "refund"
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
      app_role: ["admin", "player"],
      tournament_category: ["survival", "full_map", "clash_squad", "lone_wolf"],
      tournament_mode: ["solo", "duo", "squad"],
      tournament_status: ["upcoming", "ongoing", "completed", "cancelled"],
      txn_status: ["pending", "approved", "rejected"],
      txn_type: [
        "deposit",
        "withdraw",
        "entry_fee",
        "prize",
        "referral",
        "bonus",
        "refund",
      ],
    },
  },
} as const
