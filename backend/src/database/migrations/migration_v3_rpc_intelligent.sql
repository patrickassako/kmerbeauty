-- Fonction RPC intelligente pour prestataires fixes ET mobiles
-- Gère 2 types de matching:
-- 1. Prestataires FIXES: distance GPS (location ou lat/lng)
-- 2. Prestataires MOBILES: service_zones (ville/quartier)

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
  match_type TEXT -- 'gps_distance' | 'service_zone' | 'fallback'
)
LANGUAGE plpgsql
AS $$
DECLARE
  has_postgis BOOLEAN;
  has_coordinates BOOLEAN;
BEGIN
  -- Vérifier si PostGIS location existe
  SELECT EXISTS (
    SELECT 1 FROM therapists WHERE location IS NOT NULL LIMIT 1
  ) INTO has_postgis;
  
  -- Vérifier si on a des coordonnées GPS clientes
  has_coordinates := (lat IS NOT NULL AND lng IS NOT NULL);

  RETURN QUERY
  WITH fixed_providers AS (
    -- 1. PRESTATAIRES FIXES avec localisation GPS
    SELECT DISTINCT
      t.id, t.user_id, t.business_name, t.bio_fr, t.bio_en,
      t.rating, t.review_count,
      CASE
        WHEN has_postgis AND has_coordinates AND t.location IS NOT NULL THEN
          ST_Distance(
            t.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
          )
        WHEN has_coordinates AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL THEN
          (6371000 * acos(
            cos(radians(lat)) * cos(radians(t.latitude::double precision)) *
            cos(radians(t.longitude::double precision) - radians(lng)) +
            sin(radians(lat)) * sin(radians(t.latitude::double precision))
          ))::DOUBLE PRECISION
        ELSE 999999::DOUBLE PRECISION
      END as distance_meters,
      t.profile_image, t.city, t.is_mobile, t.is_active,
      t.created_at, t.updated_at, t.latitude, t.longitude,
      t.region, t.country, t.service_zones,
      'gps_distance'::TEXT as match_type,
      1 as priority -- Priorité 1 pour prestataires fixes proches
    FROM therapists t
    WHERE t.is_active = true
      AND t.is_mobile = false -- Prestataires FIXES uniquement
      AND (
        (has_postgis AND has_coordinates AND t.location IS NOT NULL)
        OR (has_coordinates AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL)
      )
      AND (
        -- Filtre distance si coordonnées disponibles
        NOT has_coordinates OR
        (has_postgis AND t.location IS NOT NULL AND ST_DWithin(
          t.location,
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
          radius_meters
        ))
        OR (t.latitude IS NOT NULL AND t.longitude IS NOT NULL)
      )
  ),
  mobile_providers AS (
    -- 2. PRESTATAIRES MOBILES avec service_zones matching
    SELECT DISTINCT
      t.id, t.user_id, t.business_name, t.bio_fr, t.bio_en,
      t.rating, t.review_count,
      0::DOUBLE PRECISION as distance_meters, -- Distance non applicable pour mobiles
      t.profile_image, t.city, t.is_mobile, t.is_active,
      t.created_at, t.updated_at, t.latitude, t.longitude,
      t.region, t.country, t.service_zones,
      'service_zone'::TEXT as match_type,
      CASE
        -- Matching exact ville + quartier = priorité 2
        WHEN client_city IS NOT NULL AND client_district IS NOT NULL 
          AND t.service_zones @> jsonb_build_array(
            jsonb_build_object('city', client_city, 'district', client_district)
          ) THEN 2
        -- Matching ville seulement = priorité 3
        WHEN client_city IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(t.service_zones) zone
            WHERE zone->>'city' ILIKE client_city
          ) THEN 3
        ELSE 4
      END as priority
    FROM therapists t
    WHERE t.is_active = true
      AND t.is_mobile = true -- Prestataires MOBILES uniquement
      AND (
        client_city IS NULL -- Si pas de filtre ville, retourner tous les mobiles
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(t.service_zones) zone
          WHERE zone->>'city' ILIKE client_city
            OR (client_district IS NOT NULL AND zone->>'district' ILIKE client_district)
        )
      )
  ),
  fallback_providers AS (
    -- 3. FALLBACK: Autres prestataires actifs (si aucun matching)
    SELECT DISTINCT
      t.id, t.user_id, t.business_name, t.bio_fr, t.bio_en,
      t.rating, t.review_count,
      999999::DOUBLE PRECISION as distance_meters,
      t.profile_image, t.city, t.is_mobile, t.is_active,
      t.created_at, t.updated_at, t.latitude, t.longitude,
      t.region, t.country, t.service_zones,
      'fallback'::TEXT as match_type,
      5 as priority
    FROM therapists t
    WHERE t.is_active = true
      AND t.id NOT IN (SELECT fp.id FROM fixed_providers fp)
      AND t.id NOT IN (SELECT mp.id FROM mobile_providers mp)
  )
  -- Combiner tous les résultats et trier par pertinence
  SELECT * FROM (
    SELECT * FROM fixed_providers
    UNION ALL
    SELECT * FROM mobile_providers
    UNION ALL
    SELECT * FROM fallback_providers
  ) combined
  ORDER BY 
    priority ASC,
    CASE 
      WHEN distance_meters < 999999 THEN distance_meters 
      ELSE rating 
    END ASC,
    rating DESC NULLS LAST,
    created_at DESC
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 
'Matching intelligent: 
- Prestataires FIXES par distance GPS
- Prestataires MOBILES par service_zones (ville/quartier)
- Fallback si aucun matching
Paramètres: lat/lng (GPS) OU client_city/client_district (manuel)';
