-- Migration: Create therapist_services and salon_services linking tables
-- This links services to their providers (therapists and salons)

-- Create therapist_services table
CREATE TABLE IF NOT EXISTS therapist_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(therapist_id, service_id)
);

-- Create salon_services table
CREATE TABLE IF NOT EXISTS salon_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, service_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_therapist_services_therapist_id ON therapist_services(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_services_service_id ON therapist_services(service_id);
CREATE INDEX IF NOT EXISTS idx_salon_services_salon_id ON salon_services(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_services_service_id ON salon_services(service_id);

-- Populate therapist_services: Link all therapists to all services with base prices
-- This gives each therapist access to all available services
INSERT INTO therapist_services (therapist_id, service_id, price, duration, is_active)
SELECT
  t.id as therapist_id,
  s.id as service_id,
  s.base_price as price,
  s.duration as duration,
  true as is_active
FROM therapists t
CROSS JOIN services s
WHERE t.is_active = true
  AND s.is_active = true
ON CONFLICT (therapist_id, service_id) DO NOTHING;

-- Populate salon_services: Link all salons to all services with base prices
-- This gives each salon access to all available services
INSERT INTO salon_services (salon_id, service_id, price, duration, is_active)
SELECT
  sal.id as salon_id,
  s.id as service_id,
  s.base_price as price,
  s.duration as duration,
  true as is_active
FROM salons sal
CROSS JOIN services s
WHERE sal.is_active = true
  AND s.is_active = true
ON CONFLICT (salon_id, service_id) DO NOTHING;

-- Add RLS policies for therapist_services
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view therapist services" ON therapist_services
  FOR SELECT USING (true);

CREATE POLICY "Therapists can manage their own services" ON therapist_services
  FOR ALL USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for salon_services
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view salon services" ON salon_services
  FOR SELECT USING (true);

CREATE POLICY "Salon owners can manage their salon services" ON salon_services
  FOR ALL USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );
