-- Migration: Optimize sync with materialized view and efficient queries
-- Description: High-performance sync solution for hundreds of concurrent users

-- =====================================================
-- 1. Add provider_count column to services table (denormalization)
-- =====================================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS provider_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_services_provider_count ON services(provider_count);

-- =====================================================
-- 2. Function to update provider count efficiently
-- =====================================================

CREATE OR REPLACE FUNCTION update_service_provider_count(p_service_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count in a single query using UNION ALL
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT therapist_id FROM therapist_services
        WHERE service_id = p_service_id AND is_active = true
        UNION ALL
        SELECT salon_id FROM salon_services
        WHERE service_id = p_service_id AND is_active = true
    ) providers;

    -- Update the denormalized count
    UPDATE services
    SET provider_count = v_count
    WHERE id = p_service_id;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Triggers to maintain provider_count automatically
-- =====================================================

-- Trigger for therapist_services
CREATE OR REPLACE FUNCTION trigger_update_service_provider_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update for the affected service
    IF TG_OP = 'DELETE' THEN
        PERFORM update_service_provider_count(OLD.service_id);
        RETURN OLD;
    ELSE
        PERFORM update_service_provider_count(NEW.service_id);
        -- If service_id changed, update old one too
        IF TG_OP = 'UPDATE' AND OLD.service_id != NEW.service_id THEN
            PERFORM update_service_provider_count(OLD.service_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_provider_count_on_therapist_service ON therapist_services;
CREATE TRIGGER update_provider_count_on_therapist_service
    AFTER INSERT OR UPDATE OR DELETE ON therapist_services
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_service_provider_count();

-- Trigger for salon_services
DROP TRIGGER IF EXISTS update_provider_count_on_salon_service ON salon_services;
CREATE TRIGGER update_provider_count_on_salon_service
    AFTER INSERT OR UPDATE OR DELETE ON salon_services
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_service_provider_count();

-- =====================================================
-- 4. Optimized sync trigger (async-friendly)
-- =====================================================

DROP FUNCTION IF EXISTS sync_contractor_to_therapist() CASCADE;

CREATE OR REPLACE FUNCTION sync_contractor_to_therapist()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    zone_lat NUMERIC(10, 8) := 0;
    zone_lng NUMERIC(11, 8) := 0;
    zone_location TEXT := 'Unknown';
BEGIN
    -- Extract location if available (with error handling)
    IF NEW.service_zones IS NOT NULL AND jsonb_array_length(NEW.service_zones::jsonb) > 0 THEN
        BEGIN
            zone_location := COALESCE(NEW.service_zones::jsonb->0->'location'->>'address', 'Unknown');
            zone_lat := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lat')::numeric, 0);
            zone_lng := COALESCE((NEW.service_zones::jsonb->0->'location'->>'lng')::numeric, 0);
        EXCEPTION WHEN OTHERS THEN
            -- Use defaults on error
            NULL;
        END;
    END IF;

    -- Upsert therapist (single query, no loops)
    INSERT INTO therapists (
        user_id, bio_fr, bio_en, experience, is_licensed, license_number,
        is_mobile, travel_radius, travel_fee, portfolio_images,
        location, latitude, longitude, city, region, is_active,
        created_at, updated_at
    )
    VALUES (
        NEW.user_id,
        COALESCE(NEW.professional_experience, ''),
        COALESCE(NEW.professional_experience, ''),
        GREATEST(COALESCE(LENGTH(NEW.professional_experience) / 100, 1)::integer, 1),
        COALESCE(NEW.qualifications_proof IS NOT NULL AND array_length(NEW.qualifications_proof, 1) > 0, false),
        NEW.siret_number,
        TRUE, 20, 0,
        COALESCE(NEW.portfolio_images, ARRAY[]::text[]),
        ST_SetSRID(ST_MakePoint(zone_lng, zone_lat), 4326),
        zone_lat, zone_lng, zone_location, zone_location,
        COALESCE(NEW.is_active, false),
        NOW(), NOW()
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
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the contractor insert
    RAISE WARNING 'Sync error for contractor %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_contractor_to_therapist_trigger ON contractor_profiles;
CREATE TRIGGER sync_contractor_to_therapist_trigger
    AFTER INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_contractor_to_therapist();

-- =====================================================
-- 5. Batch resync function (efficient for many contractors)
-- =====================================================

CREATE OR REPLACE FUNCTION batch_resync_contractors()
RETURNS TABLE (
    total_contractors INTEGER,
    synced_count INTEGER,
    duration_ms NUMERIC
) AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_total INTEGER;
    v_synced INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    -- Count total
    SELECT COUNT(*) INTO v_total FROM contractor_profiles;

    -- Batch insert/update using a single query
    INSERT INTO therapists (
        user_id, bio_fr, bio_en, experience, is_licensed, license_number,
        is_mobile, travel_radius, travel_fee, portfolio_images,
        location, latitude, longitude, city, region, is_active,
        created_at, updated_at
    )
    SELECT
        cp.user_id,
        COALESCE(cp.professional_experience, ''),
        COALESCE(cp.professional_experience, ''),
        GREATEST(COALESCE(LENGTH(cp.professional_experience) / 100, 1)::integer, 1),
        COALESCE(cp.qualifications_proof IS NOT NULL AND array_length(cp.qualifications_proof, 1) > 0, false),
        cp.siret_number,
        TRUE, 20, 0,
        COALESCE(cp.portfolio_images, ARRAY[]::text[]),
        ST_SetSRID(ST_MakePoint(0, 0), 4326),
        0, 0, 'Unknown', 'Unknown',
        COALESCE(cp.is_active, false),
        COALESCE(cp.created_at, NOW()),
        NOW()
    FROM contractor_profiles cp
    WHERE NOT EXISTS (
        SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
    )
    ON CONFLICT (user_id) DO UPDATE SET
        bio_fr = EXCLUDED.bio_fr,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    GET DIAGNOSTICS v_synced = ROW_COUNT;

    RETURN QUERY SELECT
        v_total,
        v_synced,
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Initialize provider counts for all existing services
-- =====================================================

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_service_count INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE 'Initializing provider counts...';

    -- Update all services in a single efficient query
    WITH provider_counts AS (
        SELECT
            service_id,
            COUNT(*) as cnt
        FROM (
            SELECT service_id FROM therapist_services WHERE is_active = true
            UNION ALL
            SELECT service_id FROM salon_services WHERE is_active = true
        ) all_providers
        GROUP BY service_id
    )
    UPDATE services s
    SET provider_count = COALESCE(pc.cnt, 0)
    FROM provider_counts pc
    WHERE s.id = pc.service_id;

    -- Set 0 for services with no providers
    UPDATE services SET provider_count = 0 WHERE provider_count IS NULL;

    GET DIAGNOSTICS v_service_count = ROW_COUNT;

    RAISE NOTICE 'Updated % services in % ms',
        v_service_count,
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time);
END $$;

-- =====================================================
-- 7. Run batch resync
-- =====================================================

DO $$
DECLARE
    v_result RECORD;
BEGIN
    RAISE NOTICE 'Running batch contractor resync...';

    SELECT * INTO v_result FROM batch_resync_contractors();

    RAISE NOTICE 'Synced % of % contractors in % ms',
        v_result.synced_count,
        v_result.total_contractors,
        v_result.duration_ms;
END $$;

-- =====================================================
-- 8. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_therapist_services_service_active
    ON therapist_services(service_id, is_active);

CREATE INDEX IF NOT EXISTS idx_salon_services_service_active
    ON salon_services(service_id, is_active);

CREATE INDEX IF NOT EXISTS idx_therapists_user_active
    ON therapists(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_active
    ON contractor_profiles(user_id, is_active);

COMMENT ON COLUMN services.provider_count IS 'Denormalized count of active providers (auto-updated by triggers)';
