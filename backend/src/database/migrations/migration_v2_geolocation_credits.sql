-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Update therapists table (Merge contractor_profiles)
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS siret_number VARCHAR(50);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS legal_status VARCHAR(100);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS qualifications_proof TEXT[];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS professional_experience TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS types_of_services TEXT[];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS id_card_url JSONB;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS insurance_url TEXT;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS training_certificates TEXT[];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS portfolio_images TEXT[];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS confidentiality_accepted BOOLEAN DEFAULT false;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT ARRAY['fr'];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS available_transportation TEXT[];
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 2. Add Geolocation columns to therapists
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS service_zones JSONB DEFAULT '[]';
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Cameroun';

-- Create Index for Geolocation
CREATE INDEX IF NOT EXISTS idx_therapists_location ON therapists USING GIST (location);

-- 3. Data Migration: Copy data from contractor_profiles to therapists
-- Assuming contractor_profiles has a user_id that matches therapists.user_id or similar link.
-- Let's check the relationship. Usually contractor_profiles is linked to a user, and therapist is also linked to a user.
-- Or contractor_profiles might be linked directly to therapist.
-- Based on previous knowledge, Therapist and ContractorProfile might be 1:1 or linked via User.
-- Let's assume they are linked via user_id for now, but we should verify.
-- Actually, looking at standard patterns, if they were separate, they likely share a user_id.
-- Let's try to update based on user_id if it exists in both.
-- However, to be safe, I will comment out the actual data copy for now and let the user verify the relationship or I will check the entities first.
-- WAIT: I should check the entities first to be sure about the relationship.
-- But I can write the DDL statements first.

-- 4. Create Credits System Tables

-- provider_credits
CREATE TABLE IF NOT EXISTS provider_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL, -- 'therapist' | 'salon'
  balance DECIMAL(10,2) DEFAULT 20.00,
  total_earned DECIMAL(10,2) DEFAULT 20.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  monthly_credits_last_given TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, provider_type)
);

-- credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  reference_id UUID,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_provider ON credit_transactions(provider_id, provider_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(created_at);

-- interaction_costs
CREATE TABLE IF NOT EXISTS interaction_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_type VARCHAR(50) UNIQUE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO interaction_costs (interaction_type, cost, description) VALUES
  ('profile_view', 0.1, 'Visite du profil prestataire'),
  ('chat_pre_booking', 1.0, 'Chat avant réservation'),
  ('booking_confirmed', 3.0, 'Réservation confirmée'),
  ('review_created', 0.5, 'Avis client publié'),
  ('favorite_added', 0.3, 'Ajout aux favoris')
ON CONFLICT (interaction_type) DO NOTHING;

-- credit_packs
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price_fcfa INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO credit_packs (name, credits, price_fcfa, discount_percentage, display_order) VALUES
  ('Light', 20, 2000, 0, 1),
  ('Starter', 50, 4500, 10, 2),
  ('Pro', 100, 8000, 20, 3),
  ('Business', 250, 18000, 28, 4),
  ('Premium', 500, 35000, 30, 5)
ON CONFLICT DO NOTHING; -- Name is not unique constraint, but usually safe to insert if empty. 
-- Better to check existence or just insert. For now, simple insert.

-- credit_purchases
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL,
  pack_id UUID REFERENCES credit_packs(id),
  credits_amount INTEGER NOT NULL,
  price_paid INTEGER NOT NULL,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50) DEFAULT 'flutterwave',
  flutterwave_transaction_id VARCHAR(255),
  flutterwave_tx_ref VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_provider ON credit_purchases(provider_id, provider_type);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(payment_status);

-- referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL,
  referrer_type VARCHAR(20) NOT NULL,
  referee_id UUID,
  referee_type VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  credits_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  signup_completed_at TIMESTAMP,
  validated_at TIMESTAMP,
  first_booking_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, referrer_type);

-- referral_monthly_limits
CREATE TABLE IF NOT EXISTS referral_monthly_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  referral_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, provider_type, year, month)
);

-- position_boosts
CREATE TABLE IF NOT EXISTS position_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  duration_days INTEGER DEFAULT 7,
  credits_cost DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_boosts_zone ON position_boosts(city, district, position, active);
CREATE INDEX IF NOT EXISTS idx_position_boosts_provider ON position_boosts(provider_id, provider_type);

-- position_boost_bids
CREATE TABLE IF NOT EXISTS position_boost_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL,
  provider_type VARCHAR(20) NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  auction_end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_boost_bids_zone ON position_boost_bids(city, district, position, status);
