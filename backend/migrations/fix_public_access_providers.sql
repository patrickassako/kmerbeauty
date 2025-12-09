-- Enable RLS on main tables if not already enabled (idempotent usually, but good practice)
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;

-- 1. Therapists: Allow public read access (essential for listing providers)
DROP POLICY IF EXISTS "Public read access" ON therapists;
CREATE POLICY "Public read access" ON therapists
  FOR SELECT USING (true);

-- 2. Salons: Allow public read access
DROP POLICY IF EXISTS "Public read access" ON salons;
CREATE POLICY "Public read access" ON salons
  FOR SELECT USING (true);

-- 3. Therapist Services: Allow public read access (to see prices/services)
DROP POLICY IF EXISTS "Public read access" ON therapist_services;
CREATE POLICY "Public read access" ON therapist_services
  FOR SELECT USING (true);

-- 4. Salon Services: Allow public read access
DROP POLICY IF EXISTS "Public read access" ON salon_services;
CREATE POLICY "Public read access" ON salon_services
  FOR SELECT USING (true);

-- 5. Profiles/Users: If therapists rely on joining users, we might need this. 
-- However, frontend seems to use therapists table directly.
-- IF data is missing, we might need to open 'users' table partially.
-- For now, we assume therapists table has the data.

-- 6. RPC Function Security
-- If get_nearby_providers is used, it should be SECURITY DEFINER to bypass strict user RLS if it joins users table
-- But simpler is to rely on the fact that we might default to use data from 'therapists' table which we just opened.
-- The existing RPC joins users. If that fails for anon, we might need to update RPC.
-- Let's update the RPC to be SECURITY DEFINER just to be safe for Search functionality.

ALTER FUNCTION get_nearby_providers(double precision, double precision, integer, text, text, uuid) SECURITY DEFINER;
