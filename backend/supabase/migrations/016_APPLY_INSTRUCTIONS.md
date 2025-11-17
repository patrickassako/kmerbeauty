# Migration 016: Optimize for Scale - Application Instructions

## ⚠️ IMPORTANT: This migration must be applied manually

This migration contains critical performance optimizations to support hundreds of concurrent users.

## What this migration does:

1. **Adds denormalized `provider_count` column** to `services` table
   - Eliminates N+1 query problem
   - Auto-maintained by database triggers
   - Indexed for fast queries

2. **Creates trigger functions** to automatically update `provider_count`
   - Triggers on INSERT/UPDATE/DELETE in `therapist_services`
   - Triggers on INSERT/UPDATE/DELETE in `salon_services`

3. **Optimizes sync trigger** for contractor → therapist sync
   - Removes loops
   - Single-query upserts
   - Error handling without blocking

4. **Adds batch resync function** for efficient bulk operations
   - Single query instead of loops
   - No setTimeout() delays
   - Scales to hundreds of contractors

5. **Initializes provider counts** for existing services
   - Runs once during migration
   - Updates all services with correct counts

## How to Apply:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `backend/supabase/migrations/016_optimize_for_scale.sql`
4. Copy its entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

### Option 2: Using Supabase CLI

```bash
cd backend
npx supabase db push
```

## Verify the Migration:

After applying, verify it worked:

```sql
-- Check that provider_count column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services'
AND column_name = 'provider_count';

-- Check that triggers are created
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%provider_count%';

-- Check that provider counts are populated
SELECT id, name_fr, provider_count
FROM services
ORDER BY provider_count DESC
LIMIT 10;
```

## Backend Changes Required:

The backend has already been updated in this commit:
- ✅ `services.service.ts` now uses denormalized `provider_count`
- ✅ `contractor.service.ts` removed setTimeout() blocking calls
- ✅ N+1 query pattern eliminated

## Performance Impact:

**Before:**
- findAll() for 100 services: 200+ queries (2 COUNT queries per service)
- Each query takes ~50ms = 10+ seconds total
- hasServices() blocks for 1 second per call

**After:**
- findAll() for 100 services: 1 query
- Single query takes ~50ms total
- hasServices() returns immediately
- Scales to thousands of services and hundreds of concurrent users

## Rollback (if needed):

If you need to rollback this migration:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS update_provider_count_on_therapist_service ON therapist_services;
DROP TRIGGER IF EXISTS update_provider_count_on_salon_service ON salon_services;

-- Remove functions
DROP FUNCTION IF EXISTS trigger_update_service_provider_count();
DROP FUNCTION IF EXISTS update_service_provider_count(UUID);
DROP FUNCTION IF EXISTS batch_resync_contractors();

-- Remove column
ALTER TABLE services DROP COLUMN IF EXISTS provider_count;

-- Restore old sync trigger (from migration 015)
-- See migration 015_comprehensive_sync_diagnostics.sql
```

## Questions or Issues?

If you encounter any errors during migration:
1. Check the Supabase SQL Editor error message
2. Verify all previous migrations (001-015) have been applied
3. Check that the services, therapist_services, and salon_services tables exist
4. Contact the development team with the error details
