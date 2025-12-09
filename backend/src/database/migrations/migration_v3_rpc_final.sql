-- Version FINALE fonctionnelle avec PostGIS activé
-- Cette version suppose que migration_v2_geolocation_credits.sql a été exécuté

DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
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
LANGUAGE plpgsql
AS $$
BEGIN
  -- Version avec PostGIS (si location existe et est rempli)
  IF EXISTS (
    SELECT 1 FROM therapists 
    WHERE location IS NOT NULL 
    LIMIT 1
  ) THEN
    RETURN QUERY
    SELECT
      t.id,
      t.user_id,
      t.business_name,
      t.bio_fr,
      t.bio_en,
      t.rating,
      t.review_count,
      ST_Distance(
        t.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) as distance_meters,
      t.profile_image,
      t.city,
      t.is_mobile,
      t.is_active,
      t.created_at,
      t.updated_at,
      t.latitude,
      t.longitude,
      t.region,
      t.country
    FROM therapists t
    WHERE t.is_active = true
      AND t.location IS NOT NULL
      AND ST_DWithin(
        t.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT 20;
  ELSE
    -- Fallback: retourne basé sur latitude/longitude s'ils existent
    IF EXISTS (
      SELECT 1 FROM therapists 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
      LIMIT 1
    ) THEN
      RETURN QUERY
      SELECT
        t.id,
        t.user_id,
        t.business_name,
        t.bio_fr,
        t.bio_en,
        t.rating,
        t.review_count,
        -- Calcul simple de distance avec Haversine approximatif
        (6371000 * acos(
          cos(radians(lat)) * cos(radians(t.latitude::double precision)) *
          cos(radians(t.longitude::double precision) - radians(lng)) +
          sin(radians(lat)) * sin(radians(t.latitude::double precision))
        ))::DOUBLE PRECISION as distance_meters,
        t.profile_image,
        t.city,
        t.is_mobile,
        t.is_active,
        t.created_at,
        t.updated_at,
        t.latitude,
        t.longitude,
        t.region,
        t.country
      FROM therapists t
      WHERE t.is_active = true
        AND t.latitude IS NOT NULL
        AND t.longitude IS NOT NULL
      ORDER BY distance_meters ASC
      LIMIT 20;
    ELSE
      -- Ultime fallback: juste retourner les actifs
      RETURN QUERY
      SELECT
        t.id,
        t.user_id,
        t.business_name,
        t.bio_fr,
        t.bio_en,
        t.rating,
        t.review_count,
        0::DOUBLE PRECISION as distance_meters,
        t.profile_image,
        t.city,
        t.is_mobile,
        t.is_active,
        t.created_at,
        t.updated_at,
        t.latitude,
        t.longitude,
        t.region,
        t.country
      FROM therapists t
      WHERE t.is_active = true
      ORDER BY t.created_at DESC
      LIMIT 20;
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 'Retourne les thérapeutes proches avec 3 modes: PostGIS (optimal), Haversine (fallback), ou tous actifs (safe)';
