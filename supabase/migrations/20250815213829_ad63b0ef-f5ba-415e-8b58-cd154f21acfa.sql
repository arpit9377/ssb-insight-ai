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

-- Create policies for payment_requests
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

-- Create policies for device_fingerprints
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

-- Create function to reset test limits for paid users
CREATE OR REPLACE FUNCTION public.activate_paid_subscription(target_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    subscription_type = 'paid',
    subscription_expires_at = NOW() + INTERVAL '30 days',
    tests_remaining_tat = 30,
    tests_remaining_ppdt = 30,
    tests_remaining_wat = 30,
    tests_remaining_srt = 30,
    last_test_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

-- Create function to check and decrement test limits
CREATE OR REPLACE FUNCTION public.decrement_test_limit(target_user_id TEXT, test_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining_count INTEGER;
  column_name TEXT;
BEGIN
  -- Determine column name based on test type
  CASE test_type
    WHEN 'tat' THEN column_name := 'tests_remaining_tat';
    WHEN 'ppdt' THEN column_name := 'tests_remaining_ppdt';
    WHEN 'wat' THEN column_name := 'tests_remaining_wat';
    WHEN 'srt' THEN column_name := 'tests_remaining_srt';
    ELSE RETURN FALSE;
  END CASE;

  -- Get current remaining count
  EXECUTE format('SELECT %I FROM public.profiles WHERE user_id = $1', column_name)
  INTO remaining_count
  USING target_user_id;

  -- Check if user has remaining tests
  IF remaining_count <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Decrement the count
  EXECUTE format('UPDATE public.profiles SET %I = %I - 1, updated_at = NOW() WHERE user_id = $1', column_name, column_name)
  USING target_user_id;

  RETURN TRUE;
END;
$$;

-- Create function to get remaining test counts
CREATE OR REPLACE FUNCTION public.get_test_limits(target_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tat', tests_remaining_tat,
    'ppdt', tests_remaining_ppdt,
    'wat', tests_remaining_wat,
    'srt', tests_remaining_srt,
    'subscription_type', subscription_type,
    'subscription_expires_at', subscription_expires_at
  ) INTO result
  FROM public.profiles
  WHERE user_id = target_user_id;

  RETURN result;
END;
$$;