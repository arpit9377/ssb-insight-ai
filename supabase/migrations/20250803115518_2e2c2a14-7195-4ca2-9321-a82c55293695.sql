-- Update RLS policies to work with external authentication (Clerk)
-- Since we're using Clerk for auth, we need to allow authenticated operations

-- First, let's update the test_sessions table policies
DROP POLICY IF EXISTS "Anyone can create test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can view their own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can update their own test sessions" ON public.test_sessions;

-- Allow operations when using external auth (Clerk)
CREATE POLICY "Enable insert for external auth" ON public.test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for external auth" ON public.test_sessions FOR SELECT USING (true);
CREATE POLICY "Enable update for external auth" ON public.test_sessions FOR UPDATE USING (true);

-- Update user_responses table policies
DROP POLICY IF EXISTS "Users can view their own responses" ON public.user_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.user_responses;

CREATE POLICY "Enable insert for external auth" ON public.user_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for external auth" ON public.user_responses FOR SELECT USING (true);

-- Update user_analysis_usage table policies
DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_analysis_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.user_analysis_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_analysis_usage;

CREATE POLICY "Enable insert for external auth" ON public.user_analysis_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for external auth" ON public.user_analysis_usage FOR SELECT USING (true);
CREATE POLICY "Enable update for external auth" ON public.user_analysis_usage FOR UPDATE USING (true);

-- Update ai_analyses table policies
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.ai_analyses;

CREATE POLICY "Enable insert for external auth" ON public.ai_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for external auth" ON public.ai_analyses FOR SELECT USING (true);

-- Update subscriptions table policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;

CREATE POLICY "Enable insert for external auth" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for external auth" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Enable update for external auth" ON public.subscriptions FOR UPDATE USING (true);