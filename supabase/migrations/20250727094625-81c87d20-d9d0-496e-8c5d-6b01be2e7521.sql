-- Phase 1: Fix user_id column types and enable RLS

-- Fix user_id column types from UUID to TEXT to match Clerk user IDs
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE TEXT;

-- Enable RLS on tables that don't have it
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow all operations on user_responses" ON public.user_responses;
DROP POLICY IF EXISTS "Allow all operations on test_images" ON public.test_images;
DROP POLICY IF EXISTS "Allow all operations on wat_words" ON public.wat_words;
DROP POLICY IF EXISTS "Allow all operations on srt_situations" ON public.srt_situations;

-- Create secure RLS policies for user-specific data

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.subscriptions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- Test sessions policies
CREATE POLICY "Users can view their own test sessions" 
ON public.test_sessions FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own test sessions" 
ON public.test_sessions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own test sessions" 
ON public.test_sessions FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id);

-- User responses policies
CREATE POLICY "Users can view their own responses" 
ON public.user_responses FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own responses" 
ON public.user_responses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- AI analyses policies
CREATE POLICY "Users can view their own analyses" 
ON public.ai_analyses FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own analyses" 
ON public.ai_analyses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- User analysis usage policies
CREATE POLICY "Users can view their own usage" 
ON public.user_analysis_usage FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own usage" 
ON public.user_analysis_usage FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.user_analysis_usage FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

-- Content management tables - public read, admin write
CREATE POLICY "Public can view test images" 
ON public.test_images FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Public can view WAT words" 
ON public.wat_words FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Public can view SRT situations" 
ON public.srt_situations FOR SELECT 
TO authenticated 
USING (true);

-- Admin policies for content management (for future admin implementation)
CREATE POLICY "Admins can manage test images" 
ON public.test_images FOR ALL 
TO authenticated 
USING (true) -- TODO: Replace with proper admin check when roles are implemented
WITH CHECK (true);

CREATE POLICY "Admins can manage WAT words" 
ON public.wat_words FOR ALL 
TO authenticated 
USING (true) -- TODO: Replace with proper admin check when roles are implemented
WITH CHECK (true);

CREATE POLICY "Admins can manage SRT situations" 
ON public.srt_situations FOR ALL 
TO authenticated 
USING (true) -- TODO: Replace with proper admin check when roles are implemented
WITH CHECK (true);