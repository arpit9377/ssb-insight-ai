-- Add functions with proper security settings to fix linter warnings
CREATE OR REPLACE FUNCTION public.activate_paid_subscription(target_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
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