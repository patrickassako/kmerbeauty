-- Migration: Add RLS policies for bookings table operations
-- Description: Fixes "new row violates row-level security policy" error when creating bookings
-- Issue: Only SELECT policy exists for bookings, missing INSERT/UPDATE/DELETE policies

-- =====================================================
-- 1. Add INSERT policy for bookings
-- =====================================================

-- Clients can create bookings for themselves
CREATE POLICY bookings_insert_client ON bookings
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

COMMENT ON POLICY bookings_insert_client ON bookings IS
  'Allows authenticated users to create bookings for themselves';

-- =====================================================
-- 2. Add UPDATE policy for bookings
-- =====================================================

-- Users can update their own bookings (clients)
-- Providers can update bookings assigned to them
CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE
  USING (
    auth.uid()::text = user_id::text OR
    auth.uid()::text IN (
      SELECT user_id::text FROM therapists WHERE id = bookings.therapist_id
    ) OR
    auth.uid()::text IN (
      SELECT user_id::text FROM salons WHERE id = bookings.salon_id
    )
  );

COMMENT ON POLICY bookings_update_own ON bookings IS
  'Allows clients and providers to update their bookings';

-- =====================================================
-- 3. Add DELETE policy for bookings
-- =====================================================

-- Only the client who created the booking can delete it
CREATE POLICY bookings_delete_own ON bookings
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

COMMENT ON POLICY bookings_delete_own ON bookings IS
  'Allows clients to delete their own bookings';

-- =====================================================
-- 4. Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies for bookings table created successfully';
  RAISE NOTICE '   - INSERT: Clients can create bookings';
  RAISE NOTICE '   - SELECT: Existing policy (clients and providers can view)';
  RAISE NOTICE '   - UPDATE: Clients and providers can update';
  RAISE NOTICE '   - DELETE: Clients can delete their bookings';

  -- Show all policies for bookings table
  RAISE NOTICE '📊 Current RLS policies for bookings table:';
END $$;

-- List all policies for verification
SELECT
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE cmd
  END as operation,
  roles
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;
