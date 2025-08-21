-- Fix RLS policies for test_images table to allow proper image uploads

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage test images" ON test_images;
DROP POLICY IF EXISTS "Public can view test images" ON test_images;
DROP POLICY IF EXISTS "Authenticated users can manage test images" ON test_images;

-- Create new, more specific policies
CREATE POLICY "Anyone can view test images" 
ON test_images 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert test images" 
ON test_images 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update test images" 
ON test_images 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete test images" 
ON test_images 
FOR DELETE 
TO authenticated
USING (true);

CREATE POLICY "Service role can manage all test images" 
ON test_images 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);