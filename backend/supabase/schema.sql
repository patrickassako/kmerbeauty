-- ============================================
-- KMERSERVICES - Schéma de base de données Supabase
-- Services de beauté à la demande - Cameroun
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN');
CREATE TYPE language AS ENUM ('FRENCH', 'ENGLISH');
CREATE TYPE category AS ENUM (
  'HAIRDRESSING',      -- FR: Coiffure | EN: Hairdressing
  'EYE_CARE',          -- FR: Soins des yeux | EN: Eye Care
  'WELLNESS_MASSAGE',  -- FR: Massage et Bien-être | EN: Wellness & Massage
  'FACIAL',            -- FR: Soins du visage | EN: Facial Care
  'NAIL_CARE',         -- FR: Manucure/Pédicure | EN: Nail Care
  'MAKEUP',            -- FR: Maquillage | EN: Makeup
  'WAXING',            -- FR: Épilation | EN: Waxing
  'BARBER',            -- FR: Barbier | EN: Barber
  'OTHER'              -- FR: Autre | EN: Other
);

-- ============================================
-- TABLE: category_translations
-- ============================================

CREATE TABLE category_translations (
  category category PRIMARY KEY,
  name_fr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_fr TEXT,
  description_en TEXT
);

-- Insérer les traductions des catégories
INSERT INTO category_translations (category, name_fr, name_en, description_fr, description_en) VALUES
  ('HAIRDRESSING', 'Coiffure', 'Hairdressing', 'Services de coiffure professionnels', 'Professional hair styling services'),
  ('EYE_CARE', 'Soins des yeux', 'Eye Care', 'Soins des cils et sourcils', 'Eyelash and eyebrow care'),
  ('WELLNESS_MASSAGE', 'Massage et Bien-être', 'Wellness & Massage', 'Massages relaxants et thérapeutiques', 'Relaxing and therapeutic massages'),
  ('FACIAL', 'Soins du visage', 'Facial Care', 'Traitements pour le visage', 'Facial treatments'),
  ('NAIL_CARE', 'Manucure/Pédicure', 'Nail Care', 'Soins des ongles', 'Nail care services'),
  ('MAKEUP', 'Maquillage', 'Makeup', 'Maquillage professionnel', 'Professional makeup services'),
  ('WAXING', 'Épilation', 'Waxing', 'Services d''épilation', 'Hair removal services'),
  ('BARBER', 'Barbier', 'Barber', 'Services de barbier pour hommes', 'Men''s barbering services'),
  ('OTHER', 'Autre', 'Other', 'Autres services de beauté', 'Other beauty services');
CREATE TYPE location_type AS ENUM ('HOME', 'SALON');
CREATE TYPE booking_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);
CREATE TYPE payment_method AS ENUM (
  'ORANGE_MONEY',
  'MTN_MOBILE_MONEY',
  'CARD',
  'CASH'
);
CREATE TYPE mobile_operator AS ENUM ('ORANGE', 'MTN');
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED'
);
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'SERVICE_SUGGESTION', 'SYSTEM');

-- ============================================
-- TABLE: users
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL, -- Format: +237XXXXXXXXX
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar TEXT,
  role user_role DEFAULT 'CLIENT' NOT NULL,

  -- Social Auth
  google_id VARCHAR(255) UNIQUE,
  facebook_id VARCHAR(255) UNIQUE,
  apple_id VARCHAR(255) UNIQUE,

  -- Langue préférée
  language language DEFAULT 'FRENCH' NOT NULL,

  -- Localisation Cameroun
  city VARCHAR(100),
  region VARCHAR(100),

  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABLE: addresses
-- ============================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- "Domicile", "Bureau"

  -- Adresse Cameroun
  quarter VARCHAR(100) NOT NULL, -- Quartier (ex: Akwa, Bonanjo)
  street VARCHAR(255),
  landmark VARCHAR(255) NOT NULL, -- Point de repère
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Cameroun',

  -- Géolocalisation
  location GEOMETRY(POINT, 4326),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Instructions d'accès
  instructions TEXT,

  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_location ON addresses USING GIST(location);

-- ============================================
-- TABLE: therapists (Prestataires indépendants)
-- ============================================

CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Info professionnelle (multi-langue)
  bio_fr TEXT,
  bio_en TEXT,
  experience INTEGER NOT NULL, -- Années d'expérience
  professional_experience TEXT,
  is_licensed BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(100),

  -- Mobilité
  is_mobile BOOLEAN DEFAULT TRUE,
  travel_radius INTEGER NOT NULL, -- En km
  travel_fee DECIMAL(10, 2) DEFAULT 0, -- XAF

  -- Location de base
  location GEOMETRY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,

  -- Portfolio
  portfolio_images TEXT[],
  profile_image TEXT,

  -- Business Info
  business_name VARCHAR(255),
  siret_number VARCHAR(100),
  legal_status VARCHAR(100),
  qualifications_proof TEXT[],
  types_of_services TEXT[],
  id_card_url JSONB,
  insurance_url TEXT,
  training_certificates TEXT[],
  
  -- Agreements
  confidentiality_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  languages_spoken TEXT[] DEFAULT ARRAY['fr'],
  available_transportation TEXT[],
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  profile_completed BOOLEAN DEFAULT FALSE,
  service_zones JSONB DEFAULT '[]'::jsonb,

  -- Salon affilié (optionnel) - sera ajouté après la création de la table salons
  salon_id UUID,

  -- Stats (Legacy/Duplicate?)
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_therapists_user ON therapists(user_id);
CREATE INDEX idx_therapists_location ON therapists USING GIST(location);
CREATE INDEX idx_therapists_city ON therapists(city);
CREATE INDEX idx_therapists_mobile ON therapists(is_mobile);

-- ============================================
-- TABLE: education
-- ============================================

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_education_therapist ON education(therapist_id);

-- ============================================
-- TABLE: salons
-- ============================================

CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Multi-langue
  name_fr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_fr TEXT,
  description_en TEXT,

  -- Location Cameroun
  quarter VARCHAR(100) NOT NULL,
  street VARCHAR(255),
  landmark VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Cameroun',

  location GEOMETRY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  -- Images
  logo TEXT,
  cover_image TEXT,
  ambiance_images TEXT[],

  -- Informations (multi-langue via JSON)
  established_year INTEGER,
  features JSONB, -- [{"fr": "Priorité à l'individu", "en": "Priority to Individual"}]

  -- Horaires (JSON)
  opening_hours JSONB,

  -- Stats
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  service_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_salons_user ON salons(user_id);
CREATE INDEX idx_salons_location ON salons USING GIST(location);
CREATE INDEX idx_salons_city ON salons(city);

-- Ajouter maintenant la contrainte de clé étrangère pour therapists.salon_id
ALTER TABLE therapists
  ADD CONSTRAINT fk_therapists_salon
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE SET NULL;

-- ============================================
-- TABLE: services
-- ============================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Multi-langue
  name_fr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_fr TEXT,
  description_en TEXT,

  category category NOT NULL,

  images TEXT[],

  -- Détails (multi-langue)
  components JSONB, -- [{"step": 1, "fr": "Shampooing", "en": "Shampoo"}]
  purpose_fr TEXT,
  purpose_en TEXT,
  ideal_for_fr TEXT,
  ideal_for_en TEXT,

  duration INTEGER NOT NULL, -- Minutes
  base_price DECIMAL(10, 2) NOT NULL, -- XAF

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);

-- ============================================
-- TABLE: therapist_services (Liaison)
-- ============================================

CREATE TABLE therapist_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  price DECIMAL(10, 2), -- Prix personnalisé (XAF)
  duration INTEGER, -- Durée personnalisée

  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(therapist_id, service_id)
);

CREATE INDEX idx_therapist_services_therapist ON therapist_services(therapist_id);
CREATE INDEX idx_therapist_services_service ON therapist_services(service_id);

-- ============================================
-- TABLE: salon_services (Liaison)
-- ============================================

CREATE TABLE salon_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  price DECIMAL(10, 2), -- XAF
  duration INTEGER,

  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(salon_id, service_id)
);

CREATE INDEX idx_salon_services_salon ON salon_services(salon_id);
CREATE INDEX idx_salon_services_service ON salon_services(service_id);

-- ============================================
-- TABLE: bookings
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Client
  user_id UUID NOT NULL REFERENCES users(id),

  -- Prestataire (therapist OU salon)
  therapist_id UUID REFERENCES therapists(id),
  salon_id UUID REFERENCES salons(id),

  -- Date & heure
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- Total en minutes

  -- Location
  location_type location_type NOT NULL,
  quarter VARCHAR(100),
  street VARCHAR(255),
  landmark VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,

  location GEOMETRY(POINT, 4326),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  instructions TEXT,

  -- Prix (XAF)
  subtotal DECIMAL(10, 2) NOT NULL,
  travel_fee DECIMAL(10, 2) DEFAULT 0,
  tip DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Statut
  status booking_status DEFAULT 'PENDING' NOT NULL,

  -- Annulation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_provider CHECK (
    (therapist_id IS NOT NULL AND salon_id IS NULL) OR
    (therapist_id IS NULL AND salon_id IS NOT NULL)
  )
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_therapist ON bookings(therapist_id);
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- TABLE: booking_items
-- ============================================

CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  service_name VARCHAR(255) NOT NULL, -- Snapshot
  price DECIMAL(10, 2) NOT NULL, -- XAF
  duration INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);

-- ============================================
-- TABLE: payments
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),

  amount DECIMAL(10, 2) NOT NULL, -- XAF
  currency VARCHAR(10) DEFAULT 'XAF',

  method payment_method NOT NULL,
  status payment_status DEFAULT 'PENDING' NOT NULL,

  -- Flutterwave
  flutterwave_id VARCHAR(255) UNIQUE,
  flutterwave_tx_ref VARCHAR(255) UNIQUE,

  -- Mobile Money (Cameroun)
  mobile_operator mobile_operator,
  mobile_number VARCHAR(20), -- +237XXXXXXXXX

  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- TABLE: transactions (Historique financier)
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lié à un paiement
  payment_id UUID REFERENCES payments(id),

  -- Utilisateur (prestataire qui reçoit l'argent)
  user_id UUID NOT NULL REFERENCES users(id),

  -- Montant
  amount DECIMAL(10, 2) NOT NULL, -- XAF
  currency VARCHAR(10) DEFAULT 'XAF',

  -- Type de transaction
  type VARCHAR(50) NOT NULL, -- 'BOOKING_PAYMENT', 'REFUND', 'WITHDRAWAL', 'TIP'

  -- Statut
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'

  -- Détails
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_payment ON transactions(payment_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- TABLE: reviews
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id),

  -- Review pour therapist OU salon
  therapist_id UUID REFERENCES therapists(id),
  salon_id UUID REFERENCES salons(id),

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Critères optionnels
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  professionalism INTEGER CHECK (professionalism >= 1 AND professionalism <= 5),
  value INTEGER CHECK (value >= 1 AND value <= 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_review_target CHECK (
    (therapist_id IS NOT NULL AND salon_id IS NULL) OR
    (therapist_id IS NULL AND salon_id IS NOT NULL)
  )
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_therapist ON reviews(therapist_id);
CREATE INDEX idx_reviews_salon ON reviews(salon_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- TABLE: favorites
-- ============================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  therapist_id UUID REFERENCES therapists(id),
  salon_id UUID REFERENCES salons(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, therapist_id),
  UNIQUE(user_id, salon_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ============================================
-- TABLE: availability
-- ============================================

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dimanche
  start_time TIME NOT NULL, -- "09:00"
  end_time TIME NOT NULL, -- "18:00"

  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_availability_therapist ON availability(therapist_id);

-- ============================================
-- TABLE: chats
-- ============================================

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lié à une réservation
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Participants (client + prestataire)
  client_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),

  -- Dernier message
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,

  -- Statut
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chats_booking ON chats(booking_id);
CREATE INDEX idx_chats_client ON chats(client_id);
CREATE INDEX idx_chats_provider ON chats(provider_id);

-- ============================================
-- TABLE: chat_messages
-- ============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,

  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  type message_type DEFAULT 'TEXT' NOT NULL,

  -- Attachments
  attachments TEXT[],

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- TRIGGERS: updated_at automatique
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies de base (à affiner selon vos besoins)

-- Users: Chacun peut lire, créer et modifier son propre profil
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Bookings: Les utilisateurs voient leurs propres réservations
CREATE POLICY bookings_select_own ON bookings FOR SELECT
  USING (auth.uid()::text = user_id::text OR
         auth.uid()::text IN (
           SELECT user_id::text FROM therapists WHERE id = bookings.therapist_id
         ) OR
         auth.uid()::text IN (
           SELECT user_id::text FROM salons WHERE id = bookings.salon_id
         ));

-- Chats: Les participants peuvent voir les messages
CREATE POLICY chats_select_participants ON chats FOR SELECT
  USING (auth.uid()::text = client_id::text OR auth.uid()::text = provider_id::text);

CREATE POLICY chat_messages_select_participants ON chat_messages FOR SELECT
  USING (auth.uid()::text IN (
    SELECT client_id::text FROM chats WHERE id = chat_messages.chat_id
    UNION
    SELECT provider_id::text FROM chats WHERE id = chat_messages.chat_id
  ));

-- Services: Tout le monde peut lire
CREATE POLICY services_select_all ON services FOR SELECT TO authenticated USING (true);

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
