-- Fix RLS to allow reading User Profiles for Therapists/Providers
-- The client needs to fetch first_name, last_name, and phone from the users table 
-- when these are not present in the therapists table.
-- Currently, no policy permits reading other users' data.

-- We enable access to a user row ONLY if that user is linked in the 'therapists' table.

DROP POLICY IF EXISTS "Public read provider users" ON "users";

CREATE POLICY "Public read provider users" ON "users"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM therapists 
    WHERE therapists.user_id = users.id
  )
);

-- Force cache refresh for schema permissions if needed
NOTIFY pgrst, 'reload schema';
