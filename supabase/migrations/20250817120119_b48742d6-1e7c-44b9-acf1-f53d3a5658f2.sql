-- Fix RLS policies for payment_requests to work with external auth like other tables
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Service role can manage all payment requests" ON public.payment_requests;

-- Create new policies that match the pattern used in other tables
CREATE POLICY "Enable insert for external auth" 
ON public.payment_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable select for external auth" 
ON public.payment_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Enable update for external auth" 
ON public.payment_requests 
FOR UPDATE 
USING (true);

-- Keep service role access for admin operations  
CREATE POLICY "Service role can manage all payment requests" 
ON public.payment_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);