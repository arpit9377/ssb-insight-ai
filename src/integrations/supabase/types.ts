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
      profiles: {
        Row: {
          age: number | null
          background: string | null
          created_at: string
          education: string | null
          email: string
          full_name: string | null
          id: string
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          background?: string | null
          created_at?: string
          education?: string | null
          email: string
          full_name?: string | null
          id?: string
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          background?: string | null
          created_at?: string
          education?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_status?: string | null
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
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
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
      increment_usage_count: {
        Args: { table_name: string; row_id: string }
        Returns: undefined
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
