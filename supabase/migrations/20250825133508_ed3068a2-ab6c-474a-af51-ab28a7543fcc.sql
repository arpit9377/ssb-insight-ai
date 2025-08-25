-- Drop existing dangerous policies that allow unrestricted access
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for external auth" ON public.payment_requests;
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.payment_requests;
DROP POLICY IF EXISTS "Enable update for external auth" ON public.payment_requests;
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.user_responses;
DROP POLICY IF EXISTS "Enable select for external auth" ON public.user_responses;
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.ai_analyses;
DROP POLICY IF EXISTS "Enable select for external auth" ON public.ai_analyses;
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.test_sessions;
DROP POLICY IF EXISTS "Enable select for external auth" ON public.test_sessions;
DROP POLICY IF EXISTS "Enable update for external auth" ON public.test_sessions;
DROP POLICY IF EXISTS "Enable insert for external auth" ON public.user_analysis_usage;
DROP POLICY IF EXISTS "Enable select for external auth" ON public.user_analysis_usage;
DROP POLICY IF EXISTS "Enable update for external auth" ON public.user_analysis_usage;

-- PROFILES: Users can only access their own profile data
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles  
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- PAYMENT_REQUESTS: Users see only their requests, service role manages all
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own payment requests" ON public.payment_requests
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own payment requests" ON public.payment_requests
FOR UPDATE USING (auth.uid()::text = user_id);

-- USER_RESPONSES: Users access only their own test responses
CREATE POLICY "Users can view own responses" ON public.user_responses
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own responses" ON public.user_responses
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- AI_ANALYSES: Users access only their own psychological analyses  
CREATE POLICY "Users can view own analyses" ON public.ai_analyses
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own analyses" ON public.ai_analyses
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- TEST_SESSIONS: Users access only their own test sessions
CREATE POLICY "Users can view own test sessions" ON public.test_sessions
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own test sessions" ON public.test_sessions
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own test sessions" ON public.test_sessions
FOR UPDATE USING (auth.uid()::text = user_id);

-- USER_ANALYSIS_USAGE: Users access only their own usage data
CREATE POLICY "Users can view own usage data" ON public.user_analysis_usage
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own usage data" ON public.user_analysis_usage
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own usage data" ON public.user_analysis_usage
FOR UPDATE USING (auth.uid()::text = user_id);