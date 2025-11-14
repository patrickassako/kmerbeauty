-- Migration: Add missing columns to contractor_profiles
-- Description: Adds profile_picture and ensures compatibility with therapists table

-- Add profile_picture column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_profiles'
        AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE contractor_profiles ADD COLUMN profile_picture TEXT;
        COMMENT ON COLUMN contractor_profiles.profile_picture IS 'URL to contractor profile picture';
    END IF;
END $$;

-- Function to sync contractor profile data to therapists table
-- This ensures that when a contractor profile is created/updated,
-- the therapists table is also updated with the relevant information
CREATE OR REPLACE FUNCTION sync_contractor_to_therapist()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update therapist record when contractor profile is created/updated
    INSERT INTO therapists (
        user_id,
        bio_fr,
        bio_en,
        experience,
        is_mobile,
        travel_radius,
        portfolio_images,
        profile_image,
        location,
        latitude,
        longitude,
        city,
        region,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.professional_experience, -- Use professional_experience as bio_fr
        NEW.professional_experience, -- Use same for bio_en (can be different later)
        COALESCE(LENGTH(NEW.professional_experience) / 100, 1), -- Estimate experience from bio length
        TRUE, -- Assuming all contractors are mobile
        10, -- Default 10km radius
        NEW.portfolio_images,
        NEW.profile_picture,
        ST_SetSRID(ST_MakePoint(0, 0), 4326), -- Default location (will be updated later)
        0, -- Default latitude
        0, -- Default longitude
        'Unknown', -- Default city (will be updated later)
        'Unknown', -- Default region (will be updated later)
        NEW.is_active,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        bio_fr = EXCLUDED.bio_fr,
        bio_en = EXCLUDED.bio_en,
        portfolio_images = EXCLUDED.portfolio_images,
        profile_image = EXCLUDED.profile_image,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync contractor to therapist
DROP TRIGGER IF EXISTS sync_contractor_to_therapist_trigger ON contractor_profiles;
CREATE TRIGGER sync_contractor_to_therapist_trigger
    AFTER INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_contractor_to_therapist();

COMMENT ON FUNCTION sync_contractor_to_therapist IS 'Automatically syncs contractor profile data to therapists table';
