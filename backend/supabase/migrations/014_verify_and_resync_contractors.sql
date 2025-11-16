-- Migration: Verify and resync all contractors to therapists
-- Description: Ensures all contractor_profiles have corresponding therapist records

-- Function to check and log sync status
DO $$
DECLARE
    contractor_count INT;
    therapist_count INT;
    missing_count INT;
    rec RECORD;
BEGIN
    -- Count contractors
    SELECT COUNT(*) INTO contractor_count FROM contractor_profiles;
    RAISE NOTICE 'Total contractor_profiles: %', contractor_count;

    -- Count therapists
    SELECT COUNT(*) INTO therapist_count FROM therapists;
    RAISE NOTICE 'Total therapists: %', therapist_count;

    -- Count contractors without therapist records
    SELECT COUNT(*) INTO missing_count
    FROM contractor_profiles cp
    WHERE NOT EXISTS (
        SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
    );
    RAISE NOTICE 'Contractors without therapist records: %', missing_count;

    -- List missing contractors
    IF missing_count > 0 THEN
        RAISE NOTICE 'Missing contractor user_ids:';
        FOR rec IN
            SELECT cp.id, cp.user_id
            FROM contractor_profiles cp
            WHERE NOT EXISTS (
                SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
            )
        LOOP
            RAISE NOTICE '  - Contractor ID: %, User ID: %', rec.id, rec.user_id;
        END LOOP;
    END IF;
END $$;

-- Resync all contractors that are missing from therapists table
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
SELECT
    cp.user_id,
    COALESCE(cp.professional_experience, ''),
    COALESCE(cp.professional_experience, ''),
    COALESCE(LENGTH(cp.professional_experience) / 100, 1)::integer,
    COALESCE(cp.qualifications_proof IS NOT NULL AND array_length(cp.qualifications_proof, 1) > 0, false),
    cp.siret_number,
    TRUE,
    20,
    0,
    COALESCE(cp.portfolio_images, ARRAY[]::text[]),
    ST_SetSRID(ST_MakePoint(0, 0), 4326),
    0,
    0,
    'Unknown',
    'Unknown',
    COALESCE(cp.is_active, false),
    COALESCE(cp.created_at, NOW()),
    NOW()
FROM contractor_profiles cp
WHERE NOT EXISTS (
    SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
    bio_fr = EXCLUDED.bio_fr,
    bio_en = EXCLUDED.bio_en,
    experience = EXCLUDED.experience,
    is_licensed = EXCLUDED.is_licensed,
    license_number = EXCLUDED.license_number,
    portfolio_images = EXCLUDED.portfolio_images,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify sync after insertion
DO $$
DECLARE
    post_sync_missing INT;
BEGIN
    SELECT COUNT(*) INTO post_sync_missing
    FROM contractor_profiles cp
    WHERE NOT EXISTS (
        SELECT 1 FROM therapists t WHERE t.user_id = cp.user_id
    );

    RAISE NOTICE 'After sync - contractors without therapist records: %', post_sync_missing;

    IF post_sync_missing > 0 THEN
        RAISE WARNING 'Some contractors still not synced. Manual intervention may be required.';
    ELSE
        RAISE NOTICE 'All contractors successfully synced to therapists table!';
    END IF;
END $$;
