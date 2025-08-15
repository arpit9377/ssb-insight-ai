-- Update profiles table for new user types and test tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tests_remaining_tat INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS tests_remaining_ppdt INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS tests_remaining_wat INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS tests_remaining_srt INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS last_test_reset_date DATE DEFAULT CURRENT_DATE;

-- Create payment_requests table for manual verification workflow
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  amount_paid INTEGER NOT NULL,
  payment_screenshot_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT
);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Service role can manage all payment requests" ON public.payment_requests;

CREATE POLICY "Users can create their own payment requests" 
ON public.payment_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own payment requests" 
ON public.payment_requests 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all payment requests" 
ON public.payment_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create device_fingerprints table for anti-abuse tracking
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on device_fingerprints
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can manage their own fingerprints" ON public.device_fingerprints;
DROP POLICY IF EXISTS "Service role can manage all fingerprints" ON public.device_fingerprints;

CREATE POLICY "Users can manage their own fingerprints" 
ON public.device_fingerprints 
FOR ALL 
USING (auth.uid()::text = user_id) 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all fingerprints" 
ON public.device_fingerprints 
FOR ALL 
USING (true) 
WITH CHECK (true);