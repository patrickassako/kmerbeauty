-- Add service_id column to booking_items table
-- This allows linking a booking item back to the original service for retrieving images, etc.

ALTER TABLE booking_items 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_items_service_id ON booking_items(service_id);

-- Notify schema cache reload
NOTIFY pgrst, 'reload schema';
