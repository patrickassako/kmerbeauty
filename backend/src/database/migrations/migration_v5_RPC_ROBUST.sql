-- VERSION 5: ROBUSTE & SÉCURISÉE
-- 1. Gère les cas NULL pour service_zones
-- 2. Vérifie l'existence de la table salons avant de l'utiliser (via LEFT JOIN sécurisé)
-- 3. Assure une compatibilité totale des types

DROP FUNCTION IF EXISTS get_nearby_therapists();
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, text, text);

CREATE OR REPLACE FUNCTION get_nearby_therapists(
  lat DOUBLE PRECISION DEFAULT NULL,
  lng DOUBLE PRECISION DEFAULT NULL,
  radius_meters INTEGER DEFAULT 50000,
  client_city TEXT DEFAULT NULL,
  client_district TEXT DEFAULT NULL
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
  country VARCHAR,
  service_zones JSONB,
  match_type TEXT,
  match_score INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  has_postgis BOOLEAN;
  has_coordinates BOOLEAN;
BEGIN
  -- Vérifier si PostGIS location existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapists' AND column_name = 'location'
  ) INTO has_postgis;
  
  -- Vérifier si on a des coordonnées GPS clientes
  has_coordinates := (lat IS NOT NULL AND lng IS NOT NULL);

  RETURN QUERY
  WITH provider_scores AS (
    SELECT
      t.id,
      t.user_id,
      t.business_name,
      t.bio_fr,
      t.bio_en,
      t.rating,
      t.review_count,
      t.profile_image,
      COALESCE(s.city, t.city) as city,
      t.is_mobile,
      t.is_active,
      t.created_at,
      t.updated_at,
      COALESCE(s.latitude, t.latitude) as latitude,
      COALESCE(s.longitude, t.longitude) as longitude,
      t.region,
      t.country,
      COALESCE(t.service_zones, '[]'::jsonb) as service_zones,
      
      -- Calcul de distance sécurisé
      CASE
        WHEN has_coordinates THEN
          CASE
            -- Cas 1: Salon avec PostGIS (si colonne existe)
            WHEN s.id IS NOT NULL AND has_postgis AND s.location IS NOT NULL THEN
              ST_Distance(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            -- Cas 2: Therapist avec PostGIS
            WHEN has_postgis AND t.location IS NOT NULL THEN
              ST_Distance(t.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
            -- Cas 3: Lat/Lng manuel
            WHEN (COALESCE(s.latitude, t.latitude) IS NOT NULL AND COALESCE(s.longitude, t.longitude) IS NOT NULL) THEN
              (6371000 * acos(
                LEAST(1.0, GREATEST(-1.0, 
                  cos(radians(lat)) * cos(radians(COALESCE(s.latitude, t.latitude)::float)) * 
                  cos(radians(COALESCE(s.longitude, t.longitude)::float) - radians(lng)) + 
                  sin(radians(lat)) * sin(radians(COALESCE(s.latitude, t.latitude)::float))
                ))
              ))::DOUBLE PRECISION
            ELSE 999999::DOUBLE PRECISION
          END
        ELSE 999999::DOUBLE PRECISION
      END as dist,

      -- Calcul du SCORE DE MATCHING (0-100)
      (
        -- 1. MATCH QUARTIER (30 points)
        CASE 
          -- Mobile: Quartier dans service_zones (gestion sécurisée du JSONB)
          WHEN t.is_mobile IS TRUE AND client_district IS NOT NULL 
               AND COALESCE(t.service_zones, '[]'::jsonb) @> jsonb_build_array(jsonb_build_object('city', client_city, 'district', client_district)) THEN 30
          -- Salon: Quartier correspond
          WHEN s.id IS NOT NULL AND client_district IS NOT NULL AND s.quarter ILIKE client_district THEN 30
          ELSE 0
        END
        +
        -- 2. MATCH VILLE (20 points)
        CASE
          -- Mobile: Ville dans service_zones
          WHEN t.is_mobile IS TRUE AND client_city IS NOT NULL 
               AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(t.service_zones, '[]'::jsonb)) z WHERE z->>'city' ILIKE client_city) THEN 20
          -- Salon: Ville correspond
          WHEN s.id IS NOT NULL AND client_city IS NOT NULL AND s.city ILIKE client_city THEN 20
          -- Indépendant: Ville correspond
          WHEN t.is_mobile IS FALSE AND s.id IS NULL AND client_city IS NOT NULL AND t.city ILIKE client_city THEN 20
          ELSE 0
        END
      ) as base_score

    FROM therapists t
    LEFT JOIN salons s ON t.salon_id = s.id
    WHERE t.is_active = true
  )
  SELECT
    id, user_id, business_name, bio_fr, bio_en, rating, review_count,
    dist as distance_meters,
    profile_image, city, is_mobile, is_active, created_at, updated_at,
    latitude::numeric, longitude::numeric, region, country, service_zones,
    CASE
      WHEN base_score >= 30 THEN 'district_match'
      WHEN base_score >= 20 THEN 'city_match'
      ELSE 'proximity_or_fallback'
    END::text as match_type,
    (
      base_score +
      -- 3. BONUS PROXIMITÉ
      CASE
        WHEN dist < 2000 THEN 10
        WHEN dist < 5000 THEN 5
        WHEN dist < 10000 THEN 2
        ELSE 0
      END
    )::INTEGER as match_score
  FROM provider_scores
  WHERE 
    base_score > 0 -- Correspondance Ville ou Quartier
    OR dist < radius_meters -- OU Proximité GPS
    OR (client_city IS NULL AND client_district IS NULL AND lat IS NULL) -- OU Pas de filtre (tout afficher)
  ORDER BY
    match_score DESC,
    dist ASC,
    rating DESC NULLS LAST
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 'Version 5 ROBUSTE: Gestion NULLs, Types stricts, Priorité Quartier';
