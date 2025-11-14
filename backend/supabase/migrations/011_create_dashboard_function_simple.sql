-- Migration: Create simplified dashboard stats function
-- Description: Creates a simple version of get_contractor_dashboard_stats that works without all tables

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_contractor_dashboard_stats(UUID, DATE, DATE);

-- Create simplified version that returns default values
CREATE OR REPLACE FUNCTION get_contractor_dashboard_stats(
  p_contractor_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_income DECIMAL,
  total_proposals INTEGER,
  completed_bookings INTEGER,
  total_clients INTEGER,
  upcoming_appointments INTEGER
) AS $$
BEGIN
  -- Return default values for now
  -- These will be updated when the actual tables are created
  RETURN QUERY
  SELECT
    0::DECIMAL as total_income,
    0::INTEGER as total_proposals,
    0::INTEGER as completed_bookings,
    0::INTEGER as total_clients,
    0::INTEGER as upcoming_appointments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_contractor_dashboard_stats IS 'Returns contractor dashboard statistics (simplified version with default values)';
