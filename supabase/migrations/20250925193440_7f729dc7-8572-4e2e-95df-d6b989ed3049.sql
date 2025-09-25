-- Drop the existing index and create a proper unique constraint
DROP INDEX IF EXISTS idx_user_streaks_user_id;

-- Add unique constraint on user_id (this will automatically create a unique index)
ALTER TABLE public.user_streaks 
DROP CONSTRAINT IF EXISTS unique_user_id;

ALTER TABLE public.user_streaks 
ADD CONSTRAINT user_streaks_user_id_unique UNIQUE (user_id);