-- Add new columns to profiles table for enhanced profile features
-- Migration: Add avatar_url, target_exam, preparation_level, target_exam_date, preferred_test_types

-- Add avatar_url column for profile picture storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add SSB-specific fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_exam TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preparation_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_exam_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_test_types TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile picture stored in Supabase Storage';
COMMENT ON COLUMN profiles.target_exam IS 'Target SSB exam: NDA, CDS, AFCAT, TES, TGC, Other';
COMMENT ON COLUMN profiles.preparation_level IS 'Preparation level: Beginner, Intermediate, Advanced, Repeater';
COMMENT ON COLUMN profiles.target_exam_date IS 'Target date for SSB exam';
COMMENT ON COLUMN profiles.preferred_test_types IS 'Preferred test types: PPDT, TAT, WAT, SRT';
