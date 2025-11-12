-- ============================================
-- Add missing INSERT policy for users table
-- ============================================
-- This allows authenticated users to insert their own user record
-- The service role key bypasses RLS, but this policy is needed
-- for other auth flows

-- Add INSERT policy for users - allow inserting with matching auth.uid()
CREATE POLICY users_insert_own ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Also add a policy to allow service role to insert (in case it's not bypassing RLS)
-- Note: Service role should bypass RLS by default, but this is a safety measure
