-- Update user profiles for new test limit structure
-- Set free plan users to have 2 tests each
UPDATE public.profiles 
SET 
  tests_remaining_tat = 2,
  tests_remaining_ppdt = 2,
  tests_remaining_wat = 2,
  tests_remaining_srt = 2,
  subscription_type = 'unpaid'
WHERE subscription_type IS NULL OR subscription_type = 'free';

-- Update database function to handle new limits
CREATE OR REPLACE FUNCTION public.activate_paid_subscription(target_user_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    subscription_type = 'paid',
    subscription_expires_at = NOW() + INTERVAL '365 days',
    tests_remaining_tat = 30,
    tests_remaining_ppdt = 30,
    tests_remaining_wat = 30,
    tests_remaining_srt = 30,
    last_test_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$function$;