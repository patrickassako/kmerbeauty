-- Migration: Contractor System
-- Description: Tables et fonctions pour le système prestataire complet

-- =====================================================
-- 1. CONTRACTOR PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  siret_number VARCHAR(50),
  legal_status VARCHAR(100),

  -- Professional info
  qualifications_proof TEXT[], -- URLs des documents
  professional_experience TEXT,
  types_of_services TEXT[], -- ['hairdressing', 'beauty', 'massage', 'nails']

  -- Documents
  id_card_url TEXT,
  insurance_url TEXT,
  training_certificates TEXT[], -- URLs
  portfolio_images TEXT[], -- URLs

  -- Legal
  confidentiality_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,

  -- Languages
  languages_spoken TEXT[] DEFAULT ARRAY['fr'],

  -- Transportation
  available_transportation TEXT[], -- ['car', 'bike', 'public_transport']

  -- Service zones (trusted zones)
  service_zones JSONB DEFAULT '[]'::jsonb, -- [{location: {lat, lng, address}, radius: 10}]

  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,

  -- Status
  profile_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_contractor_user ON contractor_profiles(user_id);
CREATE INDEX idx_contractor_active ON contractor_profiles(is_active, is_verified);

-- =====================================================
-- 2. CONTRACTOR AVAILABILITY
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  -- Working hours per day
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Monday, 6 = Sunday
  is_working BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(contractor_id, day_of_week)
);

CREATE INDEX idx_availability_contractor ON contractor_availability(contractor_id);

-- =====================================================
-- 3. CONTRACTOR BREAKS
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (end_time > start_time)
);

CREATE INDEX idx_breaks_contractor ON contractor_breaks(contractor_id);

-- =====================================================
-- 4. CONTRACTOR SCHEDULE EXCEPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  exception_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE, -- false = day off, true = special availability
  start_time TIME,
  end_time TIME,
  reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(contractor_id, exception_date)
);

CREATE INDEX idx_exceptions_contractor ON contractor_exceptions(contractor_id);
CREATE INDEX idx_exceptions_date ON contractor_exceptions(exception_date);

-- =====================================================
-- 5. CONTRACTOR SERVICES (Services provided by contractor)
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Contractor-specific pricing and duration
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  description TEXT,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(contractor_id, service_id)
);

CREATE INDEX idx_contractor_services_contractor ON contractor_services(contractor_id);
CREATE INDEX idx_contractor_services_service ON contractor_services(service_id);
CREATE INDEX idx_contractor_services_active ON contractor_services(contractor_id, is_active);

-- =====================================================
-- 6. PROPOSALS (Client requests / Offres)
-- =====================================================

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Parties
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  -- Service details
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  requested_date TIMESTAMP WITH TIME ZONE,
  location JSONB, -- {address, lat, lng}

  -- Pricing (peut être négocié)
  proposed_price DECIMAL(10, 2),
  estimated_duration INTEGER, -- minutes

  -- Status
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED')),

  -- Contractor response
  contractor_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_contractor ON proposals(contractor_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);

-- =====================================================
-- 7. CONTRACTOR EARNINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) DEFAULT 0, -- Commission de la plateforme
  net_amount DECIMAL(10, 2) NOT NULL, -- Montant net pour le prestataire

  payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  payment_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_earnings_contractor ON contractor_earnings(contractor_id);
CREATE INDEX idx_earnings_booking ON contractor_earnings(booking_id);
CREATE INDEX idx_earnings_status ON contractor_earnings(payment_status);
CREATE INDEX idx_earnings_date ON contractor_earnings(created_at DESC);

-- =====================================================
-- 8. UPDATE BOOKINGS TABLE
-- =====================================================

-- Ajouter contractor_id si pas déjà présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'contractor_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN contractor_id UUID REFERENCES contractor_profiles(id);
    CREATE INDEX idx_bookings_contractor ON bookings(contractor_id);
  END IF;
END $$;

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update contractor stats
CREATE OR REPLACE FUNCTION update_contractor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE contractor_profiles
    SET
      total_bookings = (
        SELECT COUNT(*)
        FROM bookings
        WHERE contractor_id = NEW.contractor_id
        AND status = 'COMPLETED'
      ),
      total_revenue = (
        SELECT COALESCE(SUM(net_amount), 0)
        FROM contractor_earnings
        WHERE contractor_id = NEW.contractor_id
        AND payment_status = 'PAID'
      ),
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE provider_id IN (
          SELECT user_id FROM contractor_profiles WHERE id = NEW.contractor_id
        )
      ),
      updated_at = NOW()
    WHERE id = NEW.contractor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on earnings
DROP TRIGGER IF EXISTS trigger_update_contractor_stats ON contractor_earnings;
CREATE TRIGGER trigger_update_contractor_stats
  AFTER INSERT OR UPDATE ON contractor_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_stats();

