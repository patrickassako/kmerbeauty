-- Drop old functions to clean up
DROP FUNCTION IF EXISTS get_top_provider();

-- Create new function with explicit type casting
CREATE OR REPLACE FUNCTION get_top_provider()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar text,
  total_revenue double precision,
  booking_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    u.first_name::text,  -- Explicitly cast to text to avoid type mismatch
    u.last_name::text,   -- Explicitly cast to text
    u.avatar::text,      -- Explicitly cast to text
    COALESCE(SUM(b.total), 0)::double precision as total_revenue,
    COUNT(b.id)::bigint as booking_count
  FROM therapists t
  JOIN users u ON t.user_id = u.id
  JOIN bookings b ON b.therapist_id = t.id
  WHERE b.status = 'COMPLETED'
  GROUP BY t.id, u.first_name, u.last_name, u.avatar
  ORDER BY total_revenue DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_top_provider() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_provider() TO service_role;
GRANT EXECUTE ON FUNCTION get_top_provider() TO anon;
