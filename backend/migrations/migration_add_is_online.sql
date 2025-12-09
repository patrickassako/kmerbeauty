-- Add is_online column to therapists table
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_online = true if they are active (optional, but good for migration)
-- UPDATE therapists SET is_online = TRUE WHERE is_active = TRUE;

-- Comment on column
COMMENT ON COLUMN therapists.is_online IS 'Indicates if the provider is currently available to receive bookings (user controlled)';
