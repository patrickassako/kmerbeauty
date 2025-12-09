-- ÉTAPE 1: Supprimer TOUTES les anciennes versions de get_nearby_therapists
DROP FUNCTION IF EXISTS get_nearby_therapists();
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, integer, integer);
DROP FUNCTION IF EXISTS get_nearby_therapists(double precision, double precision, integer, text, text);

-- ÉTAPE 2: Créer la nouvelle version intelligente
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
  match_type TEXT
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
    SELECT
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
      'gps_distance'::TEXT as match_type
    FROM therapists t
    WHERE t.is_active = true
      AND (t.is_mobile = false OR t.is_mobile IS NULL)
      AND (
        (has_postgis AND has_coordinates AND t.location IS NOT NULL)
        OR (has_coordinates AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL)
      )
      AND (
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
    SELECT
      t.id, t.user_id, t.business_name, t.bio_fr, t.bio_en,
      t.rating, t.review_count,
      0::DOUBLE PRECISION as distance_meters,
      t.profile_image, t.city, t.is_mobile, t.is_active,
      t.created_at, t.updated_at, t.latitude, t.longitude,
      t.region, t.country, t.service_zones,
      'service_zone'::TEXT as match_type,
      CASE
        WHEN client_city IS NOT NULL AND client_district IS NOT NULL 
          AND t.service_zones @> jsonb_build_array(
            jsonb_build_object('city', client_city, 'district', client_district)
          ) THEN 2
        WHEN client_city IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(t.service_zones) zone
            WHERE zone->>'city' ILIKE client_city
          ) THEN 3
        ELSE 4
      END as zone_priority
    FROM therapists t
    WHERE t.is_active = true
      AND t.is_mobile = true
      AND (
        client_city IS NULL
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(t.service_zones) zone
          WHERE zone->>'city' ILIKE client_city
            OR (client_district IS NOT NULL AND zone->>'district' ILIKE client_district)
        )
      )
  ),
  fallback_providers AS (
    SELECT
      t.id, t.user_id, t.business_name, t.bio_fr, t.bio_en,
      t.rating, t.review_count,
      999999::DOUBLE PRECISION as distance_meters,
      t.profile_image, t.city, t.is_mobile, t.is_active,
      t.created_at, t.updated_at, t.latitude, t.longitude,
      t.region, t.country, t.service_zones,
      'fallback'::TEXT as match_type
    FROM therapists t
    WHERE t.is_active = true
      AND t.id NOT IN (SELECT fp.id FROM fixed_providers fp)
      AND t.id NOT IN (SELECT mp.id FROM mobile_providers mp)
  )
  SELECT 
    fp.id, fp.user_id, fp.business_name, fp.bio_fr, fp.bio_en,
    fp.rating, fp.review_count, fp.distance_meters,
    fp.profile_image, fp.city, fp.is_mobile, fp.is_active,
    fp.created_at, fp.updated_at, fp.latitude, fp.longitude,
    fp.region, fp.country, fp.service_zones, fp.match_type,
    1 as sort_order
  FROM fixed_providers fp
  
  UNION ALL
  
  SELECT 
    mp.id, mp.user_id, mp.business_name, mp.bio_fr, mp.bio_en,
    mp.rating, mp.review_count, mp.distance_meters,
    mp.profile_image, mp.city, mp.is_mobile, mp.is_active,
    mp.created_at, mp.updated_at, mp.latitude, mp.longitude,
    mp.region, mp.country, mp.service_zones, mp.match_type,
    2 as sort_order
  FROM mobile_providers mp
  
  UNION ALL
  
  SELECT 
    fbp.id, fbp.user_id, fbp.business_name, fbp.bio_fr, fbp.bio_en,
    fbp.rating, fbp.review_count, fbp.distance_meters,
    fbp.profile_image, fbp.city, fbp.is_mobile, fbp.is_active,
    fbp.created_at, fbp.updated_at, fbp.latitude, fbp.longitude,
    fbp.region, fbp.country, fbp.service_zones, fbp.match_type,
    3 as sort_order
  FROM fallback_providers fbp
  
  ORDER BY sort_order ASC, distance_meters ASC, rating DESC NULLS LAST
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_nearby_therapists IS 
'Matching intelligent: Prestataires FIXES (GPS) + MOBILES (service_zones). Paramètres: lat/lng OU client_city/client_district';
