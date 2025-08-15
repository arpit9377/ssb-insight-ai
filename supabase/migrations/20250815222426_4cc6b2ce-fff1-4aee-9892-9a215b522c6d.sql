-- Delete all duplicate profiles for this user, keeping only the most recent paid one
DELETE FROM public.profiles 
WHERE user_id = 'user_2y6GOaxjbXiNVEfXExQbYqEkHPh'
AND id NOT IN (
  SELECT id FROM public.profiles 
  WHERE user_id = 'user_2y6GOaxjbXiNVEfXExQbYqEkHPh'
  AND subscription_type = 'paid'
  ORDER BY updated_at DESC 
  LIMIT 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_user_id 
UNIQUE (user_id);