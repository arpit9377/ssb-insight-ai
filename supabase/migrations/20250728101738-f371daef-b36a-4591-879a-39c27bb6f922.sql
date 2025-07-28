-- Fix the security warnings by setting proper search_path for functions

-- Fix the user profile creation function
CREATE OR REPLACE FUNCTION create_user_profile_during_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, subscription_status)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, do nothing
    RETURN NEW;
END;
$$;

-- Fix the increment usage count function
CREATE OR REPLACE FUNCTION increment_usage_count(table_name text, row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF table_name = 'wat_words' THEN
    UPDATE public.wat_words SET usage_count = usage_count + 1 WHERE id = row_id;
  ELSIF table_name = 'srt_situations' THEN
    UPDATE public.srt_situations SET usage_count = usage_count + 1 WHERE id = row_id;
  END IF;
END;
$$;