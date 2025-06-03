
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          age: number;
          education: string;
          background: string;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name: string;
          age: number;
          education: string;
          background: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
          age?: number;
          education?: string;
          background?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_images: {
        Row: {
          id: string;
          test_type: string;
          image_url: string;
          prompt: string;
          sequence_number: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_type: string;
          image_url: string;
          prompt: string;
          sequence_number: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_type?: string;
          image_url?: string;
          prompt?: string;
          sequence_number?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_responses: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          test_session_id: string;
          question_id: string;
          response_text: string;
          time_taken: number;
          ai_feedback: any;
          trait_scores: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          test_session_id: string;
          question_id: string;
          response_text: string;
          time_taken: number;
          ai_feedback?: any;
          trait_scores?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          test_session_id?: string;
          question_id?: string;
          response_text?: string;
          time_taken?: number;
          ai_feedback?: any;
          trait_scores?: any;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan_type: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan_type: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          plan_type?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
