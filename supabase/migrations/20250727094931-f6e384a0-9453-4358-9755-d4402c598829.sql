-- Fix the authentication issue by temporarily allowing profile creation during signup
-- We need to allow users to create their initial profile

-- Create a function that can be called during user creation
CREATE OR REPLACE FUNCTION create_user_profile_during_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile_during_signup();

-- Also allow service role to bypass RLS for profile operations
CREATE POLICY "Service role can manage profiles" 
ON public.profiles FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);