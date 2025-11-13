-- ============================================
-- Migration 004: Enhanced Chat Features
-- ============================================
-- Description: Ajout de fonctionnalités avancées au système de chat
-- - Messages vocaux (VOICE)
-- - Réponses aux messages (reply_to_message_id)
-- - Offres de services personnalisés (offer_data)
-- ============================================

-- 1. Ajouter VOICE au message_type enum
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'VOICE';

-- 2. Ajouter les colonnes manquantes à chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS offer_data JSONB,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER; -- Pour les messages vocaux

-- 3. Créer un index pour les réponses
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id);

-- 4. Ajouter des commentaires pour la documentation
COMMENT ON COLUMN chat_messages.reply_to_message_id IS 'ID du message auquel on répond (pour les threads)';
COMMENT ON COLUMN chat_messages.offer_data IS 'Données JSON de l''offre personnalisée: {service_name, description, price, duration, custom_fields}';
COMMENT ON COLUMN chat_messages.duration_seconds IS 'Durée du message vocal en secondes';

-- 5. Créer une table pour les offres acceptées (pour tracking)
CREATE TABLE IF NOT EXISTS chat_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,

  -- Détails de l'offre
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL, -- en minutes

  -- Champs personnalisés supplémentaires
  custom_fields JSONB,

  -- Statut de l'offre
  status VARCHAR(20) DEFAULT 'PENDING' NOT NULL, -- PENDING, ACCEPTED, DECLINED, EXPIRED

  -- Réservation liée si acceptée
  booking_id UUID REFERENCES bookings(id),

  -- Expiration de l'offre (optionnel)
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Réponse du client
  client_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les offres
CREATE INDEX IF NOT EXISTS idx_chat_offers_message ON chat_offers(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_offers_chat ON chat_offers(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_offers_status ON chat_offers(status);
CREATE INDEX IF NOT EXISTS idx_chat_offers_booking ON chat_offers(booking_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_chat_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_offers_updated_at
  BEFORE UPDATE ON chat_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_offers_updated_at();

-- 6. Fonction helper pour créer une offre
CREATE OR REPLACE FUNCTION create_chat_offer(
  p_chat_id UUID,
  p_sender_id UUID,
  p_service_name VARCHAR,
  p_description TEXT,
  p_price DECIMAL,
  p_duration INTEGER,
  p_custom_fields JSONB DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 48
) RETURNS TABLE(message_id UUID, offer_id UUID) AS $$
DECLARE
  v_message_id UUID;
  v_offer_id UUID;
BEGIN
  -- Créer le message
  INSERT INTO chat_messages (
    chat_id,
    sender_id,
    content,
    type,
    offer_data
  ) VALUES (
    p_chat_id,
    p_sender_id,
    format('Offre personnalisée: %s', p_service_name),
    'SERVICE_SUGGESTION',
    jsonb_build_object(
      'service_name', p_service_name,
      'description', p_description,
      'price', p_price,
      'duration', p_duration,
      'custom_fields', COALESCE(p_custom_fields, '{}'::jsonb)
    )
  ) RETURNING id INTO v_message_id;

  -- Créer l'offre associée
  INSERT INTO chat_offers (
    message_id,
    chat_id,
    service_name,
    description,
    price,
    duration,
    custom_fields,
    expires_at
  ) VALUES (
    v_message_id,
    p_chat_id,
    p_service_name,
    p_description,
    p_price,
    p_duration,
    p_custom_fields,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL
  ) RETURNING id INTO v_offer_id;

  RETURN QUERY SELECT v_message_id, v_offer_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour accepter une offre
CREATE OR REPLACE FUNCTION accept_chat_offer(
  p_offer_id UUID,
  p_client_response TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Mettre à jour le statut de l'offre
  UPDATE chat_offers
  SET
    status = 'ACCEPTED',
    client_response = p_client_response,
    responded_at = NOW()
  WHERE id = p_offer_id;

  -- TODO: Créer automatiquement une réservation
  -- (à implémenter selon la logique de réservation)

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour décliner une offre
CREATE OR REPLACE FUNCTION decline_chat_offer(
  p_offer_id UUID,
  p_client_response TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE chat_offers
  SET
    status = 'DECLINED',
    client_response = p_client_response,
    responded_at = NOW()
  WHERE id = p_offer_id;
END;
$$ LANGUAGE plpgsql;
