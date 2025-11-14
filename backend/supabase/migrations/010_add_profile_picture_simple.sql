-- Migration: Add profile_picture column to contractor_profiles
-- Description: Adds missing profile_picture column

-- Add profile_picture column
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;

COMMENT ON COLUMN contractor_profiles.profile_picture IS 'URL to contractor profile picture';
