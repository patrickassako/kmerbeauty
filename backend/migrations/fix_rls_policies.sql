-- 1. Enable RLS on users table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON "users";
CREATE POLICY "Users can view own profile" ON "users"
  FOR SELECT USING (auth.uid() = id);

-- 3. Policy: Admins can view ALL profiles
-- This allows any user with role 'ADMIN' to select all rows in 'users'
DROP POLICY IF EXISTS "Admins can view all profiles" ON "users";
CREATE POLICY "Admins can view all profiles" ON "users"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" AS u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );

-- 4. Enable RLS on bookings table (for Dashboard)
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Admins can view ALL bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON "bookings";
CREATE POLICY "Admins can view all bookings" ON "bookings"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" AS u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );

-- 6. Policy: Admins can view ALL support conversations (if not already covered)
DROP POLICY IF EXISTS "Admins can view all conversations" ON "support_conversations";
CREATE POLICY "Admins can view all conversations" ON "support_conversations"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "users" AS u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );
