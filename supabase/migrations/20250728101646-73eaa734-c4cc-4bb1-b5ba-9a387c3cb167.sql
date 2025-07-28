-- Fix database connectivity issues by ensuring proper RLS policies for test content

-- Ensure wat_words table has proper public access
DROP POLICY IF EXISTS "Public can view WAT words" ON public.wat_words;
CREATE POLICY "Public can view WAT words" 
ON public.wat_words FOR SELECT 
USING (true);

-- Ensure test_images table has proper public access  
DROP POLICY IF EXISTS "Public can view test images" ON public.test_images;
CREATE POLICY "Public can view test images" 
ON public.test_images FOR SELECT 
USING (true);

-- Ensure srt_situations table has proper public access
DROP POLICY IF EXISTS "Public can view SRT situations" ON public.srt_situations;
CREATE POLICY "Public can view SRT situations" 
ON public.srt_situations FOR SELECT 
USING (true);

-- Add admin policies for content management
CREATE POLICY "Authenticated users can manage WAT words" 
ON public.wat_words FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage test images" 
ON public.test_images FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage SRT situations" 
ON public.srt_situations FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Create missing RPC function for usage count increment
CREATE OR REPLACE FUNCTION increment_usage_count(table_name text, row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF table_name = 'wat_words' THEN
    UPDATE wat_words SET usage_count = usage_count + 1 WHERE id = row_id;
  ELSIF table_name = 'srt_situations' THEN
    UPDATE srt_situations SET usage_count = usage_count + 1 WHERE id = row_id;
  END IF;
END;
$$;