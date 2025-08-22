-- Fix RLS policies for WAT words and SRT situations to work with external auth

-- Drop existing policies for wat_words
DROP POLICY IF EXISTS "Admins can manage WAT words" ON public.wat_words;
DROP POLICY IF EXISTS "Public can view WAT words" ON public.wat_words;
DROP POLICY IF EXISTS "Authenticated users can manage WAT words" ON public.wat_words;

-- Create new permissive policies for wat_words
CREATE POLICY "Allow all operations on WAT words" 
ON public.wat_words 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Drop existing policies for srt_situations  
DROP POLICY IF EXISTS "Admins can manage SRT situations" ON public.srt_situations;
DROP POLICY IF EXISTS "Public can view SRT situations" ON public.srt_situations;
DROP POLICY IF EXISTS "Authenticated users can manage SRT situations" ON public.srt_situations;

-- Create new permissive policies for srt_situations
CREATE POLICY "Allow all operations on SRT situations" 
ON public.srt_situations 
FOR ALL 
USING (true) 
WITH CHECK (true);