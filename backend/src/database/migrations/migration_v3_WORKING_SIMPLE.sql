-- VERSION SIMPLE ET FONCTIONNELLE
-- On revient à la base qui marchait, puis on améliorera après

DROP FUNCTION IF EXISTS get_nearby_therapists();
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, text, text);

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION DEFAULT NULL,
  lng DOUBLE PRECISION DEFAULT NULL,
  radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  business_name VARCHAR,
  bio_fr TEXT,
  bio_en TEXT,
  rating NUMERIC,
  review_count INTEGER,
  distance_meters DOUBLE PRECISION,
  profile_image TEXT,
  city VARCHAR,
  is_mobile BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  region VARCHAR,
  country VARCHAR
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
    updated_at,
    latitude,
    longitude,
    region,
    country
  FROM therapists
  WHERE is_active = true
  ORDER BY rating DESC NULLS LAST, created_at DESC
  LIMIT 50;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 'Version simple - retourne les thérapeutes actifs. PostGIS et service_zones à venir.';
