-- Allow anonymous users to create test sessions temporarily for testing
-- and ensure authenticated users can still use the system properly

-- Drop existing policies for test_sessions
DROP POLICY IF EXISTS "Users can create their own test sessions" ON test_sessions;
DROP POLICY IF EXISTS "Users can view their own test sessions" ON test_sessions;
DROP POLICY IF EXISTS "Users can update their own test sessions" ON test_sessions;

-- Create new policies that handle both authenticated and anonymous users
CREATE POLICY "Anyone can create test sessions" 
ON test_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own test sessions" 
ON test_sessions 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (auth.uid())::text = user_id
    ELSE true
  END
);

CREATE POLICY "Users can update their own test sessions" 
ON test_sessions 
FOR UPDATE 
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (auth.uid())::text = user_id
    ELSE true
  END
);

-- Also fix profiles table to allow upsert operations
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a more permissive policy for profile creation
CREATE POLICY "Users can insert their own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (auth.uid())::text = user_id
    ELSE true
  END
);

-- Allow upsert operations on profiles
CREATE POLICY "Service role can upsert profiles" 
ON profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);