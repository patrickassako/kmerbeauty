-- VERSION 6: CORRECTION AMBIGUÏTÉ ID
-- Cette version corrige l'erreur "column reference id is ambiguous"
-- en utilisant des alias explicites pour le CTE final (ps.*)

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
      t.id as t_id, -- Alias interne pour éviter confusion
      t.user_id as t_user_id,
      t.business_name as t_business_name,
      t.bio_fr as t_bio_fr,
      t.bio_en as t_bio_en,
      t.rating as t_rating,
      t.review_count as t_review_count,
      t.profile_image as t_profile_image,
      COALESCE(s.city, t.city) as t_city,
      t.is_mobile as t_is_mobile,
      t.is_active as t_is_active,
      t.created_at as t_created_at,
      t.updated_at as t_updated_at,
      COALESCE(s.latitude, t.latitude) as t_latitude,
      COALESCE(s.longitude, t.longitude) as t_longitude,
      t.region as t_region,
      t.country as t_country,
      COALESCE(t.service_zones, '[]'::jsonb) as t_service_zones,
      
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
          -- Mobile: Quartier dans service_zones
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
    ps.t_id as id,
    ps.t_user_id as user_id,
    ps.t_business_name as business_name,
    ps.t_bio_fr as bio_fr,
    ps.t_bio_en as bio_en,
    ps.t_rating as rating,
    ps.t_review_count as review_count,
    ps.dist as distance_meters,
    ps.t_profile_image as profile_image,
    ps.t_city as city,
    ps.t_is_mobile as is_mobile,
    ps.t_is_active as is_active,
    ps.t_created_at as created_at,
    ps.t_updated_at as updated_at,
    ps.t_latitude::numeric as latitude,
    ps.t_longitude::numeric as longitude,
    ps.t_region as region,
    ps.t_country as country,
    ps.t_service_zones as service_zones,
    CASE
      WHEN ps.base_score >= 30 THEN 'district_match'
      WHEN ps.base_score >= 20 THEN 'city_match'
      ELSE 'proximity_or_fallback'
    END::text as match_type,
    (
      ps.base_score +
      -- 3. BONUS PROXIMITÉ
      CASE
        WHEN ps.dist < 2000 THEN 10
        WHEN ps.dist < 5000 THEN 5
        WHEN ps.dist < 10000 THEN 2
        ELSE 0
      END
    )::INTEGER as match_score
  FROM provider_scores ps
  WHERE 
    ps.base_score > 0 -- Correspondance Ville ou Quartier
    OR ps.dist < radius_meters -- OU Proximité GPS
    OR (client_city IS NULL AND client_district IS NULL AND lat IS NULL) -- OU Pas de filtre
  ORDER BY
    match_score DESC,
    ps.dist ASC,
    ps.t_rating DESC NULLS LAST
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 'Version 6: Correction ambiguïté ID avec alias explicites';
