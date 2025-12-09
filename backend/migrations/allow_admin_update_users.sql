-- Allow admins to update user profiles (e.g., to suspend/activate accounts)
CREATE POLICY "Admins can update all profiles" ON "users"
  FOR UPDATE USING ( is_admin() );

-- Also ensure admins can delete if necessary (optional but good for full management)
CREATE POLICY "Admins can delete profiles" ON "users"
  FOR DELETE USING ( is_admin() );
