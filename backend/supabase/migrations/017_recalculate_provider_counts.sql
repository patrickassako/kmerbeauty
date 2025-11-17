-- Migration: Recalculate provider_count to ensure only active providers are counted
-- Description: Fixes any incorrect provider counts that may include inactive providers
-- Run this if you need to reset all provider_count values

DO $$
DECLARE
    v_start_time TIMESTAMP;
    v_service_count INTEGER;
BEGIN
    v_start_time := clock_timestamp();

    RAISE NOTICE '🔄 Recalculating provider counts (is_active = true only)...';

    -- Update all services in a single efficient query
    -- This counts ONLY providers where is_active = true
    WITH provider_counts AS (
        SELECT
            service_id,
            COUNT(*) as cnt
        FROM (
            SELECT service_id FROM therapist_services WHERE is_active = true
            UNION ALL
            SELECT service_id FROM salon_services WHERE is_active = true
        ) all_active_providers
        GROUP BY service_id
    )
    UPDATE services s
    SET provider_count = COALESCE(pc.cnt, 0)
    FROM provider_counts pc
    WHERE s.id = pc.service_id;

    GET DIAGNOSTICS v_service_count = ROW_COUNT;

    -- Set 0 for services with no active providers
    UPDATE services SET provider_count = 0 WHERE provider_count IS NULL;

    RAISE NOTICE '✅ Updated % services in % ms',
        v_service_count,
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time);

    -- Show some statistics
    RAISE NOTICE '📊 Statistics:';
    RAISE NOTICE '   - Services with 0 providers: %',
        (SELECT COUNT(*) FROM services WHERE provider_count = 0);
    RAISE NOTICE '   - Services with 1-5 providers: %',
        (SELECT COUNT(*) FROM services WHERE provider_count BETWEEN 1 AND 5);
    RAISE NOTICE '   - Services with 6+ providers: %',
        (SELECT COUNT(*) FROM services WHERE provider_count > 5);
END $$;

-- Verify the results
SELECT
    id,
    name_fr,
    provider_count,
    (SELECT COUNT(*) FROM therapist_services ts WHERE ts.service_id = services.id AND ts.is_active = true) as therapist_count,
    (SELECT COUNT(*) FROM salon_services ss WHERE ss.service_id = services.id AND ss.is_active = true) as salon_count
FROM services
ORDER BY provider_count DESC
LIMIT 20;
