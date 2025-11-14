-- Migration: Fix RLS policies for therapists to allow contractor sync
-- Description: Allows the sync trigger to insert/update therapists table

-- First, let's make the sync function run with owner privileges (bypass RLS)
DROP FUNCTION IF EXISTS sync_contractor_to_therapist() CASCADE;

CREATE OR REPLACE FUNCTION sync_contractor_to_therapist()
RETURNS TRIGGER
SECURITY DEFINER  -- This makes the function run with the privileges of the owner, bypassing RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    first_zone_location TEXT;
    zone_lat NUMERIC(10, 8);
    zone_lng NUMERIC(11, 8);
BEGIN
    -- Extract location from first service zone if available
    IF NEW.service_zones IS NOT NULL AND jsonb_array_length(NEW.service_zones::jsonb) > 0 THEN
        BEGIN
            -- Try to extract location from first zone (if it's an object with location)
            first_zone_location := NEW.service_zones::jsonb->0->'location'->>'address';
            zone_lat := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lat')::numeric, 0);
            zone_lng := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lng')::numeric, 0);
        EXCEPTION WHEN OTHERS THEN
            -- If extraction fails, use defaults
            zone_lat := 0;
            zone_lng := 0;
            first_zone_location := 'Unknown';
        END;
    ELSE
        zone_lat := 0;
        zone_lng := 0;
        first_zone_location := 'Unknown';
    END IF;

    -- Insert or update therapist record
    INSERT INTO therapists (
        user_id,
        bio_fr,
        bio_en,
        experience,
        is_licensed,
        license_number,
        is_mobile,
        travel_radius,
        travel_fee,
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
        COALESCE(NEW.professional_experience, ''), -- bio_fr
        COALESCE(NEW.professional_experience, ''), -- bio_en
        COALESCE(LENGTH(NEW.professional_experience) / 100, 1)::integer, -- Estimate experience
        COALESCE(NEW.qualifications_proof IS NOT NULL AND array_length(NEW.qualifications_proof, 1) > 0, false), -- is_licensed
        NEW.siret_number, -- Use SIRET as license number
        TRUE, -- is_mobile (all contractors are mobile)
        20, -- Default 20km travel radius
        0, -- Default travel fee
        COALESCE(NEW.portfolio_images, ARRAY[]::text[]), -- portfolio_images
        NEW.profile_picture, -- profile_image
        ST_SetSRID(ST_MakePoint(zone_lng, zone_lat), 4326), -- location from service zone
        zone_lat, -- latitude
        zone_lng, -- longitude
        COALESCE(first_zone_location, 'Unknown'), -- city from first service zone
        COALESCE(first_zone_location, 'Unknown'), -- region from first service zone
        COALESCE(NEW.is_active, false), -- is_active
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        bio_fr = EXCLUDED.bio_fr,
        bio_en = EXCLUDED.bio_en,
        experience = EXCLUDED.experience,
        is_licensed = EXCLUDED.is_licensed,
        license_number = EXCLUDED.license_number,
        portfolio_images = EXCLUDED.portfolio_images,
        profile_image = EXCLUDED.profile_image,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        city = EXCLUDED.city,
        region = EXCLUDED.region,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_contractor_to_therapist_trigger ON contractor_profiles;
CREATE TRIGGER sync_contractor_to_therapist_trigger
    AFTER INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_contractor_to_therapist();

COMMENT ON FUNCTION sync_contractor_to_therapist IS 'Automatically syncs contractor profile data to therapists table (SECURITY DEFINER - bypasses RLS)';
