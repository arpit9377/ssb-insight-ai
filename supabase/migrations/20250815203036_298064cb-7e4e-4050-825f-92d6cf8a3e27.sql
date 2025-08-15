-- Update subscriptions table to replace Razorpay fields with Cashfree fields
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS razorpay_order_id,
DROP COLUMN IF EXISTS razorpay_payment_id,
DROP COLUMN IF EXISTS razorpay_signature;

-- Add Cashfree specific columns
ALTER TABLE public.subscriptions 
ADD COLUMN cashfree_order_id text,
ADD COLUMN cashfree_payment_id text,
ADD COLUMN cashfree_signature text,
ADD COLUMN cashfree_order_token text;