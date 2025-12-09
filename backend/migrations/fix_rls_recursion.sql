-- 1. Create a secure function to check if the current user is an admin
-- SECURITY DEFINER allows this function to bypass RLS when reading the users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON "users";
DROP POLICY IF EXISTS "Admins can view all bookings" ON "bookings";
DROP POLICY IF EXISTS "Admins can view all conversations" ON "support_conversations";
DROP POLICY IF EXISTS "Admins can view all reports" ON "reports"; -- Just in case

-- 3. Re-create policies using the secure function

-- Users Table
CREATE POLICY "Admins can view all profiles" ON "users"
  FOR SELECT USING ( is_admin() );

-- Bookings Table
CREATE POLICY "Admins can view all bookings" ON "bookings"
  FOR SELECT USING ( is_admin() );

-- Support Conversations
CREATE POLICY "Admins can view all conversations" ON "support_conversations"
  FOR SELECT USING ( is_admin() );

-- Reports (Moderation)
CREATE POLICY "Admins can view all reports" ON "reports"
  FOR SELECT USING ( is_admin() );

-- Admin Logs
CREATE POLICY "Admins can view all logs" ON "admin_logs"
  FOR SELECT USING ( is_admin() );

-- Credit Purchases (Revenue)
ALTER TABLE "credit_purchases" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all credit purchases" ON "credit_purchases";
CREATE POLICY "Admins can view all credit purchases" ON "credit_purchases"
  FOR SELECT USING ( is_admin() );
