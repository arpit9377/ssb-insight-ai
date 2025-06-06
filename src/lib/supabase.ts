
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://katdnpqytskvsrweqtjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdGRucHF5dHNrdnNyd2VxdGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDk1ODgsImV4cCI6MjA2NDcyNTU4OH0.sb7MGMlJeKfw4YIk1626SsyaMO73GkufEnohBJq5lcY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string; // Changed to string to support Clerk user IDs
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
          user_id: string; // Changed to string to support Clerk user IDs
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
      wat_words: {
        Row: {
          id: string;
          word: string;
          is_active: boolean;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          is_active?: boolean;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          is_active?: boolean;
          usage_count?: number;
          created_at?: string;
        };
      };
      srt_situations: {
        Row: {
          id: string;
          situation: string;
          is_active: boolean;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          situation: string;
          is_active?: boolean;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          situation?: string;
          is_active?: boolean;
          usage_count?: number;
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