-- Function: Check contractor availability
CREATE OR REPLACE FUNCTION check_contractor_availability(
  p_contractor_id UUID,
  p_date_time TIMESTAMP WITH TIME ZONE,
  p_duration INTEGER -- minutes
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_time TIME;
  v_date DATE;
  v_is_working BOOLEAN;
  v_start_time TIME;
  v_end_time TIME;
  v_has_exception BOOLEAN;
  v_exception_available BOOLEAN;
BEGIN
  v_day_of_week := EXTRACT(ISODOW FROM p_date_time) - 1; -- 0 = Monday
  v_time := p_date_time::TIME;
  v_date := p_date_time::DATE;

  -- Check for exceptions first
  SELECT is_available INTO v_exception_available
  FROM contractor_exceptions
  WHERE contractor_id = p_contractor_id
  AND exception_date = v_date;

  v_has_exception := FOUND;

  IF v_has_exception THEN
    RETURN v_exception_available;
  END IF;

  -- Check regular availability
  SELECT is_working, start_time, end_time
  INTO v_is_working, v_start_time, v_end_time
  FROM contractor_availability
  WHERE contractor_id = p_contractor_id
  AND day_of_week = v_day_of_week;

  IF NOT FOUND OR NOT v_is_working THEN
    RETURN FALSE;
  END IF;

  -- Check if time is within working hours
  IF v_time < v_start_time OR v_time + (p_duration || ' minutes')::INTERVAL > v_end_time::TIME THEN
    RETURN FALSE;
  END IF;

  -- Check for breaks
  IF EXISTS (
    SELECT 1 FROM contractor_breaks
    WHERE contractor_id = p_contractor_id
    AND day_of_week = v_day_of_week
    AND v_time >= start_time
    AND v_time < end_time
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check for existing bookings
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE contractor_id = p_contractor_id
    AND status NOT IN ('CANCELLED', 'REJECTED')
    AND (
      (scheduled_at <= p_date_time AND scheduled_at + (duration || ' minutes')::INTERVAL > p_date_time)
      OR
      (scheduled_at < p_date_time + (p_duration || ' minutes')::INTERVAL AND scheduled_at >= p_date_time)
    )
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get contractor dashboard stats
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
    COALESCE(SUM(ce.net_amount), 0) as total_income,
    (SELECT COUNT(*) FROM proposals WHERE contractor_id = p_contractor_id
     AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
     AND (p_end_date IS NULL OR created_at::DATE <= p_end_date)) as total_proposals,
    (SELECT COUNT(*) FROM bookings WHERE contractor_id = p_contractor_id
     AND status = 'COMPLETED'
     AND (p_start_date IS NULL OR scheduled_at::DATE >= p_start_date)
     AND (p_end_date IS NULL OR scheduled_at::DATE <= p_end_date)) as completed_bookings,
    (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE contractor_id = p_contractor_id) as total_clients,
    (SELECT COUNT(*) FROM bookings WHERE contractor_id = p_contractor_id
     AND status = 'CONFIRMED'
     AND scheduled_at >= NOW()) as upcoming_appointments
  FROM contractor_earnings ce
  WHERE ce.contractor_id = p_contractor_id
  AND ce.payment_status = 'PAID'
  AND (p_start_date IS NULL OR ce.created_at::DATE >= p_start_date)
  AND (p_end_date IS NULL OR ce.created_at::DATE <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_earnings ENABLE ROW LEVEL SECURITY;

-- Policies for contractor_profiles
CREATE POLICY "Contractors can view their own profile"
  ON contractor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Contractors can update their own profile"
  ON contractor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contractor profile"
  ON contractor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified contractors"
  ON contractor_profiles FOR SELECT
  USING (is_verified = TRUE AND is_active = TRUE);

-- Policies for contractor_availability
CREATE POLICY "Contractors can manage their availability"
  ON contractor_availability FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view contractor availability"
  ON contractor_availability FOR SELECT
  USING (TRUE);

-- Policies for contractor_breaks
CREATE POLICY "Contractors can manage their breaks"
  ON contractor_breaks FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for contractor_exceptions
CREATE POLICY "Contractors can manage their exceptions"
  ON contractor_exceptions FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for contractor_services
CREATE POLICY "Contractors can manage their services"
  ON contractor_services FOR ALL
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active contractor services"
  ON contractor_services FOR SELECT
  USING (is_active = TRUE);

-- Policies for proposals
CREATE POLICY "Clients can view their proposals"
  ON proposals FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Contractors can view proposals sent to them"
  ON proposals FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Contractors can update proposal status"
  ON proposals FOR UPDATE
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for contractor_earnings
CREATE POLICY "Contractors can view their earnings"
  ON contractor_earnings FOR SELECT
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 11. INITIAL DATA
-- =====================================================

-- Update users table to support contractor role if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'CONTRACTOR', 'ADMIN'));
  END IF;
END $$;
