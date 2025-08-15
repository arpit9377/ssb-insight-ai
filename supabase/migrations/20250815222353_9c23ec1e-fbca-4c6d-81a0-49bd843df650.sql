-- Fix duplicate profiles by deleting unpaid records when paid exists
DELETE FROM public.profiles 
WHERE user_id IN (
  SELECT user_id 
  FROM public.profiles 
  WHERE subscription_type = 'paid'
) 
AND subscription_type = 'unpaid';

-- Update the get_test_limits function to handle multiple records better
CREATE OR REPLACE FUNCTION public.get_test_limits(target_user_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE user_id = target_user_id
  ORDER BY 
    CASE WHEN subscription_type = 'paid' THEN 1 ELSE 2 END,
    updated_at DESC
  LIMIT 1;

  RETURN result;
END;
$function$