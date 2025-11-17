-- Migration: Add comprehensive diagnostics and fixes for contractor-therapist sync issues
-- Description: Adds logging, diagnostics, and automatic fixes for sync problems

-- =====================================================
-- 1. Enhanced sync trigger with logging
-- =====================================================

DROP FUNCTION IF EXISTS sync_contractor_to_therapist() CASCADE;

CREATE OR REPLACE FUNCTION sync_contractor_to_therapist()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    first_zone_location TEXT;
    zone_lat NUMERIC(10, 8);
    zone_lng NUMERIC(11, 8);
    v_therapist_id UUID;
BEGIN
    -- Log the sync attempt
    RAISE NOTICE 'Syncing contractor % (user_id: %)', NEW.id, NEW.user_id;

    -- Extract location from first service zone if available
    IF NEW.service_zones IS NOT NULL AND jsonb_array_length(NEW.service_zones::jsonb) > 0 THEN
        BEGIN
            first_zone_location := NEW.service_zones::jsonb->0->'location'->>'address';
            zone_lat := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lat')::numeric, 0);
            zone_lng := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lng')::numeric, 0);
        EXCEPTION WHEN OTHERS THEN
            zone_lat := 0;
            zone_lng := 0;
            first_zone_location := 'Unknown';
            RAISE NOTICE 'Failed to extract location, using defaults';
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
        COALESCE(NEW.professional_experience, ''),
        COALESCE(NEW.professional_experience, ''),
        COALESCE(LENGTH(NEW.professional_experience) / 100, 1)::integer,
        COALESCE(NEW.qualifications_proof IS NOT NULL AND array_length(NEW.qualifications_proof, 1) > 0, false),
        NEW.siret_number,
        TRUE,
        20,
        0,
        COALESCE(NEW.portfolio_images, ARRAY[]::text[]),
        ST_SetSRID(ST_MakePoint(zone_lng, zone_lat), 4326),
        zone_lat,
        zone_lng,
        COALESCE(first_zone_location, 'Unknown'),
        COALESCE(first_zone_location, 'Unknown'),
        COALESCE(NEW.is_active, false),
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
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        city = EXCLUDED.city,
        region = EXCLUDED.region,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_therapist_id;

    RAISE NOTICE 'Successfully synced contractor % to therapist %', NEW.id, v_therapist_id;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the contractor insert
    RAISE WARNING 'Error syncing contractor % to therapist: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_contractor_to_therapist_trigger ON contractor_profiles;
CREATE TRIGGER sync_contractor_to_therapist_trigger
    AFTER INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_contractor_to_therapist();

COMMENT ON FUNCTION sync_contractor_to_therapist IS 'Automatically syncs contractor profile data to therapists table with logging';

-- =====================================================
-- 2. Diagnostic function to check sync status
-- =====================================================

CREATE OR REPLACE FUNCTION diagnose_contractor_sync()
RETURNS TABLE (
    issue_type TEXT,
    contractor_id UUID,
    user_id UUID,
    details TEXT
) AS $$
BEGIN
    -- Find contractors without therapist records
    RETURN QUERY
    SELECT
        'MISSING_THERAPIST'::TEXT,
        cp.id,
        cp.user_id,
        'Contractor has no corresponding therapist record'::TEXT
    FROM contractor_profiles cp
    WHERE NOT EXISTS (
        SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
    );

    -- Find contractors with therapist but no services
    RETURN QUERY
    SELECT
        'NO_SERVICES'::TEXT,
        cp.id,
        cp.user_id,
        'Contractor has therapist but no services in therapist_services'::TEXT
    FROM contractor_profiles cp
    INNER JOIN therapists t ON t.user_id = cp.user_id
    WHERE NOT EXISTS (
        SELECT 1 FROM therapist_services ts WHERE ts.therapist_id = t.id
    );

    -- Find therapists with inactive services only
    RETURN QUERY
    SELECT
        'INACTIVE_SERVICES'::TEXT,
        cp.id,
        cp.user_id,
        'All therapist services are inactive'::TEXT
    FROM contractor_profiles cp
    INNER JOIN therapists t ON t.user_id = cp.user_id
    WHERE EXISTS (
        SELECT 1 FROM therapist_services ts WHERE ts.therapist_id = t.id
    )
    AND NOT EXISTS (
        SELECT 1 FROM therapist_services ts
        WHERE ts.therapist_id = t.id AND ts.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Manual resync function
-- =====================================================

CREATE OR REPLACE FUNCTION resync_all_contractors()
RETURNS TABLE (
    contractor_id UUID,
    user_id UUID,
    action TEXT,
    success BOOLEAN
) AS $$
DECLARE
    rec RECORD;
    v_success BOOLEAN;
BEGIN
    FOR rec IN SELECT * FROM contractor_profiles
    LOOP
        BEGIN
            -- Trigger the sync by updating updated_at
            UPDATE contractor_profiles
            SET updated_at = NOW()
            WHERE id = rec.id;

            v_success := true;

            RETURN QUERY SELECT rec.id, rec.user_id, 'RESYNCED'::TEXT, v_success;
        EXCEPTION WHEN OTHERS THEN
            v_success := false;
            RETURN QUERY SELECT rec.id, rec.user_id, 'FAILED: ' || SQLERRM, v_success;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Run diagnostics and report
-- =====================================================

DO $$
DECLARE
    issue_count INT;
    rec RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONTRACTOR-THERAPIST SYNC DIAGNOSTICS';
    RAISE NOTICE '========================================';

    -- Count total contractors and therapists
    SELECT COUNT(*) INTO issue_count FROM contractor_profiles;
    RAISE NOTICE 'Total contractor_profiles: %', issue_count;

    SELECT COUNT(*) INTO issue_count FROM therapists;
    RAISE NOTICE 'Total therapists: %', issue_count;

    SELECT COUNT(*) INTO issue_count FROM therapist_services WHERE is_active = true;
    RAISE NOTICE 'Total active therapist_services: %', issue_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'ISSUES FOUND:';
    RAISE NOTICE '========================================';

    -- Run diagnostics
    FOR rec IN SELECT * FROM diagnose_contractor_sync()
    LOOP
        RAISE NOTICE '% - Contractor: % (User: %): %',
            rec.issue_type, rec.contractor_id, rec.user_id, rec.details;
    END LOOP;

    -- Count issues
    SELECT COUNT(*) INTO issue_count FROM diagnose_contractor_sync();

    IF issue_count = 0 THEN
        RAISE NOTICE 'No sync issues found!';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total issues found: %', issue_count;
        RAISE NOTICE 'Running automatic resync...';
        RAISE NOTICE '========================================';

        -- Resync all contractors
        PERFORM resync_all_contractors();

        RAISE NOTICE 'Resync completed. Re-running diagnostics...';

        -- Check again
        SELECT COUNT(*) INTO issue_count FROM diagnose_contractor_sync();
        RAISE NOTICE 'Remaining issues: %', issue_count;
    END IF;
END $$;
