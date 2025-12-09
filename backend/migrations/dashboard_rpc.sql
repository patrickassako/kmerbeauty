-- Function to get the best provider based on revenue from completed bookings
CREATE OR REPLACE FUNCTION get_best_provider()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar text,
  total_revenue float,
  booking_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    u.first_name,
    u.last_name,
    u.avatar,
    COALESCE(SUM(b.total), 0)::float as total_revenue,
    COUNT(b.id) as booking_count
  FROM therapists t
  JOIN users u ON t.user_id = u.id
  JOIN bookings b ON b.therapist_id = t.id
  WHERE b.status = 'COMPLETED'
  GROUP BY t.id, u.first_name, u.last_name, u.avatar
  ORDER BY total_revenue DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_best_provider() TO authenticated;
GRANT EXECUTE ON FUNCTION get_best_provider() TO service_role;
