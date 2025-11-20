-- Migration: Ajouter la colonne fcm_token pour les push notifications
-- Date: 2025-11-20

-- Ajouter la colonne fcm_token à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;

-- Commenter la colonne
COMMENT ON COLUMN users.fcm_token IS 'Token FCM/Expo pour envoyer les push notifications à cet utilisateur';
