-- Allow admins to view all marketplace products
CREATE POLICY "Admins can view all marketplace products" ON "marketplace_products"
  FOR SELECT USING ( is_admin() );

-- Allow admins to view all marketplace orders
CREATE POLICY "Admins can view all marketplace orders" ON "marketplace_orders"
  FOR SELECT USING ( is_admin() );
