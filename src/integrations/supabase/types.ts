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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          ai_provider: string
          analysis_type: string
          created_at: string
          id: string
          improvements: string[] | null
          is_premium_analysis: boolean | null
          overall_score: number | null
          processed_feedback: Json | null
          raw_analysis: Json | null
          recommendations: string[] | null
          response_id: string | null
          strengths: string[] | null
          test_session_id: string | null
          trait_scores: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_provider: string
          analysis_type: string
          created_at?: string
          id?: string
          improvements?: string[] | null
          is_premium_analysis?: boolean | null
          overall_score?: number | null
          processed_feedback?: Json | null
          raw_analysis?: Json | null
          recommendations?: string[] | null
          response_id?: string | null
          strengths?: string[] | null
          test_session_id?: string | null
          trait_scores?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_provider?: string
          analysis_type?: string
          created_at?: string
          id?: string
          improvements?: string[] | null
          is_premium_analysis?: boolean | null
          overall_score?: number | null
          processed_feedback?: Json | null
          raw_analysis?: Json | null
          recommendations?: string[] | null
          response_id?: string | null
          strengths?: string[] | null
          test_session_id?: string | null
          trait_scores?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_analyses_response"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "user_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_analyses_test_session"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          created_at: string | null
          fingerprint_hash: string
          id: string
          ip_address: unknown | null
          last_seen_at: string | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          ip_address?: unknown | null
          last_seen_at?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          ip_address?: unknown | null
          last_seen_at?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          avatar_url: string | null
          average_score: number
          category: string
          city: string | null
          created_at: string
          current_streak: number
          display_name: string
          id: string
          monthly_points: number
          rank_position: number | null
          total_points: number
          total_tests_completed: number
          updated_at: string
          user_id: string
          weekly_points: number
        }
        Insert: {
          avatar_url?: string | null
          average_score?: number
          category?: string
          city?: string | null
          created_at?: string
          current_streak?: number
          display_name: string
          id?: string
          monthly_points?: number
          rank_position?: number | null
          total_points?: number
          total_tests_completed?: number
          updated_at?: string
          user_id: string
          weekly_points?: number
        }
        Update: {
          avatar_url?: string | null
          average_score?: number
          category?: string
          city?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string
          id?: string
          monthly_points?: number
          rank_position?: number | null
          total_points?: number
          total_tests_completed?: number
          updated_at?: string
          user_id?: string
          weekly_points?: number
        }
        Relationships: []
      }
      openai_api_logs: {
        Row: {
          cost_estimate: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          is_premium_request: boolean | null
          metadata: Json | null
          model_used: string | null
          request_type: string | null
          response_time_ms: number | null
          tokens_used: number | null
          updated_at: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          is_premium_request?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          tokens_used?: number | null
          updated_at?: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          is_premium_request?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          tokens_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount_paid: number
          id: string
          payment_screenshot_url: string
          phone_number: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_notes?: string | null
          amount_paid: number
          id?: string
          payment_screenshot_url: string
          phone_number: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          admin_notes?: string | null
          amount_paid?: number
          id?: string
          payment_screenshot_url?: string
          phone_number?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          background: string | null
          career_goals: string | null
          city: string | null
          country: string | null
          created_at: string
          data_sharing: boolean | null
          education: string | null
          email: string
          experience_years: number | null
          full_name: string | null
          id: string
          interests: string | null
          last_test_reset_date: string | null
          linkedin_url: string | null
          notification_email: boolean | null
          notification_sms: boolean | null
          occupation: string | null
          payment_screenshot_url: string | null
          phone_number: string | null
          preferred_language: string | null
          public_profile: boolean | null
          state: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_type: string | null
          tests_remaining_ppdt: number | null
          tests_remaining_srt: number | null
          tests_remaining_tat: number | null
          tests_remaining_wat: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          background?: string | null
          career_goals?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_sharing?: boolean | null
          education?: string | null
          email: string
          experience_years?: number | null
          full_name?: string | null
          id?: string
          interests?: string | null
          last_test_reset_date?: string | null
          linkedin_url?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          occupation?: string | null
          payment_screenshot_url?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          public_profile?: boolean | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          tests_remaining_ppdt?: number | null
          tests_remaining_srt?: number | null
          tests_remaining_tat?: number | null
          tests_remaining_wat?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          background?: string | null
          career_goals?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          data_sharing?: boolean | null
          education?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string | null
          id?: string
          interests?: string | null
          last_test_reset_date?: string | null
          linkedin_url?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          occupation?: string | null
          payment_screenshot_url?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          public_profile?: boolean | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          tests_remaining_ppdt?: number | null
          tests_remaining_srt?: number | null
          tests_remaining_tat?: number | null
          tests_remaining_wat?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srt_situations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          situation: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          situation: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          situation?: string
          usage_count?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          cashfree_order_id: string | null
          cashfree_order_token: string | null
          cashfree_payment_id: string | null
          cashfree_signature: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          cashfree_order_id?: string | null
          cashfree_order_token?: string | null
          cashfree_payment_id?: string | null
          cashfree_signature?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          cashfree_order_id?: string | null
          cashfree_order_token?: string | null
          cashfree_payment_id?: string | null
          cashfree_signature?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          prompt: string
          sequence_number: number
          test_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          prompt: string
          sequence_number?: number
          test_type: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          prompt?: string
          sequence_number?: number
          test_type?: string
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          completed_at: string | null
          completed_questions: number
          created_at: string
          id: string
          started_at: string
          status: string
          test_type: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_questions?: number
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          test_type: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_questions?: number
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          test_type?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_analysis_usage: {
        Row: {
          created_at: string
          free_analyses_used: number
          id: string
          last_free_analysis_date: string | null
          total_analyses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_analyses_used?: number
          id?: string
          last_free_analysis_date?: string | null
          total_analyses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_analyses_used?: number
          id?: string
          last_free_analysis_date?: string | null
          total_analyses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_responses: {
        Row: {
          ai_feedback: Json | null
          created_at: string
          id: string
          question_id: string
          response_text: string
          test_session_id: string
          test_type: string
          time_taken: number
          trait_scores: Json | null
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          created_at?: string
          id?: string
          question_id: string
          response_text: string
          test_session_id: string
          test_type: string
          time_taken?: number
          trait_scores?: Json | null
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          created_at?: string
          id?: string
          question_id?: string
          response_text?: string
          test_session_id?: string
          test_type?: string
          time_taken?: number
          trait_scores?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          badges: Json | null
          best_login_streak: number
          best_test_streak: number
          created_at: string
          current_login_streak: number
          current_test_streak: number
          id: string
          last_login_date: string | null
          last_test_date: string | null
          level_rank: string
          streak_freeze_count: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json | null
          best_login_streak?: number
          best_test_streak?: number
          created_at?: string
          current_login_streak?: number
          current_test_streak?: number
          id?: string
          last_login_date?: string | null
          last_test_date?: string | null
          level_rank?: string
          streak_freeze_count?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json | null
          best_login_streak?: number
          best_test_streak?: number
          created_at?: string
          current_login_streak?: number
          current_test_streak?: number
          id?: string
          last_login_date?: string | null
          last_test_date?: string | null
          level_rank?: string
          streak_freeze_count?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wat_words: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          usage_count: number
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          usage_count?: number
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          usage_count?: number
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_paid_subscription: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      decrement_test_limit: {
        Args: { target_user_id: string; test_type: string }
        Returns: boolean
      }
      get_openai_api_summary: {
        Args: { hours_back?: number }
        Returns: Json
      }
      get_test_limits: {
        Args: { target_user_id: string }
        Returns: Json
      }
      increment_usage_count: {
        Args: { row_id: string; table_name: string }
        Returns: undefined
      }
      update_user_streak: {
        Args: { activity_type: string; target_user_id: string }
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
