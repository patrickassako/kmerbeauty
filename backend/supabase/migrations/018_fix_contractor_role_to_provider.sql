-- Migration: Fix contractor user role from CONTRACTOR to PROVIDER
-- Description: Updates all users with role 'CONTRACTOR' to 'PROVIDER' for consistency
-- Reason: The UserRole enum only has CLIENT, PROVIDER, and ADMIN
--         but contractor.service.ts was incorrectly setting role to 'CONTRACTOR'
--         This caused issues with chat and other provider-specific features

DO $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    RAISE NOTICE '🔄 Updating user roles from CONTRACTOR to PROVIDER...';

    -- Update all users with CONTRACTOR role to PROVIDER
    UPDATE users
    SET role = 'PROVIDER'
    WHERE role = 'CONTRACTOR';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RAISE NOTICE '✅ Updated % users from CONTRACTOR to PROVIDER', v_updated_count;

    -- Verify no CONTRACTOR roles remain
    IF EXISTS (SELECT 1 FROM users WHERE role = 'CONTRACTOR') THEN
        RAISE WARNING '⚠️  Some users still have CONTRACTOR role!';
    ELSE
        RAISE NOTICE '✅ All contractor users now have PROVIDER role';
    END IF;

    -- Show statistics
    RAISE NOTICE '📊 Role distribution:';
    RAISE NOTICE '   - CLIENT: %', (SELECT COUNT(*) FROM users WHERE role = 'CLIENT');
    RAISE NOTICE '   - PROVIDER: %', (SELECT COUNT(*) FROM users WHERE role = 'PROVIDER');
    RAISE NOTICE '   - ADMIN: %', (SELECT COUNT(*) FROM users WHERE role = 'ADMIN');
END $$;

-- Verification query
SELECT
    role,
    COUNT(*) as count,
    array_agg(email ORDER BY created_at DESC LIMIT 5) as sample_emails
FROM users
GROUP BY role
ORDER BY role;
