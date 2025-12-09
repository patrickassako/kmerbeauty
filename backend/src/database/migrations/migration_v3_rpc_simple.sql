-- Version ultra-simplifiée - retourne seulement les colonnes qui existent vraiment
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  business_name TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  rating NUMERIC,
  review_count INTEGER,
  distance_meters DOUBLE PRECISION,
  profile_image TEXT,
  city TEXT,
  is_mobile BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT
    id,
    user_id,
    business_name,
    bio_fr,
    bio_en,
    rating,
    review_count,
    0::DOUBLE PRECISION as distance_meters,
    profile_image,
    city,
    is_mobile,
    is_active,
    created_at,
    updated_at
  FROM therapists
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 20;
$$;

-- Commenter pour vérifier que ça marche
COMMENT ON FUNCTION get_nearby_therapists IS 'Version simplifiée temporaire sans PostGIS - retourne tous les thérapeutes actifs';
