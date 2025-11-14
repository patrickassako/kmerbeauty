-- Migration: Fix id_card_url type to support front/back object
-- Description: Changes id_card_url from TEXT to JSONB to support {front: url, back: url} structure

-- Change id_card_url column type from TEXT to JSONB
ALTER TABLE contractor_profiles
ALTER COLUMN id_card_url TYPE JSONB USING
  CASE
    WHEN id_card_url IS NULL THEN NULL
    WHEN id_card_url::text ~ '^{.*}$' THEN id_card_url::jsonb -- Already JSON
    ELSE jsonb_build_object('url', id_card_url) -- Convert plain text to JSON
  END;

-- Add comment to document the expected structure
COMMENT ON COLUMN contractor_profiles.id_card_url IS 'ID card URLs in format: {"front": "url", "back": "url"} or simple string for backward compatibility';
