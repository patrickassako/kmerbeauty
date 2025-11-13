-- =====================================================
-- Script: Create and populate provider-service linking tables
-- Purpose: Link therapists and salons to the services they offer
--
-- Instructions:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- =====================================================

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS therapist_services CASCADE;
DROP TABLE IF EXISTS salon_services CASCADE;

-- Create therapist_services table
CREATE TABLE therapist_services (
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
CREATE TABLE salon_services (
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
CREATE INDEX idx_therapist_services_therapist_id ON therapist_services(therapist_id);
CREATE INDEX idx_therapist_services_service_id ON therapist_services(service_id);
CREATE INDEX idx_therapist_services_active ON therapist_services(is_active);
CREATE INDEX idx_salon_services_salon_id ON salon_services(salon_id);
CREATE INDEX idx_salon_services_service_id ON salon_services(service_id);
CREATE INDEX idx_salon_services_active ON salon_services(is_active);

-- Populate therapist_services: Link all active therapists to all active services
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
  AND s.is_active = true;

-- Populate salon_services: Link all active salons to all active services
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
  AND s.is_active = true;

-- Enable Row Level Security
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for therapist_services
DROP POLICY IF EXISTS "Anyone can view therapist services" ON therapist_services;
CREATE POLICY "Anyone can view therapist services" ON therapist_services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Therapists can manage their own services" ON therapist_services;
CREATE POLICY "Therapists can manage their own services" ON therapist_services
  FOR ALL USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE user_id = auth.uid()
    )
  );

-- RLS policies for salon_services
DROP POLICY IF EXISTS "Anyone can view salon services" ON salon_services;
CREATE POLICY "Anyone can view salon services" ON salon_services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Salon owners can manage their salon services" ON salon_services;
CREATE POLICY "Salon owners can manage their salon services" ON salon_services
  FOR ALL USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

-- Verify the data
SELECT
  'therapist_services' as table_name,
  COUNT(*) as total_links,
  COUNT(DISTINCT therapist_id) as unique_therapists,
  COUNT(DISTINCT service_id) as unique_services
FROM therapist_services
WHERE is_active = true

UNION ALL

SELECT
  'salon_services' as table_name,
  COUNT(*) as total_links,
  COUNT(DISTINCT salon_id) as unique_salons,
  COUNT(DISTINCT service_id) as unique_services
FROM salon_services
WHERE is_active = true;
