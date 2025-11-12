-- ============================================
-- MIGRATION 002: Restructuration pour flow client-prestataire
-- ============================================

-- ============================================
-- TABLE: service_packages (Packages de services)
-- ============================================

CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Multi-langue
  name_fr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_fr TEXT,
  description_en TEXT,

  category category NOT NULL,

  images TEXT[],

  -- Prix et durée de base (sera personnalisé par prestataire)
  base_price DECIMAL(10, 2) NOT NULL, -- XAF
  base_duration INTEGER NOT NULL, -- Minutes totales

  -- Priorité pour l'affichage
  priority INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_packages_category ON service_packages(category);
CREATE INDEX idx_service_packages_priority ON service_packages(priority DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: package_services (Services inclus dans un package)
-- ============================================

CREATE TABLE package_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Ordre d'exécution dans le package
  sequence INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, service_id)
);

CREATE INDEX idx_package_services_package ON package_services(package_id);
CREATE INDEX idx_package_services_service ON package_services(service_id);

-- ============================================
-- TABLE: therapist_packages (Packages offerts par prestataires)
-- ============================================

CREATE TABLE therapist_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Prix et durée personnalisés
  price DECIMAL(10, 2), -- XAF (NULL = utilise base_price)
  duration INTEGER, -- Minutes (NULL = utilise base_duration)

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(therapist_id, package_id)
);

CREATE INDEX idx_therapist_packages_therapist ON therapist_packages(therapist_id);
CREATE INDEX idx_therapist_packages_package ON therapist_packages(package_id);

-- ============================================
-- TABLE: salon_packages (Packages offerts par salons)
-- ============================================

CREATE TABLE salon_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Prix et durée personnalisés
  price DECIMAL(10, 2), -- XAF (NULL = utilise base_price)
  duration INTEGER, -- Minutes (NULL = utilise base_duration)

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(salon_id, package_id)
);

CREATE INDEX idx_salon_packages_salon ON salon_packages(salon_id);
CREATE INDEX idx_salon_packages_package ON salon_packages(package_id);

-- ============================================
-- TABLE: provider_gallery (Galerie de travaux du prestataire)
-- ============================================

CREATE TABLE provider_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Prestataire (therapist OU salon)
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,

  -- Image
  image_url TEXT NOT NULL,

  -- Description (multi-langue)
  caption_fr TEXT,
  caption_en TEXT,

  -- Service associé (optionnel)
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_gallery_owner CHECK (
    (therapist_id IS NOT NULL AND salon_id IS NULL) OR
    (therapist_id IS NULL AND salon_id IS NOT NULL)
  )
);

CREATE INDEX idx_provider_gallery_therapist ON provider_gallery(therapist_id);
CREATE INDEX idx_provider_gallery_salon ON provider_gallery(salon_id);
CREATE INDEX idx_provider_gallery_service ON provider_gallery(service_id);

-- ============================================
-- TABLE: work_zones (Zones de travail du prestataire)
-- ============================================

CREATE TABLE work_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Localisation
  quarter VARCHAR(100), -- Quartier spécifique (optionnel)
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,

  -- Disponibilité pour cette zone
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_zones_therapist ON work_zones(therapist_id);
CREATE INDEX idx_work_zones_city ON work_zones(city);

-- ============================================
-- MODIFICATION: Ajouter priorité aux services
-- ============================================

ALTER TABLE services
ADD COLUMN priority INTEGER DEFAULT 0;

CREATE INDEX idx_services_priority ON services(priority DESC);

-- ============================================
-- MODIFICATION: Chats indépendants des bookings
-- Permet de discuter avant de créer une réservation
-- ============================================

-- Supprimer la contrainte UNIQUE sur booking_id
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_booking_id_key;

-- Rendre booking_id nullable
ALTER TABLE chats ALTER COLUMN booking_id DROP NOT NULL;

-- Ajouter un index pour les chats sans booking
CREATE INDEX idx_chats_no_booking ON chats(client_id, provider_id) WHERE booking_id IS NULL;

-- ============================================
-- TABLE: provider_contact_unlocks
-- Verrouillage des contacts prestataires jusqu'à commande
-- ============================================

CREATE TABLE provider_contact_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Déverrouillé via une commande
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(client_id, provider_id)
);

CREATE INDEX idx_provider_contact_unlocks_client ON provider_contact_unlocks(client_id);
CREATE INDEX idx_provider_contact_unlocks_provider ON provider_contact_unlocks(provider_id);

-- ============================================
-- TABLE: gift_cards (Cartes cadeaux)
-- ============================================

CREATE TYPE gift_card_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Code unique
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Valeur en XAF
  value DECIMAL(10, 2) NOT NULL,

  -- Multi-langue
  title_fr VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_fr TEXT,
  description_en TEXT,

  -- Applicable sur
  applicable_categories category[],
  min_order_amount DECIMAL(10, 2),

  -- Dates de validité
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

  status gift_card_status DEFAULT 'ACTIVE',

  -- Utilisateur qui possède la carte (NULL = disponible à l'achat)
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Utilisateur qui a acheté la carte pour offrir
  purchaser_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Booking où la carte a été utilisée
  used_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_owner ON gift_cards(owner_id);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- Trigger pour updated_at
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MODIFICATION: Ajouter balance aux utilisateurs prestataires
-- Pour le système de crédit
-- ============================================

ALTER TABLE users
ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0;

CREATE INDEX idx_users_balance ON users(balance) WHERE role IN ('PROVIDER', 'ADMIN');

-- ============================================
-- ROW LEVEL SECURITY pour les nouvelles tables
-- ============================================

-- Service packages: Tout le monde peut lire
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_packages_select_all ON service_packages FOR SELECT TO authenticated USING (true);

-- Provider gallery: Tout le monde peut lire
ALTER TABLE provider_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_gallery_select_all ON provider_gallery FOR SELECT TO authenticated USING (true);

-- Work zones: Tout le monde peut lire
ALTER TABLE work_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_zones_select_all ON work_zones FOR SELECT TO authenticated USING (true);

-- Provider contact unlocks: Les clients voient leurs propres déverrouillages
ALTER TABLE provider_contact_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_contact_unlocks_select_own ON provider_contact_unlocks FOR SELECT
  USING (auth.uid()::text = client_id::text OR auth.uid()::text = provider_id::text);

-- Gift cards: Tout le monde peut lire les cartes actives
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY gift_cards_select_active ON gift_cards FOR SELECT
  USING (status = 'ACTIVE' OR auth.uid()::text = owner_id::text);

-- ============================================
-- FIN DE LA MIGRATION 002
-- ============================================
