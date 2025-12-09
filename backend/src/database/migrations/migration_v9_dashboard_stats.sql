-- Function: Get contractor dashboard stats
-- This function aggregates data from bookings to provide stats for the dashboard.
-- It handles both therapists and salons by checking therapist_id and salon_id.

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
  RETURN QUERY
  SELECT
    -- Total Income: Sum of total from completed bookings
    COALESCE((
      SELECT SUM(total)
      FROM bookings
      WHERE (therapist_id = p_contractor_id OR salon_id = p_contractor_id OR contractor_id = p_contractor_id)
      AND status = 'COMPLETED'
      AND (p_start_date IS NULL OR scheduled_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR scheduled_at::DATE <= p_end_date)
    ), 0) as total_income,

    -- Total Proposals (Commandes): Count of PENDING bookings
    (
      SELECT COUNT(*)
      FROM bookings
      WHERE (therapist_id = p_contractor_id OR salon_id = p_contractor_id OR contractor_id = p_contractor_id)
      AND status = 'PENDING'
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date)
    )::INTEGER as total_proposals,

    -- Completed Bookings
    (
      SELECT COUNT(*)
      FROM bookings
      WHERE (therapist_id = p_contractor_id OR salon_id = p_contractor_id OR contractor_id = p_contractor_id)
      AND status = 'COMPLETED'
      AND (p_start_date IS NULL OR scheduled_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR scheduled_at::DATE <= p_end_date)
    )::INTEGER as completed_bookings,

    -- Total Clients: Distinct users
    (
      SELECT COUNT(DISTINCT user_id)
      FROM bookings
      WHERE (therapist_id = p_contractor_id OR salon_id = p_contractor_id OR contractor_id = p_contractor_id)
    )::INTEGER as total_clients,

    -- Upcoming Appointments
    (
      SELECT COUNT(*)
      FROM bookings
      WHERE (therapist_id = p_contractor_id OR salon_id = p_contractor_id OR contractor_id = p_contractor_id)
      AND status = 'CONFIRMED'
      AND scheduled_at >= NOW()
    )::INTEGER as upcoming_appointments;
END;
$$ LANGUAGE plpgsql;
